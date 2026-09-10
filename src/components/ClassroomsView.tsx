import React, { useState } from 'react';
import { Users, Plus, Trash, ArrowLeft, UploadSimple } from '@phosphor-icons/react';
import { Classroom, Essay } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ClassroomsViewProps {
  classrooms: Classroom[];
  essays: Essay[];
  onAddClassroom: (name: string) => void;
  onDeleteClassroom: (id: string) => void;
  onAddStudent: (classroomId: string, name: string) => void;
  onDeleteStudent: (classroomId: string, studentId: string) => void;
  onImportStudents: (classroomId: string, names: string[]) => void;
}

export function ClassroomsView({
  classrooms,
  essays,
  onAddClassroom,
  onDeleteClassroom,
  onAddStudent,
  onDeleteStudent,
  onImportStudents
}: ClassroomsViewProps) {
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');

  const handleAddClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onAddClassroom(newClassName);
    setNewClassName('');
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom || !newStudentName.trim()) return;
    onAddStudent(selectedClassroom.id, newStudentName);
    setNewStudentName('');
  };

  const handleImport = () => {
    if (!selectedClassroom || !importText.trim()) return;
    const names = importText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length > 0) {
      onImportStudents(selectedClassroom.id, names);
    }
    setImportText('');
    setIsImporting(false);
  };

  if (selectedClassroom) {
    const currentClass = classrooms.find(c => c.id === selectedClassroom.id) || selectedClassroom;
    
    // Compute stats
    const classEssays = essays.filter(e => e.classroomId === currentClass.id && e.analysis);
    
    const getStudentStats = (studentId: string) => {
      const studentEssays = classEssays.filter(e => e.studentId === studentId);
      if (studentEssays.length === 0) return null;
      
      const scores = studentEssays.map(e => e.analysis!.suggestedTotalScore);
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return { avgScore, count: studentEssays.length };
    };

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans">
        <button 
          onClick={() => setSelectedClassroom(null)}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] transition-colors mb-6 font-semibold"
        >
          <ArrowLeft weight="bold" /> Voltar para turmas
        </button>

        <div className="flex justify-between items-end mb-8 border-b border-[#E5E7EB] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tighter">{currentClass.name}</h1>
            <p className="text-[#6B7280] mt-2 font-medium">{currentClass.students.length} aluno(s) • {classEssays.length} redações corrigidas</p>
          </div>
          <button 
            onClick={() => setIsImporting(true)}
            className="px-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-sm font-bold shadow-sm hover:bg-[#F1F3F5] transition-all flex items-center gap-2"
          >
            <UploadSimple weight="bold" /> Importar Lista
          </button>
        </div>

        {isImporting && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#111827] mb-2">Importar Alunos</h3>
            <p className="text-xs text-[#6B7280] mb-4">Cole um nome por linha para importar múltiplos alunos de uma vez.</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-32 p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB] mb-4 resize-none"
              placeholder="Maria Silva&#10;João Alves&#10;Ana Júlia..."
            />
            <div className="flex gap-3">
              <button onClick={handleImport} className="px-4 py-2 bg-[#111827] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#222222]">
                Importar Nomes
              </button>
              <button onClick={() => setIsImporting(false)} className="px-4 py-2 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#F8F9FA]">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 bg-[#F8F9FA] p-5 rounded-xl border border-[#E5E7EB] h-fit">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-4">Adicionar Aluno</h3>
            <form onSubmit={handleAddStudent} className="flex flex-col gap-3">
              <input 
                type="text" 
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                placeholder="Nome do aluno"
                className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
              <button type="submit" disabled={!newStudentName.trim()} className="w-full py-2 bg-[#2563EB] text-white rounded-lg font-bold text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-[#1D4ED8]">
                Adicionar
              </button>
            </form>
          </div>

          <div className="md:col-span-3">
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#6B7280] text-[10px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4">Nome do Aluno</th>
                    <th className="px-6 py-4 text-center">Redações</th>
                    <th className="px-6 py-4 text-center">Média</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {currentClass.students.map(student => {
                    const stats = getStudentStats(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="px-6 py-4 font-bold text-[#111827]">{student.name}</td>
                        <td className="px-6 py-4 text-center text-[#6B7280] font-medium">{stats?.count || 0}</td>
                        <td className="px-6 py-4 text-center">
                          {stats ? (
                            <span className={cn(
                              "font-mono font-bold px-2.5 py-1 rounded-md text-[11px]",
                              stats.avgScore >= 800 ? "bg-[#17A34A]/10 text-[#17A34A]" : 
                              stats.avgScore >= 600 ? "bg-[#2563EB]/10 text-[#2563EB]" : "bg-[#DC2626]/10 text-[#DC2626]"
                            )}>
                              {stats.avgScore}
                            </span>
                          ) : (
                            <span className="text-[#D1D5DB]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => onDeleteStudent(currentClass.id, student.id)}
                            className="text-[#D1D5DB] hover:text-[#DC2626] transition-colors p-2"
                          >
                            <Trash weight="bold" size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {currentClass.students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[#6B7280] italic text-sm">
                        Nenhum aluno adicionado a esta turma.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-6 border-b border-[#E5E7EB] gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] tracking-tighter">Minhas Turmas</h1>
          <p className="text-[#6B7280] text-sm mt-1.5 font-medium">Gerencie seus alunos e acompanhe o desempenho em grupo.</p>
        </div>
        
        <form onSubmit={handleAddClassroom} className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            placeholder="Nome da nova turma..."
            className="px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm min-w-[240px] focus:outline-none focus:ring-1 focus:ring-[#2563EB] shadow-sm bg-white flex-1"
          />
          <button type="submit" disabled={!newClassName.trim()} className="bg-[#111827] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-[#222222] transition-colors flex items-center gap-2">
            <Plus weight="bold" /> Criar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map(c => (
          <div key={c.id} className="bg-white border border-[#E5E7EB] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer" onClick={() => setSelectedClassroom(c)}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-[#F8F9FA] rounded-xl flex items-center justify-center border border-[#E5E7EB] text-[#6B7280]">
                <Users weight="bold" size={24} />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteClassroom(c.id); }}
                className="text-[#D1D5DB] hover:text-[#DC2626] transition-colors p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
              >
                <Trash weight="bold" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-[#111827] tracking-tight">{c.name}</h3>
            <p className="text-[#6B7280] mt-1 text-sm font-medium">{c.students.length} alunos cadastrados</p>
            
            <div className="mt-8 pt-4 border-t border-[#F8F9FA] flex justify-between items-center text-[#2563EB] font-bold text-xs uppercase tracking-widest">
              <span>Gerenciar Turma</span>
              <ArrowLeft weight="bold" className="rotate-180" />
            </div>
          </div>
        ))}

        {classrooms.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-[#E5E7EB] rounded-2xl bg-[#F8F9FA]">
            <Users weight="bold" className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
            <p className="text-[#111827] font-bold tracking-tight">Nenhuma turma criada</p>
            <p className="text-[#6B7280] text-sm mt-1">Crie sua primeira turma para começar a organizar seus alunos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
