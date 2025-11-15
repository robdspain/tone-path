import { useState, useEffect, useRef } from 'react';

interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  tempo: number; // Playback speed multiplier (1.0 = normal, 0.5 = half speed, 2.0 = double speed)
  loopStart: number;
  loopEnd: number;
  isLooping: boolean;
}

export const useAudioPlayback = (audioBuffer: AudioBuffer | null) => {
  const [state, setState] = useState<AudioPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    tempo: 1.0,
    loopStart: 0,
    loopEnd: 0,
    isLooping: false,
  });

  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio buffer
  useEffect(() => {
    if (!audioBuffer) {
      setState((prev) => ({ ...prev, duration: 0 }));
      return;
    }

    const duration = audioBuffer.duration;
    setState((prev) => ({
      ...prev,
      duration,
      loopEnd: duration,
    }));

    // Initialize audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Always have a gain node that downstream processors (e.g. chord detection) can tap into
    if (audioContextRef.current && !gainNodeRef.current) {
      const gain = audioContextRef.current.createGain();
      gain.connect(audioContextRef.current.destination);
      gainNodeRef.current = gain;
    }

    // Cleanup on unmount or when audio buffer changes
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    };
  }, [audioBuffer]);

  // Update current time during playback
  useEffect(() => {
    if (!state.isPlaying || !audioBuffer || !audioContextRef.current) {
      return;
    }

    const updateTime = () => {
      if (!audioContextRef.current) return;

      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * state.tempo;
      let currentTime = pausedTimeRef.current + elapsed;

      // Handle looping
      if (state.isLooping && currentTime >= state.loopEnd) {
        currentTime = state.loopStart;
        pausedTimeRef.current = state.loopStart;
        startTimeRef.current = audioContextRef.current.currentTime;
        
        // Restart playback from loop start
        if (sourceRef.current) {
          sourceRef.current.stop();
          playFromTime(state.loopStart);
        }
        return;
      }

      // Clamp to duration
      if (currentTime > state.duration) {
        currentTime = state.duration;
        setState((prev) => ({ ...prev, isPlaying: false, currentTime }));
        return;
      }

      setState((prev) => ({ ...prev, currentTime }));
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying, state.tempo, state.isLooping, state.loopEnd, audioBuffer, state.duration]);

  const playFromTime = (startOffset: number) => {
    if (!audioBuffer || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = state.tempo;

    // Handle looping
    if (state.isLooping) {
      source.loop = true;
      source.loopStart = state.loopStart;
      source.loopEnd = state.loopEnd;
    }

    if (!gainNodeRef.current) {
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;
    }

    source.connect(gainNodeRef.current);
    source.start(0, startOffset);

    sourceRef.current = source;
    startTimeRef.current = ctx.currentTime;
    pausedTimeRef.current = startOffset;

    // Handle end of playback (when not looping)
    source.onended = () => {
      if (!state.isLooping) {
        setState((prev) => ({ ...prev, isPlaying: false, currentTime: prev.duration }));
      }
    };
  };

  const play = async () => {
    if (!audioBuffer || !audioContextRef.current) return;

    try {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const startOffset = Math.max(0, Math.min(state.currentTime, state.duration));
      playFromTime(startOffset);
      setState((prev) => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const pause = () => {
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  };

  const stop = () => {
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    pausedTimeRef.current = 0;
  };

  const seek = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, state.duration));
    pausedTimeRef.current = clampedTime;
    setState((prev) => ({ ...prev, currentTime: clampedTime }));

    // If playing, restart from new position
    if (state.isPlaying) {
      pause();
      setTimeout(() => play(), 100);
    }
  };

  const setTempo = (tempo: number) => {
    const clampedTempo = Math.max(0.25, Math.min(tempo, 2.0)); // 0.25x to 2x speed
    setState((prev) => ({ ...prev, tempo: clampedTempo }));

    // Update playback rate if currently playing
    if (sourceRef.current) {
      sourceRef.current.playbackRate.value = clampedTempo;
    }
  };

  const setLoopStart = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, state.loopEnd - 0.1));
    setState((prev) => ({ ...prev, loopStart: clampedTime }));
  };

  const setLoopEnd = (time: number) => {
    const clampedTime = Math.max(state.loopStart + 0.1, Math.min(time, state.duration));
    setState((prev) => ({ ...prev, loopEnd: clampedTime }));
  };

  const toggleLoop = () => {
    setState((prev) => ({ ...prev, isLooping: !prev.isLooping }));
  };

  return {
    ...state,
    play,
    pause,
    stop,
    seek,
    setTempo,
    setLoopStart,
    setLoopEnd,
    toggleLoop,
    audioContext: audioContextRef.current,
    outputNode: gainNodeRef.current,
  };
};
