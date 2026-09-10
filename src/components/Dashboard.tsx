import React, { useState, useCallback } from 'react';
import { Essay, Classroom } from '../types';
import { UploadSimple, FileText, CheckCircle, Clock, MagnifyingGlass, Warning, Trash, Key } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ProgressBar } from './ProgressBar';
import { ProcessingStepper } from './ProcessingStepper';
import { SkeletonCard, SkeletonTableRow } from './Skeleton';
import { ApiKeyModal } from './ApiKeyModal';

interface DashboardProps {
  essays: Essay[];
  classrooms?: Classroom[];
  globalTheme: string;
  onGlobalThemeChange: (theme: string) => void;
  onSelect: (id: string) => void;
  onUploadClick: () => void;
  onUpdateEssay: (id: string, updates: Partial<Essay>) => void;
  onDeleteEssay: (id: string) => void;
  onProcessManual?: (id: string) => void;
  onFileDrop?: (files: FileList) => void;
  isLoading?: boolean;
}

export function Dashboard({ essays, classrooms = [], globalTheme, onGlobalThemeChange, onSelect, onUploadClick, onUpdateEssay, onDeleteEssay, onProcessManual, onFileDrop, isLoading }: DashboardProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'uploadedAt' | 'score' | 'theme'>('uploadedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiStatus, setAiStatus] = useState<'checking' | 'ready' | 'error'>(() => {
    const localKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
    return (!localKey || localKey.trim() === '') ? 'error' : 'ready';
  });
  const [showSettings, setShowSettings] = useState(false);

  React.useEffect(() => {
    const updateKeyStatus = () => {
      const localKey = localStorage.getItem('user_gemini_api_key');
      setAiStatus((!localKey || localKey.trim() === '') ? 'error' : 'ready');
    };
    window.addEventListener('gemini_key_updated', updateKeyStatus);
    return () => window.removeEventListener('gemini_key_updated', updateKeyStatus);
  }, []);


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && onFileDrop) {
      onFileDrop(files);
    }
  }, [onFileDrop]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex gap-6 mb-12">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full">
            <tbody>
              {[1, 2, 3].map(i => <SkeletonTableRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (essays.length === 0) {
    return (
      <div
        className={cn(
          "h-full flex flex-col items-center justify-center p-8 max-w-xl mx-auto text-center font-sans text-[#111827] transition-all duration-300",
          isDragOver && "drop-zone-active"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm bg-white rounded-xl p-10 border border-[#E5E7EB] relative z-10"
        >
          <div className="relative mb-8 flex justify-center">
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300",
              isDragOver
                ? "bg-[#F1F3F5] border-2 border-[#111827] scale-105"
                : "bg-[#F8F9FA] border border-[#E5E7EB]"
            )}>
              <UploadSimple weight="bold" className={cn(
                "w-8 h-8 transition-all duration-300",
                isDragOver ? "text-[#111827]" : "text-[#D1D5DB]"
              )} />
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight mb-3 text-[#111827]">
            Comece suas correções
          </h2>
          <p className="text-[#6B7280] mb-8 text-sm leading-relaxed max-w-md mx-auto">
            Arraste arquivos ou clique no botão abaixo para adicionar as redações na fila de processamento local.
          </p>

          <div className="mb-8 w-full text-left">
            <label className="text-[10px] uppercase font-bold text-[#6B7280] tracking-widest pl-1 mb-2 block">Tema da Redação:</label>
            <div className="bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-3 rounded-lg flex items-center focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]/20 transition-all">
              <input 
                 type="text" 
                 placeholder="Ex: Efeitos da inteligência artificial..." 
                 value={globalTheme}
                 onChange={(e) => onGlobalThemeChange(e.target.value)}
                 className="w-full bg-transparent border-none text-sm focus:outline-none text-[#111827] font-medium placeholder:text-[#D1D5DB]"
              />
            </div>
          </div>

          <button
            onClick={onUploadClick}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3.5 rounded-lg font-bold text-sm shadow-sm shadow-[#2563EB]/10 flex items-center justify-center gap-2.5 transition-all cursor-pointer mx-auto active:scale-95"
          >
            <UploadSimple weight="bold" size={18} />
            Selecionar Arquivos
          </button>
          
          <p className="text-[10px] text-[#D1D5DB] mt-8 font-mono tracking-wider uppercase">
            Formatos: JPG, PNG, WEBP, PDF
          </p>
        </motion.div>
      </div>
    );
  }

  const readyEssays = essays.filter(e => e.status === 'done' && e.analysis);
  const average = readyEssays.length > 0 ? Math.round(readyEssays.reduce((acc, e) => acc + e.analysis!.suggestedTotalScore, 0) / readyEssays.length) : 0;
  const highest = readyEssays.length > 0 ? Math.max(...readyEssays.map(e => e.analysis!.suggestedTotalScore)) : 0;
  const lowest = readyEssays.length > 0 ? Math.min(...readyEssays.map(e => e.analysis!.suggestedTotalScore)) : 0;
  const completedCount = essays.filter(e => e.status === 'done').length;
  const processingCount = essays.filter(e => e.status === 'processing' || e.status === 'pending').length;

  const filteredEssays = essays.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (e.studentName?.toLowerCase() || '').includes(q) || e.fileName.toLowerCase().includes(q) || (e.analysis?.detectedTheme?.toLowerCase() || '').includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortField === 'uploadedAt') {
      return sortDir === 'asc' ? a.uploadedAt - b.uploadedAt : b.uploadedAt - a.uploadedAt;
    } else if (sortField === 'score') {
      const scoreA = a.analysis?.suggestedTotalScore || 0;
      const scoreB = b.analysis?.suggestedTotalScore || 0;
      return sortDir === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    } else {
      const themeA = a.analysis?.detectedTheme || 'Sem tema';
      const themeB = b.analysis?.detectedTheme || 'Sem tema';
      return sortDir === 'asc' ? themeA.localeCompare(themeB) : themeB.localeCompare(themeA);
    }
  });

  const groupedEssays = (() => {
    const groups: { theme: string; essays: Essay[] }[] = [];
    const map = new Map<string, Essay[]>();
    
    filteredEssays.forEach(e => {
      const theme = e.status === 'processing' || e.status === 'pending' ? 'Na Fila / Processando' : (e.analysis?.detectedTheme || 'Sem tema');
      if (!map.has(theme)) map.set(theme, []);
      map.get(theme)!.push(e);
    });

    map.forEach((essays, theme) => {
      groups.push({ theme, essays });
    });

    // Sort groups themselves if needed, here we just follow the map insertion order or simple sort
    return groups.sort((a, b) => {
      if (a.theme === 'Na Fila / Processando') return -1;
      if (b.theme === 'Na Fila / Processando') return 1;
      return a.theme.localeCompare(b.theme);
    });
  })();

  const renderClassroomSelector = (essay: Essay) => {
    const selectedClassroom = classrooms?.find(c => c.id === essay.classroomId);
    return (
      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
         <select 
            value={essay.classroomId || ""} 
            onChange={(e) => onUpdateEssay(essay.id, { classroomId: e.target.value, studentId: undefined, studentName: undefined })}
            className="appearance-none bg-transparent border-none text-[#6B7280] hover:text-[#111827] font-bold text-[9px] uppercase tracking-widest cursor-pointer focus:outline-none truncate max-w-[120px] hover:bg-[#F1F3F5] rounded px-1 py-0.5 -ml-1 transition-colors outline-none"
          >
            <option value="" disabled>+ Turma</option>
            {classrooms?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {essay.classroomId && selectedClassroom && (
            <>
              <span className="text-[#D1D5DB] text-[10px] font-medium">/</span>
              <select 
                value={essay.studentId || ""} 
                onChange={(e) => {
                  const student = selectedClassroom.students.find(s => s.id === e.target.value);
                  onUpdateEssay(essay.id, { studentId: e.target.value, studentName: student?.name });
                }}
                className="appearance-none bg-transparent border-none text-[#6B7280] hover:text-[#111827] font-bold text-[9px] uppercase tracking-widest cursor-pointer focus:outline-none truncate max-w-[120px] hover:bg-[#F1F3F5] rounded px-1 py-0.5 transition-colors outline-none"
              >
                <option value="" disabled>+ Aluno</option>
                {selectedClassroom.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </>
          )}
          
          <span className="text-[#D1D5DB] text-[10px] font-medium ml-1">|</span>
          <select 
            value={essay.specialNeedsProfile || "none"} 
            onChange={(e) => onUpdateEssay(essay.id, { specialNeedsProfile: e.target.value as any })}
            className="appearance-none bg-transparent border-none text-[#6B7280] hover:text-[#111827] font-bold text-[9px] uppercase tracking-widest cursor-pointer focus:outline-none hover:bg-[#F1F3F5] rounded px-1 py-0.5 transition-colors outline-none"
          >
            <option value="none">Padrão</option>
            <option value="dislexia">Dislexia</option>
            <option value="surdez">Surdez (L2)</option>
            <option value="tea">TEA</option>
          </select>
      </div>
    );
  };


  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';
  
  return (
    <>
      <ApiKeyModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onKeySaved={() => setAiStatus('ready')}
      />

      <div
      className={cn(
        "max-w-6xl mx-auto p-8 font-sans text-[#111827] overflow-y-auto h-full custom-scrollbar transition-all duration-300",
        isDragOver && "drop-zone-active rounded-2xl"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#111827] tracking-tighter">
          {greeting}, Professor
        </h1>
        <p className="text-[#6B7280] text-sm mt-1.5 font-medium">
          Gerencie e acompanhe a correção das redações do ENEM.
        </p>
      </div>

      {/* Configuration Required Banner */}
      {aiStatus === 'error' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-6 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#DC2626]" />
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="w-12 h-12 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-center shrink-0">
              <Warning weight="bold" size={24} className="text-[#DC2626]" />
            </div>
            <div>
              <h4 className="font-bold text-[#111827] tracking-tight">Módulo de IA Indisponível</h4>
              <p className="text-[#6B7280] text-sm mt-0.5 font-medium">
                Sua chave de API do Gemini não foi encontrada ou é inválida. Configure para ativar a correção automática.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full md:w-auto px-6 py-3 bg-[#111827] text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#222222] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            Configurar Módulo <Key size={14} />
          </button>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] transition-all hover:border-[#111827]/10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-2">Média da Turma</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-[#111827] leading-none tracking-tight">{average}</span>
            <span className="text-xs text-[#D1D5DB] font-medium uppercase">pts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] transition-all hover:border-[#111827]/10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-2">Maior Nota</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-[#17A34A] leading-none tracking-tight">{highest}</span>
            <span className="text-xs text-[#D1D5DB] font-medium uppercase">pts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] transition-all hover:border-[#111827]/10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-2">Menor Nota</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-[#DC2626] leading-none tracking-tight">{lowest}</span>
            <span className="text-xs text-[#D1D5DB] font-medium uppercase">pts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] transition-all hover:border-[#111827]/10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-2">Por corrigir</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-[#2563EB] leading-none tracking-tight">{essays.length - completedCount}</span>
            <span className="text-xs text-[#D1D5DB] font-medium uppercase">docs</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {processingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 md:mb-6"
        >
          <ProgressBar current={completedCount} total={essays.length} />
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">Fila de Correção</h2>
          <p className="text-[#6B7280] text-sm mt-0.5 font-medium">
            {completedCount} de {essays.length} redações validadas
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-64 bg-white border border-[#E5E7EB] px-4 py-2.5 rounded-lg flex items-center gap-3 focus-within:border-[#111827] focus-within:ring-1 focus-within:ring-[#111827] transition-all">
            <MagnifyingGlass weight="bold" className="w-4 h-4 text-[#D1D5DB]" />
            <input 
               type="text" 
               placeholder="Buscar aluno, arquivo ou tema..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full bg-transparent border-none text-sm focus:outline-none text-[#111827] font-medium placeholder:text-[#D1D5DB]"
            />
          </div>

          <div className="bg-white border border-[#E5E7EB] px-3 py-2.5 rounded-lg flex items-center focus-within:border-[#111827] transition-all">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest text-[#6B7280] focus:outline-none cursor-pointer"
            >
              <option value="all">TODOS</option>
              <option value="done">CORRIGIDOS</option>
              <option value="reviewing">REVISÃO</option>
              <option value="processing">NA FILA</option>
              <option value="error">ERRO</option>
            </select>
          </div>

          <button 
            onClick={() => setShowSettings(true)}
            title={aiStatus === 'error' ? "Configurar Chave da API do Gemini" : "Chave do Gemini Ativa"}
            className={cn(
              "px-3 py-2.5 rounded-lg transition-all cursor-pointer border flex items-center gap-2 active:scale-95 text-xs font-bold",
              aiStatus === 'error' 
                ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs" 
                : "bg-white border-[#E5E7EB] text-[#374151] hover:text-[#111827] hover:bg-[#F8F9FA]"
            )}
          >
            <Key weight="bold" size={16} className={aiStatus === 'error' ? "text-amber-600 animate-pulse" : "text-emerald-600"} />
            <span className="hidden sm:inline uppercase text-[10px] tracking-wider">
              {aiStatus === 'error' ? 'Configurar Chave' : 'Chave Ativa'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Card List / Desktop Table */}
      <div className="space-y-4 md:space-y-0 bg-white md:bg-transparent rounded-xl md:rounded-none border md:border-none border-[#E5E7EB] md:shadow-none overflow-hidden mb-8">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[10px] font-bold uppercase tracking-widest text-[#6B7280] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-5 w-5/12 cursor-pointer hover:text-[#111827] transition-colors" onClick={() => { setSortField('uploadedAt'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                  Documento & Aluno {sortField === 'uploadedAt' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-5 cursor-pointer hover:text-[#111827] transition-colors" onClick={() => { setSortField('theme'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                  Status / Tema {sortField === 'theme' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-5 cursor-pointer hover:text-[#111827] transition-colors" onClick={() => { setSortField('score'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                  Nota {sortField === 'score' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-5 text-right font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              <AnimatePresence>
                {groupedEssays ? (
                  groupedEssays.map(group => (
                    <React.Fragment key={`group-${group.theme}`}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-[#F8F9FA] border-b border-[#E5E7EB]"
                      >
                        <td colSpan={4} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#111827]">
                          <span className="bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-lg shadow-sm">
                            {group.theme} <span className="text-[#6B7280] ml-2">({group.essays.length})</span>
                          </span>
                        </td>
                      </motion.tr>
                      {group.essays.map(essay => (
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          key={essay.id}
                          className={cn("hover:bg-[#F8F9FA] transition-colors group", (essay.status === 'done' || essay.status === 'reviewing' || essay.status === 'error') && "cursor-pointer")}
                          onClick={() => (essay.status === 'done' || essay.status === 'reviewing' || essay.status === 'error') && onSelect(essay.id)}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                                {essay.imageUrl.startsWith('data:image/') && <img src={essay.imageUrl} alt="" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />}
                                {essay.imageUrl.startsWith('data:application/pdf') && <FileText className="text-[#D1D5DB]" size={24} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  placeholder="Nome do Aluno (ou selecione turma)"
                                  value={essay.studentName || ''}
                                  onChange={(e) => onUpdateEssay(essay.id, { studentName: e.target.value })}
                                  className="font-bold text-[#111827] text-sm bg-transparent border-b border-transparent focus:border-[#E5E7EB] focus:outline-none w-full placeholder:text-[#D1D5DB] transition-colors mb-0.5"
                                />
                                {renderClassroomSelector(essay)}
                                <p className="text-[9px] text-[#D1D5DB] font-mono tracking-wider truncate mt-1.5 uppercase">{essay.fileName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 align-middle text-[#111827]">
                            <div className="flex flex-col gap-1.5 items-start">
                              <AnimatePresence mode="wait">
                                {essay.status === 'done' ? (
                                  <motion.div
                                    key="done"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#17A34A] text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Corrigido
                                  </motion.div>
                                ) : essay.status === 'reviewing' ? (
                                  <motion.div
                                    key="reviewing"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#EAB308] text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    <WarningCircle weight="bold" className="w-3.5 h-3.5" /> Revisão
                                  </motion.div>
                                ) : (essay.status === 'processing' || essay.status === 'pending') ? (
                                  <div key="processing" className="min-w-[120px]">
                                    {essay.status === 'processing' ? <ProcessingStepper status="processing" /> : <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Fila</span>}
                                  </div>
                                ) : (
                                  <div key="error" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                                    <Warning weight="bold" className="w-3.5 h-3.5" /> Erro
                                  </div>
                                )}
                              </AnimatePresence>
                              {essay.analysis?.detectedTheme && sortField !== 'theme' && (
                                <span className="inline-block bg-[#F8F9FA] border border-[#E5E7EB] text-[#6B7280] text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg truncate max-w-[180px]" title={essay.analysis.detectedTheme}>
                                  {essay.analysis.detectedTheme}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {(essay.status === 'done' || essay.status === 'reviewing') && essay.analysis ? (
                              <div className="space-y-1">
                                <span className={cn(
                                  "font-bold text-xl block font-mono tracking-tight",
                                  essay.analysis.suggestedTotalScore > 800 ? "text-[#17A34A]" :
                                    essay.analysis.suggestedTotalScore > 500 ? "text-[#2563EB]" : "text-[#DC2626]"
                                )}>
                                  {essay.analysis.suggestedTotalScore} <span className="text-[10px] text-[#D1D5DB] font-sans tracking-widest uppercase align-middle font-bold">pts</span>
                                </span>
                              </div>
                            ) : <span className="text-[#D1D5DB]">—</span>}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {essay.status === 'error' && (
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (onProcessManual) {
                                      onProcessManual(essay.id);
                                    } else {
                                      onUpdateEssay(essay.id, { status: 'pending' });
                                    }
                                  }}
                                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                                  title="Tentar Novamente"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                                  Retentar
                                </button>
                              )}
                              <button
                                onClick={() => onDeleteEssay(essay.id)}
                                className="opacity-0 group-hover:opacity-100 text-[#D1D5DB] hover:text-[#DC2626] p-2 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                              >
                                <Trash weight="bold" size={18} />
                              </button>
                              <button
                                onClick={() => onSelect(essay.id)}
                                disabled={essay.status === 'processing' || essay.status === 'pending'}
                                className={cn(
                                  "h-10 px-6 rounded-lg font-bold text-xs uppercase tracking-widest transition-all",
                                  (essay.status === 'done' || essay.status === 'reviewing' || essay.status === 'error') 
                                    ? (essay.status === 'error' ? "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20" : "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm shadow-[#2563EB]/20")
                                    : "bg-[#F8F9FA] text-[#D1D5DB] border border-[#E5E7EB] cursor-not-allowed"
                                )}
                              >
                                {essay.status === 'error' ? 'Ver Erro' : 'Avaliar'}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  filteredEssays.map(essay => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={essay.id}
                    className={cn("hover:bg-[#F8F9FA] transition-colors group", (essay.status === 'done' || essay.status === 'reviewing') && "cursor-pointer")}
                    onClick={() => (essay.status === 'done' || essay.status === 'reviewing') && onSelect(essay.id)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                          {essay.imageUrl.startsWith('data:image/') && <img src={essay.imageUrl} alt="" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />}
                          {essay.imageUrl.startsWith('data:application/pdf') && <FileText className="text-[#D1D5DB]" size={24} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            placeholder="Nome do Aluno..."
                            value={essay.studentName || ''}
                            onChange={(e) => onUpdateEssay(essay.id, { studentName: e.target.value })}
                            className="font-bold text-[#111827] text-sm bg-transparent border-b border-transparent focus:border-[#E5E7EB] focus:outline-none w-full placeholder:text-[#D1D5DB] transition-colors"
                          />
                          <p className="text-[10px] text-[#D1D5DB] font-mono tracking-wider truncate mt-1 uppercase">{essay.fileName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-[#111827]">
                      <AnimatePresence mode="wait">
                        {essay.status === 'done' ? (
                          <motion.div
                            key="done"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#17A34A] text-[10px] font-bold uppercase tracking-wider"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Corrigido
                          </motion.div>
                        ) : essay.status === 'reviewing' ? (
                          <motion.div
                            key="reviewing"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#EAB308] text-[10px] font-bold uppercase tracking-wider"
                          >
                            <WarningCircle weight="bold" className="w-3.5 h-3.5" /> Revisão
                          </motion.div>
                        ) : (essay.status === 'processing' || essay.status === 'pending') ? (
                          <div key="processing" className="min-w-[120px]">
                            {essay.status === 'processing' ? <ProcessingStepper status="processing" /> : <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Fila</span>}
                          </div>
                        ) : (
                           <div key="error" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                            <Warning weight="bold" className="w-3.5 h-3.5" /> Erro
                          </div>
                        )}
                      </AnimatePresence>
                    </td>
                    <td className="px-6 py-5">
                       {(essay.status === 'done' || essay.status === 'reviewing') && essay.analysis ? (
                        <div className="space-y-1">
                          <span className={cn(
                            "font-bold text-xl block font-mono tracking-tight",
                            essay.analysis.suggestedTotalScore > 800 ? "text-[#17A34A]" :
                              essay.analysis.suggestedTotalScore > 500 ? "text-[#2563EB]" : "text-[#DC2626]"
                          )}>
                            {essay.analysis.suggestedTotalScore} <span className="text-[10px] text-[#D1D5DB] font-sans tracking-widest uppercase align-middle font-bold">pts</span>
                          </span>
                          {essay.analysis.detectedTheme && (
                            <span className="inline-block bg-[#F1F3F5] text-[#6B7280] text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md truncate max-w-[180px]" title={essay.analysis.detectedTheme}>
                              {essay.analysis.detectedTheme}
                            </span>
                          )}
                        </div>
                      ) : <span className="text-[#D1D5DB]">—</span>}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-3">
                        {essay.status === 'error' && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (onProcessManual) {
                                onProcessManual(essay.id);
                              } else {
                                onUpdateEssay(essay.id, { status: 'pending' });
                              }
                            }}
                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                            title="Tentar Novamente"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                            Retentar
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteEssay(essay.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#D1D5DB] hover:text-[#DC2626] p-2 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash weight="bold" size={18} />
                        </button>
                        <button
                          onClick={() => onSelect(essay.id)}
                          disabled={essay.status === 'processing' || essay.status === 'pending' || essay.status === 'error'}
                          className={cn(
                            "h-10 px-6 rounded-lg font-bold text-xs uppercase tracking-widest transition-all",
                            (essay.status === 'done' || essay.status === 'reviewing') 
                              ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm shadow-[#2563EB]/20" 
                              : "bg-[#F8F9FA] text-[#D1D5DB] border border-[#E5E7EB] cursor-not-allowed"
                          )}
                        >
                          Avaliar
                        </button>
                       </div>
                    </td>
                  </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
          </div>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-[#E5E7EB]">
          <AnimatePresence>
            {groupedEssays ? (
              groupedEssays.map(group => (
                <React.Fragment key={`mobile-group-${group.theme}`}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-[#F8F9FA] border-y border-[#E5E7EB]"
                  >
                    <span className="bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-lg shadow-sm text-[11px] font-bold uppercase tracking-widest text-[#111827]">
                      {group.theme} <span className="text-[#6B7280] ml-2">({group.essays.length})</span>
                    </span>
                  </motion.div>
                  {group.essays.map(essay => (
                    <motion.div
                      key={essay.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="p-5 flex flex-col gap-4 bg-white"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg border border-[#E5E7EB] overflow-hidden flex-shrink-0 bg-[#F8F9FA] flex items-center justify-center">
                          {essay.imageUrl.startsWith('data:image/') && <img src={essay.imageUrl} alt="" className="w-full h-full object-contain grayscale" />}
                          {essay.imageUrl.startsWith('data:application/pdf') && <FileText className="text-[#D1D5DB] w-7 h-7" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 mr-2">
                              <input
                                type="text"
                                placeholder="Nome do Aluno..."
                                value={essay.studentName || ''}
                                onChange={(e) => onUpdateEssay(essay.id, { studentName: e.target.value })}
                                className="font-bold text-[#111827] text-sm bg-transparent border-b border-transparent focus:border-[#E5E7EB] focus:outline-none w-full placeholder:text-[#D1D5DB]"
                              />
                            </div>
                            {(essay.status === 'done' || essay.status === 'reviewing') && essay.analysis && (
                              <div className="text-right shrink-0">
                                <span className={cn(
                                  "font-bold text-xl block font-mono leading-none tracking-tight",
                                  essay.analysis.suggestedTotalScore > 800 ? "text-[#17A34A]" :
                                    essay.analysis.suggestedTotalScore > 500 ? "text-[#2563EB]" : "text-[#DC2626]"
                                )}>
                                  {essay.analysis.suggestedTotalScore}
                                </span>
                              </div>
                            )}
                          </div>
                          {renderClassroomSelector(essay)}
                          <p className="text-[10px] text-[#D1D5DB] font-mono mt-1.5 truncate uppercase tracking-widest">{essay.fileName}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          {essay.status === 'done' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#17A34A] text-[9px] font-bold uppercase tracking-wider">
                              Corrigido
                            </span>
                          ) : essay.status === 'reviewing' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#EAB308]/20 text-[#EAB308] text-[9px] font-bold uppercase tracking-wider">
                              Revisão
                            </span>
                          ) : essay.status === 'error' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#DC2626]/20 text-[#DC2626] text-[9px] font-bold uppercase tracking-wider">
                              Erro
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#6B7280] text-[9px] font-bold uppercase tracking-wider">
                              {essay.status === 'processing' ? 'Processando' : 'Na fila'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 h-10">
                          <button
                            onClick={() => onDeleteEssay(essay.id)}
                            className="text-[#D1D5DB] p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#DC2626]/30 hover:text-[#DC2626] transition-all cursor-pointer bg-[#F8F9FA]"
                          >
                            <Trash weight="bold" size={16} />
                          </button>
                          
                          <div className="relative flex-1 min-w-[120px]">
                            <AnimatePresence mode="wait">
                              {essay.status === 'error' ? (
                                <motion.div
                                  key="mo-error-actions"
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
                                  className="flex gap-2"
                                >
                                  <button
                                    onClick={() => onUpdateEssay(essay.id, { status: 'pending' })}
                                    className="flex-1 bg-[#111827] text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer active:scale-95 h-10 flex items-center justify-center transition-all"
                                  >
                                     ↻
                                  </button>
                                  {onProcessManual && (
                                    <button
                                      onClick={() => onProcessManual(essay.id)}
                                      className="flex-1 bg-[#17A34A] text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer active:scale-95 h-10 flex items-center justify-center transition-all"
                                    >
                                      Manual
                                    </button>
                                  )}
                                </motion.div>
                              ) : (essay.status === 'done' || essay.status === 'reviewing') ? (
                                <motion.button
                                  key="mo-evaluate-action"
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
                                  onClick={() => onSelect(essay.id)}
                                  className="w-full h-10 bg-[#2563EB] text-white px-6 rounded-lg font-bold text-[11px] uppercase tracking-widest active:scale-95 flex items-center justify-center shadow-sm transition-all"
                                >
                                  Avaliar
                                </motion.button>
                              ) : (
                                <motion.div
                                  key="mo-loading-action"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="w-full h-10 bg-white text-[#D1D5DB] px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-[#E5E7EB]"
                                >
                                  <div className="w-3 h-3 border-2 border-[#D1D5DB] border-t-[#6B7280] rounded-full animate-spin" />
                                  {essay.status === 'processing' ? 'Analisando' : 'Na Fila'}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </React.Fragment>
              ))
            ) : (
              filteredEssays.map(essay => (
              <motion.div
                key={essay.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-5 flex flex-col gap-4 bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg border border-[#E5E7EB] overflow-hidden flex-shrink-0 bg-[#F8F9FA] flex items-center justify-center">
                    {essay.imageUrl.startsWith('data:image/') && <img src={essay.imageUrl} alt="" className="w-full h-full object-contain grayscale" />}
                    {essay.imageUrl.startsWith('data:application/pdf') && <FileText className="text-[#D1D5DB] w-7 h-7" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <input
                        type="text"
                        placeholder="Nome do Aluno..."
                        value={essay.studentName || ''}
                        onChange={(e) => onUpdateEssay(essay.id, { studentName: e.target.value })}
                        className="font-bold text-[#111827] text-sm bg-transparent border-b border-transparent focus:border-[#E5E7EB] focus:outline-none w-full placeholder:text-[#D1D5DB]"
                      />
                      {(essay.status === 'done' || essay.status === 'reviewing') && essay.analysis && (
                        <div className="text-right ml-4 shrink-0">
                          <span className={cn(
                            "font-bold text-xl block font-mono leading-none tracking-tight",
                            essay.analysis.suggestedTotalScore > 800 ? "text-[#17A34A]" :
                              essay.analysis.suggestedTotalScore > 500 ? "text-[#2563EB]" : "text-[#DC2626]"
                          )}>
                            {essay.analysis.suggestedTotalScore}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-[#D1D5DB] font-mono mt-1.5 truncate uppercase tracking-widest">{essay.fileName}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {essay.status === 'done' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#17A34A] text-[9px] font-bold uppercase tracking-wider">
                        Corrigido
                      </span>
                    ) : essay.status === 'reviewing' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#EAB308]/20 text-[#EAB308] text-[9px] font-bold uppercase tracking-wider">
                        Revisão
                      </span>
                    ) : essay.status === 'error' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#DC2626]/20 text-[#DC2626] text-[9px] font-bold uppercase tracking-wider">
                        Erro
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#6B7280] text-[9px] font-bold uppercase tracking-wider">
                        {essay.status === 'processing' ? 'Processando' : 'Na fila'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 h-10">
                    <button
                      onClick={() => onDeleteEssay(essay.id)}
                      className="text-[#D1D5DB] p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#DC2626]/30 hover:text-[#DC2626] transition-all cursor-pointer bg-[#F8F9FA]"
                    >
                      <Trash weight="bold" size={16} />
                    </button>
                    
                    <div className="relative flex-1 min-w-[120px]">
                      <AnimatePresence mode="wait">
                        {essay.status === 'error' ? (
                          <motion.div
                            key="mo-error-actions"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex gap-2"
                          >
                            <button
                              onClick={() => onUpdateEssay(essay.id, { status: 'pending' })}
                              className="flex-1 bg-[#111827] text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer active:scale-95 h-10 flex items-center justify-center transition-all"
                            >
                               ↻
                            </button>
                            {onProcessManual && (
                              <button
                                onClick={() => onProcessManual(essay.id)}
                                className="flex-1 bg-[#17A34A] text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer active:scale-95 h-10 flex items-center justify-center transition-all"
                              >
                                Manual
                              </button>
                            )}
                          </motion.div>
                        ) : (essay.status === 'done' || essay.status === 'reviewing') ? (
                          <motion.button
                            key="mo-evaluate-action"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            onClick={() => onSelect(essay.id)}
                            className="w-full h-10 bg-[#2563EB] text-white px-6 rounded-lg font-bold text-[11px] uppercase tracking-widest active:scale-95 flex items-center justify-center shadow-sm transition-all"
                          >
                            Avaliar
                          </motion.button>
                        ) : (
                          <motion.div
                            key="mo-loading-action"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-10 bg-white text-[#D1D5DB] px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-[#E5E7EB]"
                          >
                            <div className="w-3 h-3 border-2 border-[#D1D5DB] border-t-[#6B7280] rounded-full animate-spin" />
                            {essay.status === 'processing' ? 'Analisando' : 'Na Fila'}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {filteredEssays.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#E5E7EB]">
               <MagnifyingGlass weight="bold" className="w-6 h-6 text-[#D1D5DB]" />
            </div>
            <p className="text-base font-bold text-[#111827] tracking-tight">Nenhuma redação encontrada</p>
            <p className="text-[#6B7280] text-sm mt-1 font-medium italic">Tente outra busca ou limpe os filtros aplicados</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="mt-8 px-6 py-2.5 text-[11px] font-bold text-[#111827] border border-[#E5E7EB] rounded-lg hover:bg-[#F8F9FA] transition-all cursor-pointer uppercase tracking-widest"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  </>
);
}
