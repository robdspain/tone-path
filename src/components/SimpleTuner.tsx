import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { NoteEvent } from '@/types/transcription';

interface SimpleTunerProps {
  currentNote: NoteEvent | null;
}

// Calculate cents deviation from target note
function calculateCents(frequency: number, targetFrequency: number): number {
  if (targetFrequency === 0) return 0;
  return 1200 * Math.log2(frequency / targetFrequency);
}

// Get target frequency for a note
function getTargetFrequency(note: string): number {
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
  return NOTE_FREQUENCIES[note] || 0;
}

export const SimpleTuner: React.FC<SimpleTunerProps> = ({ currentNote }) => {
  const [displayedNote, setDisplayedNote] = useState<NoteEvent | null>(currentNote);

  useEffect(() => {
    if (currentNote) {
      setDisplayedNote(currentNote);
    } else {
      // Clear after a delay when no note detected
      const timer = setTimeout(() => {
        setDisplayedNote(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentNote]);

  if (!displayedNote) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-30">🎯</div>
          <div className="text-gray-400 font-medium">No note detected</div>
          <div className="text-sm text-gray-600 mt-2">Play a note to see tuning</div>
        </div>
      </div>
    );
  }

  const noteName = displayedNote.note;
  const frequency = displayedNote.frequency;
  const targetFrequency = getTargetFrequency(noteName);
  const cents = calculateCents(frequency, targetFrequency);
  
  // Determine if flat or sharp
  const isFlat = cents < -5;
  const isSharp = cents > 5;
  const isInTune = !isFlat && !isSharp;

  // Calculate meter position (-50 to +50 cents, mapped to bar positions)
  const meterBars = 13; // Number of bars in the meter
  const maxCents = 50;
  const barIndex = Math.round(((cents + maxCents) / (maxCents * 2)) * (meterBars - 1));
  const clampedBarIndex = Math.max(0, Math.min(meterBars - 1, barIndex));
  const centerBarIndex = Math.floor(meterBars / 2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full flex items-center justify-center py-6"
    >
      <div className="relative bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl w-full max-w-md">
        {/* Note Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {/* Left Arrow */}
          <motion.div
            animate={{
              opacity: isFlat || isInTune ? 1 : 0.3,
              scale: isFlat || isInTune ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
            className={`text-2xl ${
              isInTune 
                ? 'text-green-400' 
                : isFlat 
                ? 'text-red-400' 
                : 'text-gray-600'
            }`}
          >
            ◀
          </motion.div>

          {/* Note Name */}
          <motion.div
            animate={{
              scale: isInTune ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 1, repeat: isInTune ? Infinity : 0 }}
            className={`text-5xl sm:text-6xl font-bold ${
              isInTune ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {noteName}
          </motion.div>

          {/* Right Arrow */}
          <motion.div
            animate={{
              opacity: isSharp || isInTune ? 1 : 0.3,
              scale: isSharp || isInTune ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
            className={`text-2xl ${
              isInTune 
                ? 'text-green-400' 
                : isSharp 
                ? 'text-red-400' 
                : 'text-gray-600'
            }`}
          >
            ▶
          </motion.div>
        </div>

        {/* Meter Bars */}
        <div className="flex items-center justify-center gap-1.5 mb-6 h-24">
          {Array.from({ length: meterBars }, (_, i) => {
            const isCenter = i === centerBarIndex;
            const isActive = i === clampedBarIndex;
            const distanceFromCenter = Math.abs(i - centerBarIndex);
            
            // Calculate brightness/intensity
            let intensity = 0.3;
            if (isActive) {
              intensity = isInTune ? 1 : 0.7;
            } else if (isCenter) {
              intensity = 0.5;
            } else {
              intensity = Math.max(0.1, 0.3 - distanceFromCenter * 0.05);
            }

            return (
              <motion.div
                key={i}
                animate={{
                  opacity: intensity,
                  scale: isActive ? 1.2 : 1,
                }}
                transition={{ duration: 0.2 }}
                className={`rounded-sm ${
                  isActive && isInTune
                    ? 'bg-green-400 shadow-lg shadow-green-400/50'
                    : isActive
                    ? 'bg-red-400 shadow-lg shadow-red-400/50'
                    : isCenter
                    ? 'bg-gray-500'
                    : 'bg-gray-600'
                }`}
                style={{
                  width: isActive ? '12px' : isCenter ? '8px' : '6px',
                  height: isActive ? '60px' : isCenter ? '40px' : '30px',
                }}
              />
            );
          })}
        </div>

        {/* Frequency Display */}
        <div className="text-center">
          <div className="text-white/90 font-mono text-lg sm:text-xl">
            {frequency.toFixed(3)}Hz
          </div>
          {!isInTune && (
            <div className="text-sm text-red-400 mt-2">
              {isFlat ? 'Flat' : 'Sharp'} ({cents > 0 ? '+' : ''}{cents.toFixed(0)} cents)
            </div>
          )}
          {isInTune && (
            <div className="text-sm text-green-400 mt-2">
              In Tune
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

