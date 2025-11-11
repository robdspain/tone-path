// Type definitions for chord recognition
export interface ChordFrame {
  time: number;              // seconds in song
  chord: string;             // e.g. "Am7"
  confidence: number;        // 0–1
}

export interface ChordStream {
  source: "youtube" | "spotify" | "apple" | "file" | "microphone";
  bpm?: number;
  key?: string;
  frames: ChordFrame[];
}

export interface ChordAnalysisResult {
  label: string;
  confidence: number;
  notes?: string[];
}

