import React, { useState, useRef, useCallback } from 'react';
import { UploadSimple, FileText, DownloadSimple, Upload, DotsThreeVertical, Trash } from '@phosphor-icons/react';
import { ToastProvider, useToast } from './components/Toast';
import { Dashboard } from './components/Dashboard';
import { CorrectionView } from './components/CorrectionView';
import { OnboardingModal } from './components/OnboardingModal';
import { ClassroomsView } from './components/ClassroomsView';
import { UploadModal, UploadFileItem } from './components/UploadModal';
import { useEssayPipeline } from './hooks/useEssayPipeline';
import { useEssayBackup } from './hooks/useEssayBackup';
import { useClassrooms } from './hooks/useClassrooms';

import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const [selectedEssayId, setSelectedEssayId] = useState<string | null>(null);
  const [globalTheme, setGlobalTheme] = useState('');
  const [currentView, setCurrentView] = useState<'correcoes' | 'turmas'>('correcoes');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('onboarding_v1_completed') !== 'true';
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const { addToast } = useToast();

  const {
    essays,
    isLoaded,
    setEssays,
    updateEssay,
    deleteEssay,
    clearHistory,
    processFilesWithMetadata,
    processManualEssayItem,
  } = useEssayPipeline({
    globalTheme,
    addToast,
    onManualReady: setSelectedEssayId,
  });

  const classroomsState = useClassrooms();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadConfirm = useCallback((items: UploadFileItem[], theme: string) => {
    setGlobalTheme(theme);
    const fileItems = items.map(item => ({
      file: item.file,
      specialNeedsProfile: item.specialNeedsProfile,
    }));
    processFilesWithMetadata(fileItems, theme);
    setPendingFiles([]);
    setCurrentView('correcoes');
  }, [processFilesWithMetadata]);

  const handleFileDrop = useCallback((files: FileList) => {
    setPendingFiles(Array.from(files));
  }, []);

  const selectedEssay = essays.find(e => e.id === selectedEssayId);
  const readyEssays = essays.filter(e => e.status === 'done' || e.status === 'reviewing' || e.status === 'error');
  const selectedIndex = selectedEssay ? readyEssays.findIndex(e => e.id === selectedEssay.id) : -1;

  const handleNext = () => {
    if (selectedIndex < readyEssays.length - 1) {
      setSelectedEssayId(readyEssays[selectedIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedEssayId(readyEssays[selectedIndex - 1].id);
    }
  };

  const { exportBackup, importBackup } = useEssayBackup({
    essays,
    setEssays,
    addToast,
  });

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    importBackup(e.target.files?.[0]);
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_v1_completed', 'true');
    setShowOnboarding(false);
  };

  const handleExportCSV = useCallback(() => {
    const rows = [
      ['Aluno', 'Arquivo', 'Status', 'Nota Total', 'C1', 'C2', 'C3', 'C4', 'C5', 'Tema'],
      ...essays.map(e => [
        e.studentName || '', e.fileName || '', e.status,
        e.analysis?.suggestedTotalScore ?? '',
        e.analysis?.competencies?.c1?.score ?? '', e.analysis?.competencies?.c2?.score ?? '',
        e.analysis?.competencies?.c3?.score ?? '', e.analysis?.competencies?.c4?.score ?? '',
        e.analysis?.competencies?.c5?.score ?? '',
        e.analysis?.detectedTheme?.replace(/"/g, '""') || ''
      ].map(cell => `"${cell}"`).join(','))
    ];
    const csvContent = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "relatorio_redacoes.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [essays]);

  if (!isLoaded || !classroomsState.isClassroomsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-2 border-[#111827] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-[#111827]">
      {showOnboarding && essays.length === 0 && !selectedEssayId && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onComplete={completeOnboarding}
        />
      )}

      {/* Upload Modal */}
      {pendingFiles.length > 0 && (
        <UploadModal
          files={pendingFiles}
          defaultTheme={globalTheme}
          onConfirm={handleUploadConfirm}
          onCancel={() => setPendingFiles([])}
        />
      )}

      {/* Header */}
      {!selectedEssayId && (
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-8 border-r border-[#E5E7EB] pr-8 mr-2 overflow-hidden shrink-0">
            <button onClick={() => { setCurrentView('correcoes'); setSelectedEssayId(null); }} className="flex items-center gap-3 cursor-pointer group shrink-0">
              <div className="w-8 h-8 bg-[#111827] rounded-lg flex items-center justify-center text-white">
                <FileText size={16} />
              </div>
              <div className="text-left hidden md:block">
                <h1 className="text-sm font-bold text-[#111827] leading-tight tracking-tight">ENEM AI</h1>
                <p className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wider">Professor Pro</p>
              </div>
            </button>
            <nav className="flex gap-1 h-16">
              <button 
                onClick={() => setCurrentView('correcoes')}
                className={`px-4 text-xs font-bold uppercase tracking-widest relative ${currentView === 'correcoes' ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
              >
                Painel
                {currentView === 'correcoes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111827] rounded-t" />}
              </button>
              <button 
                onClick={() => setCurrentView('turmas')}
                className={`px-4 text-xs font-bold uppercase tracking-widest relative ${currentView === 'turmas' ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
              >
                Turmas
                {currentView === 'turmas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111827] rounded-t" />}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3 ml-auto pl-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowMenu(prev => !prev)}
                title="Mais ações"
                className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F1F3F5] rounded-lg transition-colors cursor-pointer"
              >
                <DotsThreeVertical weight="bold" size={20} />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-[#E5E7EB] shadow-xl z-50 overflow-hidden"
                    >
                      <button onClick={() => { exportBackup(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#111827] hover:bg-[#F8F9FA] transition-colors">
                        <DownloadSimple weight="bold" size={16} className="text-[#6B7280]" /> Exportar Backup
                      </button>
                      <button onClick={() => { backupInputRef.current?.click(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#111827] hover:bg-[#F8F9FA] transition-colors">
                        <Upload weight="bold" size={16} className="text-[#6B7280]" /> Importar Backup
                      </button>
                      <button onClick={() => { handleExportCSV(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#111827] hover:bg-[#F8F9FA] transition-colors border-t border-[#F1F3F5]">
                        <DownloadSimple weight="bold" size={16} className="text-[#6B7280]" /> Exportar Planilha CSV
                      </button>
                      {essays.length > 0 && currentView === 'correcoes' && (
                        <button onClick={() => { clearHistory(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#DC2626] hover:bg-red-50 transition-colors border-t border-[#E5E7EB]">
                          <Trash weight="bold" size={16} /> Limpar Toda a Fila
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <input type="file" accept=".json" ref={backupInputRef} className="hidden" onChange={handleImportBackup} />

            <button onClick={() => fileInputRef.current?.click()} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm shadow-[#2563EB]/10 shrink-0 uppercase tracking-widest leading-none outline-none focus:outline-none">
              <UploadSimple weight="bold" size={14} className="shrink-0" /> <span className="hidden md:inline">Adicionar</span>
            </button>
            <input type="file" multiple accept="image/*,application/pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          </div>
        </header>
      )}

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {selectedEssay ? (
            <motion.div 
              key={`correction-${selectedEssay.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <CorrectionView
                essay={selectedEssay}
                 classrooms={classroomsState.classrooms}
                 onBack={() => setSelectedEssayId(null)}
                 onUpdate={(updates) => updateEssay(selectedEssay.id, updates)}
                 onNext={handleNext}
                 onPrev={handlePrev}
                 currentIndex={selectedIndex}
                 totalCount={readyEssays.length}
                 onRetry={(id) => {
                   const e = essays.find(essay => essay.id === id);
                   if (!e) return;
                   if (e.theme) {
                     updateEssay(id, { status: 'pending', error: undefined });
                   } else {
                     processManualEssayItem(id, e.imageUrl);
                   }
                 }}
              />
            </motion.div>
          ) : currentView === 'turmas' ? (
            <motion.div 
              key="classrooms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <ClassroomsView
                classrooms={classroomsState.classrooms}
                essays={readyEssays}
                onAddClassroom={classroomsState.addClassroom}
                onDeleteClassroom={classroomsState.deleteClassroom}
                onAddStudent={classroomsState.addStudent}
                onDeleteStudent={classroomsState.deleteStudent}
                onImportStudents={classroomsState.importStudents}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <Dashboard
                essays={essays}
                classrooms={classroomsState.classrooms}
                globalTheme={globalTheme}
                onGlobalThemeChange={setGlobalTheme}
                onSelect={setSelectedEssayId}
                onUploadClick={() => fileInputRef.current?.click()}
                onUpdateEssay={updateEssay}
                onDeleteEssay={deleteEssay}
                onFileDrop={handleFileDrop}
                onProcessManual={(id) => {
                  const e = essays.find(e => e.id === id);
                  if (e) processManualEssayItem(e.id, e.imageUrl);
                }}
                isLoading={!isLoaded || !classroomsState.isClassroomsLoaded}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
