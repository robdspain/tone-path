import { useState, useRef } from 'react';
import type { TranscriptionData, TranscriptionEvent } from '@/types/transcription';

export const useRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedDataState] = useState<TranscriptionData | null>(null);
  const eventsRef = useRef<TranscriptionEvent[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = (instrument: TranscriptionData['instrument']) => {
    eventsRef.current = [];
    startTimeRef.current = Date.now() / 1000;
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    const data: TranscriptionData = {
      instrument: recordedData?.instrument || 'guitar',
      events: [...eventsRef.current],
      startTime: startTimeRef.current,
      endTime: Date.now() / 1000,
    };
    setRecordedDataState(data);
    return data;
  };

  const addEvent = (event: TranscriptionEvent) => {
    if (isRecording) {
      eventsRef.current.push(event);
    }
  };

  const clearRecording = () => {
    eventsRef.current = [];
    setRecordedDataState(null);
    startTimeRef.current = 0;
  };

  const setRecordedData = (data: TranscriptionData | null) => {
    setRecordedDataState(data);
  };

  return {
    isRecording,
    recordedData,
    startRecording,
    stopRecording,
    addEvent,
    clearRecording,
    setRecordedData,
  };
};

