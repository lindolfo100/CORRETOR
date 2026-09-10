import { Essay } from '../types';

export function buildBackupFileName(date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `enem_ai_backup_${date.getFullYear()}-${m}-${d}.json`;
}

export function buildBackupDataUrl(essays: Essay[]): string {
  return `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(essays))}`;
}

export function parseBackupJson(content: string): Essay[] {
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error('INVALID_BACKUP_FORMAT');
  }
  return parsed as Essay[];
}
