import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { NoteEvent } from '@/types/transcription';

// Note frequencies (A4 = 440 Hz)
const NOTE_FREQUENCIES: Record<string, number> = {
  C0: 16.35, C1: 32.70, C2: 65.41, C3: 130.81, C4: 261.63, C5: 523.25, C6: 1046.50, C7: 2093.00, C8: 4186.01,
  'C#0': 17.32, 'C#1': 34.65, 'C#2': 69.30, 'C#3': 138.59, 'C#4': 277.18, 'C#5': 554.37, 'C#6': 1108.73, 'C#7': 2217.46,
  D0: 18.35, D1: 36.71, D2: 73.42, D3: 146.83, D4: 293.66, D5: 587.33, D6: 1174.66, D7: 2349.32, D8: 4698.64,
  'D#0': 19.45, 'D#1': 38.89, 'D#2': 77.78, 'D#3': 155.56, 'D#4': 311.13, 'D#5': 622.25, 'D#6': 1244.51, 'D#7': 2489.02,
  E0: 20.60, E1: 41.20, E2: 82.41, E3: 164.81, E4: 329.63, E5: 659.25, E6: 1318.51, E7: 2637.02, E8: 5274.04,
  F0: 21.83, F1: 43.65, F2: 87.31, F3: 174.61, F4: 349.23, F5: 698.46, F6: 1396.91, F7: 2793.83, F8: 5587.65,
  'F#0': 23.12, 'F#1': 46.25, 'F#2': 92.50, 'F#3': 185.00, 'F#4': 369.99, 'F#5': 739.99, 'F#6': 1479.98, 'F#7': 2959.96,
  G0: 24.50, G1: 49.00, G2: 98.00, G3: 196.00, G4: 392.00, G5: 783.99, G6: 1567.98, G7: 3135.96, G8: 6271.93,
  'G#0': 25.96, 'G#1': 51.91, 'G#2': 103.83, 'G#3': 207.65, 'G#4': 415.30, 'G#5': 830.61, 'G#6': 1661.22, 'G#7': 3322.44,
  A0: 27.50, A1: 55.00, A2: 110.00, A3: 220.00, A4: 440.00, A5: 880.00, A6: 1760.00, A7: 3520.00, A8: 7040.00,
  'A#0': 29.14, 'A#1': 58.27, 'A#2': 116.54, 'A#3': 233.08, 'A#4': 466.16, 'A#5': 932.33, 'A#6': 1864.66, 'A#7': 3729.31,
  B0: 30.87, B1: 61.74, B2: 123.47, B3: 246.94, B4: 493.88, B5: 987.77, B6: 1975.53, B7: 3951.07, B8: 7902.13,
};

function frequencyToNote(frequency: number): { note: string; cents: number } {
  if (frequency < 16 || frequency > 8000) {
    return { note: '', cents: 0 };
  }

  let minDiff = Infinity;
  let closestNote = '';
  let closestFreq = 0;

  for (const [note, freq] of Object.entries(NOTE_FREQUENCIES)) {
    const diff = Math.abs(frequency - freq);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
      closestFreq = freq;
    }
  }

  const cents = 1200 * Math.log2(frequency / closestFreq);
  return { note: closestNote, cents };
}

// Simple autocorrelation-based pitch detection (fallback)
function detectPitchAutocorrelation(buffer: Float32Array, sampleRate: number): number | null {
  const minPeriod = Math.floor(sampleRate / 2000);
  const maxPeriod = Math.floor(sampleRate / 80);

  let maxCorrelation = 0;
  let bestPeriod = 0;

  for (let period = minPeriod; period < maxPeriod; period++) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - period; i++) {
      correlation += buffer[i] * buffer[i + period];
    }
    correlation /= buffer.length - period;

    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestPeriod = period;
    }
  }

  if (maxCorrelation > 0.3 && bestPeriod > 0) {
    return sampleRate / bestPeriod;
  }

  return null;
}

const CREPE_FRAME_SIZE = 1024;
const CREPE_SAMPLE_RATE = 16000;
const CREPE_MIN_FREQUENCY = 50;
const CREPE_MAX_FREQUENCY = 550;
const CREPE_CONFIDENCE_THRESHOLD = 0.35;
const CREPE_MODEL_URL = process.env.NEXT_PUBLIC_CREPE_MODEL_URL || '/models/crepe/model.json';

function resampleForCrepe(buffer: Float32Array, sampleRate: number): Float32Array {
  const resampled = new Float32Array(CREPE_FRAME_SIZE);
  if (!buffer.length) return resampled;
  const ratio = sampleRate / CREPE_SAMPLE_RATE;

  for (let i = 0; i < CREPE_FRAME_SIZE; i++) {
    const sourceIndex = i * ratio;
    const baseIndex = Math.floor(sourceIndex);
    const frac = sourceIndex - baseIndex;
    const sampleA = buffer[Math.min(baseIndex, buffer.length - 1)];
    const sampleB = buffer[Math.min(baseIndex + 1, buffer.length - 1)];
    resampled[i] = sampleA + (sampleB - sampleA) * frac;
  }

  // Normalize (zero mean, unit variance)
  let mean = 0;
  for (let i = 0; i < CREPE_FRAME_SIZE; i++) {
    mean += resampled[i];
  }
  mean /= CREPE_FRAME_SIZE;

  let variance = 0;
  for (let i = 0; i < CREPE_FRAME_SIZE; i++) {
    const centered = resampled[i] - mean;
    resampled[i] = centered;
    variance += centered * centered;
  }
  const std = Math.sqrt(variance / CREPE_FRAME_SIZE) || 1;
  for (let i = 0; i < CREPE_FRAME_SIZE; i++) {
    resampled[i] = resampled[i] / std;
  }

  return resampled;
}

function crepeBinToFrequency(bin: number, totalBins: number): number {
  const minLog = Math.log2(CREPE_MIN_FREQUENCY);
  const range = Math.log2(CREPE_MAX_FREQUENCY) - minLog;
  return Math.pow(2, minLog + (bin / Math.max(totalBins - 1, 1)) * range);
}

async function detectPitchCREPE(
  model: tf.LayersModel | null,
  buffer: Float32Array,
  sampleRate: number
): Promise<number | null> {
  if (!model) return null;

  try {
    const frame = resampleForCrepe(buffer, sampleRate);

    const confidences = tf.tidy(() => {
      const input = tf.tensor(frame, [1, CREPE_FRAME_SIZE, 1], 'float32');
      const prediction = model.predict(input) as tf.Tensor;
      const data = prediction.dataSync();
      tf.dispose([input, prediction]);
      return Array.from(data);
    });

    let peakIndex = 0;
    let peakConfidence = 0;

    confidences.forEach((confidence, idx) => {
      if (confidence > peakConfidence) {
        peakConfidence = confidence;
        peakIndex = idx;
      }
    });

    if (peakConfidence < CREPE_CONFIDENCE_THRESHOLD) {
      return null;
    }

    let weightedSum = 0;
    let weightTotal = 0;
    for (let offset = -2; offset <= 2; offset++) {
      const idx = peakIndex + offset;
      if (idx >= 0 && idx < confidences.length) {
        const weight = confidences[idx];
        weightTotal += weight;
        weightedSum += weight * crepeBinToFrequency(idx, confidences.length);
      }
    }

    return weightTotal > 0 ? weightedSum / weightTotal : crepeBinToFrequency(peakIndex, confidences.length);
  } catch (error) {
    console.error('CREPE inference error:', error);
    return null;
  }
}

export const usePitchDetection = (
  audioContext: AudioContext | null,
  analyser: AnalyserNode | null,
  sensitivity: number = 0.5,
  useCREPE: boolean = false
) => {
  const [currentNote, setCurrentNote] = useState<NoteEvent | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastNoteTimeRef = useRef<number>(0);

  // Load CREPE model if requested
  useEffect(() => {
    let cancelled = false;

    const loadModel = async () => {
      if (!useCREPE) {
        if (modelRef.current) {
          modelRef.current.dispose();
          modelRef.current = null;
        }
        setIsModelLoaded(true);
        return;
      }

      setIsModelLoaded(false);

      try {
        await tf.ready();
        if (tf.findBackend('webgl') && tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl');
          await tf.ready();
        }
        const model = await tf.loadLayersModel(CREPE_MODEL_URL);
        if (!cancelled) {
          modelRef.current = model;
          setIsModelLoaded(true);
        } else {
          model.dispose();
        }
      } catch (error) {
        console.warn('Failed to load CREPE model, falling back to autocorrelation:', error);
        if (!cancelled) {
          setIsModelLoaded(true);
        }
      }
    };

    loadModel();

    return () => {
      cancelled = true;
    };
  }, [useCREPE]);

  useEffect(() => {
    if (!audioContext || !analyser || !isModelLoaded) {
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const analyze = async () => {
      analyser.getFloatTimeDomainData(dataArray);

      const volume = dataArray.reduce((sum, val) => sum + Math.abs(val), 0) / bufferLength;
      
      if (volume < sensitivity * 0.1) {
        setCurrentNote(null);
        animationFrameRef.current = requestAnimationFrame(analyze);
        return;
      }

      let frequency: number | null = null;

      if (useCREPE && modelRef.current) {
        frequency = await detectPitchCREPE(modelRef.current, dataArray, audioContext.sampleRate);
      }

      // Fallback to autocorrelation
      if (!frequency) {
        frequency = detectPitchAutocorrelation(dataArray, audioContext.sampleRate);
      }
      
      if (frequency) {
        const { note, cents } = frequencyToNote(frequency);
        const now = Date.now() / 1000;
        
        if (note) {
          const noteEvent: NoteEvent = {
            timestamp: now,
            note,
            frequency,
            duration: now - lastNoteTimeRef.current || 0.1,
            velocity: Math.min(volume * 10, 1),
            confidence: Math.max(0, 1 - Math.abs(cents) / 50),
          };

          setCurrentNote(noteEvent);
          lastNoteTimeRef.current = now;
        }
      }

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    animationFrameRef.current = requestAnimationFrame(analyze);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioContext, analyser, isModelLoaded, sensitivity, useCREPE]);

  return {
    currentNote,
    isModelLoaded,
  };
};
