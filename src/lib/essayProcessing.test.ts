import { describe, expect, it } from 'vitest';
import {
  getMimeTypeFromDataUrl,
  isAiOverloadedErrorMessage,
  isApiKeyErrorMessage,
  scaleToMaxDimension,
} from './essayProcessing';

describe('essayProcessing helpers', () => {
  it('detecta mime type corretamente do data URL', () => {
    expect(getMimeTypeFromDataUrl('data:image/png;base64,abc')).toBe('image/png');
    expect(getMimeTypeFromDataUrl('not-a-data-url')).toBe('image/jpeg');
  });

  it('redimensiona imagem mantendo proporção e limite máximo', () => {
    expect(scaleToMaxDimension(3200, 1600)).toEqual({ width: 1600, height: 800 });
    expect(scaleToMaxDimension(600, 1200)).toEqual({ width: 600, height: 1200 });
  });

  it('classifica mensagens de erro de chave e sobrecarga', () => {
    expect(isApiKeyErrorMessage('API key not valid')).toBe(true);
    expect(isApiKeyErrorMessage('erro genérico')).toBe(false);
    expect(isAiOverloadedErrorMessage('503 UNAVAILABLE')).toBe(true);
    expect(isAiOverloadedErrorMessage('timeout local')).toBe(false);
  });
});
