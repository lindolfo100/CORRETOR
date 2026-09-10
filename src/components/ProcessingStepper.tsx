import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Upload, ScanText, Brain, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProcessingStepperProps {
  status: 'pending' | 'processing' | 'reviewing' | 'done' | 'error';
}

const steps = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'ocr', label: 'OCR', icon: ScanText },
  { id: 'analysis', label: 'Análise IA', icon: Brain },
  { id: 'done', label: 'Concluído', icon: CheckCircle },
];

function getActiveStep(status: ProcessingStepperProps['status']): number {
  switch (status) {
    case 'pending': return 0;
    case 'processing': return 2; // OCR + analysis happen together via API
    case 'reviewing': return 3; 
    case 'done': return 4;
    case 'error': return -1;
    default: return 0;
  }
}

export function ProcessingStepper({ status }: ProcessingStepperProps) {
  const activeStep = getActiveStep(status);
  const [fakePercent, setFakePercent] = useState(0);

  useEffect(() => {
    if (status === 'processing') {
      let val = 0;
      const interval = setInterval(() => {
        val += Math.floor(Math.random() * 8) + 2;
        if (val > 99) val = 99;
        setFakePercent(val);
      }, 500);
      return () => clearInterval(interval);
    } else if (status === 'done' || status === 'reviewing') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFakePercent(100);
    } else {
      setFakePercent(0);
    }
  }, [status]);

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <AnimatePresence mode="wait">
        {steps[Math.min(steps.length - 1, Math.max(0, activeStep === -1 ? 2 : activeStep))] && (
          <motion.div
            key={status === 'error' ? 'error' : steps[Math.min(steps.length - 1, Math.max(0, activeStep === -1 ? 2 : activeStep))].id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2"
          >
            <div
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500",
                (status === 'done' || status === 'reviewing') && "bg-[#17A34A] text-white",
                status === 'processing' && "bg-[#2563EB] text-white animate-pulse",
                status === 'error' && "bg-[#DC2626] text-white",
                status === 'pending' && "bg-[#F8F9FA] text-[#D1D5DB] border border-[#E5E7EB]"
              )}
            >
              {status === 'error' ? (
                <Brain className="w-3 h-3" />
              ) : (
                React.createElement(steps[Math.min(steps.length - 1, Math.max(0, activeStep === -1 ? 2 : activeStep))].icon, { className: "w-3.5 h-3.5" })
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-widest leading-none",
                  (status === 'done' || status === 'reviewing') && "text-[#17A34A]",
                  status === 'processing' && "text-[#2563EB]",
                  status === 'error' && "text-[#DC2626]",
                  status === 'pending' && "text-[#6B7280]"
                )}
              >
                {status === 'error' ? 'Erro na Análise' : steps[Math.min(steps.length - 1, Math.max(0, activeStep === -1 ? 2 : activeStep))].label}
              </span>
              {status === 'processing' && fakePercent > 0 && (
                <div className="text-[8px] font-bold font-mono text-[#2563EB] mt-0.5">
                  {fakePercent}% CONCLUÍDO
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
