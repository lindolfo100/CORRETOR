import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { getRubric, getRubricLevel } from '../lib/rubricData';
import { CaretDown, CaretUp, Info, Eye } from '@phosphor-icons/react';

const scoreOptions = [0, 40, 80, 120, 160, 200];

type CompId = 'c1' | 'c2' | 'c3' | 'c4' | 'c5';

export function CompetenceCard({ title, subtitle, score, max, onChangeScore, competencyId, children }: {
  title: string; subtitle: string; score: number; max: number;
  onChangeScore?: (val: number) => void;
  competencyId?: CompId;
  children: React.ReactNode;
}) {
  const [showRubric, setShowRubric] = useState(false);
  const rubric = competencyId ? getRubric(competencyId) : null;
  const currentLevel = competencyId ? getRubricLevel(competencyId, score) : null;

  const scoreColor = score >= 160 ? '#059669' : score >= 120 ? '#2563EB' : score >= 80 ? '#D97706' : '#DC2626';

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border"
      style={{ borderColor: rubric ? `${rubric.borderColor}20` : '#E5E7EB', borderLeftWidth: '4px', borderLeftColor: rubric?.borderColor || '#E5E7EB' }}
    >
      {/* Header */}
      <div className="px-6 py-5 flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            {rubric && <span className="text-lg">{rubric.icon}</span>}
            <div>
              <h4 className="font-bold text-[15px] text-[#111827] tracking-tight">{title}</h4>
              <span className="text-[10px] font-bold uppercase tracking-widest block mt-0.5" style={{ color: rubric?.color || '#6B7280' }}>
                {subtitle}
              </span>
            </div>
          </div>
          {/* Current Level Badge */}
          {currentLevel && (
            <div
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: rubric ? `${rubric.borderColor}10` : '#F3F4F6', color: rubric?.color || '#6B7280' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rubric?.borderColor }} />
              Nível: {currentLevel.label}
            </div>
          )}
        </div>

        {/* Score & Quick Pills */}
        <div className="flex flex-col items-end shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-3xl font-black leading-none tracking-tighter font-mono"
              style={{ color: rubric?.color || scoreColor }}
            >
              {score}
            </span>
            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">/ {max} pts</span>
          </div>

          {/* Quick Score Selector Pills */}
          {onChangeScore && (
            <div className="flex items-center gap-1 bg-[#F8F9FA] p-1 rounded-lg border border-[#E5E7EB] print:hidden">
              {scoreOptions.map(opt => {
                const isSelected = opt === score;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChangeScore(opt)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer",
                      isSelected
                        ? "text-white shadow-xs scale-105"
                        : "text-[#6B7280] hover:text-[#111827] hover:bg-white"
                    )}
                    style={isSelected ? { backgroundColor: rubric?.color || scoreColor } : undefined}
                    title={`Definir nota da competência para ${opt}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rubric Toggle */}
      {rubric && (
        <div className="px-6 pb-1">
          <button
            onClick={() => setShowRubric(!showRubric)}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer rounded-md px-2 py-1.5 -ml-2 hover:bg-[#F8F9FA]"
            style={{ color: rubric.color }}
          >
            <Info weight="bold" size={12} />
            {showRubric ? 'Ocultar' : 'Ver'} Rúbrica Oficial
            {showRubric ? <CaretUp weight="bold" size={10} /> : <CaretDown weight="bold" size={10} />}
          </button>

          {showRubric && (
            <div className="mt-2 mb-3 rounded-xl overflow-hidden border" style={{ borderColor: `${rubric.borderColor}20` }}>
              {rubric.levels.map((level) => {
                const isActive = level.score === score;
                return (
                  <div
                    key={level.score}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 text-sm transition-all border-b last:border-b-0",
                      isActive ? 'font-bold' : 'opacity-60 hover:opacity-80'
                    )}
                    style={{
                      backgroundColor: isActive ? `${rubric.borderColor}08` : 'transparent',
                      borderColor: `${rubric.borderColor}10`,
                    }}
                  >
                    <div className="flex items-center gap-2 shrink-0 mt-0.5 min-w-[80px]">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isActive ? rubric.borderColor : '#D1D5DB' }}
                      />
                      <span className="text-[11px] font-bold font-mono tracking-tight" style={{ color: isActive ? rubric.color : '#6B7280' }}>
                        {level.score} pts
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest mr-2"
                        style={{ color: isActive ? rubric.color : '#9CA3AF' }}
                      >
                        {level.label}
                      </span>
                      <span className="text-[12px] text-[#6B7280] leading-relaxed">
                        {level.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6 pt-3 border-t border-[#F8F9FA] print:px-0 print:py-2">{children}</div>
    </div>
  );
}

export function C5Element({ label, value, color, onClick }: { label: string; value: string | null; color?: string; onClick?: (val: string) => void }) {
  const isPresent = Boolean(
    value && 
    value.trim() !== '' && 
    value.trim().toLowerCase() !== 'null' && 
    value.trim().toLowerCase() !== 'undefined' &&
    value.trim().toLowerCase() !== 'não identificado' && 
    value.trim().toLowerCase() !== 'nao identificado' && 
    value.trim().toLowerCase() !== 'none' && 
    value.trim().toLowerCase() !== 'ausente' &&
    value.trim().toLowerCase() !== 'inexistente'
  );
  const accentColor = color || (isPresent ? '#059669' : '#E11D48');
  const displayValue = isPresent ? value : 'Não identificado';

  return (
    <div 
      onClick={() => isPresent && onClick && onClick(value!)}
      title={isPresent ? `Clique para localizar "${label}" na transcrição` : 'Elemento não identificado na proposta'}
      className={cn(
        "flex items-start gap-4 p-4 md:p-5 transition-all rounded-xl group",
        isPresent ? "hover:bg-[#ECFDF5] cursor-pointer hover:shadow-xs active:scale-[0.99]" : "bg-rose-50/20 hover:bg-rose-50/40"
      )}
    >
      <div className="mt-0.5 shrink-0">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
          style={{
            backgroundColor: isPresent ? `${accentColor}15` : '#FEE2E2',
            border: `1.5px solid ${isPresent ? `${accentColor}30` : '#FECACA'}`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full transition-all"
            style={{ backgroundColor: isPresent ? accentColor : '#E11D48' }}
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="font-bold text-[11px] uppercase tracking-widest block"
            style={{ color: isPresent ? accentColor : '#9CA3AF' }}
          >
            {label}
            {isPresent ? (
              <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-md inline-block align-middle"
                style={{ backgroundColor: `${accentColor}10`, color: accentColor }}>
                ✓ Identificado
              </span>
            ) : (
              <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded-md inline-block align-middle bg-rose-50 text-[#E11D48] border border-rose-200">
                ✗ Não identificado
              </span>
            )}
          </span>
          {isPresent && (
            <span className="text-[#6B7280] group-hover:text-[#059669] transition-colors flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider shrink-0">
              <Eye size={12} weight="bold" />
              Localizar
            </span>
          )}
        </div>
        {isPresent ? (
          <p className="text-[#374151] text-sm leading-relaxed font-medium group-hover:text-[#111827] transition-colors">{displayValue}</p>
        ) : (
          <p className="text-[#E11D48] text-xs font-semibold">
            Não identificado
          </p>
        )}
      </div>
    </div>
  );
}
