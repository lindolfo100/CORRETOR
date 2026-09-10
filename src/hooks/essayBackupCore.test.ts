import { describe, expect, it } from 'vitest';
import { buildBackupDataUrl, buildBackupFileName, parseBackupJson } from './essayBackupCore';
import { Essay } from '../types';

const mockEssays: Essay[] = [
  {
    id: '1',
    fileName: 'redacao-1.png',
    imageUrl: 'data:image/png;base64,abc',
    status: 'pending',
    uploadedAt: 123,
    analysis: null,
  },
];

describe('essayBackupCore', () => {
  it('gera filename de backup com padrão esperado', () => {
    const fileName = buildBackupFileName(new Date('2026-05-07T12:00:00.000Z'));
    expect(fileName).toBe('enem_ai_backup_2026-05-07.json');
  });

  it('serializa backup para data url', () => {
    const dataUrl = buildBackupDataUrl(mockEssays);
    expect(dataUrl.startsWith('data:text/json;charset=utf-8,')).toBe(true);
    expect(decodeURIComponent(dataUrl.split(',')[1])).toContain('"redacao-1.png"');
  });

  it('importa backup válido e falha em conteúdo inválido', () => {
    const valid = JSON.stringify(mockEssays);
    expect(parseBackupJson(valid)).toEqual(mockEssays);
    expect(() => parseBackupJson('{"foo":"bar"}')).toThrow('INVALID_BACKUP_FORMAT');
  });
});
