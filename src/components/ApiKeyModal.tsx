import React, { useState } from 'react';
import { Key, ArrowUpRight, X, WarningCircle, CheckCircle, Eye, EyeSlash, Trash } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { validateGeminiApiKey } from '../services/aiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (apiKey: string) => void;
  reasonMessage?: string;
}

export function ApiKeyModal({ isOpen, onClose, onKeySaved, reasonMessage }: ApiKeyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <ApiKeyModalContent
          onClose={onClose}
          onKeySaved={onKeySaved}
          reasonMessage={reasonMessage}
        />
      )}
    </AnimatePresence>
  );
}

function ApiKeyModalContent({
  onClose,
  onKeySaved,
  reasonMessage
}: {
  onClose: () => void;
  onKeySaved?: (apiKey: string) => void;
  reasonMessage?: string;
}) {
  const [apiKey, setApiKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') || '' : ''));
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === 'undefined') return 'gemini-3.8-flash';
    const stored = localStorage.getItem('user_gemini_model') || 'gemini-3.8-flash';
    return stored === 'gemini-flash-lite-latest' ? 'gemini-3.8-flash' : stored;
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleTestKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setTestResult({ valid: false, message: 'Insira uma chave antes de testar.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await validateGeminiApiKey(trimmed);
      if (res.valid) {
        setTestResult({ valid: true, message: 'Chave válida e pronta para corrigir redações!' });
      } else {
        setTestResult({ valid: false, message: res.error || 'Chave inválida. Verifique o código copiado.' });
      }
    } catch (err: any) {
      setTestResult({ valid: false, message: err?.message || 'Falha ao testar conexão.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    const trimmed = apiKey.trim();

    if (trimmed) {
      localStorage.setItem('user_gemini_api_key', trimmed);
    } else {
      localStorage.removeItem('user_gemini_api_key');
    }
    localStorage.setItem('user_gemini_model', selectedModel);

    // Notify other components
    window.dispatchEvent(new Event('gemini_key_updated'));

    setTimeout(() => {
      setIsSaving(false);
      onKeySaved?.(trimmed);
      onClose();
    }, 250);
  };

  const handleClear = () => {
    localStorage.removeItem('user_gemini_api_key');
    setApiKey('');
    setTestResult(null);
    window.dispatchEvent(new Event('gemini_key_updated'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#111827]/50 backdrop-blur-xs"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E5E7EB]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8F9FA]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#111827] text-white rounded-xl flex items-center justify-center shadow-xs">
                <Key size={20} weight="bold" />
              </div>
              <div>
                <h3 className="font-bold text-[#111827] tracking-tight text-base">Configurar Chave do Gemini</h3>
                <p className="text-xs text-[#6B7280] font-medium mt-0.5">Uso individual gratuito via Google AI Studio</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-black/5 rounded-lg transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {reasonMessage && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                <WarningCircle weight="fill" size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Ação necessária</strong>
                  {reasonMessage}
                </div>
              </div>
            )}

            {/* Input Key */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4B5563]">
                  Sua Chave de API (Google AI Studio)
                </label>
                {apiKey && (
                  <button 
                    type="button" 
                    onClick={handleClear}
                    className="text-[10px] text-red-600 hover:text-red-700 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Trash size={12} /> Limpar Chave
                  </button>
                )}
              </div>

              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="Cole sua chave aqui (ex: AIzaSy...)"
                  className="w-full pl-4 pr-24 py-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:outline-none text-sm font-mono text-[#111827] placeholder:text-[#9CA3AF]"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-[#6B7280] hover:text-[#111827] rounded-md transition-colors"
                    title={showKey ? "Ocultar" : "Mostrar"}
                  >
                    {showKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={isTesting || !apiKey.trim()}
                    className="px-2.5 py-1 bg-white border border-[#D1D5DB] hover:border-[#111827] text-[#111827] disabled:opacity-40 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {isTesting ? 'Testando...' : 'Testar'}
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={cn(
                  "mt-2.5 p-3 rounded-lg border text-xs flex items-center gap-2",
                  testResult.valid 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-red-50 border-red-200 text-red-700"
                )}>
                  {testResult.valid ? (
                    <CheckCircle weight="bold" size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <WarningCircle weight="bold" size={16} className="text-red-600 shrink-0" />
                  )}
                  <span className="font-medium">{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Step-by-step Helper */}
            <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-[#4B5563] leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span>Acesse o <strong>Google AI Studio</strong> com sua conta Google e crie sua chave gratuita com 1 clique:</span>
              </div>

              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-[#D1D5DB] hover:border-[#111827] rounded-lg text-xs font-bold text-[#111827] hover:bg-[#F3F4F6] transition-all shadow-2xs"
              >
                Obter Chave Gratuita no Google AI Studio <ArrowUpRight weight="bold" size={14} />
              </a>

              <div className="flex items-start gap-2.5 text-xs text-[#4B5563] leading-relaxed pt-1">
                <span className="w-5 h-5 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span>Cole a chave acima e clique em <strong>Salvar e Ativar</strong>.</span>
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] flex gap-2 items-start text-[11px] text-[#6B7280]">
                <WarningCircle weight="fill" size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                <span>
                  <strong>Segurança & Privacidade:</strong> Como a aplicação é disponibilizada na Vercel sem chave global, sua chave fica gravada <em>apenas no seu próprio navegador</em> e é usada exclusivamente para analisar suas redações.
                </span>
              </div>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4B5563] mb-2.5">
                Modelo de Inteligência Artificial
              </label>
              <div className="space-y-2">
                <div 
                  onClick={() => setSelectedModel('gemini-3.8-flash')}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                    selectedModel === 'gemini-3.8-flash' 
                      ? "bg-[#2563EB]/5 border-[#2563EB]" 
                      : "bg-[#F8F9FA] border-[#E5E7EB] hover:border-[#D1D5DB]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                      selectedModel === 'gemini-3.8-flash' ? "border-[#2563EB] bg-[#2563EB]" : "border-[#D1D5DB] bg-white"
                    )}>
                      {selectedModel === 'gemini-3.8-flash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#111827]">gemini-3.8-flash</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Mais Rápido & Recomendado</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedModel('gemini-flash-latest')}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                    selectedModel === 'gemini-flash-latest' 
                      ? "bg-[#2563EB]/5 border-[#2563EB]" 
                      : "bg-[#F8F9FA] border-[#E5E7EB] hover:border-[#D1D5DB]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                      selectedModel === 'gemini-flash-latest' ? "border-[#2563EB] bg-[#2563EB]" : "border-[#D1D5DB] bg-white"
                    )}>
                      {selectedModel === 'gemini-flash-latest' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#111827]">gemini-flash-latest</span>
                      <span className="text-[10px] text-[#6B7280] ml-2 font-medium">Correção padrão ENEM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[#E5E7EB] bg-[#F8F9FA] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#D1D5DB] hover:border-[#111827] text-[#374151] rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#111827] hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar e Ativar'}
            </button>
          </div>
        </motion.div>
      </div>
    );
}
