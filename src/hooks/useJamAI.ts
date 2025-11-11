// Hook for Smart Jam AI - generates backing tracks
import { useState, useCallback } from 'react';
import type { JamInput, JamSession, JamPattern } from '@/types/jam';
import { generateBandPattern } from '@/lib/ai/magenta';

export function useJamAI() {
  const [session, setSession] = useState<JamSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJam = useCallback(async (input: JamInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const patternData = await generateBandPattern(input);
      
      const pattern: JamPattern = {
        drums: patternData.drums,
        bass: patternData.bass,
        style: patternData.style,
      };
      
      const newSession: JamSession = {
        id: `jam-${Date.now()}`,
        input,
        pattern,
        createdAt: new Date().toISOString(),
        isPlaying: false,
      };
      
      setSession(newSession);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate jam pattern';
      setError(errorMsg);
      console.error('Jam generation error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  return { 
    session, 
    createJam, 
    loading, 
    error,
    clearSession,
  };
}

