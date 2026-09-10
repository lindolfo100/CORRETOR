import React from 'react';
import { motion } from 'motion/react';
import { RUBRIC_DATA, getRubricLevel } from '../lib/rubricData';
import { cn } from '../lib/utils';
import { CaretRight } from '@phosphor-icons/react';

interface CompetencyScoreChartProps {
  scores: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
  };
  activeCompetency?: 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'all' | null;
  onSelectCompetency?: (id: 'c1' | 'c2' | 'c3' | 'c4' | 'c5') => void;
  onChangeScore?: (id: 'c1' | 'c2' | 'c3' | 'c4' | 'c5', score: number) => void;
}

const SCORE_LEVELS = [0, 40, 80, 120, 160, 200];

export function CompetencyScoreChart({
  scores,
  activeCompetency,
  onSelectCompetency,
  onChangeScore,
}: CompetencyScoreChartProps) {
  const totalScore = scores.c1 + scores.c2 + scores.c3 + scores.c4 + scores.c5;

  const performanceTier = totalScore >= 900
    ? { label: 'Excelente (900+)', color: '#059669', bg: '#ECFDF5', border: '#10B981' }
    : totalScore >= 800
    ? { label: 'Muito Bom (800-880)', color: '#2563EB', bg: '#EFF6FF', border: '#3B82F6' }
    : totalScore >= 600
    ? { label: 'Mediano (600-760)', color: '#D97706', bg: '#FFFBEB', border: '#F59E0B' }
    : totalScore >= 400
    ? { label: 'Insuficiente (400-560)', color: '#EA580C', bg: '#FFF7ED', border: '#F97316' }
    : { label: 'Crítico / Fuga (<400)', color: '#DC2626', bg: '#FEF2F2', border: '#EF4444' };

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
      {/* Top Total Score Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F1F3F5]">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-baseline gap-1.5 px-3.5 py-2 rounded-xl border"
            style={{ backgroundColor: performanceTier.bg, borderColor: `${performanceTier.border}40` }}
          >
            <span className="text-3xl font-black font-mono tracking-tight" style={{ color: performanceTier.color }}>
              {totalScore}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">/ 1000</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#111827]">Desempenho Geral</span>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ backgroundColor: `${performanceTier.color}15`, color: performanceTier.color }}
              >
                {performanceTier.label}
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Média: {(totalScore / 5).toFixed(0)} pts por competência
            </p>
          </div>
        </div>

        {/* Legend Scale */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
          <span>Escala Oficial:</span>
          {SCORE_LEVELS.map(s => (
            <span key={s} className="px-1.5 py-0.5 rounded bg-[#F8F9FA] text-[#6B7280] font-mono">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* 5 Competency Bars */}
      <div className="space-y-3 pt-4">
        {RUBRIC_DATA.map((rubric) => {
          const score = scores[rubric.id];
          const level = getRubricLevel(rubric.id, score);
          const percent = (score / 200) * 100;
          const isSelected = activeCompetency === rubric.id;

          return (
            <div
              key={rubric.id}
              className={cn(
                "group p-2.5 rounded-xl border transition-all",
                isSelected
                  ? "bg-[#F8F9FA] border-transparent shadow-xs ring-2"
                  : "bg-white border-[#F1F3F5] hover:border-[#E5E7EB] hover:bg-[#FAFAFA]"
              )}
              style={isSelected ? { ringColor: rubric.color } : undefined}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                {/* Left: Code, Title, Level */}
                <button
                  type="button"
                  onClick={() => onSelectCompetency && onSelectCompetency(rubric.id)}
                  className="flex items-center gap-2 text-left cursor-pointer group-hover:opacity-100 min-w-0"
                >
                  <span
                    className="text-[11px] font-black font-mono px-2 py-0.5 rounded-md uppercase tracking-wider text-white shrink-0"
                    style={{ backgroundColor: rubric.color }}
                  >
                    {rubric.id.toUpperCase()}
                  </span>
                  <span className="text-[12px] font-bold text-[#111827] truncate">
                    {rubric.subtitle}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 hidden md:inline-block"
                    style={{ backgroundColor: `${rubric.color}12`, color: rubric.color }}
                  >
                    {level.label}
                  </span>
                </button>

                {/* Right: Score and 1-click pills */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="font-mono font-black text-sm"
                    style={{ color: rubric.color }}
                  >
                    {score} <span className="text-[10px] text-[#9CA3AF] font-bold">/ 200</span>
                  </span>

                  {onChangeScore && (
                    <div className="hidden lg:flex items-center gap-0.5 bg-[#F1F3F5] p-0.5 rounded-md">
                      {SCORE_LEVELS.map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeScore(rubric.id, val);
                          }}
                          className={cn(
                            "px-1.5 py-0.5 text-[9px] font-mono font-bold rounded transition-colors",
                            val === score
                              ? "text-white"
                              : "text-[#6B7280] hover:text-[#111827] hover:bg-white"
                          )}
                          style={val === score ? { backgroundColor: rubric.color } : undefined}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}

                  {onSelectCompetency && (
                    <button
                      type="button"
                      onClick={() => onSelectCompetency(rubric.id)}
                      className="p-1 rounded text-[#9CA3AF] hover:text-[#111827] transition-colors"
                      title={`Abrir detalhes da ${rubric.title}`}
                    >
                      <CaretRight size={14} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar with 5 Ticks */}
              <div 
                className="relative w-full h-2.5 bg-[#F1F3F5] rounded-full overflow-hidden cursor-pointer"
                onClick={() => onSelectCompetency && onSelectCompetency(rubric.id)}
              >
                {/* Ticks at 40, 80, 120, 160 */}
                <div className="absolute inset-0 flex justify-between pointer-events-none px-[20%]">
                  <div className="w-[1px] h-full bg-white/70" />
                  <div className="w-[1px] h-full bg-white/70" />
                  <div className="w-[1px] h-full bg-white/70" />
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: rubric.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
