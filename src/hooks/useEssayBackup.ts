import { Dispatch, SetStateAction, useCallback } from 'react';
import { Essay } from '../types';
import { buildBackupDataUrl, buildBackupFileName, parseBackupJson } from './essayBackupCore';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;

interface UseEssayBackupArgs {
  essays: Essay[];
  setEssays: Dispatch<SetStateAction<Essay[]>>;
  addToast: ToastFn;
}

export function useEssayBackup({ essays, setEssays, addToast }: UseEssayBackupArgs) {
  const exportBackup = useCallback(() => {
    const link = document.createElement('a');
    link.href = buildBackupDataUrl(essays);
    link.download = buildBackupFileName();
    link.click();
    addToast('Backup JSON exportado', 'success');
  }, [essays, addToast]);

  const importBackup = useCallback((file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = parseBackupJson((event.target?.result as string) || '[]');
        setEssays(imported);
        addToast('Backup importado com sucesso', 'success');
      } catch {
        addToast('Erro ao importar backup. Arquivo inválido.', 'error');
      }
    };
    reader.readAsText(file);
  }, [setEssays, addToast]);

  return {
    exportBackup,
    importBackup,
  };
}
