import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-[#17A34A]" />,
    error: <AlertTriangle className="w-5 h-5 text-[#DC2626]" />,
    info: <Info className="w-5 h-5 text-[#2563EB]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#EAB308]" />,
  };

  const bgColors: Record<ToastType, string> = {
    success: 'bg-white border-[#E5E7EB]',
    error: 'bg-white border-[#DC2626]/20',
    info: 'bg-white border-[#2563EB]/20',
    warning: 'bg-white border-[#EAB308]/20',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-xl border shadow-xl min-w-[320px] max-w-[420px] ${bgColors[toast.type]}`}
      style={{
        animation: isExiting ? 'toast-out 0.3s ease-in forwards' : 'toast-in 0.4s ease-out',
      }}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <span className="text-[13px] font-bold text-[#111827] flex-1 tracking-tight leading-tight">{toast.message}</span>
      <button
        onClick={() => { setIsExiting(true); setTimeout(() => onRemove(toast.id), 300); }}
        className="text-[#D1D5DB] hover:text-[#111827] transition-all cursor-pointer p-1 rounded-md"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
