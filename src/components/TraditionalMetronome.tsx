import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import * as Tone from 'tone';

interface TraditionalMetronomeProps {
  initialBpm?: number;
  onBpmChange?: (bpm: number) => void;
}

// Traditional metronome BPM values (matching real metronomes)
const METRONOME_BPM_VALUES = [
  // Left side (from top to bottom)
  { side: 'left', values: [40, 56, 64, 104, 120, 136, 152, 168, 184, 200] },
  // Right side (from top to bottom)
  { side: 'right', values: [48, 64, 96, 112, 128, 144, 160, 176, 192, 208] },
];

// Combine and sort all BPM values for slider mapping
const ALL_BPM_VALUES = [...new Set([
  ...METRONOME_BPM_VALUES[0].values,
  ...METRONOME_BPM_VALUES[1].values,
])].sort((a, b) => a - b);

const MIN_BPM = 40;
const MAX_BPM = 208;

function findClosestBpm(targetBpm: number): number {
  return ALL_BPM_VALUES.reduce((prev, curr) =>
    Math.abs(curr - targetBpm) < Math.abs(prev - targetBpm) ? curr : prev
  );
}

function bpmToSliderPosition(bpm: number): number {
  // Map BPM to slider position (0 = top, 1 = bottom)
  // Higher BPM = lower position (weight down)
  const normalized = (bpm - MIN_BPM) / (MAX_BPM - MIN_BPM);
  return 1 - normalized; // Invert so higher BPM is lower on slider
}

function sliderPositionToBpm(position: number): number {
  // Map slider position to BPM
  const normalized = 1 - position; // Invert back
  const bpm = MIN_BPM + normalized * (MAX_BPM - MIN_BPM);
  return findClosestBpm(bpm);
}

export const TraditionalMetronome: React.FC<TraditionalMetronomeProps> = ({
  initialBpm = 120,
  onBpmChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(initialBpm);
  const [volume, setVolume] = useState(0.7);
  const [pendulumAngle, setPendulumAngle] = useState(0);
  const [isDraggingWeight, setIsDraggingWeight] = useState(false);
  const [isDraggingPendulum, setIsDraggingPendulum] = useState(false);
  
  const loopRef = useRef<Tone.Loop | null>(null);
  const volumeRef = useRef(volume);
  const pendulumAnimationRef = useRef<number | null>(null);
  
  // Motion values for dragging
  const weightY = useMotionValue(bpmToSliderPosition(initialBpm));
  const springWeightY = useSpring(weightY, { stiffness: 300, damping: 30 });
  const weightYTransform = useTransform(springWeightY, (v) => v * 384); // 384px = h-96
  
  // Update weight position when BPM changes externally
  useEffect(() => {
    const targetPosition = bpmToSliderPosition(bpm);
    if (Math.abs(weightY.get() - targetPosition) > 0.01) {
      weightY.set(targetPosition);
    }
  }, [bpm, weightY]);
  
  // Update refs
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Update BPM when weight position changes (debounced)
  useEffect(() => {
    const unsubscribe = springWeightY.on('change', (latest) => {
      const newBpm = sliderPositionToBpm(latest);
      if (Math.abs(newBpm - bpm) > 1) {
        setBpm(newBpm);
      }
    });
    return unsubscribe;
  }, [springWeightY, bpm]);

  // Update Tone.js BPM
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    onBpmChange?.(bpm);
  }, [bpm, onBpmChange]);

  // Metronome tick sound
  const playTick = (time: number) => {
    const osc = new Tone.Oscillator({
      frequency: 1000,
      type: 'sine',
    });
    
    const gain = new Tone.Gain(volumeRef.current);
    const envelope = new Tone.Envelope({
      attack: 0.001,
      decay: 0.1,
      sustain: 0,
      release: 0.05,
    }).connect(gain.gain);
    
    osc.connect(gain);
    gain.toDestination();
    
    osc.start(time);
    envelope.triggerAttackRelease(volumeRef.current, 0.05, time);
    osc.stop(time + 0.15);
    
    setTimeout(() => {
      osc.dispose();
      envelope.dispose();
      gain.dispose();
    }, 200);
  };

  // Animate pendulum
  useEffect(() => {
    if (!isPlaying) {
      if (pendulumAnimationRef.current) {
        cancelAnimationFrame(pendulumAnimationRef.current);
        pendulumAnimationRef.current = null;
      }
      setPendulumAngle(0);
      return;
    }

    const period = 60 / bpm; // Time for one beat in seconds
    const startTime = performance.now();
    const maxAngle = 30; // Maximum pendulum angle in degrees

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const phase = (elapsed % period) / period;
      // Sine wave for smooth pendulum motion
      const angle = Math.sin(phase * Math.PI * 2) * maxAngle;
      setPendulumAngle(angle);
      pendulumAnimationRef.current = requestAnimationFrame(animate);
    };

    pendulumAnimationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, bpm]);

  // Metronome loop
  useEffect(() => {
    if (!isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (loopRef.current) {
        loopRef.current.dispose();
        loopRef.current = null;
      }
      return;
    }

    Tone.Transport.start();
    loopRef.current = new Tone.Loop((time) => {
      playTick(time);
    }, '4n').start(0);

    return () => {
      if (loopRef.current) {
        loopRef.current.dispose();
        loopRef.current = null;
      }
    };
  }, [isPlaying]);

  const weightContainerRef = useRef<HTMLDivElement>(null);

  const handleWeightDrag = (clientY: number) => {
    if (!weightContainerRef.current) return;
    const rect = weightContainerRef.current.getBoundingClientRect();
    const relativeY = (clientY - rect.top) / rect.height;
    const clampedY = Math.max(0, Math.min(1, relativeY));
    weightY.set(clampedY);
  };

  const handleWeightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingWeight(true);
    handleWeightDrag(e.clientY);
    
    const handleMouseMove = (e: MouseEvent) => {
      handleWeightDrag(e.clientY);
    };
    
    const handleMouseUp = () => {
      setIsDraggingWeight(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleWeightTouchStart = (e: React.TouchEvent) => {
    setIsDraggingWeight(true);
    handleWeightDrag(e.touches[0].clientY);
  };

  const handleWeightTouchMove = (e: React.TouchEvent) => {
    if (isDraggingWeight) {
      handleWeightDrag(e.touches[0].clientY);
    }
  };

  const handleWeightTouchEnd = () => {
    setIsDraggingWeight(false);
  };

  const handlePendulumDragEnd = () => {
    if (!isDraggingPendulum) return;
    setIsDraggingPendulum(false);
    if (!isPlaying) {
      Tone.start();
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const currentBpm = Math.round(bpm);

  return (
    <div className="w-full flex items-center justify-center py-6">
      <div className="relative w-full max-w-md">
        {/* Wooden Metronome Frame */}
        <div className="relative bg-gradient-to-b from-amber-800 via-amber-700 to-amber-800 rounded-lg shadow-2xl p-6 sm:p-8">
          {/* Wood texture overlay */}
          <div 
            className="absolute inset-0 rounded-lg opacity-20"
            style={{
              backgroundImage: `
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
                repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.05) 1px, rgba(0,0,0,0.05) 2px)
              `,
            }}
          />
          
          {/* Top Panel with BPM Display */}
          <div className="relative z-10 bg-amber-900/80 rounded-lg p-4 mb-4 border-2 border-amber-950 shadow-inner">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-bold text-white tracking-wider">
                {Math.round(currentBpm)}
              </div>
              <div className="text-xs text-amber-200 mt-1">BPM</div>
            </div>
          </div>

          {/* Main Metronome Body */}
          <div className="relative z-10 flex items-start justify-center gap-8 mb-4">
            {/* Left BPM Scale */}
            <div className="relative w-12 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-sm border-2 border-gray-700 shadow-inner">
              {METRONOME_BPM_VALUES[0].values.map((value, index) => {
                const position = index / (METRONOME_BPM_VALUES[0].values.length - 1);
                const isActive = Math.abs(value - currentBpm) < 2;
                return (
                  <div
                    key={`left-${value}`}
                    className="absolute left-0 right-0 flex items-center"
                    style={{ top: `${position * 100}%`, transform: 'translateY(-50%)' }}
                  >
                    <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {value}
                    </div>
                    <div className={`flex-1 h-0.5 ml-2 ${isActive ? 'bg-white' : 'bg-gray-600'}`} />
                  </div>
                );
              })}
            </div>

            {/* Center - Pendulum Area */}
            <div className="relative flex-1 flex flex-col items-center">
              {/* Pendulum Bar */}
              <motion.div
                drag="y"
                dragConstraints={{ top: -50, bottom: 50 }}
                dragElastic={0.2}
                onDragStart={() => setIsDraggingPendulum(true)}
                onDragEnd={handlePendulumDragEnd}
                animate={{
                  rotate: isPlaying ? pendulumAngle : 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 10,
                }}
                className="relative z-20 cursor-grab active:cursor-grabbing"
                style={{
                  transformOrigin: 'top center',
                }}
              >
                <div className="w-2 h-32 bg-gradient-to-b from-gray-300 to-gray-500 rounded-full shadow-lg border border-gray-400" />
                {/* Pendulum weight */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-400 shadow-lg" />
              </motion.div>

              {/* Weight Slider */}
              <div
                ref={weightContainerRef}
                className="absolute right-0 top-0 bottom-0 w-16 cursor-grab active:cursor-grabbing"
                onMouseDown={handleWeightMouseDown}
                onTouchStart={handleWeightTouchStart}
                onTouchMove={handleWeightTouchMove}
                onTouchEnd={handleWeightTouchEnd}
              >
                <motion.div
                  style={{
                    y: weightYTransform,
                  }}
                  className="absolute left-0 right-0 w-full"
                >
                  {/* Weight */}
                  <div className="relative mx-auto w-12">
                    <div className="w-12 h-16 bg-gradient-to-b from-gray-400 to-gray-600 rounded-lg shadow-xl border-2 border-gray-500">
                      {/* Weight notch */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-500 rounded-full" />
                    </div>
                    {/* Pointer line */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-300" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right BPM Scale */}
            <div className="relative w-12 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-sm border-2 border-gray-700 shadow-inner">
              {METRONOME_BPM_VALUES[1].values.map((value, index) => {
                const position = index / (METRONOME_BPM_VALUES[1].values.length - 1);
                const isActive = Math.abs(value - currentBpm) < 2;
                return (
                  <div
                    key={`right-${value}`}
                    className="absolute left-0 right-0 flex items-center justify-end"
                    style={{ top: `${position * 100}%`, transform: 'translateY(-50%)' }}
                  >
                    <div className={`flex-1 h-0.5 mr-2 ${isActive ? 'bg-white' : 'bg-gray-600'}`} />
                    <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Base */}
          <div className="relative z-10 bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg p-4 border-2 border-amber-950 shadow-inner">
            <div className="flex items-center justify-between gap-4">
              {/* Play/Pause Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isPlaying) {
                    Tone.start();
                  }
                  setIsPlaying(!isPlaying);
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 border-2 border-orange-800 shadow-lg flex items-center justify-center text-white text-xl hover:from-orange-600 hover:to-orange-800 transition-colors"
              >
                {isPlaying ? '⏸' : '▶'}
              </motion.button>

              {/* Volume Control */}
              <div className="flex-1 flex items-center gap-3">
                <div className="text-white text-xl">🔊</div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="text-xs text-white/80 w-10 text-right">
                  {Math.round(volume * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

