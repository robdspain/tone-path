// Type definitions for Smart Jam AI
export type JamStyle = "rock" | "blues" | "funk" | "jazz" | "pop" | "lofi";

export interface JamInput {
  key: string;
  bpm: number;
  style: JamStyle;
  bars: number;
  audioBuffer?: AudioBuffer;
  detectedChords?: string[];
}

export interface JamPattern {
  drums: number[][];  // Array of [time, velocity] pairs
  bass: { note: string; time: number; duration: number }[];
  style: JamStyle;
}

export interface JamSession {
  id: string;
  input: JamInput;
  pattern: JamPattern;
  createdAt: string;
  isPlaying: boolean;
}

