import { describe, expect, it, vi } from 'vitest';
import { processEssayWithAiFlow, processManualOcrFlow } from './essayPipelineCore';
import { Essay } from '../types';

const baseEssay: Essay = {
  id: 'essay-1',
  fileName: 'redacao.png',
  imageUrl: 'data:image/png;base64,abc',
  status: 'pending',
  uploadedAt: Date.now(),
  analysis: null,
};

describe('essayPipelineCore', () => {
  it('processa redação e atualiza status para reviewing', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined);
    const addToast = vi.fn();
    const processEssayImage = vi.fn().mockResolvedValue({
      transcription: 'texto',
      nullity: { isValid: true, reason: null },
      competencies: {
        c1: { score: 0, structureClass: 'Deficitária', deviations: [] },
        c2: { score: 0, repertoire: [], themeAddressed: 'Tangencial' },
        c3: { score: 0, project: 'Falhas_Muitas', development: 'Limitado', arguments: [] },
        c4: { score: 0, connectives: [], monobloc: false },
        c5: { score: 0, elements: { agent: null, action: null, means: null, effect: null, detail: null }, humanRightsViolation: false },
      },
      suggestedTotalScore: 0,
      feedbackOptions: ['ok'],
    });

    const processEssayImageOCR = vi.fn().mockResolvedValue('texto transcrito');

    await processEssayWithAiFlow({
      essay: baseEssay,
      globalTheme: 'Tema teste',
      processEssayImage,
      processEssayImageOCR,
      updateStatus,
      addToast,
    });

    expect(updateStatus).toHaveBeenNthCalledWith(1, 'processing');
    expect(updateStatus).toHaveBeenNthCalledWith(2, 'reviewing', expect.objectContaining({ analysis: expect.any(Object) }));
    expect(addToast).toHaveBeenCalledWith('"redacao.png" corrigida!', 'success');
  });

  it('marca erro e mostra warning quando IA sobrecarrega', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined);
    const addToast = vi.fn();
    const processEssayImage = vi.fn().mockRejectedValue(new Error('503 UNAVAILABLE'));
    const processEssayImageOCR = vi.fn().mockRejectedValue(new Error('503 UNAVAILABLE'));

    await processEssayWithAiFlow({
      essay: baseEssay,
      globalTheme: '',
      processEssayImage,
      processEssayImageOCR,
      updateStatus,
      addToast,
    });

    expect(updateStatus).toHaveBeenNthCalledWith(1, 'processing');
    expect(updateStatus).toHaveBeenNthCalledWith(2, 'error');
    expect(addToast).toHaveBeenCalledWith(
      'A IA está sobrecarregada no momento. Tente novamente em alguns minutos.',
      'warning',
      8000
    );
  });

  it('fluxo manual cria analysis padrão após OCR', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined);
    const addToast = vi.fn();
    const processEssayImageOCR = vi.fn().mockResolvedValue('texto transcrito');

    const analysis = await processManualOcrFlow({
      base64data: 'data:image/png;base64,abc',
      updateStatus,
      processEssayImageOCR,
      addToast,
    });

    expect(updateStatus).toHaveBeenNthCalledWith(1, 'processing');
    expect(updateStatus).toHaveBeenNthCalledWith(2, 'reviewing', expect.objectContaining({ analysis: expect.any(Object) }));
    expect(analysis.transcription).toBe('texto transcrito');
    expect(addToast).toHaveBeenCalledWith('OCR completo. Avalie manualmente!', 'success');
  });
});
