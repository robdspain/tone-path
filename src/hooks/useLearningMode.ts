// Hook for Learning Mode - tracks practice performance
import { useState, useCallback, useEffect } from 'react';
import type { LessonProgress, LearningModeType, PracticeTarget, PerformanceMetrics } from '@/types/learning';
import type { NoteEvent, ChordEvent } from '@/types/transcription';
import { evaluatePerformance } from '@/lib/learning/metrics';

interface UseLearningModeOptions {
  mode: LearningModeType;
  target: PracticeTarget | null;
  enabled?: boolean;
}

export function useLearningMode(options: UseLearningModeOptions) {
  const { mode, target, enabled = true } = options;
  
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const updateMetrics = useCallback((liveNotes: NoteEvent[], liveChords?: ChordEvent[]) => {
    if (!target || !enabled) return;

    const metrics = evaluatePerformance(liveNotes, target);
    setCurrentMetrics(metrics);

    const newProgress: LessonProgress = {
      date: new Date().toISOString(),
      mode,
      accuracy: metrics.accuracy,
      timingDeviation: metrics.timingDeviation,
      avgPitchError: metrics.pitchError,
      duration: sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : undefined,
    };

    setProgress(newProgress);
  }, [target, enabled, mode, sessionStartTime]);

  const startSession = useCallback(() => {
    setSessionStartTime(Date.now());
    setProgress(null);
    setCurrentMetrics(null);
  }, []);

  const endSession = useCallback(() => {
    setSessionStartTime(null);
  }, []);

  // Auto-start session when enabled
  useEffect(() => {
    if (enabled && target && !sessionStartTime) {
      startSession();
    }
  }, [enabled, target, sessionStartTime, startSession]);

  return { 
    progress, 
    currentMetrics,
    updateMetrics,
    startSession,
    endSession,
  };
}

