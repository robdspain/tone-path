// Type definitions for Learning Mode
export type LearningModeType = "chords" | "scales" | "timing" | "songs";

export type DifficultyLevel = "beginner" | "intermediate" | "expert";

export interface LessonProgress {
  date: string;
  mode: LearningModeType;
  accuracy: number;          // 0-1
  timingDeviation: number;   // milliseconds
  avgPitchError: number;     // cents
  duration?: number;          // seconds
}

export interface PracticeTarget {
  mode: LearningModeType;
  difficulty: DifficultyLevel;
  targetNotes?: string[];
  targetChords?: string[];
  targetPattern?: { time: number; note: string }[];
  tempo?: number;
}

export interface PerformanceMetrics {
  accuracy: number;
  timingDeviation: number;
  pitchError: number;
  correctNotes: number;
  totalNotes: number;
}

