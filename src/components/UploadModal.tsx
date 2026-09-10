import React, { useState, useEffect } from 'react';
import { UploadSimple, X, FileText, Image as ImageIcon, Brain, Ear, PuzzlePiece, Key } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { SPECIAL_NEEDS_LABELS } from '../lib/rubricData';
import { motion, AnimatePresence } from 'motion/react';
import { ApiKeyModal } from './ApiKeyModal';

type SpecialNeedsProfile = 'none' | 'dislexia' | 'surdez' | 'tea';

export interface UploadFileItem {
  file: File;
  preview: string | null;
  specialNeedsProfile: SpecialNeedsProfile;
}

interface UploadModalProps {
  files: File[];
  defaultTheme: string;
  onConfirm: (items: UploadFileItem[], theme: string) => void;
  onCancel: () => void;
}

const profileIcons: Record<SpecialNeedsProfile, React.ReactNode> = {
  none: null,
  dislexia: <Brain weight="bold" size={14} />,
  surdez: <Ear weight="bold" size={14} />,
  tea: <PuzzlePiece weight="bold" size={14} />,
};

export function UploadModal({ files, defaultTheme, onConfirm, onCancel }: UploadModalProps) {
  const [theme, setTheme] = useState(defaultTheme);
  const [items, setItems] = useState<UploadFileItem[]>(() =>
    files.map(file => ({ file, preview: null, specialNeedsProfile: 'none' as SpecialNeedsProfile }))
  );
  const [hasApiKey, setHasApiKey] = useState(() => {
    const key = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
    return Boolean(key && key.trim().length > 0);
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    const updateKey = () => {
      const key = localStorage.getItem('user_gemini_api_key');
      setHasApiKey(Boolean(key && key.trim().length > 0));
    };
    window.addEventListener('gemini_key_updated', updateKey);
    return () => window.removeEventListener('gemini_key_updated', updateKey);
  }, []);

  // Load image previews asynchronously (setState in FileReader callback is fine)
  useEffect(() => {
    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setItems(prev => prev.map((it, i) => i === index ? { ...it, preview: reader.result as string } : it));
        };
        reader.readAsDataURL(file);
      }
    });
  }, [files]);

  const updateProfile = (index: number, profile: SpecialNeedsProfile) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, specialNeedsProfile: profile } : it));
  };

  const applyProfileToAll = (profile: SpecialNeedsProfile) => {
    setItems(prev => prev.map(it => ({ ...it, specialNeedsProfile: profile })));
  };

  const handleSubmit = () => {
    onConfirm(items, theme);
  };

  const profileOptions: { value: SpecialNeedsProfile; label: string }[] = [
    { value: 'none', label: 'Padrão' },
    { value: 'dislexia', label: 'Dislexia' },
    { value: 'surdez', label: 'Surdez (L2)' },
    { value: 'tea', label: 'TEA' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-[#111827]/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E5E7EB] max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#2563EB] text-white rounded-xl flex items-center justify-center shadow-sm shadow-[#2563EB]/20">
                <UploadSimple weight="bold" size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[#111827] tracking-tight text-[15px]">Configurar Envio</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mt-0.5">
                  {items.length} arquivo{items.length !== 1 ? 's' : ''} selecionado{items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-[#D1D5DB] hover:text-[#111827] hover:bg-black/5 rounded-lg transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {!hasApiKey && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600 shrink-0" weight="bold" />
                  <span className="font-medium">Chave da IA não configurada. Configure para enviar para correção.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(true)}
                  className="px-3 py-1.5 bg-[#111827] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-all shrink-0 cursor-pointer"
                >
                  Configurar
                </button>
              </div>
            )}

            {/* Theme */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#6B7280] tracking-widest pl-1 mb-2 block">
                Tema da Redação
              </label>
              <div className="bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-3 rounded-xl flex items-center focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/10 transition-all">
                <input
                  type="text"
                  placeholder="Ex: Efeitos da inteligência artificial na educação..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-transparent border-none text-sm focus:outline-none text-[#111827] font-medium placeholder:text-[#D1D5DB]"
                />
              </div>
            </div>

            {/* Quick Apply */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#6B7280] tracking-widest pl-1 mb-2.5 block">
                Perfil de Acessibilidade
              </label>
              <div className="flex gap-2 flex-wrap">
                {profileOptions.map(opt => {
                  const meta = SPECIAL_NEEDS_LABELS[opt.value];
                  const allMatch = items.length > 0 && items.every(it => it.specialNeedsProfile === opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => applyProfileToAll(opt.value)}
                      title={meta.description}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                        allMatch
                          ? `text-white border-transparent shadow-sm`
                          : `hover:opacity-80 border-transparent`
                      )}
                      style={{
                        backgroundColor: allMatch ? meta.color : meta.bgColor,
                        color: allMatch ? '#fff' : meta.color,
                        borderColor: allMatch ? meta.color : meta.borderColor,
                      }}
                    >
                      {profileIcons[opt.value]}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#9CA3AF] mt-2 pl-1 font-medium">
                Aplicar a todos os arquivos, ou ajuste individualmente abaixo.
              </p>
            </div>

            {/* File List */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#6B7280] tracking-widest pl-1 mb-2.5 block">
                Arquivos ({items.length})
              </label>
              <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                {items.map((item, index) => {
                  const meta = SPECIAL_NEEDS_LABELS[item.specialNeedsProfile];
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center gap-3 p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl hover:border-[#D1D5DB] transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="w-11 h-11 rounded-lg bg-white border border-[#E5E7EB] flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {item.preview ? (
                          <img src={item.preview} alt="" className="w-full h-full object-cover" />
                        ) : item.file.type === 'application/pdf' ? (
                          <FileText className="text-[#D1D5DB]" size={20} />
                        ) : (
                          <ImageIcon className="text-[#D1D5DB]" size={20} />
                        )}
                      </div>

                      {/* File name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111827] truncate">{item.file.name}</p>
                        <p className="text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider mt-0.5">
                          {(item.file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>

                      {/* Profile Selector */}
                      <select
                        value={item.specialNeedsProfile}
                        onChange={(e) => updateProfile(index, e.target.value as SpecialNeedsProfile)}
                        className="appearance-none text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg cursor-pointer focus:outline-none transition-all border"
                        style={{
                          backgroundColor: meta.bgColor,
                          color: meta.color,
                          borderColor: meta.borderColor,
                        }}
                      >
                        {profileOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F8F9FA] flex gap-3 flex-shrink-0">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-[#E5E7EB] text-[#6B7280] rounded-xl font-bold text-sm hover:bg-white transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-[2] px-4 py-3 bg-[#2563EB] text-white rounded-xl font-bold text-sm hover:bg-[#1D4ED8] shadow-sm shadow-[#2563EB]/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <UploadSimple weight="bold" size={16} />
              Enviar para Correção
            </button>
          </div>
        </motion.div>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeySaved={() => setHasApiKey(true)}
      />
    </AnimatePresence>
  );
}
