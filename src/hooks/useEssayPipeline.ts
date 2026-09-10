import { useCallback, useEffect, useState } from 'react';
import localforage from 'localforage';
import { generateId, scaleToMaxDimension } from '../lib/essayProcessing';
import { Essay } from '../types';
import { processEssayWithAiFlow, processManualOcrFlow } from './essayPipelineCore';
import { processEssayImage, processEssayImageOCR } from '../services/aiService';
import { convertPdfToImages } from '../services/pdfService';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;

interface UseEssayPipelineArgs {
  globalTheme: string;
  addToast: ToastFn;
  onManualReady?: (essayId: string) => void;
}

export interface FileWithMetadata {
  file: File;
  specialNeedsProfile: 'none' | 'dislexia' | 'surdez' | 'tea';
}

const ESSAYS_STORAGE_KEY = 'enem_ai_essays_v1';

export function useEssayPipeline({ globalTheme, addToast, onManualReady }: UseEssayPipelineArgs) {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load essays from localforage on mount
  useEffect(() => {
    const init = async () => {
      try {
        const savedEssays = await localforage.getItem<Essay[]>(ESSAYS_STORAGE_KEY);
        if (savedEssays) {
          setEssays(savedEssays.sort((a, b) => b.uploadedAt - a.uploadedAt));
        }
      } catch (error) {
        console.error('Falha ao carregar redações do armazenamento local', error);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  // Save essays to localforage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localforage.setItem(ESSAYS_STORAGE_KEY, essays);
    }
  }, [essays, isLoaded]);

  const updateEssay = useCallback(async (id: string, updates: Partial<Essay>) => {
    setEssays(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const deleteEssay = useCallback(async (id: string) => {
    setEssays(prev => prev.filter(e => e.id !== id));
    addToast('Redação removida', 'info');
  }, [addToast]);

  const processEssayItem = useCallback(async (essay: Essay) => {
    // Use per-essay theme if available, fall back to globalTheme
    const theme = essay.theme || globalTheme;
    await processEssayWithAiFlow({
      essay,
      globalTheme: theme,
      processEssayImage,
      processEssayImageOCR,
      updateStatus: async (status, extra) => {
         setEssays(prev => prev.map(e => e.id === essay.id ? { ...e, status, ...extra } : e));
      },
      addToast,
    });
  }, [globalTheme, addToast]);

  const processManualEssayItem = useCallback(async (id: string, base64data: string) => {
    try {
      await processManualOcrFlow({
        base64data,
        processEssayImageOCR,
        updateStatus: async (status, extra) => {
          setEssays(prev => prev.map(e => e.id === id ? { ...e, status, ...extra } : e));
        },
        addToast,
      });
      onManualReady?.(id);
    } catch {
      // toast/error state already handled in core flow
    }
  }, [addToast, onManualReady]);

  const createEssayDoc = useCallback(async (
    fileName: string,
    base64: string,
    metadata?: { specialNeedsProfile?: 'none' | 'dislexia' | 'surdez' | 'tea'; theme?: string }
  ) => {
    const essayId = generateId();
    const newEssay: Essay = {
      id: essayId,
      fileName,
      imageUrl: base64,
      status: 'pending',
      uploadedAt: Date.now(),
      analysis: null,
      specialNeedsProfile: metadata?.specialNeedsProfile || 'none',
      theme: metadata?.theme,
    };
    setEssays(prev => [newEssay, ...prev]);
  }, []);

  /** Process files with metadata from the upload modal */
  const processFilesWithMetadata = useCallback(async (
    fileItems: FileWithMetadata[],
    theme: string
  ) => {
    for (const { file, specialNeedsProfile } of fileItems) {
      const metadata = { specialNeedsProfile, theme };

      if (file.type === 'application/pdf') {
        try {
          addToast(`Processando PDF... extraindo páginas de ${file.name}`, 'info');
          const images = await convertPdfToImages(file);
          for (let i = 0; i < images.length; i += 1) {
            await createEssayDoc(`${file.name} (Pág. ${i + 1})`, images[i], metadata);
          }
        } catch (error) {
          console.error('Falha ao processar PDF', error);
          addToast('Falha ao processar PDF', 'error');
        }
        continue;
      }

      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = async () => {
          const canvas = document.createElement('canvas');
          const { width, height } = scaleToMaxDimension(image.width, image.height);
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height);
            await createEssayDoc(file.name, canvas.toDataURL('image/jpeg', 0.8), metadata);
          }
          URL.revokeObjectURL(objectUrl);
        };
        image.src = objectUrl;
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        await createEssayDoc(file.name, reader.result as string, metadata);
      };
      reader.readAsDataURL(file);
    }
    if (fileItems.length > 0) {
      setTimeout(() => addToast(`${fileItems.length} arquivo(s) adicionado(s) à fila`, 'success'), 500);
    }
  }, [addToast, createEssayDoc]);

  /** Legacy processFiles without metadata (for backward compatibility) */
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileItems: FileWithMetadata[] = Array.from(files).map(file => ({
      file,
      specialNeedsProfile: 'none' as const,
    }));
    await processFilesWithMetadata(fileItems, globalTheme);
  }, [processFilesWithMetadata, globalTheme]);

  useEffect(() => {
    if (!isLoaded) return;
    const pendingEssay = essays.find((essay) => essay.status === 'pending');
    const isProcessing = essays.some((essay) => essay.status === 'processing');
    if (pendingEssay && !isProcessing) {
      processEssayItem(pendingEssay);
    }
  }, [essays, isLoaded, processEssayItem]);

  const clearHistory = useCallback(async () => {
    setEssays([]);
    await localforage.removeItem(ESSAYS_STORAGE_KEY);
    addToast('Histórico limpo', 'info');
  }, [addToast]);

  return {
    essays,
    isLoaded,
    setEssays,
    updateEssay,
    deleteEssay,
    clearHistory,
    processFiles,
    processFilesWithMetadata,
    processManualEssayItem,
  };
}
