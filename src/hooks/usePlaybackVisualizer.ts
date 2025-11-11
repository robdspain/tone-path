// Hook to visualize Tone.js playback audio
import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

export const usePlaybackVisualizer = (isPlaying: boolean) => {
  const [audioData, setAudioData] = useState<Float32Array | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setAudioData(null);
      setFrequencyData(null);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Create analyser node connected to Tone.js destination
    const analyser = Tone.context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    
    // Connect Tone.js master output to analyser
    Tone.getDestination().connect(analyser);
    analyserRef.current = analyser;

    const updateVisualization = () => {
      if (!analyserRef.current || !isPlaying) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      
      // Get time domain data (waveform)
      const timeData = new Float32Array(bufferLength);
      analyser.getFloatTimeDomainData(timeData);
      setAudioData(timeData);

      // Get frequency data (spectrum)
      const freqData = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(freqData);
      setFrequencyData(freqData);

      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };

    animationFrameRef.current = requestAnimationFrame(updateVisualization);

    return () => {
      if (analyserRef.current) {
        Tone.getDestination().disconnect(analyserRef.current);
        analyserRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  return {
    audioData,
    frequencyData,
  };
};

