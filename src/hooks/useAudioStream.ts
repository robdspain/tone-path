import { useState, useEffect, useRef } from 'react';
import type { AudioSettings } from '@/types/transcription';

export const useAudioStream = (settings: AudioSettings) => {
  const [isListening, setIsListening] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startListening = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = settings.smoothing;

      const source = ctx.createMediaStreamSource(mediaStream);
      source.connect(analyserNode);

      setAudioContext(ctx);
      setAnalyser(analyserNode);
      setStream(mediaStream);
      sourceRef.current = source;
      setIsListening(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
    setIsListening(false);
    setAudioContext(null);
    setAnalyser(null);
  };

  const getAudioData = (): Float32Array | null => {
    if (!analyser) return null;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);
    return dataArray;
  };

  const getFrequencyData = (): Uint8Array | null => {
    if (!analyser) return null;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return {
    isListening,
    audioContext,
    analyser,
    startListening,
    stopListening,
    getAudioData,
    getFrequencyData,
    error,
  };
};

