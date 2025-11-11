import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import * as Tone from 'tone';

interface TraditionalMetronomeProps {
  initialBpm?: number;
  onBpmChange?: (bpm: number) => void;
}

// Traditional metronome BPM values (matching real metronomes)
const LEFT_BPM_VALUES = [40, 56, 64, 104, 120, 136, 152, 168, 184, 200];
const RIGHT_BPM_VALUES = [48, 64, 96, 112, 128, 144, 160, 176, 192, 208];

// Combine and sort all BPM values for slider mapping
const ALL_BPM_VALUES = [...new Set([...LEFT_BPM_VALUES, ...RIGHT_BPM_VALUES])].sort((a, b) => a - b);

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
  
  const loopRef = useRef<Tone.Loop | null>(null);
  const volumeRef = useRef(volume);
  const pendulumAnimationRef = useRef<number | null>(null);
  const weightContainerRef = useRef<HTMLDivElement>(null);
  const pendulumRef = useRef<HTMLDivElement>(null);
  
  // Motion values for dragging weight
  const weightY = useMotionValue(bpmToSliderPosition(initialBpm));
  const springWeightY = useSpring(weightY, { stiffness: 300, damping: 30 });
  const weightYTransform = useTransform(springWeightY, (v) => v * 400); // Height of scale area
  
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

  // Update BPM when weight position changes
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

  // Animate pendulum swing
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
    const maxAngle = 25; // Maximum pendulum angle in degrees

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

  // Handle weight dragging
  const handleWeightDrag = (clientY: number) => {
    if (!weightContainerRef.current) return;
    const rect = weightContainerRef.current.getBoundingClientRect();
    const relativeY = (clientY - rect.top) / rect.height;
    const clampedY = Math.max(0, Math.min(1, relativeY));
    weightY.set(clampedY);
  };

  const handleWeightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    e.stopPropagation();
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

  // Handle pendulum drag to start/stop
  const handlePendulumClick = () => {
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
      <div className="relative w-full max-w-2xl">
        {/* Main Metronome Panel - Amber Brown */}
        <div className="relative bg-gradient-to-b from-amber-700 via-amber-600 to-amber-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Wood texture overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 6px),
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)
              `,
            }}
          />
          
          {/* Top BPM Display - Darker Brown */}
          <div className="relative z-10 bg-gradient-to-b from-amber-900 to-amber-950 px-6 py-4 border-b-2 border-amber-950">
            <div className="text-center">
              <div className="text-6xl sm:text-7xl font-bold text-white tracking-wider">
                {currentBpm}
              </div>
              <div className="text-sm text-amber-200 mt-1 uppercase tracking-wider">BPM</div>
            </div>
          </div>

          {/* Main Body - Scales and Pendulum */}
          <div className="relative z-10 px-6 py-8">
            <div className="relative flex items-start justify-center gap-6 h-[400px]">
              {/* Left BPM Scale */}
              <div className="relative w-14 h-full bg-gradient-to-b from-gray-800 to-gray-900 rounded border border-gray-700 shadow-inner">
                {LEFT_BPM_VALUES.map((value, index) => {
                  const position = index / (LEFT_BPM_VALUES.length - 1);
                  const isActive = Math.abs(value - currentBpm) < 3;
                  return (
                    <div
                      key={`left-${value}`}
                      className="absolute left-0 right-0 flex items-center"
                      style={{ top: `${position * 100}%`, transform: 'translateY(-50%)' }}
                    >
                      <div className={`text-xs font-bold px-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                        {value}
                      </div>
                      <div className={`flex-1 h-px ml-1 ${isActive ? 'bg-white' : 'bg-gray-600'}`} />
                    </div>
                  );
                })}
              </div>

              {/* Center - Pendulum Area */}
              <div className="relative flex-1 flex flex-col items-center h-full">
                {/* Pendulum Bar - Light Gray, Vertical */}
                <motion.div
                  ref={pendulumRef}
                  onClick={handlePendulumClick}
                  animate={{
                    rotate: isPlaying ? pendulumAngle : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 15,
                  }}
                  className="relative z-20 cursor-pointer"
                  style={{
                    transformOrigin: 'top center',
                  }}
                >
                  {/* Pendulum rod */}
                  <div className="w-3 h-64 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400 rounded-full shadow-lg">
                    {/* Top pivot point */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-500 rounded-full border-2 border-gray-600 shadow-md" />
                    {/* Bottom weight indicator */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-500 rounded-full border border-gray-600" />
                  </div>
                </motion.div>

                {/* Weight Slider Area - Right Side */}
                <div
                  ref={weightContainerRef}
                  className="absolute right-0 top-0 bottom-0 w-20 cursor-grab active:cursor-grabbing"
                  onMouseDown={handleWeightMouseDown}
                  onTouchStart={handleWeightTouchStart}
                  onTouchMove={handleWeightTouchMove}
                  onTouchEnd={handleWeightTouchEnd}
                >
                  <motion.div
                    style={{
                      y: weightYTransform,
                    }}
                    className="absolute left-0 right-0 flex items-center justify-center"
                  >
                    {/* Weight Block - Dark Gray Rectangle */}
                    <div className="relative">
                      {/* Connection line to pendulum */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-12 h-px bg-white/40" />
                      
                      {/* Weight block */}
                      <div className="w-14 h-20 bg-gradient-to-b from-gray-600 to-gray-800 rounded-md shadow-xl border-2 border-gray-500">
                        {/* Notch on weight */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-500 rounded-full" />
                      </div>
                      
                      {/* Pointer line extending down */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-6 bg-gray-300" />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Right BPM Scale */}
              <div className="relative w-14 h-full bg-gradient-to-b from-gray-800 to-gray-900 rounded border border-gray-700 shadow-inner">
                {RIGHT_BPM_VALUES.map((value, index) => {
                  const position = index / (RIGHT_BPM_VALUES.length - 1);
                  const isActive = Math.abs(value - currentBpm) < 3;
                  return (
                    <div
                      key={`right-${value}`}
                      className="absolute left-0 right-0 flex items-center justify-end"
                      style={{ top: `${position * 100}%`, transform: 'translateY(-50%)' }}
                    >
                      <div className={`flex-1 h-px mr-1 ${isActive ? 'bg-white' : 'bg-gray-600'}`} />
                      <div className={`text-xs font-bold px-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="relative z-10 bg-gradient-to-b from-amber-800 to-amber-900 px-6 py-4 border-t-2 border-amber-950">
            <div className="flex items-center justify-between gap-4">
              {/* Play/Pause Button - Orange Circle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isPlaying) {
                    Tone.start();
                  }
                  setIsPlaying(!isPlaying);
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-700 shadow-lg flex items-center justify-center text-white text-xl hover:from-orange-600 hover:to-orange-700 transition-colors flex-shrink-0"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                )}
              </motion.button>

              {/* Volume Control */}
              <div className="flex-1 flex items-center gap-3">
                {/* Speaker Icon */}
                <div className="text-white text-xl flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4.01-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
                  </svg>
                </div>
                
                {/* Volume Slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  style={{
                    background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${volume * 100}%, rgb(55 65 81) ${volume * 100}%, rgb(55 65 81) 100%)`
                  }}
                />
                
                {/* Volume Percentage */}
                <div className="text-sm text-white font-semibold w-12 text-right flex-shrink-0">
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
