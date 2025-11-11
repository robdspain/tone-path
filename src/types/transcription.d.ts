// Type definitions for transcription data

export type Instrument = 'trumpet' | 'guitar' | 'bass' | 'ukulele' | 'piano';

export interface NoteEvent {
  timestamp: number;
  note: string; // e.g., "E4", "C#5"
  frequency: number; // Hz
  duration: number; // seconds
  velocity: number; // 0-1
  confidence?: number; // 0-1
}

export interface ChordEvent {
  timestamp: number;
  chord: string; // e.g., "Cmaj7", "Am"
  notes: string[]; // e.g., ["C4", "E4", "G4", "B4"]
  confidence: number; // 0-1
}

export type TranscriptionEvent = NoteEvent | ChordEvent;

export interface TranscriptionData {
  instrument: Instrument;
  events: TranscriptionEvent[];
  startTime: number;
  endTime?: number;
}

export interface AudioSettings {
  sensitivity: number; // 0-1
  latency: number; // ms
  smoothing: number; // 0-1
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  tempo: number; // BPM
  loopStart?: number;
  loopEnd?: number;
}

