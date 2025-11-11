// Preset types and definitions
import type { Instrument, AudioSettings } from './transcription';

export interface TranscriptionPreset {
  id: string;
  name: string;
  description?: string;
  instrument: Instrument;
  audioSettings: AudioSettings;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  author?: string;
}

export interface PresetLibrary {
  presets: TranscriptionPreset[];
  version: string;
}

// Default presets for each instrument
export const DEFAULT_PRESETS: Record<Instrument, TranscriptionPreset> = {
  trumpet: {
    id: 'default-trumpet',
    name: 'Default Trumpet',
    description: 'Optimized settings for trumpet practice',
    instrument: 'trumpet',
    audioSettings: {
      sensitivity: 0.6,
      latency: 100,
      smoothing: 0.7,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['trumpet', 'brass', 'default'],
  },
  guitar: {
    id: 'default-guitar',
    name: 'Default Guitar',
    description: 'Optimized settings for guitar practice',
    instrument: 'guitar',
    audioSettings: {
      sensitivity: 0.5,
      latency: 100,
      smoothing: 0.8,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['guitar', 'strings', 'default'],
  },
  bass: {
    id: 'default-bass',
    name: 'Default Bass',
    description: 'Optimized settings for bass guitar practice',
    instrument: 'bass',
    audioSettings: {
      sensitivity: 0.4,
      latency: 100,
      smoothing: 0.9,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['bass', 'strings', 'default'],
  },
  ukulele: {
    id: 'default-ukulele',
    name: 'Default Ukulele',
    description: 'Optimized settings for ukulele practice',
    instrument: 'ukulele',
    audioSettings: {
      sensitivity: 0.5,
      latency: 100,
      smoothing: 0.8,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['ukulele', 'strings', 'default'],
  },
  piano: {
    id: 'default-piano',
    name: 'Default Piano',
    description: 'Optimized settings for piano practice',
    instrument: 'piano',
    audioSettings: {
      sensitivity: 0.6,
      latency: 100,
      smoothing: 0.7,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['piano', 'keys', 'default'],
  },
};

