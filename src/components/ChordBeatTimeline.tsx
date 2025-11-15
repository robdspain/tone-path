import React, { useMemo, useState, useEffect } from 'react';
import type { ChordFrame } from '@/types/chords';

interface ChordBeatTimelineProps {
  frames: ChordFrame[];
  duration?: number | null;
  bpm?: number | null;
  beatsPerBar?: number;
  title?: string;
  currentTime?: number | null;
  onBeatSelect?: (time: number) => void;
}

type BeatCell = {
  chord: string | null;
  confidence: number | null;
  start: number;
};

const DEFAULT_BPM = 120;
const MEASURES_VISIBLE = 4;

export const ChordBeatTimeline: React.FC<ChordBeatTimelineProps> = ({
  frames,
  duration,
  bpm = null,
  beatsPerBar = 4,
  title = 'Chord Timeline',
  currentTime = null,
  onBeatSelect,
}) => {
  const { measures, secondsPerBeat } = useMemo(() => {
    if (!frames.length) {
      return { measures: [], secondsPerBeat: 60 / DEFAULT_BPM };
    }
    const effectiveBpm = bpm && bpm > 0 ? bpm : DEFAULT_BPM;
    const spb = 60 / effectiveBpm;
    const timelineDuration =
      typeof duration === 'number' && duration > 0
        ? duration
        : frames[frames.length - 1]?.time + spb * 4;
    const totalBeats = Math.max(1, Math.ceil(timelineDuration / spb));

    const beatCells: BeatCell[] = [];
    let frameIndex = 0;
    let activeChord: string | null = null;
    let activeConfidence: number | null = null;

    for (let beat = 0; beat < totalBeats; beat++) {
      const beatStart = beat * spb;

      while (frameIndex < frames.length && frames[frameIndex].time <= beatStart + 1e-3) {
        activeChord = frames[frameIndex].chord;
        activeConfidence = frames[frameIndex].confidence ?? null;
        frameIndex += 1;
      }

      beatCells.push({
        chord: activeChord,
        confidence: activeConfidence,
        start: beatStart,
      });
    }

    const grouped: BeatCell[][] = [];
    for (let idx = 0; idx < beatCells.length; idx += beatsPerBar) {
      const slice = beatCells.slice(idx, idx + beatsPerBar);
      while (slice.length < beatsPerBar) {
        slice.push({
          chord: null,
          confidence: null,
          start: (idx + slice.length) * spb,
        });
      }
      grouped.push(slice);
    }
    return { measures: grouped, secondsPerBeat: spb };
  }, [frames, duration, bpm, beatsPerBar]);

  if (!frames.length) {
    return null;
  }

  const effectiveBpm = bpm && bpm > 0 ? bpm : DEFAULT_BPM;
  const totalMeasures = measures.length;
  const activeBeat = currentTime != null ? Math.max(0, Math.floor(currentTime / secondsPerBeat)) : 0;
  const activeMeasureIndex = Math.min(totalMeasures - 1, Math.floor(activeBeat / beatsPerBar));
  const activeBeatWithinMeasure = activeBeat % beatsPerBar;
  const autoWindowStart = Math.max(
    0,
    Math.min(activeMeasureIndex, Math.max(0, totalMeasures - MEASURES_VISIBLE)),
  );
  const [manualWindowStart, setManualWindowStart] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [pendingFollowTime, setPendingFollowTime] = useState<number | null>(null);

  useEffect(() => {
    if (pendingFollowTime == null || currentTime == null) return;
    if (Math.abs(currentTime - pendingFollowTime) < secondsPerBeat / 2) {
      setIsFollowing(true);
      setPendingFollowTime(null);
    }
  }, [pendingFollowTime, currentTime, secondsPerBeat]);

  const windowStart =
    isFollowing || manualWindowStart == null
      ? autoWindowStart
      : Math.min(manualWindowStart, Math.max(0, totalMeasures - MEASURES_VISIBLE));
  const visibleMeasures = measures.slice(windowStart, windowStart + MEASURES_VISIBLE);

  const shiftWindow = (delta: number) => {
    if (!totalMeasures) return;
    setIsFollowing(false);
    setManualWindowStart((prev) => {
      const base = prev ?? windowStart;
      const next = Math.min(
        Math.max(0, base + delta),
        Math.max(0, totalMeasures - MEASURES_VISIBLE),
      );
      return next;
    });
  };

  const handleBeatSelect = (beatTime: number, measureIndex: number) => {
    onBeatSelect?.(beatTime);
    const clampedMeasure = Math.min(
      Math.max(0, measureIndex),
      Math.max(0, totalMeasures - MEASURES_VISIBLE),
    );
    setManualWindowStart(clampedMeasure);
    setIsFollowing(false);
    setPendingFollowTime(beatTime);
  };

  const handleFollow = () => {
    setIsFollowing(true);
    setManualWindowStart(null);
    setPendingFollowTime(null);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-white">{title}</p>
          <p className="text-xs text-white/60">Tap beats to cue playback or explore the harmony.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-white/60">
            Tempo: {Math.round(effectiveBpm)} BPM • Bars {windowStart + 1}-
            {Math.min(totalMeasures, windowStart + MEASURES_VISIBLE)}
          </div>
          {totalMeasures > MEASURES_VISIBLE && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftWindow(-MEASURES_VISIBLE)}
                className="px-2 py-1 rounded-lg border border-white/15 text-white/70 text-xs hover:bg-white/10"
              >
                ▲ Bars
              </button>
              <button
                type="button"
                onClick={() => shiftWindow(MEASURES_VISIBLE)}
                className="px-2 py-1 rounded-lg border border-white/15 text-white/70 text-xs hover:bg-white/10"
              >
                ▼ Bars
              </button>
              <button
                type="button"
                onClick={handleFollow}
                className={`px-2 py-1 rounded-lg border text-xs ${
                  isFollowing
                    ? 'border-emerald-400/40 text-emerald-200 bg-emerald-500/20'
                    : 'border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/20'
                }`}
              >
                Follow
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {visibleMeasures.map((measure, idx) => {
          const absoluteIdx = windowStart + idx;
          const isActiveMeasure = absoluteIdx === activeMeasureIndex;
          const barStart = measure[0]?.start ?? absoluteIdx * beatsPerBar * secondsPerBeat;
          const barEnd = barStart + beatsPerBar * secondsPerBeat;
          const normalizedTime = currentTime ?? 0;
          const barProgress =
            currentTime != null
              ? Math.min(Math.max((normalizedTime - barStart) / (barEnd - barStart), 0), 1)
              : 0;
          const timeInBar =
            isActiveMeasure && currentTime != null && currentTime >= barStart && currentTime < barEnd;
          const uniqueChords = measure
            .map((beat) => beat.chord)
            .filter((chord, chordIdx, arr) => chord && chord !== arr[chordIdx - 1]) as string[];
          const barLabel = uniqueChords.length ? uniqueChords.join(' → ') : '—';
          const targetMeasureStart = Math.min(
            Math.max(absoluteIdx - 1, 0),
            Math.max(0, totalMeasures - MEASURES_VISIBLE),
          );

          return (
        <div key={`measure-${absoluteIdx}`} className="space-y-2">
              <button
                  type="button"
                  onClick={() => handleBeatSelect(barStart, targetMeasureStart)}
                  className={`relative w-full rounded-2xl border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40 hover:border-white/60 ${
                    isActiveMeasure ? 'border-emerald-400/60 bg-white/5' : 'border-white/15 bg-white/5'
                  }`}
                >
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div
                      className="h-full bg-emerald-500/20 transition-[width] ease-linear"
                      style={{ width: `${barProgress * 100}%` }}
                    />
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between text-xs text-white/60 font-mono mb-1">
                      <span>
                        {new Date(barStart * 1000).toISOString().substring(14, 19)} • {beatsPerBar} beats
                      </span>
                      <span>{timeInBar ? 'Now' : 'Jump'}</span>
                    </div>
                    <p className="text-base font-semibold text-white truncate">{barLabel}</p>
                  </div>
                </button>
                <div className="grid grid-cols-4 gap-1">
                  {measure.map((beat, beatIdx) => {
                    const beatStart = beat.start;
                    const beatEnd = beatStart + secondsPerBeat;
                    const isActiveBeat =
                      currentTime != null && currentTime >= beatStart && currentTime < beatEnd;
                    return (
                      <button
                        key={`bar-${absoluteIdx}-beat-${beatIdx}`}
                        type="button"
                        onClick={() => handleBeatSelect(beat.start, targetMeasureStart)}
                        className={`text-[10px] font-mono px-1.5 py-1 rounded-xl border transition ${
                          isActiveBeat
                            ? 'border-emerald-300 text-emerald-100 bg-emerald-500/20'
                            : 'border-white/15 text-white/60 hover:border-white/40'
                        }`}
                        title={`Beat ${beatIdx + 1}`}
                      >
                        {beat.chord || '—'}
                      </button>
                    );
                  })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};
