import { Essay, EssayAnalysis } from '../types';
import { getMimeTypeFromDataUrl, isAiOverloadedErrorMessage, isApiKeyErrorMessage, isQuotaErrorMessage } from '../lib/essayProcessing';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;

interface ProcessEssayDeps {
  essay: Essay;
  globalTheme: string;
  processEssayImage: (base64Image: string, mimeType?: string, theme?: string, preTranscription?: string, specialNeedsProfile?: 'none' | 'dislexia' | 'surdez' | 'tea') => Promise<EssayAnalysis>;
  processEssayImageOCR: (base64Image: string, mimeType?: string) => Promise<string>;
  updateStatus: (status: Essay['status'], extra?: Partial<Essay>) => Promise<void>;
  addToast: ToastFn;
}

interface ProcessManualDeps {
  base64data: string;
  updateStatus: (status: Essay['status'], extra?: Partial<Essay>) => Promise<void>;
  processEssayImageOCR: (base64Image: string, mimeType?: string) => Promise<string>;
  addToast: ToastFn;
}

export async function processEssayWithAiFlow(deps: ProcessEssayDeps): Promise<void> {
  const { essay, globalTheme, processEssayImage, updateStatus, addToast } = deps;
  try {
    await updateStatus('processing');
    const mimeType = getMimeTypeFromDataUrl(essay.imageUrl);
    
    // 1. Extrair transcrição primeiro para evitar falha na estruturação JSON de textos longos
    const transcription = await processManualOcrFlow({
      base64data: essay.imageUrl,
      updateStatus: async () => {}, // mock status updaters for silent inner run
      processEssayImageOCR: deps.processEssayImageOCR,
      addToast: () => {}
    }).then(res => res.transcription).catch(() => null);

    // 2. Analisar a redação (passando a transcrição pré-extraída se houver)
    const analysis = await processEssayImage(essay.imageUrl, mimeType, globalTheme, transcription || undefined, essay.specialNeedsProfile);
    
    // Assegura que a transcrição completa não seja perdida
    if (transcription && (!analysis.transcription || analysis.transcription === "Transcrição não disponível." || analysis.transcription.length < 50)) {
       analysis.transcription = transcription;
    }

    await updateStatus('reviewing', { analysis });
    addToast(`"${essay.studentName || essay.fileName}" corrigida!`, 'success');
  } catch (error: unknown) {
    const errMsg = typeof error === 'string' ? error : (error as Error)?.message || 'Erro genérico';
    await updateStatus('error', { error: errMsg });
    if (isApiKeyErrorMessage(errMsg)) {
      addToast('Erro de configuração da chave da IA. Revise a chave pessoal do Gemini.', 'error', 10000);
      return;
    }
    if (isAiOverloadedErrorMessage(errMsg)) {
      addToast('A IA está sobrecarregada no momento. Tente novamente em alguns minutos.', 'warning', 8000);
      return;
    }
    if (isQuotaErrorMessage(errMsg)) {
      addToast('Limite de cota atingido (15 por minuto no Grátis). Aguarde um instante.', 'warning', 8000);
      return;
    }
    addToast(`Erro ao processar "${essay.fileName}"`, 'error');
  }
}

export async function processManualOcrFlow(deps: ProcessManualDeps): Promise<EssayAnalysis> {
  const { base64data, updateStatus, processEssayImageOCR, addToast } = deps;
  await updateStatus('processing');
  try {
    const mimeType = getMimeTypeFromDataUrl(base64data);
    const transcription = await processEssayImageOCR(base64data, mimeType);
    const emptyAnalysis: EssayAnalysis = {
      transcription,
      detectedTheme: 'Tema não identificado',
      nullity: { isValid: true, reason: null },
      competencies: {
        c1: { score: 0, structureClass: 'Deficitária', deviations: [] },
        c2: { score: 0, repertoire: [], themeAddressed: 'Tangencial' },
        c3: { score: 0, project: 'Falhas_Muitas', development: 'Limitado', arguments: [], thesis: null, topicSentences: [] },
        c4: { score: 0, connectives: [], monobloc: false },
        c5: { score: 0, elements: { agent: null, action: null, means: null, effect: null, detail: null }, humanRightsViolation: false },
      },
      suggestedTotalScore: 0,
      feedbackOptions: ['Preencha o feedback...'],
    };
    await updateStatus('reviewing', { analysis: emptyAnalysis });
    addToast('OCR completo. Avalie manualmente!', 'success');
    return emptyAnalysis;
  } catch (error: unknown) {
    const errMsg = typeof error === 'string' ? error : (error as Error)?.message || 'Erro no processo OCR';
    await updateStatus('error', { error: errMsg });
    if (isAiOverloadedErrorMessage(errMsg)) {
      addToast('A IA está sobrecarregada no momento. Tente extrair o texto novamente em alguns minutos.', 'warning', 8000);
    } else if (isQuotaErrorMessage(errMsg)) {
      addToast('Limite de cota do Gemini atingido. Aguarde um minuto.', 'warning', 8000);
    } else {
      addToast('Erro ao realizar OCR', 'error');
    }
    throw error;
  }
}
