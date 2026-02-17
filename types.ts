
export type Language = 'en' | 'ar';

export interface User {
  name: string;
  email: string;
  avatar?: string; // Legacy URL
  avatarId?: string; // New ID system
  bio?: string;
  themePreference?: string;
  darkMode: boolean;
}

export interface Activity {
  id: string;
  userId: string; // Linked to User.email
  type: 'upload' | 'quiz' | 'flashcard' | 'chat' | 'note' | 'drawing';
  description: string;
  timestamp: string;
}

export interface CreativeProject {
  id: string;
  title: string;
  content: string; // Text content
  canvasData: string | null; // Base64 image data
  lastModified: number;
  styles?: {
    textColor?: string;
    bgColor?: string;
    fontFamily?: string;
    showLines?: boolean;
  };
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'pdf' | 'md' | 'docx' | 'other';
  size?: number; // File size in bytes
  dateAdded: string;
  summary?: string;
  concepts?: Concept[];
  roadmap?: RoadmapStep[];
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  completed: boolean;
}

export interface Concept {
  term: string;
  definition: string;
  category: string;
}

export interface QAPair {
  id: string;
  question: string;
  answer: string;
}

export interface BlankSentence {
  id: string;
  sentence: string; // "The [blank] is blue."
  answer: string;
}

export interface Note {
  docId: string;
  content: string;
  lastModified: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastStudyDate: string; // ISO date
  quizzesAce: number; // Perfect scores
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}
  
export interface Quiz {
  id: string;
  docId: string;
  title: string;
  questions: QuizQuestion[];
  score?: number;
  dateCreated: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  DOCUMENTS = 'DOCUMENTS',
  STUDY = 'STUDY',
  SETTINGS = 'SETTINGS',
  TOOLS = 'TOOLS'
}

export type StudyMode = 'original' | 'summary' | 'concepts' | 'roadmap' | 'chat' | 'voice' | 'flashcards' | 'quiz' | 'qa' | 'blanks';
