// Enhanced Loop controller with waveform visualization and section markers
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateWaveform } from '@/utils/waveform';

interface LoopControllerProps {
  loopStart: number;
  loopEnd: number;
  isLooping: boolean;
  duration: number;
  tempo: number;
  audioBuffer: AudioBuffer | null;
  currentTime?: number; // Optional current playback time
  detectedBPM?: number | null; // Optional detected BPM for display
  onLoopStartChange: (time: number) => void;
  onLoopEndChange: (time: number) => void;
  onToggleLoop: () => void;
  onTempoChange: (tempo: number) => void;
  onSeek?: (time: number) => void;
}

export const LoopController: React.FC<LoopControllerProps> = ({
  loopStart,
  loopEnd,
  isLooping,
  duration,
  tempo,
  audioBuffer,
  currentTime: propCurrentTime = 0,
  detectedBPM,
  onLoopStartChange,
  onLoopEndChange,
  onToggleLoop,
  onTempoChange,
  onSeek,
}) => {
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [waveformData, setWaveformData] = useState<{ peaks: number[]; duration: number } | null>(null);
  const [isGeneratingWaveform, setIsGeneratingWaveform] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(propCurrentTime);

  // Generate waveform when audio buffer changes (without section detection)
  useEffect(() => {
    if (audioBuffer) {
      setIsGeneratingWaveform(true);
      try {
        // Use setTimeout to avoid blocking the UI
        setTimeout(() => {
          try {
            const waveform = generateWaveform(audioBuffer, 2000);
            setWaveformData({ peaks: waveform.peaks, duration: waveform.duration });
          } catch (error) {
            console.error('Error generating waveform:', error);
            setWaveformData(null);
          } finally {
            setIsGeneratingWaveform(false);
          }
        }, 0);
      } catch (error) {
        console.error('Error setting up waveform generation:', error);
        setIsGeneratingWaveform(false);
        setWaveformData(null);
      }
    } else {
      setWaveformData(null);
      setIsGeneratingWaveform(false);
    }
  }, [audioBuffer]);

  // Update current time from prop
  useEffect(() => {
    setCurrentTime(propCurrentTime);
  }, [propCurrentTime]);

  // Use audioBuffer duration if duration prop is 0 or not set
  const effectiveDuration = duration > 0 ? duration : (audioBuffer?.duration || 0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!effectiveDuration || !waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * effectiveDuration;
    onSeek?.(newTime);
  };

  const handleLoopStartDrag = (e: React.MouseEvent | MouseEvent) => {
    if (!effectiveDuration || !waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = (e as MouseEvent).clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * effectiveDuration;
    if (newTime < loopEnd - 0.1) {
      onLoopStartChange(newTime);
    }
  };

  const handleLoopEndDrag = (e: React.MouseEvent | MouseEvent) => {
    if (!effectiveDuration || !waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = (e as MouseEvent).clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * effectiveDuration;
    if (newTime > loopStart + 0.1) {
      onLoopEndChange(newTime);
    }
  };

  // Global mouse handlers for dragging
  useEffect(() => {
    if (!effectiveDuration) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingStart) {
        handleLoopStartDrag(e);
      }
      if (isDraggingEnd) {
        handleLoopEndDrag(e);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    if (isDraggingStart || isDraggingEnd) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingStart, isDraggingEnd, duration, loopStart, loopEnd, audioBuffer]);

  if (!audioBuffer) {
    return (
      <div className="w-full dark:bg-gray-800/50 bg-gray-200/50 rounded-lg p-4 text-center dark:text-gray-300 text-gray-700">
        No audio loaded
      </div>
    );
  }

  if (isGeneratingWaveform) {
    return (
      <div className="w-full dark:bg-gray-800/50 bg-gray-200/50 rounded-lg p-4 text-center dark:text-gray-300 text-gray-700">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal"></div>
          <span>Generating waveform...</span>
        </div>
      </div>
    );
  }

  if (!effectiveDuration || effectiveDuration === 0) {
    return (
      <div className="w-full dark:bg-gray-800/50 bg-gray-200/50 rounded-lg p-4 text-center dark:text-gray-300 text-gray-700">
        No audio loaded or invalid duration
      </div>
    );
  }

  if (!waveformData || waveformData.peaks.length === 0) {
    return (
      <div className="w-full dark:bg-gray-800/50 bg-gray-200/50 rounded-lg p-4 text-center dark:text-gray-300 text-gray-700">
        <div>Failed to generate waveform. Audio duration: {effectiveDuration.toFixed(2)}s</div>
        <div className="text-xs mt-2">Try reloading the audio file</div>
      </div>
    );
  }

  const loopStartPercentage = (loopStart / effectiveDuration) * 100;
  const loopEndPercentage = (loopEnd / effectiveDuration) * 100;
  const loopWidth = loopEndPercentage - loopStartPercentage;
  const progressPercentage = (currentTime / effectiveDuration) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full dark:bg-gray-800/50 bg-gray-200/50 rounded-lg p-6"
    >
      <div className="dark:text-gray-300 text-gray-800 text-sm mb-4 font-semibold">Loop & Tempo Control</div>

      {/* Waveform Visualization */}
      <div className="relative mb-4 pt-6">
        <div
          ref={waveformRef}
          className="relative w-full h-32 dark:bg-gray-900/50 bg-gray-100 rounded-lg cursor-pointer overflow-hidden border dark:border-gray-700 border-gray-300"
          onClick={handleWaveformClick}
        >
          {/* Waveform */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${waveformData.peaks.length} 100`}
            preserveAspectRatio="none"
          >
            <polyline
              points={waveformData.peaks
                .map((peak, i) => {
                  const x = i;
                  const y = 50 - peak * 40; // Center at 50, scale by 40
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="currentColor"
              className="dark:text-teal text-teal-600"
              strokeWidth="0.5"
            />
            <polyline
              points={waveformData.peaks
                .map((peak, i) => {
                  const x = i;
                  const y = 50 + peak * 40; // Mirror below center
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="currentColor"
              className="dark:text-teal text-teal-600"
              strokeWidth="0.5"
            />
          </svg>

          {/* Loop Region Highlight */}
          {isLooping && (
            <div
              className="absolute top-0 h-full bg-teal/20 border-l-2 border-r-2 border-teal"
              style={{
                left: `${loopStartPercentage}%`,
                width: `${loopWidth}%`,
              }}
            />
          )}

          {/* Playhead Indicator - More Visible */}
          <div
            className="absolute top-0 h-full z-20"
            style={{ left: `calc(${progressPercentage}% - 1px)` }}
          >
            {/* Vertical line */}
            <div className="absolute top-0 h-full w-0.5 bg-gold shadow-lg shadow-gold/50" />
            {/* Top indicator triangle */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gold" />
            {/* Bottom indicator triangle */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gold" />
          </div>

          {/* Loop Start Handle - Large and Easy to Grab */}
          <div
            className={`absolute top-0 h-full w-3 cursor-ew-resize z-30 flex items-center justify-center ${
              isDraggingStart ? 'bg-teal' : 'bg-teal/80 hover:bg-teal'
            } transition-colors`}
            style={{ left: `calc(${loopStartPercentage}% - 6px)` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingStart(true);
            }}
            title={`Loop Start: ${formatTime(loopStart)}`}
          >
            <div className="w-1 h-full bg-white/50 rounded-full" />
          </div>

          {/* Loop End Handle - Large and Easy to Grab */}
          <div
            className={`absolute top-0 h-full w-3 cursor-ew-resize z-30 flex items-center justify-center ${
              isDraggingEnd ? 'bg-teal' : 'bg-teal/80 hover:bg-teal'
            } transition-colors`}
            style={{ left: `calc(${loopEndPercentage}% - 6px)` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingEnd(true);
            }}
            title={`Loop End: ${formatTime(loopEnd)}`}
          >
            <div className="w-1 h-full bg-white/50 rounded-full" />
          </div>
        </div>
        
        {/* Playhead Time Label - positioned below waveform container */}
        <div
          className="absolute top-full mt-2 px-2 py-0.5 bg-gold/90 dark:text-gray-900 text-gray-900 rounded text-xs font-semibold whitespace-nowrap shadow-md pointer-events-none z-30 transform -translate-x-1/2"
          style={{ left: `${progressPercentage}%` }}
        >
          {formatTime(currentTime)}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between text-xs dark:text-gray-400 text-gray-600 mt-2">
          <span>{formatTime(loopStart)}</span>
          <span className={isLooping ? 'dark:text-teal text-teal-600 font-semibold' : ''}>
            Loop: {formatTime(loopEnd - loopStart)}
          </span>
          <span>{formatTime(loopEnd)}</span>
          <span className="ml-auto">Total: {formatTime(effectiveDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center flex-wrap">
        {/* Loop Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleLoop}
          className={`px-4 py-2 rounded-lg font-semibold ${
            isLooping
              ? 'bg-teal dark:text-white text-white'
              : 'dark:bg-gray-700 bg-gray-600 dark:text-gray-300 text-gray-900 dark:hover:bg-gray-600 hover:bg-gray-700'
          }`}
        >
          ⟲ {isLooping ? 'Looping' : 'Loop'}
        </motion.button>

        {/* Tempo Control */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] relative">
          <label className="text-sm dark:text-gray-300 text-gray-700 whitespace-nowrap">
            Speed:
          </label>
          <div className="flex-1 relative h-6 flex items-center">
            {/* Visible track line */}
            <div 
              className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400 dark:bg-gray-500 -translate-y-1/2 pointer-events-none rounded-full"
              style={{ zIndex: 0 }}
            />
            {/* Progress line */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-teal dark:bg-teal -translate-y-1/2 pointer-events-none rounded-full transition-all"
              style={{ 
                width: `${((tempo - 0.25) / (2.0 - 0.25)) * 100}%`,
                zIndex: 1
              }}
            />
            <input
              type="range"
              min="0.25"
              max="2.0"
              step="0.05"
              value={tempo}
              onChange={(e) => onTempoChange(Number(e.target.value))}
              className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer relative z-10 slider-speed"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm dark:text-gray-300 text-gray-800 w-16">
              {(tempo * 100).toFixed(0)}%
            </span>
            {detectedBPM && (
              <span className="text-sm dark:text-gray-400 text-gray-600 font-semibold">
                ({Math.round(detectedBPM * tempo)} BPM)
              </span>
            )}
          </div>
        </div>

        {/* Quick Tempo Buttons */}
        <div className="flex gap-1">
          {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
            <motion.button
              key={speed}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTempoChange(speed)}
              className={`px-2 py-1 text-xs rounded ${
                Math.abs(tempo - speed) < 0.01
                  ? 'bg-teal dark:text-white text-white'
                  : 'dark:bg-gray-700 bg-gray-600 dark:text-gray-300 text-gray-900 dark:hover:bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {speed}x
            </motion.button>
          ))}
        </div>
      </div>

    </motion.div>
  );
};
