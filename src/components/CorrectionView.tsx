import React, { useState, useEffect, useCallback } from 'react';
import { Essay, EssayAnalysis, Classroom } from '../types';
import { 
  Check, 
  CheckCircle, 
  CaretLeft, 
  CaretRight, 
  Warning, 
  MagnifyingGlassPlus, 
  MagnifyingGlassMinus, 
  Image as ImageIcon, 
  EyeClosed, 
  Eye,
  ChartBar,
  ChatCircleText,
  ArrowRight,
  ArrowLeft,
  ListDashes,
  Key
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useToast } from './Toast';
import { CompetenceCard, C5Element } from './CompetenceCard';
import { HighlightedText } from './HighlightedText';
import { CompetencyScoreChart } from './CompetencyScoreChart';
import { fetchLanguageToolInsights } from '../services/aiService';
import { RUBRIC_DATA } from '../lib/rubricData';
import { ApiKeyModal } from './ApiKeyModal';

interface CorrectionViewProps {
  essay: Essay;
  classrooms: Classroom[];
  onBack: () => void;
  onUpdate: (updates: Partial<Essay>) => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalCount: number;
  onRetry?: (id: string) => void;
}

type CorrectionTab = 'overview' | 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'feedback' | 'all';

const QUICK_FEEDBACK_CHIPS = [
  'Excelente domínio da norma culta e excelente repertório sociocultural.',
  'Atenção ao uso da vírgula e paralelismo sintático nos períodos longos.',
  'Repertório sociocultural pertinente, mas é preciso aprofundar a produtividade na argumentação.',
  'Bom projeto de texto com tese clara, necessitando de maior encadeamento de conectivos interparágrafos.',
  'Proposta de intervenção completa com os 5 elementos (Agente, Ação, Meio, Efeito e Detalhamento).'
];

export function CorrectionView({ 
  essay, 
  classrooms, 
  onBack, 
  onUpdate, 
  onNext, 
  onPrev, 
  currentIndex, 
  totalCount, 
  onRetry 
}: CorrectionViewProps) {
  const [customFeedback, setCustomFeedback] = useState(essay.analysis?.teacherFeedback || '');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showOriginalScan, setShowOriginalScan] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'image'>('analysis');
  const [activeSection, setActiveSection] = useState<CorrectionTab>('overview');
  const [textFilter, setTextFilter] = useState<'all' | 'c1' | 'c2' | 'c3' | 'c4' | 'c5'>('all');
  const [isApproved, setIsApproved] = useState(false);
  const [isRunningLT, setIsRunningLT] = useState(false);
  const [activeHighlightText, setActiveHighlightText] = useState<string | null>(null);
  const [prevEssayId, setPrevEssayId] = useState(essay.id);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(localStorage.getItem('user_gemini_api_key')?.trim()));

  useEffect(() => {
    const handleKeyUpdate = () => {
      setHasApiKey(Boolean(localStorage.getItem('user_gemini_api_key')?.trim()));
    };
    window.addEventListener('gemini_key_updated', handleKeyUpdate);
    return () => window.removeEventListener('gemini_key_updated', handleKeyUpdate);
  }, []);

  if (essay.id !== prevEssayId) {
    setPrevEssayId(essay.id);
    setActiveTab('analysis');
    setActiveSection('overview');
    setTextFilter('all');
    setCustomFeedback(essay.analysis?.teacherFeedback || '');
    setIsApproved(false);
    setZoomLevel(1);
  }

  const { addToast } = useToast();
  const analysis = essay.analysis;

  // Sync text highlight filter with active competency section when switched
  const handleSelectSection = (tab: CorrectionTab) => {
    setActiveSection(tab);
    if (tab === 'c1' || tab === 'c2' || tab === 'c3' || tab === 'c4' || tab === 'c5') {
      setTextFilter(tab);
    } else {
      setTextFilter('all');
    }
  };

  const handleScrollToHighlight = (text: string) => {
    if (!text || text.trim() === '') return;
    const clean = text.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '').trim();
    if (!clean) return;
    setActiveHighlightText(clean);
    
    const timer = setTimeout(() => {
      setActiveHighlightText(null);
    }, 3000);

    setTimeout(() => {
      const elements = document.querySelectorAll('[data-highlight-text]');
      let targetElement: Element | null = null;
      const normalizedTarget = clean.toLowerCase();
      
      for (const el of elements) {
        const elText = (el.getAttribute('data-highlight-text') || '').replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '').trim().toLowerCase();
        if (elText === normalizedTarget) {
          targetElement = el;
          break;
        }
      }
      
      if (!targetElement) {
        for (const el of elements) {
          const elText = (el.getAttribute('data-highlight-text') || '').toLowerCase();
          if (elText.includes(normalizedTarget) || normalizedTarget.includes(elText)) {
            targetElement = el;
            break;
          }
        }
      }

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        addToast('Posicionado na transcrição!', 'info', 1000);
      } else {
        const container = document.getElementById('transcription-container');
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  };

  const handleRunLanguageTool = async () => {
    if (!analysis) return;
    setIsRunningLT(true);
    addToast('Verificando gramática com LanguageTool...', 'info');
    try {
      const insights = await fetchLanguageToolInsights(analysis.transcription);
      if (insights.length > 0) {
        const newAnalysis = structuredClone(analysis) as EssayAnalysis;
        const existingTexts = new Set(newAnalysis.competencies.c1.deviations.map(d => d.text.toLowerCase()));
        let added = 0;
        insights.forEach(insight => {
          if (!existingTexts.has(insight.text.toLowerCase())) {
            newAnalysis.competencies.c1.deviations.push({
              text: insight.text,
              type: 'Gramática (LanguageTool)',
              correction: insight.correction,
              explanation: insight.explanation
            });
            added++;
          }
        });
        if (added > 0) {
          onUpdate({ analysis: newAnalysis });
          addToast(`${added} novos desvios identificados!`, 'success');
        } else {
          addToast('Nenhum novo desvio gramatical encontrado.', 'info');
        }
      } else {
        addToast('Ótima notícia: a gramática parece em ordem.', 'success');
      }
    } catch {
      addToast('Erro ao acessar LanguageTool.', 'error');
    } finally {
      setIsRunningLT(false);
    }
  };

  useEffect(() => {
    if (!analysis) return;
    if (customFeedback === (analysis.teacherFeedback || '')) return;
    
    const timer = setTimeout(() => {
      onUpdate({ analysis: { ...analysis, teacherFeedback: customFeedback } });
    }, 1000);
    return () => clearTimeout(timer);
  }, [customFeedback, analysis, onUpdate]);

  const handleApprove = useCallback(() => {
    if (analysis) {
      onUpdate({ status: 'done', analysis: { ...analysis, teacherFeedback: customFeedback } });
    }
    setIsApproved(true);
    addToast('Avaliação aprovada e salva com sucesso!', 'success');
  }, [analysis, customFeedback, onUpdate, addToast]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
        return;
      }
      if (
        document.activeElement?.tagName === 'TEXTAREA' || 
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'SELECT'
      ) return;

      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'a' || e.key === 'A') handleApprove();
      if (e.key === 's' || e.key === 'S') setShowOriginalScan(prev => !prev);
      if (e.key === 'Escape') onBack();
      
      // Competency quick jumps: 1 to 5, and 0 for overview
      if (e.key === '1') handleSelectSection('c1');
      if (e.key === '2') handleSelectSection('c2');
      if (e.key === '3') handleSelectSection('c3');
      if (e.key === '4') handleSelectSection('c4');
      if (e.key === '5') handleSelectSection('c5');
      if (e.key === '0') handleSelectSection('overview');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onBack, handleApprove]);

  const handleScoreChange = (comp: 'c1'|'c2'|'c3'|'c4'|'c5', newScore: number) => {
    if (!analysis) return;
    const newAnalysis = structuredClone(analysis) as EssayAnalysis;
    newAnalysis.competencies[comp].score = newScore;
    const rawTotal = 
      newAnalysis.competencies.c1.score + 
      newAnalysis.competencies.c2.score + 
      newAnalysis.competencies.c3.score + 
      newAnalysis.competencies.c4.score + 
      newAnalysis.competencies.c5.score;
    
    newAnalysis.suggestedTotalScore = newAnalysis.competencies.c5.humanRightsViolation ? 0 : rawTotal;
    onUpdate({ analysis: newAnalysis });
    addToast(`${comp.toUpperCase()} atualizada para ${newScore} pts`, 'info', 1500);
  };
  
  const handleClassroomChange = (classroomId: string) => {
    onUpdate({ classroomId, studentId: undefined, studentName: undefined });
  };
  
  const handleStudentChange = (studentId: string) => {
    const cls = classrooms.find(c => c.id === essay.classroomId);
    if (!cls) return;
    const student = cls.students.find(s => s.id === studentId);
    if (student) {
      onUpdate({ studentId, studentName: student.name });
    }
  };

  const handleAddFeedbackPreset = (text: string) => {
    setCustomFeedback(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return text;
      if (trimmed.includes(text)) return trimmed;
      return `${trimmed}\n• ${text}`;
    });
    addToast('Adicionado ao parecer!', 'success', 1200);
  };

  const renderErrorState = () => {
    const isKeyIssue = !hasApiKey || 
      essay.error?.toLowerCase().includes('chave') || 
      essay.error?.toLowerCase().includes('api_key') || 
      essay.error?.toLowerCase().includes('api key') ||
      essay.error?.toLowerCase().includes('401') || 
      essay.error?.toLowerCase().includes('500');

    return (
      <div className="max-w-xl mx-auto space-y-8 py-6">
        <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 border border-red-100 shadow-xs">
            <Warning weight="fill" size={32} />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[#111827]">Não foi possível corrigir este arquivo</h3>
          <p className="text-sm mt-2 text-[#6B7280] font-medium leading-relaxed">
            {isKeyIssue && !hasApiKey
              ? "É necessário configurar sua chave da API do Gemini para analisar as redações."
              : "A inteligência artificial encontrou uma falha na transcrição ou na avaliação da redação."}
          </p>
          
          {/* Action Card for API Key */}
          <div className="w-full mt-6 p-5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-left">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Key size={16} weight="bold" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#111827] text-xs uppercase tracking-wider">
                  {hasApiKey ? 'Chave do Gemini Configurada' : 'Chave de API Necessária'}
                </h4>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Como este aplicativo roda na Vercel com chave individual por usuário, você deve utilizar sua própria chave gratuita do Google AI Studio.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="mt-4 w-full py-2.5 px-4 bg-[#111827] hover:bg-black text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Key size={14} weight="bold" />
              {hasApiKey ? 'Trocar ou Testar Minha Chave' : 'Inserir Minha Chave Gratuita'}
            </button>
          </div>

          {onRetry && (
            <button
              onClick={() => {
                if (!hasApiKey) {
                  setShowApiKeyModal(true);
                } else {
                  onRetry(essay.id);
                }
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-[#2563EB]/20 active:scale-95"
            >
              Reanalisar Redação
            </button>
          )}
        </div>

        <div className="bg-[#111827] text-gray-100 p-6 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono">🔍 Log Técnico</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#EF4444] font-mono">Falha</span>
          </div>
          <div className="font-mono text-xs text-red-300 bg-red-950/20 p-4 rounded-lg border border-red-900/40 overflow-x-auto select-all max-h-40 whitespace-pre-wrap leading-relaxed">
            {essay.error || 'Erro interno da API do Gemini ou formato do arquivo incompatível.'}
          </div>
        </div>
      </div>
    );
  };

  if (!analysis && essay.status !== 'error') return null;

  if (isApproved) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#F8F9FA]"
      >
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
          className="w-20 h-20 bg-emerald-50 text-[#059669] rounded-2xl flex items-center justify-center mb-6 border border-emerald-200 shadow-xs"
        >
          <Check weight="bold" size={40} />
        </motion.div>
        <h2 className="text-2xl font-bold text-[#111827] tracking-tight">Correção Concluída e Aprovada!</h2>
        <p className="text-[#6B7280] mt-2 text-sm max-w-sm font-medium">
          A nota final ({analysis?.suggestedTotalScore} pts) e o parecer foram registrados no sistema.
        </p>
        <div className="flex gap-3 mt-8">
          <button 
            onClick={onBack} 
            className="bg-white hover:bg-[#F1F3F5] text-[#111827] border border-[#E5E7EB] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95"
          >
            Voltar ao Painel
          </button>
          <button 
            onClick={onNext} 
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm shadow-[#2563EB]/20 transition-all cursor-pointer active:scale-95"
          >
            Próxima Redação
          </button>
        </div>
      </motion.div>
    );
  }

  const wordCount = analysis ? analysis.transcription.trim().split(/\s+/).filter(Boolean).length : 0;
  const lineCount = analysis ? analysis.transcription.trim().split('\n').filter(line => line.trim().length > 0).length : 0;
  const selectedClassroom = classrooms.find(c => c.id === essay.classroomId);

  const scores = analysis ? {
    c1: analysis.competencies.c1.score,
    c2: analysis.competencies.c2.score,
    c3: analysis.competencies.c3.score,
    c4: analysis.competencies.c4.score,
    c5: analysis.competencies.c5.score,
  } : { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };

  const totalScore = analysis ? analysis.suggestedTotalScore : 0;

  return (
    <div className="h-full flex flex-col bg-[#F8F9FA] overflow-hidden font-sans text-[#111827] print:overflow-visible print:h-auto">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#E5E7EB] px-4 lg:px-6 py-2.5 flex-shrink-0 z-20 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back & Student inline assignment */}
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={onBack} 
              className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#111827] font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#F1F3F5]"
              title="Voltar ao Painel (Esc)"
            >
              <CaretLeft weight="bold" size={16} /> 
              <span className="hidden sm:inline">Painel</span>
            </button>
            <div className="h-5 w-px bg-[#E5E7EB]" />
            
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                placeholder="Nome do Aluno..."
                value={essay.studentName || ''}
                onChange={(e) => onUpdate({ studentName: e.target.value })}
                className="font-bold text-[#111827] text-sm bg-transparent border-b border-transparent hover:border-[#D1D5DB] focus:border-[#2563EB] focus:outline-none placeholder:text-[#9CA3AF] transition-colors min-w-[120px] max-w-[180px] truncate py-0.5"
              />
              <select 
                value={essay.classroomId || ""} 
                onChange={(e) => handleClassroomChange(e.target.value)}
                className="appearance-none bg-[#F8F9FA] border border-[#E5E7EB] text-[#4B5563] font-bold text-[11px] uppercase tracking-wider px-2 py-1 rounded-lg cursor-pointer focus:outline-none focus:border-[#2563EB] truncate max-w-[110px]"
              >
                <option value="" disabled>Turma</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {essay.classroomId && selectedClassroom && (
                <select 
                  value={essay.studentId || ""} 
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="appearance-none bg-[#F8F9FA] border border-[#E5E7EB] text-[#4B5563] font-bold text-[11px] uppercase tracking-wider px-2 py-1 rounded-lg cursor-pointer focus:outline-none focus:border-[#2563EB] truncate max-w-[110px]"
                >
                  <option value="" disabled>Aluno</option>
                  {selectedClassroom.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Right: Quick actions & Total Score */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Carousel navigation */}
            <div className="flex items-center gap-1 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-1 py-0.5">
              <button 
                title="Anterior (←)" 
                onClick={onPrev} 
                className="p-1 hover:bg-white rounded transition-all cursor-pointer text-[#6B7280] hover:text-[#111827] disabled:opacity-20 active:scale-90" 
                disabled={currentIndex === 0}
              >
                <CaretLeft weight="bold" size={14} />
              </button>
              <span className="text-[11px] font-bold text-[#111827] font-mono px-1 min-w-[36px] text-center">
                {currentIndex + 1}/{totalCount}
              </span>
              <button 
                title="Próxima (→)" 
                onClick={onNext} 
                className="p-1 hover:bg-white rounded transition-all cursor-pointer text-[#6B7280] hover:text-[#111827] disabled:opacity-20 active:scale-90" 
                disabled={currentIndex === totalCount - 1}
              >
                <CaretRight weight="bold" size={14} />
              </button>
            </div>

            {/* Toggle Scan */}
            <button 
              onClick={() => setShowOriginalScan(!showOriginalScan)} 
              title="Alternar visualização da foto original (S)"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer border",
                showOriginalScan 
                  ? "bg-[#2563EB] text-white border-transparent shadow-xs" 
                  : "text-[#6B7280] hover:bg-[#F1F3F5] border-[#E5E7EB]"
              )}
            >
              {showOriginalScan ? <EyeClosed weight="bold" size={14} /> : <ImageIcon weight="bold" size={14} />}
              <span className="hidden md:inline">{showOriginalScan ? "Ocultar Scan" : "Ver Scan"}</span>
            </button>

            {/* Score Pill */}
            <div className={cn(
              "flex items-center gap-1.5 px-3.5 py-1 rounded-xl border font-mono font-black",
              totalScore >= 800 ? "bg-emerald-50 border-emerald-200 text-[#059669]" :
              totalScore >= 600 ? "bg-blue-50 border-blue-200 text-[#2563EB]" :
              totalScore >= 400 ? "bg-amber-50 border-amber-200 text-[#D97706]" :
              "bg-rose-50 border-rose-200 text-[#E11D48]"
            )}>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 font-sans">Nota:</span>
              <span className="text-xl tracking-tight leading-none">{totalScore}</span>
            </div>
            
            {/* Quick Approve Button */}
            <button 
              title="Aprovar e Salvar Correção (A)" 
              onClick={handleApprove} 
              disabled={!analysis}
              className={cn(
                "flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs",
                analysis 
                  ? "bg-[#059669] hover:bg-[#047857] text-white shadow-emerald-600/20" 
                  : "bg-[#F1F3F5] text-[#9CA3AF] cursor-not-allowed"
              )}
            >
              <CheckCircle weight="bold" size={16} /> 
              <span>Aprovar</span>
            </button>
          </div>
        </div>

        {/* Dynamic Quick Navigation Rail (Tabs: Visão Geral, C1, C2, C3, C4, C5, Parecer, Todas) */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pt-2.5 border-t border-[#F1F3F5] mt-2 no-scrollbar">
          <div className="flex items-center gap-1 min-w-max">
            {/* Visão Geral */}
            <button
              type="button"
              onClick={() => handleSelectSection('overview')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                activeSection === 'overview'
                  ? "bg-[#111827] text-white border-[#111827] shadow-xs"
                  : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#D1D5DB] hover:text-[#111827]"
              )}
            >
              <ChartBar size={14} weight="bold" />
              <span>Resumo & Gráfico</span>
            </button>

            {/* C1 to C5 Quick Pills */}
            {RUBRIC_DATA.map((r) => {
              const isCurrent = activeSection === r.id;
              const compScore = scores[r.id];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectSection(r.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                    isCurrent
                      ? "shadow-xs text-white"
                      : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]"
                  )}
                  style={isCurrent ? { backgroundColor: r.color, borderColor: r.color } : undefined}
                >
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: isCurrent ? '#FFFFFF' : r.color }} 
                  />
                  <span>{r.id.toUpperCase()}</span>
                  <span className={cn(
                    "font-mono font-black text-[10px] px-1 py-0.2 rounded",
                    isCurrent ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#111827]"
                  )}>
                    {compScore}
                  </span>
                </button>
              );
            })}

            {/* Parecer */}
            <button
              type="button"
              onClick={() => handleSelectSection('feedback')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                activeSection === 'feedback'
                  ? "bg-[#111827] text-white border-[#111827] shadow-xs"
                  : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#D1D5DB] hover:text-[#111827]"
              )}
            >
              <ChatCircleText size={14} weight="bold" />
              <span>Parecer</span>
            </button>

            {/* Ver Todas */}
            <button
              type="button"
              onClick={() => handleSelectSection('all')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                activeSection === 'all'
                  ? "bg-[#111827] text-white border-[#111827] shadow-xs"
                  : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#D1D5DB] hover:text-[#111827]"
              )}
              title="Exibir todas as 5 competências em lista contínua"
            >
              <ListDashes size={14} weight="bold" />
              <span>Todas</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest pl-2">
            <span>Atalhos: [1-5] Competências • [0] Resumo • [A] Aprovar • [S] Scan</span>
          </div>
        </div>
      </header>

      {/* Print Header */}
      <div className="hidden print:block mb-8 pb-4 border-b border-[#111827]">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-[#111827]">Relatório de Avaliação - ENEM</h1>
        <div className="flex justify-between items-end mt-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#6B7280] tracking-widest">Aluno(a)</p>
            <p className="text-lg font-bold text-[#111827]">{essay.studentName || essay.fileName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-[#6B7280] tracking-widest">Nota Final</p>
            <p className="text-3xl font-bold font-mono text-[#2563EB]">{analysis ? analysis.suggestedTotalScore : "—"} / 1000</p>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex sm:hidden border-b border-[#E5E7EB] bg-white">
        <button 
          onClick={() => setActiveTab('analysis')}
          className={cn(
            "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
            activeTab === 'analysis' ? "border-[#2563EB] text-[#2563EB] bg-blue-50/30" : "border-transparent text-[#9CA3AF]"
          )}
        >
          Avaliação
        </button>
        <button 
          onClick={() => setActiveTab('image')}
          className={cn(
            "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
            activeTab === 'image' ? "border-[#2563EB] text-[#2563EB] bg-blue-50/30" : "border-transparent text-[#9CA3AF]"
          )}
        >
          Scan Original
        </button>
      </div>

      {/* Split Pane Work Area */}
      <div className="flex-1 flex overflow-hidden print:overflow-visible print:block relative">
        {/* Left: Original Scan */}
        {(showOriginalScan || activeTab === 'image') && (
          <div className={cn(
            "bg-[#F1F3F5] flex flex-col relative print:hidden transition-all duration-300",
            activeTab === 'image' 
              ? "fixed inset-0 top-24 z-40 sm:relative sm:inset-auto sm:top-auto sm:w-5/12 sm:border-r sm:border-[#E5E7EB]" 
              : "hidden sm:flex sm:w-5/12 sm:border-r sm:border-[#E5E7EB]"
          )}>
            <div className="absolute top-4 right-4 z-20 flex gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1 shadow-lg">
              <button 
                onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.2))} 
                className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F8F9FA] rounded-md transition-all cursor-pointer"
                title="Diminuir Zoom"
              >
                <MagnifyingGlassMinus weight="bold" size={16}/>
              </button>
              <button 
                onClick={() => setZoomLevel(1)} 
                className="px-2.5 text-[11px] font-bold text-[#111827] hover:bg-[#F8F9FA] rounded-md transition-all cursor-pointer font-mono flex items-center"
                title="Resetar Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button 
                onClick={() => setZoomLevel(z => Math.min(3, z + 0.2))} 
                className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F8F9FA] rounded-md transition-all cursor-pointer"
                title="Aumentar Zoom"
              >
                <MagnifyingGlassPlus weight="bold" size={16}/>
              </button>
            </div>

            <div className="flex-1 overflow-auto relative flex justify-center p-6 md:p-8 custom-scrollbar bg-[#111827]/5">
              {essay.imageUrl.startsWith('data:application/pdf') ? (
                <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }} className="flex-shrink-0">
                  <iframe 
                    src={essay.imageUrl + '#toolbar=0&navpanes=0&scrollbar=0'} 
                    title="PDF Original" 
                    className="w-[800px] h-[1132px] bg-white shadow-xl relative z-10" 
                  />
                </div>
              ) : (
                <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }} className="flex-shrink-0">
                  <img 
                    src={essay.imageUrl} 
                    alt="Scan" 
                    className="max-w-none w-[800px] h-auto bg-white shadow-xl relative z-10 rounded-sm" 
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Workspace: Two-column Desktop Layout (Left: Redação / Right: Mesa de Correção) */}
        <div className={cn(
          "flex-1 bg-[#F8F9FA] overflow-y-auto relative custom-scrollbar print:overflow-visible print:bg-white print:w-full transition-opacity duration-300",
          activeTab === 'image' ? "hidden sm:block opacity-40" : "block opacity-100"
        )}>
          <div className={cn(
            "mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6 print:p-0 print:space-y-6",
            showOriginalScan ? "max-w-4xl" : "max-w-7xl"
          )}>
            {!analysis ? renderErrorState() : (
              <>
                {/* Warning Nullity (if triggered) */}
                {analysis.nullity.isValid === false && (
                  <div className="bg-white p-5 rounded-2xl border-l-4 border-l-[#DC2626] border border-[#E5E7EB] flex items-start gap-4 shadow-xs">
                    <Warning weight="fill" size={24} className="flex-shrink-0 text-[#DC2626] mt-0.5" />
                    <div>
                      <h4 className="font-bold text-base tracking-tight text-[#111827]">Motivo de Anulação Detectado</h4>
                      <p className="text-xs mt-1 text-[#6B7280] font-medium leading-relaxed">{analysis.nullity.reason}</p>
                    </div>
                  </div>
                )}

                {/* Primary 2-Column Evaluation Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN: Redação Transcrita com Destaques e Métricas */}
                  <div className={cn(
                    "space-y-4",
                    showOriginalScan ? "lg:col-span-12" : "lg:col-span-6 xl:col-span-7"
                  )}>
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 md:p-7 shadow-xs">
                      {/* Transcription Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-[#F1F3F5]">
                        <div>
                          <h3 className="font-bold text-base text-[#111827]">Transcrição da Redação</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {essay.theme && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200/50">
                                Tema: {essay.theme}
                              </span>
                            )}
                            {essay.specialNeedsProfile && essay.specialNeedsProfile !== 'none' && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] border border-purple-200/50">
                                {essay.specialNeedsProfile === 'dislexia' ? '🧠 Dislexia' : essay.specialNeedsProfile === 'surdez' ? '👂 Surdez' : '🧩 TEA'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Line and Word Badges */}
                        <div className="flex items-center gap-2 text-[11px] font-bold font-mono">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg border",
                            lineCount < 8 ? "bg-rose-50 text-[#E11D48] border-rose-200" : "bg-[#F8F9FA] text-[#4B5563] border-[#E5E7EB]"
                          )}>
                            {lineCount} Linhas
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-[#F8F9FA] text-[#4B5563] border border-[#E5E7EB]">
                            {wordCount} Palavras
                          </span>
                        </div>
                      </div>

                      {/* Interactive Highlighted Text */}
                      <div id="transcription-container" className="scroll-mt-32">
                        <HighlightedText 
                          text={analysis.transcription} 
                          analysis={analysis} 
                          activeText={activeHighlightText}
                          competencyFilter={textFilter}
                          onSelectFilter={setTextFilter}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Mesa de Correção Dinâmica & Rápida */}
                  <div className={cn(
                    "space-y-4 min-w-0",
                    showOriginalScan ? "lg:col-span-12" : "lg:col-span-6 xl:col-span-5"
                  )}>
                    
                    {/* Mode 1: Resumo Geral & Gráfico de Alto Desempenho */}
                    {activeSection === 'overview' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 6 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* High Readability Bar Chart Component */}
                        <CompetencyScoreChart 
                          scores={scores}
                          activeCompetency={null}
                          onSelectCompetency={(id) => handleSelectSection(id)}
                          onChangeScore={handleScoreChange}
                        />

                        {/* Action Banner to Step-by-Step */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-4 flex items-center justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-sm text-[#111827]">Modo Avaliação Focada</h4>
                            <p className="text-xs text-[#6B7280] mt-0.5">
                              Navegue competência por competência para conferência rápida.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectSection('c1')}
                            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer active:scale-95 shrink-0"
                          >
                            <span>Iniciar C1</span>
                            <ArrowRight size={14} weight="bold" />
                          </button>
                        </div>

                        {/* Quick Insights Cards */}
                        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B7280]">
                            Diagnóstico Rápido
                          </h4>
                          <div className="space-y-3 text-xs">
                            <div className="flex items-start gap-2.5">
                              <span className="font-bold font-mono text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-[#2563EB] shrink-0">C1</span>
                              <p className="text-[#374151]">
                                {analysis.competencies.c1.deviations.length === 0 
                                  ? 'Nenhum desvio gramatical detectado.' 
                                  : `${analysis.competencies.c1.deviations.length} desvios gramaticais identificados.`}
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="font-bold font-mono text-[11px] px-1.5 py-0.5 rounded bg-purple-100 text-[#7C3AED] shrink-0">C2</span>
                              <p className="text-[#374151]">
                                Adequação ao tema: <strong>{analysis.competencies.c2.themeAddressed}</strong>. {analysis.competencies.c2.repertoire.length} repertórios identificados.
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="font-bold font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-[#D97706] shrink-0">C3</span>
                              <p className="text-[#374151] line-clamp-2">
                                {analysis.competencies.c3.thesis ? `Tese: "${analysis.competencies.c3.thesis}"` : 'Tese não explicitada.'}
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="font-bold font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-[#059669] shrink-0">C4</span>
                              <p className="text-[#374151]">
                                {analysis.competencies.c4.connectives.length} conectivos mapeados. {analysis.competencies.c4.monobloc ? 'Atenção: texto monobloco.' : 'Múltiplos parágrafos articulados.'}
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="font-bold font-mono text-[11px] px-1.5 py-0.5 rounded bg-rose-100 text-[#E11D48] shrink-0">C5</span>
                              <p className="text-[#374151]">
                                {analysis.competencies.c5.humanRightsViolation 
                                  ? '⚠ Violação de direitos humanos!' 
                                  : 'Proposta de intervenção estruturada com elementos identificados.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Mode 2: Focused Competency 1 (Norma Culta) */}
                    {(activeSection === 'c1' || activeSection === 'all') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 6 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <CompetenceCard 
                          title="Competência 1" 
                          subtitle="Domínio da Norma Culta" 
                          score={analysis.competencies.c1.score} 
                          max={200} 
                          onChangeScore={(val) => handleScoreChange('c1', val)} 
                          competencyId="c1"
                        >
                          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] bg-[#F8F9FA] border border-[#E5E7EB] px-3 py-1.5 rounded-lg flex items-center gap-2">
                              Estrutura:
                              <span className="text-[#111827] font-bold">{analysis.competencies.c1.structureClass || 'Regular'}</span>
                            </div>
                            <button 
                              onClick={handleRunLanguageTool} 
                              disabled={isRunningLT}
                              className="text-[10px] font-bold uppercase tracking-wider bg-white hover:bg-[#F8F9FA] text-[#2563EB] border border-[#2563EB]/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 active:scale-95"
                            >
                              {isRunningLT ? "Inspecionando..." : "LanguageTool"}
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {analysis.competencies.c1.deviations.map((dev, i) => (
                              <div 
                                key={i} 
                                onClick={() => handleScrollToHighlight(dev.text)}
                                title="Clique para localizar na transcrição"
                                className="text-xs bg-white p-3 rounded-xl border border-[#E5E7EB] flex flex-col items-start gap-1.5 group hover:border-[#2563EB] hover:bg-blue-50/20 transition-all cursor-pointer active:scale-[0.99]"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-[#2563EB]">
                                    {dev.type}
                                  </span>
                                  <span className="text-[#9CA3AF] group-hover:text-[#2563EB] transition-colors flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider">
                                    <Eye size={12} weight="bold" />
                                    Ver no Texto
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-rose-600 line-through font-mono font-bold">{dev.text}</span>
                                  <span className="text-[#9CA3AF]">→</span>
                                  <span className="text-emerald-700 font-bold font-mono">{dev.correction}</span>
                                </div>
                                <span className="text-[#6B7280] text-[11px] leading-relaxed italic">{dev.explanation}</span>
                              </div>
                            ))}
                            {analysis.competencies.c1.deviations.length === 0 && (
                              <div className="text-xs text-emerald-700 py-6 text-center bg-emerald-50 rounded-xl font-medium flex flex-col items-center justify-center gap-1.5 border border-emerald-200">
                                <CheckCircle size={24} weight="bold" /> 
                                <span className="font-bold">Nenhum desvio gramatical detectado</span>
                              </div>
                            )}
                          </div>
                        </CompetenceCard>

                        {/* Stepper Footer */}
                        {activeSection === 'c1' && (
                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => handleSelectSection('overview')}
                              className="text-xs font-bold text-[#6B7280] hover:text-[#111827] flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white cursor-pointer"
                            >
                              <ArrowLeft size={14} /> Resumo
                            </button>
                            <button
                              onClick={() => handleSelectSection('c2')}
                              className="text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                            >
                              <span>Próxima: C2 Tema</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Mode 3: Focused Competency 2 (Tema e Repertório) */}
                    {(activeSection === 'c2' || activeSection === 'all') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 6 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <CompetenceCard 
                          title="Competência 2" 
                          subtitle="Compreensão do Tema e Repertório" 
                          score={analysis.competencies.c2.score} 
                          max={200} 
                          onChangeScore={(val) => handleScoreChange('c2', val)} 
                          competencyId="c2"
                        >
                          <div className="space-y-4">
                            <div>
                              <span className="text-[#7C3AED] font-bold uppercase tracking-wider text-[10px] block mb-1.5">
                                Tema Detectado
                              </span>
                              <div className="bg-purple-50 border border-purple-200/60 p-3 rounded-xl">
                                <p className="font-bold text-[#111827] text-xs leading-snug">{analysis.detectedTheme}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-[#F1F3F5] pb-3">
                              <span className="text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                                Abordagem do Tema:
                              </span>
                              <span className={cn(
                                "font-bold text-xs px-2.5 py-1 rounded-md",
                                analysis.competencies.c2.themeAddressed === 'Completo' ? "bg-emerald-50 text-[#059669]" :
                                analysis.competencies.c2.themeAddressed === 'Tangencial' ? "bg-amber-50 text-[#D97706]" :
                                "bg-rose-50 text-[#DC2626]"
                              )}>
                                {analysis.competencies.c2.themeAddressed}
                              </span>
                            </div>

                            <div>
                              <span className="text-[#6B7280] font-bold uppercase tracking-wider text-[10px] block mb-2">
                                Repertório Sociocultural ({analysis.competencies.c2.repertoire.length})
                              </span>
                              <div className="space-y-2">
                                {analysis.competencies.c2.repertoire.map((r, i) => (
                                  <div 
                                    key={i} 
                                    onClick={() => handleScrollToHighlight(r.reference)}
                                    title="Clique para localizar na transcrição"
                                    className={cn(
                                      "border p-3 rounded-xl transition-all cursor-pointer hover:shadow-xs active:scale-[0.99]",
                                      r.productive 
                                        ? "bg-emerald-50/40 border-emerald-200" 
                                        : "bg-rose-50/40 border-rose-200"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <div className="font-bold text-[#111827] text-xs leading-snug">{r.reference}</div>
                                      <span className="text-[#9CA3AF] flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                        <Eye size={12} weight="bold" />
                                        Ver
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider", r.productive ? "bg-emerald-100 text-[#059669]" : "bg-rose-100 text-[#DC2626]")}>
                                        {r.productive ? "✓ Produtivo" : "✗ Limitado"}
                                      </span>
                                      {r.canned && <span className="bg-amber-100 text-[#D97706] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">⚠ Decorado</span>}
                                    </div>
                                  </div>
                                ))}
                                {analysis.competencies.c2.repertoire.length === 0 && (
                                  <p className="text-[#9CA3AF] text-xs italic">Nenhum repertório externo identificado.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CompetenceCard>

                        {/* Stepper Footer */}
                        {activeSection === 'c2' && (
                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => handleSelectSection('c1')}
                              className="text-xs font-bold text-[#6B7280] hover:text-[#111827] flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white cursor-pointer"
                            >
                              <ArrowLeft size={14} /> C1 Norma
                            </button>
                            <button
                              onClick={() => handleSelectSection('c3')}
                              className="text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                            >
                              <span>Próxima: C3 Projeto</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Mode 4: Focused Competency 3 (Projeto de Texto e Argumentação) */}
                    {(activeSection === 'c3' || activeSection === 'all') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 6 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <CompetenceCard 
                          title="Competência 3" 
                          subtitle="Projeto de Texto e Argumentação" 
                          score={analysis.competencies.c3.score} 
                          max={200} 
                          onChangeScore={(val) => handleScoreChange('c3', val)} 
                          competencyId="c3"
                        >
                          <div className="space-y-4">
                            <div>
                              <span className="text-[#D97706] font-bold uppercase tracking-wider text-[10px] block mb-1">
                                Projeto de Texto
                              </span>
                              <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-xl">
                                <p className="font-bold text-[#111827] text-xs leading-relaxed">{analysis.competencies.c3.project}</p>
                              </div>
                            </div>

                            {analysis.competencies.c3.thesis && (
                              <div>
                                <span className="text-[#6B7280] font-bold uppercase tracking-wider text-[10px] block mb-1">
                                  Tese Central
                                </span>
                                <div 
                                  onClick={() => handleScrollToHighlight(analysis.competencies.c3.thesis)}
                                  title="Clique para localizar na transcrição"
                                  className="bg-amber-50/50 border-l-4 border-l-[#D97706] p-3 rounded-r-xl cursor-pointer hover:bg-amber-50 transition-all"
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-[#D97706] uppercase tracking-wider">Tese Identificada</span>
                                    <span className="text-[#9CA3AF] flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider">
                                      <Eye size={12} weight="bold" />
                                      Ver
                                    </span>
                                  </div>
                                  <p className="text-[#374151] text-xs leading-relaxed font-semibold italic">"{analysis.competencies.c3.thesis}"</p>
                                </div>
                              </div>
                            )}

                            {analysis.competencies.c3.arguments?.length > 0 && (
                              <div>
                                <span className="text-[#6B7280] font-bold uppercase tracking-wider text-[10px] block mb-2">
                                  Argumentos ({analysis.competencies.c3.arguments.length})
                                </span>
                                <div className="space-y-2">
                                  {analysis.competencies.c3.arguments.map((arg, i) => (
                                    <div 
                                      key={i} 
                                      onClick={() => handleScrollToHighlight(arg.text)}
                                      title="Clique para localizar na transcrição"
                                      className="bg-[#F8F9FA] border border-[#E5E7EB] p-3 rounded-xl hover:border-amber-400 transition-all cursor-pointer"
                                    >
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="font-bold text-[#111827] text-xs leading-snug">{arg.text}</div>
                                        <span className="text-[#9CA3AF] flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                          <Eye size={12} weight="bold" />
                                          Ver
                                        </span>
                                      </div>
                                      <div className="text-[#6B7280] text-[11px] leading-relaxed">{arg.explanation}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CompetenceCard>

                        {/* Stepper Footer */}
                        {activeSection === 'c3' && (
                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => handleSelectSection('c2')}
                              className="text-xs font-bold text-[#6B7280] hover:text-[#111827] flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white cursor-pointer"
                            >
                              <ArrowLeft size={14} /> C2 Tema
                            </button>
                            <button
                              onClick={() => handleSelectSection('c4')}
                              className="text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                            >
                              <span>Próxima: C4 Coesão</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Mode 5: Focused Competency 4 (Coesão e Conectivos) */}
                    {(activeSection === 'c4' || activeSection === 'all') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 6 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <CompetenceCard 
                          title="Competência 4" 
                          subtitle="Coesão e Conectivos" 
                          score={analysis.competencies.c4.score} 
                          max={200} 
                          onChangeScore={(val) => handleScoreChange('c4', val)} 
                          competencyId="c4"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                                Estrutura dos Parágrafos:
                              </span>
                              <span className={cn(
                                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                analysis.competencies.c4.monobloc ? "bg-rose-50 text-[#DC2626]" : "bg-emerald-50 text-[#059669]"
                              )}>
                                {analysis.competencies.c4.monobloc ? "⚠ Texto Monobloco" : "✓ Múltiplos Parágrafos"}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                                  Conectivos Encontrados ({analysis.competencies.c4.connectives.length})
                                </span>
                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#059669]" />Inter</span>
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-300" />Intra</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {analysis.competencies.c4.connectives.map((c, i) => (
                                  <span
                                    key={i}
                                    onClick={() => handleScrollToHighlight(c.text)}
                                    className={cn(
                                      "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5",
                                      c.isInterparagraph
                                        ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                                        : "bg-[#F8F9FA] text-[#4B5563] border-[#E5E7EB] hover:bg-white"
                                    )}
                                    title={c.isInterparagraph ? "Conectivo Interparágrafo - Clique para localizar" : "Conectivo Intraparágrafo"}
                                  >
                                    <span className={cn("w-1.5 h-1.5 rounded-full", c.isInterparagraph ? "bg-[#059669]" : "bg-[#9CA3AF]")} />
                                    {c.text}
                                  </span>
                                ))}
                                {analysis.competencies.c4.connectives.length === 0 && (
                                  <p className="text-[#9CA3AF] text-xs italic">Nenhum conectivo identificado.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CompetenceCard>

                        {/* Stepper Footer */}
                        {activeSection === 'c4' && (
                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => handleSelectSection('c3')}
                              className="text-xs font-bold text-[#6B7280] hover:text-[#111827] flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white cursor-pointer"
                            >
                              <ArrowLeft size={14} /> C3 Projeto
                            </button>
                            <button
                              onClick={() => handleSelectSection('c5')}
                              className="text-xs font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                            >
                              <span>Próxima: C5 Proposta</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Mode 6: Focused Competency 5 (Proposta de Intervenção) */}
                    {(activeSection === 'c5' || activeSection === 'all') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 6 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <CompetenceCard 
                          title="Competência 5" 
                          subtitle="Proposta de Intervenção" 
                          score={analysis.competencies.c5.score} 
                          max={200} 
                          onChangeScore={(val) => handleScoreChange('c5', val)} 
                          competencyId="c5"
                        >
                          {analysis.competencies.c5.humanRightsViolation && (
                            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5">
                              <Warning weight="fill" className="text-rose-600 w-5 h-5 shrink-0" />
                              <span className="text-rose-700 text-xs font-bold">
                                Violação de Direitos Humanos — Zera a redação conforme a Cartilha 2025.
                              </span>
                            </div>
                          )}

                          <div className="bg-rose-50/20 rounded-xl border border-rose-200/60 overflow-hidden divide-y divide-rose-100">
                            <C5Element label="1. Agente" value={analysis.competencies.c5.elements.agent} color="#E11D48" onClick={handleScrollToHighlight} />
                            <C5Element label="2. Ação" value={analysis.competencies.c5.elements.action} color="#E11D48" onClick={handleScrollToHighlight} />
                            <C5Element label="3. Meio/Modo" value={analysis.competencies.c5.elements.means} color="#E11D48" onClick={handleScrollToHighlight} />
                            <C5Element label="4. Efeito" value={analysis.competencies.c5.elements.effect} color="#E11D48" onClick={handleScrollToHighlight} />
                            <C5Element label="5. Detalhamento" value={analysis.competencies.c5.elements.detail} color="#E11D48" onClick={handleScrollToHighlight} />
                          </div>
                        </CompetenceCard>

                        {/* Stepper Footer */}
                        {activeSection === 'c5' && (
                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => handleSelectSection('c4')}
                              className="text-xs font-bold text-[#6B7280] hover:text-[#111827] flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white cursor-pointer"
                            >
                              <ArrowLeft size={14} /> C4 Coesão
                            </button>
                            <button
                              onClick={() => handleSelectSection('feedback')}
                              className="text-xs font-bold text-white bg-[#111827] hover:bg-black flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                            >
                              <span>Finalizar no Parecer</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Mode 7: Parecer & Feedback Final */}
                    {(activeSection === 'feedback' || activeSection === 'all') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 6 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
                          <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
                            <div className="flex items-center gap-2">
                              <ChatCircleText size={18} weight="bold" className="text-[#2563EB]" />
                              <h4 className="font-bold text-sm text-[#111827]">Parecer do Professor</h4>
                            </div>
                            {customFeedback && (
                              <button 
                                onClick={() => setCustomFeedback('')} 
                                className="text-[10px] font-bold uppercase tracking-wider text-[#DC2626] hover:opacity-70 cursor-pointer"
                              >
                                Limpar
                              </button>
                            )}
                          </div>

                          {/* Quick Preset Chips */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-2">
                              + Inserir comentários frequentes com 1 clique:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {QUICK_FEEDBACK_CHIPS.map((chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleAddFeedbackPreset(chip)}
                                  className="text-[10px] text-left font-medium px-2.5 py-1 rounded-lg bg-[#F8F9FA] text-[#4B5563] border border-[#E5E7EB] hover:bg-blue-50 hover:text-[#2563EB] hover:border-blue-200 transition-all cursor-pointer leading-tight"
                                >
                                  + {chip.substring(0, 48)}...
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Feedback Textarea */}
                          <textarea 
                            value={customFeedback} 
                            onChange={(e) => setCustomFeedback(e.target.value)} 
                            placeholder="Escreva orientações pedagógicas para o aluno..."
                            className="w-full h-44 p-3.5 text-sm bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] focus:bg-white focus:border-[#2563EB] focus:outline-none text-[#111827] font-medium placeholder:text-[#9CA3AF] resize-none leading-relaxed transition-all" 
                          />

                          {/* Action Bar */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] font-mono text-[#9CA3AF]">
                              {customFeedback.length} caracteres
                            </span>
                            <button 
                              onClick={handleApprove} 
                              className="bg-[#059669] hover:bg-[#047857] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                            >
                              <CheckCircle size={16} weight="bold" />
                              <span>Concluir Correção</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeySaved={() => {
          setShowApiKeyModal(false);
          if (essay.status === 'error' && onRetry) {
            onRetry(essay.id);
          }
        }}
        reasonMessage="Informe sua chave do Gemini para reanalisar esta redação."
      />
    </div>
  );
}
