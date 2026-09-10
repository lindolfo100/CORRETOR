import { cn } from '../lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ current, total, className, showLabel = true }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
            Progresso da Fila
          </span>
          <span className="text-[11px] font-bold text-[#111827] font-mono leading-none">
            {current}/{total}
            <span className="text-[#D1D5DB] ml-2 font-medium">({percentage}%)</span>
          </span>
        </div>
      )}
      <div className="h-2 bg-[#F8F9FA] rounded-full overflow-hidden border border-[#E5E7EB]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage === 100 ? '#17A34A' : '#2563EB',
          }}
        >
          {percentage < 100 && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'linear-gradient(90deg, transparent, white, transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
