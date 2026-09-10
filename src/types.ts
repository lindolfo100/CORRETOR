export type EssayStatus = 'pending' | 'processing' | 'reviewing' | 'done' | 'error';

export interface C1Analysis {
  score: number;
  structureClass: 'Excelente' | 'Boa' | 'Regular' | 'Deficitária';
  deviations: { text: string; type: string; correction: string; explanation: string }[];
}

export interface C2Analysis {
  score: number;
  repertoire: { reference: string; productive: boolean; canned: boolean }[];
  themeAddressed: 'Completo' | 'Tangencial' | 'Fuga';
}

export interface C3Analysis {
  score: number;
  project: 'Estrategico' | 'Falhas_Poucas' | 'Falhas_Algumas' | 'Falhas_Muitas';
  development: 'Pleno' | 'Maior_Parte' | 'Embrionario' | 'Limitado';
  arguments: { text: string; explanation: string }[];
  thesis: string | null;
  topicSentences: string[];
}

export interface C4Analysis {
  score: number;
  connectives: { text: string; isInterparagraph: boolean }[];
  monobloc: boolean;
}

export interface C5Analysis {
  score: number;
  elements: {
    agent: string | null;
    action: string | null;
    means: string | null;
    effect: string | null;
    detail: string | null;
  };
  humanRightsViolation: boolean;
}

export interface EssayAnalysis {
  transcription: string;
  detectedTheme?: string;
  nullity: {
    isValid: boolean;
    reason: string | null;
  };
  competencies: {
    c1: C1Analysis;
    c2: C2Analysis;
    c3: C3Analysis;
    c4: C4Analysis;
    c5: C5Analysis;
  };
  suggestedTotalScore: number;
  feedbackOptions: string[];
  teacherFeedback?: string; // Stored final feedback
}

export interface Student {
  id: string;
  name: string;
}

export interface Classroom {
  id: string;
  name: string;
  students: Student[];
  createdAt: number;
}

export interface Essay {
  id: string;
  fileName: string;
  studentName?: string;
  studentId?: string;
  classroomId?: string;
  notes?: string;
  imageUrl: string;
  status: EssayStatus;
  uploadedAt: number;
  analysis: EssayAnalysis | null;
  theme?: string;
  specialNeedsProfile?: 'none' | 'dislexia' | 'surdez' | 'tea';
  error?: string;
}
