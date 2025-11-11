// Type definitions for Netlify functions
export type Instrument = 'trumpet' | 'guitar' | 'bass' | 'ukulele';

export interface NoteEvent {
  timestamp: number;
  note: string;
  frequency: number;
  duration: number;
  velocity: number;
  confidence?: number;
}

export interface ChordEvent {
  timestamp: number;
  chord: string;
  notes: string[];
  confidence: number;
}

export type TranscriptionEvent = NoteEvent | ChordEvent;

export interface TranscriptionData {
  instrument: Instrument;
  events: TranscriptionEvent[];
  startTime: number;
  endTime?: number;
}

