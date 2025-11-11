import { useState } from 'react';
import { motion } from 'framer-motion';

interface CircleOfFifthsProps {
  onKeySelect?: (key: string) => void;
}

// Circle of Fifths arranged clockwise starting from C at top
const CIRCLE_OF_FIFTHS = [
  { key: 'C', sharps: 0, flats: 0, startAngle: -90 },
  { key: 'G', sharps: 1, flats: 0, startAngle: -90 + 30 },
  { key: 'D', sharps: 2, flats: 0, startAngle: -90 + 60 },
  { key: 'A', sharps: 3, flats: 0, startAngle: -90 + 90 },
  { key: 'E', sharps: 4, flats: 0, startAngle: -90 + 120 },
  { key: 'B', sharps: 5, flats: 0, startAngle: -90 + 150 },
  { key: 'F#', sharps: 6, flats: 0, startAngle: -90 + 180 },
  { key: 'C#', sharps: 7, flats: 0, startAngle: -90 + 210 },
  { key: 'F', sharps: 0, flats: 1, startAngle: -90 - 30 },
  { key: 'Bb', sharps: 0, flats: 2, startAngle: -90 - 60 },
  { key: 'Eb', sharps: 0, flats: 3, startAngle: -90 - 90 },
  { key: 'Ab', sharps: 0, flats: 4, startAngle: -90 - 120 },
  { key: 'Db', sharps: 0, flats: 5, startAngle: -90 - 150 },
  { key: 'Gb', sharps: 0, flats: 6, startAngle: -90 - 180 },
  { key: 'Cb', sharps: 0, flats: 7, startAngle: -90 - 210 },
];

const RELATIVE_MINORS: Record<string, string> = {
  'C': 'Am', 'G': 'Em', 'D': 'Bm', 'A': 'F#m', 'E': 'C#m', 'B': 'G#m',
  'F#': 'D#m', 'C#': 'A#m', 'F': 'Dm', 'Bb': 'Gm', 'Eb': 'Cm', 'Ab': 'Fm',
  'Db': 'Bbm', 'Gb': 'Ebm', 'Cb': 'Abm'
};

const KEY_SIGNATURES: Record<string, string> = {
  'C': '', 'G': 'F#', 'D': 'F#, C#', 'A': 'F#, C#, G#', 'E': 'F#, C#, G#, D#',
  'B': 'F#, C#, G#, D#, A#', 'F#': 'F#, C#, G#, D#, A#, E#', 'C#': 'F#, C#, G#, D#, A#, E#, B#',
  'F': 'Bb', 'Bb': 'Bb, Eb', 'Eb': 'Bb, Eb, Ab', 'Ab': 'Bb, Eb, Ab, Db',
  'Db': 'Bb, Eb, Ab, Db, Gb', 'Gb': 'Bb, Eb, Ab, Db, Gb, Cb', 'Cb': 'Bb, Eb, Ab, Db, Gb, Cb, Fb'
};

export const CircleOfFifths: React.FC<CircleOfFifthsProps> = ({ onKeySelect }) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const handleKeyClick = (key: string) => {
    setSelectedKey(key === selectedKey ? null : key);
    onKeySelect?.(key);
  };

  const currentKey = selectedKey || hoveredKey;
  const relativeMinor = currentKey ? RELATIVE_MINORS[currentKey] : null;
  const keySignature = currentKey ? KEY_SIGNATURES[currentKey] : null;

  return (
    <div className="w-full flex flex-col items-center gap-6 py-6">
      <div className="relative w-full max-w-2xl aspect-square">
        {/* Outer Circle Background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 border-2 border-white/10" />
        
        {/* Inner Circle Background */}
        <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-white/10" />
        
        {/* Center Info Circle */}
        <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-slate-700/90 to-slate-800/90 border-2 border-white/20 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-white mb-2">Circle of Fifths</div>
            {currentKey && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-1"
              >
                <div className="text-xl font-semibold text-purple-300">{currentKey}</div>
                {relativeMinor && (
                  <div className="text-sm text-blue-300">Relative Minor: {relativeMinor}</div>
                )}
                {keySignature && (
                  <div className="text-xs text-gray-300 mt-2">
                    {keySignature ? `Key Signature: ${keySignature}` : 'No sharps or flats'}
                  </div>
                )}
              </motion.div>
            )}
            {!currentKey && (
              <div className="text-sm text-gray-400">Click a key to see details</div>
            )}
          </div>
        </div>

        {/* Key Buttons */}
        {CIRCLE_OF_FIFTHS.map((item, index) => {
          const isSelected = selectedKey === item.key;
          const isHovered = hoveredKey === item.key;
          const isSharpKey = item.sharps > 0;
          const isFlatKey = item.flats > 0;
          
          // Calculate position on circle using startAngle
          const radius = 35; // percentage from center
          const radian = (item.startAngle * Math.PI) / 180;
          const x = 50 + radius * Math.cos(radian);
          const y = 50 + radius * Math.sin(radian);

          return (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleKeyClick(item.key)}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 font-bold text-sm sm:text-base transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white border-white shadow-lg shadow-purple-500/50 scale-110 z-10'
                  : isHovered
                  ? 'bg-gradient-to-br from-purple-600/80 to-blue-600/80 text-white border-white/80 shadow-md scale-105 z-10'
                  : isSharpKey
                  ? 'bg-gradient-to-br from-emerald-600/60 to-emerald-700/60 text-white border-emerald-400/60 hover:border-emerald-300'
                  : isFlatKey
                  ? 'bg-gradient-to-br from-amber-600/60 to-amber-700/60 text-white border-amber-400/60 hover:border-amber-300'
                  : 'bg-gradient-to-br from-gray-600/60 to-gray-700/60 text-white border-gray-400/60 hover:border-gray-300'
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: 'clamp(3rem, 8vw, 4rem)',
                height: 'clamp(3rem, 8vw, 4rem)',
              }}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-lg sm:text-xl font-bold">{item.key}</div>
                {(item.sharps > 0 || item.flats > 0) && (
                  <div className="text-xs opacity-80">
                    {item.sharps > 0 ? `${item.sharps}♯` : `${item.flats}♭`}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}

        {/* Connecting Lines - connect keys in circle order */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          {CIRCLE_OF_FIFTHS.map((item, index) => {
            // Connect to next key in circle (clockwise)
            const nextIndex = (index + 1) % CIRCLE_OF_FIFTHS.length;
            const current = CIRCLE_OF_FIFTHS[index];
            const next = CIRCLE_OF_FIFTHS[nextIndex];
            
            const radius = 35;
            const radian1 = (current.startAngle * Math.PI) / 180;
            const radian2 = (next.startAngle * Math.PI) / 180;
            const x1 = 50 + radius * Math.cos(radian1);
            const y1 = 50 + radius * Math.sin(radian1);
            const x2 = 50 + radius * Math.cos(radian2);
            const y2 = 50 + radius * Math.sin(radian2);

            return (
              <line
                key={`line-${index}`}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-white/20"
              />
            );
          })}
        </svg>
      </div>

      {/* Key Information Panel */}
      {currentKey && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800/50 p-6"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Key: {currentKey}</h3>
              {selectedKey && (
                <button
                  onClick={() => setSelectedKey(null)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
            
            {relativeMinor && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Relative Minor:</span>
                <span className="text-lg font-semibold text-blue-300">{relativeMinor}</span>
              </div>
            )}
            
            {keySignature !== undefined && (
              <div className="pt-2 border-t border-white/10">
                <div className="text-sm text-gray-400 mb-1">Key Signature:</div>
                <div className="text-base text-white font-mono">
                  {keySignature || 'No sharps or flats'}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
