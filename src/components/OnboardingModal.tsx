import { Sparkles, KeyRound, Upload, CheckCircle2, X } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ onClose, onComplete }: OnboardingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
        aria-label="Fechar onboarding"
      />
      <div className="relative w-full max-w-xl rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#111827] rounded-lg flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-bold text-[#111827] tracking-tight">Guia Rápido</h3>
          </div>
          <button onClick={onClose} className="p-2 text-[#D1D5DB] hover:text-[#111827] hover:bg-[#F8F9FA] rounded-lg transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
            Em menos de 1 minuto você configura tudo para começar a corrigir redações com inteligência artificial local.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <KeyRound className="text-[#111827] mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-[#111827] tracking-tight">1. Configure sua chave Gemini</p>
                <p className="text-xs text-[#6B7280] mt-0.5 font-medium">Use o botão de engrenagem no dashboard para ativar a IA.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <Upload className="text-[#111827] mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-[#111827] tracking-tight">2. Defina o tema e envie arquivos</p>
                <p className="text-xs text-[#6B7280] mt-0.5 font-medium">Suporta JPG, PNG, WEBP e PDFs multipáginas.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <CheckCircle2 className="text-[#111827] mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-[#111827] tracking-tight">3. Revise e exporte</p>
                <p className="text-xs text-[#6B7280] mt-0.5 font-medium">Ajuste as notas da IA e exporte para planilha CSV.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 border border-[#E5E7EB] rounded-lg py-3 text-sm font-bold text-[#6B7280] hover:bg-[#F8F9FA] transition-all cursor-pointer"
            >
              Ver depois
            </button>
            <button
              onClick={onComplete}
              className="flex-1 bg-[#111827] text-white rounded-lg py-3 text-sm font-bold hover:bg-[#222222] shadow-sm transition-all cursor-pointer"
            >
              Começar agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
