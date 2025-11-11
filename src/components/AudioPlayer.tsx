import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  title?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer, title = 'Imported Audio' }) => {
  const {
    isPlaying,
    currentTime,
    duration,
    tempo,
    loopStart,
    loopEnd,
    isLooping,
    play,
    pause,
    stop,
    seek,
    setTempo,
    setLoopStart,
    setLoopEnd,
    toggleLoop,
  } = useAudioPlayback(audioBuffer);

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingLoopStart, setIsDraggingLoopStart] = useState(false);
  const [isDraggingLoopEnd, setIsDraggingLoopEnd] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  const handleLoopStartDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    setLoopStart(newTime);
  };

  const handleLoopEndDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    setLoopEnd(newTime);
  };

  if (!audioBuffer) {
    return (
      <div className="w-full bg-gray-800/50 rounded-lg p-6 text-center dark:text-gray-300 text-gray-700">
        No audio loaded
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const loopStartPercentage = duration > 0 ? (loopStart / duration) * 100 : 0;
  const loopEndPercentage = duration > 0 ? (loopEnd / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gold mb-2">{title}</h3>
        <div className="text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress Bar with Loop Markers */}
      <div className="relative mb-4">
        <div
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer relative"
          onClick={handleSeek}
        >
          {/* Loop region highlight */}
          {isLooping && (
            <div
              className="absolute h-2 bg-teal/30 rounded-full"
              style={{
                left: `${loopStartPercentage}%`,
                width: `${loopEndPercentage - loopStartPercentage}%`,
              }}
            />
          )}

          {/* Loop start marker */}
          {isLooping && (
            <div
              className="absolute w-1 h-2 bg-teal cursor-move"
              style={{ left: `${loopStartPercentage}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingLoopStart(true);
              }}
            />
          )}

          {/* Loop end marker */}
          {isLooping && (
            <div
              className="absolute w-1 h-2 bg-teal cursor-move"
              style={{ left: `${loopEndPercentage}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingLoopEnd(true);
              }}
            />
          )}

          {/* Progress indicator */}
          <div
            className="absolute h-2 bg-gold rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Loop time labels */}
        {isLooping && (
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(loopStart)}</span>
            <span>{formatTime(loopEnd)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Play/Pause/Stop */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isPlaying ? pause : play}
            className="px-4 py-2 bg-teal hover:bg-teal-light text-white rounded-lg font-semibold"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stop}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
          >
            ⏹ Stop
          </motion.button>
        </div>

        {/* Tempo Control */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-sm text-gray-400 whitespace-nowrap">Tempo:</span>
          <input
            type="range"
            min="0.25"
            max="2.0"
            step="0.05"
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-300 w-16 text-right">
            {(tempo * 100).toFixed(0)}%
          </span>
        </div>

        {/* Loop Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLoop}
          className={`px-4 py-2 rounded-lg font-semibold border-2 ${
            isLooping
              ? 'bg-gold dark:text-gray-900 text-gray-900 border-gold-dark/30 dark:border-gold-dark/50'
              : 'dark:bg-gray-700 bg-gray-600 dark:text-gray-300 text-gray-900 dark:hover:bg-gray-600 hover:bg-gray-700 border-transparent'
          }`}
        >
          🔁 Loop {isLooping ? 'ON' : 'OFF'}
        </motion.button>
      </div>

      {/* Loop Controls (when looping is enabled) */}
      {isLooping && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Loop Start</label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={loopStart}
                  onChange={(e) => setLoopStart(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm dark:text-gray-300 text-gray-800 w-16">{formatTime(loopStart)}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm dark:text-gray-400 text-gray-700 mb-2">Loop End</label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={loopEnd}
                  onChange={(e) => setLoopEnd(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-300 w-16">{formatTime(loopEnd)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mouse event handlers for dragging */}
      {isDraggingLoopStart && (
        <div
          className="fixed inset-0 z-50"
          onMouseMove={(e) => {
            if (isDraggingLoopStart) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = Math.max(0, Math.min(1, x / window.innerWidth));
              setLoopStart(percentage * duration);
            }
          }}
          onMouseUp={() => setIsDraggingLoopStart(false)}
        />
      )}
      {isDraggingLoopEnd && (
        <div
          className="fixed inset-0 z-50"
          onMouseMove={(e) => {
            if (isDraggingLoopEnd) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = Math.max(0, Math.min(1, x / window.innerWidth));
              setLoopEnd(percentage * duration);
            }
          }}
          onMouseUp={() => setIsDraggingLoopEnd(false)}
        />
      )}
    </motion.div>
  );
};


