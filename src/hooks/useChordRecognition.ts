// Hook for real-time chord recognition from audio stream
import { useEffect, useRef, useState } from 'react';
import type { ChordStream, ChordFrame } from '@/types/chords';
import { getChromagram, classifyChord, smoothChordSequence } from '@/lib/audio/analysis';

interface UseChordRecognitionOptions {
  enabled?: boolean;
  smoothingWindow?: number; // milliseconds
  minConfidence?: number;
}

/**
 * Listens to a WebAudio node (e.g., YouTube/Spotify playback or microphone)
 * and emits real-time chord detections.
 */
export function useChordRecognition(
  audioContext: AudioContext | null,
  sourceNode: AudioNode | null,
  options: UseChordRecognitionOptions = {}
) {
  const { enabled = true, smoothingWindow = 900, minConfidence = 0.2 } = options;
  
  const [chords, setChords] = useState<ChordStream>({ 
    source: 'microphone', 
    frames: [] 
  });
  
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rawFramesRef = useRef<ChordFrame[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!audioContext || !sourceNode || !enabled) {
      return;
    }

    // Create analyser node for better audio processing
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0.85;
    
    analyserRef.current = analyser;
    sourceNode.connect(analyser);
    
    // Use ScriptProcessorNode for audio processing (deprecated but works)
    // In production, consider using AudioWorkletNode
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    analyser.connect(processor);
    processor.connect(audioContext.destination);
    
    startTimeRef.current = audioContext.currentTime;

    processor.onaudioprocess = (e) => {
      const inputBuffer = e.inputBuffer;
      const frame = inputBuffer.getChannelData(0);
      
      // Get chromagram
      const chroma = getChromagram(frame, audioContext.sampleRate);
      
      // Classify chord
      const chordResult = classifyChord(chroma);
      
      if (chordResult && chordResult.confidence >= minConfidence) {
        const currentTime = audioContext.currentTime - startTimeRef.current;
        
        const frame: ChordFrame = {
          time: currentTime,
          chord: chordResult.label,
          confidence: Math.min(chordResult.confidence * 1.1, 1),
        };
        
        rawFramesRef.current.push(frame);
        
        // Keep only recent frames (last 30 seconds)
        rawFramesRef.current = rawFramesRef.current.filter(
          f => currentTime - f.time < 30
        );
        
        // Smooth and update
        const smoothed = smoothChordSequence(rawFramesRef.current, smoothingWindow);
        setChords(prev => ({
          ...prev,
          frames: smoothed,
        }));
      }
    };

    processorRef.current = processor;

    return () => {
      processor.disconnect();
      analyser.disconnect();
      processorRef.current = null;
      analyserRef.current = null;
    };
  }, [audioContext, sourceNode, enabled, smoothingWindow, minConfidence]);

  const clearChords = () => {
    setChords({ source: chords.source, frames: [] });
    rawFramesRef.current = [];
  };

  return { chords, clearChords };
}
