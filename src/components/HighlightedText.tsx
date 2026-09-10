import React, { useState, useRef, useCallback } from 'react';
import { EssayAnalysis } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Highlight {
  text: string;
  type: string;
  description?: string;
  colorClass: string;
  hoverBg: string;
  dotColor: string;
  category: string;
  competency: string;
}

interface TooltipData {
  highlight: Highlight;
  x: number;
  y: number;
  containerWidth: number;
}

const HIGHLIGHT_COLORS = {
  c1: { colorClass: 'bg-blue-500/15 border-b-2 border-blue-500 text-blue-950 font-medium', hoverBg: 'bg-blue-500/25', dotColor: '#2563EB', label: 'C1' },
  c2: { colorClass: 'bg-purple-500/15 border-b-2 border-purple-500 text-purple-950 font-medium', hoverBg: 'bg-purple-500/25', dotColor: '#7C3AED', label: 'C2' },
  c3_thesis: { colorClass: 'bg-amber-500/20 border-b-2 border-amber-500 text-amber-950 font-medium', hoverBg: 'bg-amber-500/30', dotColor: '#D97706', label: 'C3' },
  c3_topic: { colorClass: 'bg-amber-500/15 border-b-2 border-amber-500/70 text-amber-950 font-medium', hoverBg: 'bg-amber-500/25', dotColor: '#D97706', label: 'C3' },
  c3_arg: { colorClass: 'bg-amber-500/10 border-b-2 border-amber-500/50 text-amber-950 font-medium', hoverBg: 'bg-amber-500/20', dotColor: '#D97706', label: 'C3' },
  c4: { colorClass: 'bg-emerald-500/15 border-b-2 border-emerald-500 text-emerald-950 font-medium', hoverBg: 'bg-emerald-500/25', dotColor: '#059669', label: 'C4' },
  c5: { colorClass: 'bg-rose-500/15 border-b-2 border-rose-500 text-rose-950 font-medium', hoverBg: 'bg-rose-500/25', dotColor: '#E11D48', label: 'C5' },
};

export function HighlightedText({ 
  text, 
  analysis, 
  activeText,
  competencyFilter = 'all',
  onSelectFilter
}: { 
  text: string; 
  analysis: EssayAnalysis; 
  activeText?: string | null;
  competencyFilter?: 'all' | 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
  onSelectFilter?: (f: 'all' | 'c1' | 'c2' | 'c3' | 'c4' | 'c5') => void;
}) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback((highlight: Highlight, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({
      highlight,
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top,
      containerWidth: containerRect.width,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (!text) return null;

  const isIdentified = (val: string | null | undefined): val is string => {
    if (!val) return false;
    const lower = val.trim().toLowerCase();
    return lower !== '' && lower !== 'null' && lower !== 'undefined' && lower !== 'não identificado' && lower !== 'nao identificado' && lower !== 'none' && lower !== 'ausente';
  };

  const highlights: Highlight[] = [
    ...analysis.competencies.c1.deviations.map(d => ({
      text: d.text,
      type: d.type,
      description: `${d.explanation} → "${d.correction}"`,
      ...HIGHLIGHT_COLORS.c1,
      category: 'Desvio Gramatical',
      competency: 'C1: Norma Culta',
    })),
    ...analysis.competencies.c2.repertoire.map(r => ({
      text: r.reference,
      type: r.productive ? 'Repertório Produtivo' : 'Repertório Limitado',
      description: r.canned ? 'Repertório decorado/coringa — citação genérica aplicável a qualquer tema.' : 'Repertório legítimo e pertinente ao tema.',
      ...HIGHLIGHT_COLORS.c2,
      category: r.canned ? 'Repertório Decorado' : 'Repertório',
      competency: 'C2: Repertório',
    })),
    ...(analysis.competencies.c3.thesis ? [{
      text: analysis.competencies.c3.thesis,
      type: 'Tese Central',
      description: 'O posicionamento crítico central da redação — geralmente ao final da introdução.',
      ...HIGHLIGHT_COLORS.c3_thesis,
      category: 'Tese',
      competency: 'C3: Projeto de Texto',
    }] : []),
    ...(analysis.competencies.c3.topicSentences || []).map(ts => ({
      text: ts,
      type: 'Tópico Frasal',
      description: 'Frase que resume a ideia principal do parágrafo de desenvolvimento.',
      ...HIGHLIGHT_COLORS.c3_topic,
      category: 'Tópico Frasal',
      competency: 'C3: Projeto de Texto',
    })),
    ...analysis.competencies.c3.arguments.map(arg => ({
      text: arg.text,
      type: 'Argumento',
      description: arg.explanation,
      ...HIGHLIGHT_COLORS.c3_arg,
      category: 'Argumentação',
      competency: 'C3: Projeto de Texto',
    })),
    ...analysis.competencies.c4.connectives.map(c => ({
      text: c.text,
      type: c.isInterparagraph ? 'Conectivo Interparágrafo' : 'Conectivo Intraparágrafo',
      description: c.isInterparagraph
        ? 'Conectivo essencial que liga parágrafos entre si — fundamental para coesão global.'
        : 'Conectivo que liga orações/períodos dentro do mesmo parágrafo.',
      ...HIGHLIGHT_COLORS.c4,
      category: c.isInterparagraph ? 'Interparágrafo' : 'Intraparágrafo',
      competency: 'C4: Coesão',
    })),
    ...(isIdentified(analysis.competencies.c5.elements.agent) ? [{
      text: analysis.competencies.c5.elements.agent,
      type: 'Agente', description: 'O executor responsável pela ação proposta (ex: "Governo Federal", "MEC").',
      ...HIGHLIGHT_COLORS.c5, category: 'Proposta: Agente', competency: 'C5: Intervenção',
    }] : []),
    ...(isIdentified(analysis.competencies.c5.elements.action) ? [{
      text: analysis.competencies.c5.elements.action,
      type: 'Ação', description: 'O que deve ser feito — verbo interventivo explícito.',
      ...HIGHLIGHT_COLORS.c5, category: 'Proposta: Ação', competency: 'C5: Intervenção',
    }] : []),
    ...(isIdentified(analysis.competencies.c5.elements.means) ? [{
      text: analysis.competencies.c5.elements.means,
      type: 'Meio/Modo', description: 'Como a ação será executada (campanhas, leis, projetos).',
      ...HIGHLIGHT_COLORS.c5, category: 'Proposta: Meio', competency: 'C5: Intervenção',
    }] : []),
    ...(isIdentified(analysis.competencies.c5.elements.effect) ? [{
      text: analysis.competencies.c5.elements.effect,
      type: 'Efeito', description: 'O resultado esperado da intervenção ("a fim de", "para que").',
      ...HIGHLIGHT_COLORS.c5, category: 'Proposta: Efeito', competency: 'C5: Intervenção',
    }] : []),
    ...(isIdentified(analysis.competencies.c5.elements.detail) ? [{
      text: analysis.competencies.c5.elements.detail,
      type: 'Detalhamento', description: 'Expansão explicativa de qualquer um dos outros 4 elementos.',
      ...HIGHLIGHT_COLORS.c5, category: 'Proposta: Detalhe', competency: 'C5: Intervenção',
    }] : []),
  ];

  // Filter highlights if specific competency is selected
  const filteredHighlights = competencyFilter === 'all' 
    ? highlights 
    : highlights.filter(h => {
        if (competencyFilter === 'c1') return h.competency.startsWith('C1');
        if (competencyFilter === 'c2') return h.competency.startsWith('C2');
        if (competencyFilter === 'c3') return h.competency.startsWith('C3');
        if (competencyFilter === 'c4') return h.competency.startsWith('C4');
        if (competencyFilter === 'c5') return h.competency.startsWith('C5');
        return true;
      });

  // Process text with highlights
  let parts: { text: string; highlight?: Highlight }[] = [{ text }];
  const sortedHighlights = [...filteredHighlights].sort((a, b) => b.text.length - a.text.length);

  sortedHighlights.forEach(h => {
    const newParts: typeof parts = [];
    parts.forEach(p => {
      if (p.highlight || !h.text || h.text.trim() === '') {
        newParts.push(p);
        return;
      }
      const escaped = h.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      let match;
      try {
        match = p.text.match(new RegExp(escaped, 'i'));
      } catch {
        match = p.text.includes(h.text) ? { index: p.text.indexOf(h.text), 0: h.text } : null;
      }
      if (match && match.index !== undefined) {
        const index = match.index;
        const matchedText = match[0];
        if (index > 0) newParts.push({ text: p.text.substring(0, index) });
        newParts.push({ text: matchedText, highlight: h });
        if (index + matchedText.length < p.text.length) {
          newParts.push({ text: p.text.substring(index + matchedText.length) });
        }
      } else {
        newParts.push(p);
      }
    });
    parts = newParts;
  });

  // Color legend entries
  const legendItems: { id: 'all' | 'c1' | 'c2' | 'c3' | 'c4' | 'c5'; label: string; dotColor: string }[] = [
    { id: 'all', label: 'Todos', dotColor: '#6B7280' },
    { id: 'c1', label: 'C1 Norma', dotColor: HIGHLIGHT_COLORS.c1.dotColor },
    { id: 'c2', label: 'C2 Tema', dotColor: HIGHLIGHT_COLORS.c2.dotColor },
    { id: 'c3', label: 'C3 Argumento', dotColor: HIGHLIGHT_COLORS.c3_thesis.dotColor },
    { id: 'c4', label: 'C4 Coesão', dotColor: HIGHLIGHT_COLORS.c4.dotColor },
    { id: 'c5', label: 'C5 Proposta', dotColor: HIGHLIGHT_COLORS.c5.dotColor },
  ];

  return (
    <div className="relative" ref={containerRef}>
      {/* Legend & Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6 pb-4 border-b border-[#F1F3F5] print:hidden">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mr-1">Filtro de Destaques:</span>
        {legendItems.map(item => {
          const isSelected = competencyFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFilter && onSelectFilter(item.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                isSelected
                  ? "bg-white shadow-xs font-black"
                  : "bg-[#F8F9FA] text-[#6B7280] border-transparent hover:bg-white hover:text-[#111827]"
              )}
              style={isSelected ? { borderColor: item.dotColor, color: item.dotColor } : undefined}
            >
              <div 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: item.dotColor }} 
              />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Text with highlights */}
      <div className="whitespace-pre-wrap break-words min-w-0 leading-[1.9] text-[#111827] text-[15px] font-medium font-sans print:text-[13px] print:leading-relaxed text-justify hyphens-auto">
        {parts.map((p, i) => {
          if (p.highlight) {
            const isActive = !!(
              activeText && (
                p.highlight.text.toLowerCase().trim() === activeText.toLowerCase().trim() ||
                activeText.toLowerCase().trim().includes(p.highlight.text.toLowerCase().trim()) ||
                p.highlight.text.toLowerCase().trim().includes(activeText.toLowerCase().trim())
              )
            );
            return (
              <span
                key={i}
                data-highlight-text={p.highlight.text}
                className={cn(
                  p.highlight.colorClass,
                  "cursor-pointer transition-all inline decoration-clone px-0.5 rounded-sm scroll-mt-32",
                  isActive
                    ? "ring-4 ring-blue-600/60 bg-blue-500/30 text-blue-950 scale-105 z-20 shadow-md shadow-blue-500/20 animate-pulse font-semibold"
                    : "hover:brightness-90 duration-300"
                )}
                onMouseEnter={(e) => handleMouseEnter(p.highlight!, e)}
                onMouseLeave={handleMouseLeave}
              >
                {p.text}
              </span>
            );
          }
          return <span key={i}>{p.text}</span>;
        })}
      </div>

      {/* Floating Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: Math.min(Math.max(tooltip.x, 120), (tooltip.containerWidth || 400) - 120),
              top: tooltip.y - 8,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-3.5 w-[260px] text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tooltip.highlight.dotColor }} />
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: tooltip.highlight.dotColor }}>
                  {tooltip.highlight.competency}
                </span>
              </div>
              <p className="text-[13px] font-bold text-[#111827] tracking-tight mb-1.5">{tooltip.highlight.type}</p>
              {tooltip.highlight.description && (
                <p className="text-[11px] text-[#6B7280] leading-relaxed font-medium">{tooltip.highlight.description}</p>
              )}
              <div className="mt-2 pt-2 border-t border-[#F1F3F5]">
                <p className="text-[10px] text-[#D1D5DB] font-mono truncate italic">
                  "{tooltip.highlight.text.slice(0, 50)}{tooltip.highlight.text.length > 50 ? '...' : ''}"
                </p>
              </div>
            </div>
            {/* Arrow */}
            <div className="w-3 h-3 bg-white border-r border-b border-[#E5E7EB] transform rotate-45 mx-auto -mt-1.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
