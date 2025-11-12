import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { ChordEvent } from '@/types/transcription';

interface BarGridProps {
  chords: ChordEvent[];
  currentTime: number;
  bpm: number;
  timeSignature?: { numerator: number; denominator: number }; // e.g., { numerator: 4, denominator: 4 }
  duration: number; // Total song duration in seconds
}

export const BarGrid: React.FC<BarGridProps> = ({
  chords,
  currentTime,
  bpm,
  timeSignature = { numerator: 4, denominator: 4 },
  duration,
}) => {
  // Calculate beat duration based on BPM
  // Each beat = 60/BPM seconds
  const secondsPerBeat = 60 / bpm;
  const beatsPerMeasure = timeSignature.numerator; // For 4/4, this is 4

  // Calculate total number of beats
  const totalBeats = Math.ceil(duration / secondsPerBeat);

  // Create beats array with chord assignments
  // Each "box" represents one beat
  const beats = useMemo(() => {
    const beatsArray: Array<{
      index: number;
      startTime: number;
      endTime: number;
      chord: string | null;
      measureIndex: number;
      beatInMeasure: number;
    }> = [];

    for (let i = 0; i < totalBeats; i++) {
      const startTime = i * secondsPerBeat;
      const endTime = Math.min((i + 1) * secondsPerBeat, duration);
      const measureIndex = Math.floor(i / beatsPerMeasure);
      const beatInMeasure = i % beatsPerMeasure;

      // Find the chord that's active during this beat
      // Use the chord that starts closest to the start of the beat
      let activeChord: ChordEvent | null = null;
      let minDistance = Infinity;

      chords.forEach((chord) => {
        // Check if chord is active during this beat
        if (chord.timestamp >= startTime - secondsPerBeat * 0.3 && chord.timestamp < endTime + secondsPerBeat * 0.3) {
          const distance = Math.abs(chord.timestamp - startTime);
          if (distance < minDistance) {
            minDistance = distance;
            activeChord = chord;
          }
        }
      });

      // If no chord found, check for the most recent chord before this beat
      if (!activeChord && chords.length > 0) {
        const previousChords = chords.filter((c) => c.timestamp < startTime);
        if (previousChords.length > 0) {
          // Use the most recent chord before this beat if it's within reasonable distance
          const mostRecent = previousChords[previousChords.length - 1];
          if (startTime - mostRecent.timestamp < secondsPerBeat * 2) {
            activeChord = mostRecent;
          }
        }
      }

      beatsArray.push({
        index: i,
        startTime,
        endTime,
        chord: activeChord?.chord || null,
        measureIndex,
        beatInMeasure,
      });
    }

    return beatsArray;
  }, [chords, totalBeats, secondsPerBeat, duration, beatsPerMeasure]);

  // Group beats into measures
  const measures = useMemo(() => {
    const measuresArray: Array<typeof beats> = [];
    let currentMeasure: typeof beats = [];

    beats.forEach((beat) => {
      if (beat.beatInMeasure === 0 && currentMeasure.length > 0) {
        measuresArray.push(currentMeasure);
        currentMeasure = [];
      }
      currentMeasure.push(beat);
    });

    if (currentMeasure.length > 0) {
      measuresArray.push(currentMeasure);
    }

    return measuresArray;
  }, [beats]);

  // Find current beat index
  const currentBeatIndex = useMemo(() => {
    return beats.findIndex(
      (beat) => currentTime >= beat.startTime && currentTime < beat.endTime
    );
  }, [beats, currentTime]);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Bar Grid</h3>
          <p className="text-sm text-white/60">
            {timeSignature.numerator}/{timeSignature.denominator} • {bpm} BPM • {totalBeats} beats • {measures.length} measures
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {measures.map((measure, measureIdx) => (
          <div key={measureIdx} className="space-y-2">
            {/* Measure label */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/60 min-w-[80px]">
                Measure {measureIdx + 1}
              </span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Beats (boxes) in this measure */}
            <div className={`grid gap-2 ${
              beatsPerMeasure === 2 ? 'grid-cols-2' :
              beatsPerMeasure === 3 ? 'grid-cols-3' :
              beatsPerMeasure === 4 ? 'grid-cols-4' :
              beatsPerMeasure === 6 ? 'grid-cols-6' :
              'grid-cols-4'
            }`}>
              {measure.map((beat) => {
                const isCurrent = beat.index === currentBeatIndex;
                const isPast = beat.index < currentBeatIndex;
                const isUpcoming = beat.index > currentBeatIndex;

                return (
                  <motion.div
                    key={beat.index}
                    className={`
                      rounded-lg border-2 p-3 min-h-[80px] flex flex-col items-center justify-center
                      transition-all duration-200
                      ${
                        isCurrent
                          ? 'bg-emerald-500/30 border-emerald-400 shadow-lg shadow-emerald-400/50 scale-105'
                          : isPast
                          ? 'bg-slate-800/50 border-white/20'
                          : 'bg-slate-800/30 border-white/10'
                      }
                    `}
                    animate={
                      isCurrent
                        ? {
                            scale: [1, 1.05, 1],
                          }
                        : {}
                    }
                    transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0 }}
                  >
                    {/* Beat number */}
                    <div className="text-xs text-white/40 mb-1">
                      Beat {beat.beatInMeasure + 1}
                    </div>

                    {/* Chord name */}
                    {beat.chord ? (
                      <div
                        className={`
                          text-xl font-bold text-center
                          ${isCurrent ? 'text-emerald-300' : isPast ? 'text-white' : 'text-white/70'}
                        `}
                      >
                        {beat.chord}
                      </div>
                    ) : (
                      <div className="text-sm text-white/30">—</div>
                    )}

                    {/* Time indicator */}
                    <div className="text-xs text-white/40 mt-1">
                      {beat.startTime.toFixed(1)}s
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {beats.length === 0 && (
        <div className="text-center py-8 text-white/60">
          No beats to display. Import a song with detected BPM to see the bar grid.
        </div>
      )}
    </div>
  );
};

