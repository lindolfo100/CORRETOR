import { useState, useEffect } from 'react';
import { Classroom, Student } from '../types';

export function useClassrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const stored = localStorage.getItem('enem_ai_classrooms');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse classrooms", e);
      }
    }
    return [];
  });
  
  const isClassroomsLoaded = true;

  useEffect(() => {
    localStorage.setItem('enem_ai_classrooms', JSON.stringify(classrooms));
  }, [classrooms]);

  const addClassroom = (name: string) => {
    const newClassroom: Classroom = {
      id: crypto.randomUUID(),
      name,
      students: [],
      createdAt: Date.now(),
    };
    setClassrooms(prev => [...prev, newClassroom]);
    return newClassroom;
  };

  const deleteClassroom = (id: string) => {
    setClassrooms(prev => prev.filter(c => c.id !== id));
  };

  const addStudent = (classroomId: string, name: string) => {
    const student: Student = { id: crypto.randomUUID(), name };
    setClassrooms(prev => prev.map(c => {
      if (c.id === classroomId) {
        return { ...c, students: [...c.students, student] };
      }
      return c;
    }));
    return student;
  };

  const deleteStudent = (classroomId: string, studentId: string) => {
    setClassrooms(prev => prev.map(c => {
      if (c.id === classroomId) {
        return { ...c, students: c.students.filter(s => s.id !== studentId) };
      }
      return c;
    }));
  };
  
  const importStudents = (classroomId: string, names: string[]) => {
    const newStudents = names.map(name => ({ id: crypto.randomUUID(), name }));
    setClassrooms(prev => prev.map(c => {
      if (c.id === classroomId) {
        return { ...c, students: [...c.students, ...newStudents] };
      }
      return c;
    }));
  };

  return {
    classrooms,
    isClassroomsLoaded,
    addClassroom,
    deleteClassroom,
    addStudent,
    deleteStudent,
    importStudents,
    setClassrooms,
  };
}
