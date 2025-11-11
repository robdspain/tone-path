import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  audioData: Float32Array | null;
  frequencyData: Uint8Array | null;
  isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData,
  frequencyData,
  isActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      // Always draw, even if not active (shows empty state)
      // Dark background with fade effect
      ctx.fillStyle = 'rgba(10, 14, 26, 0.3)';
      ctx.fillRect(0, 0, width, height);

      if (frequencyData) {
        const barWidth = width / frequencyData.length;
        const centerY = height / 2;

        // Create gradient for frequency bars
        for (let i = 0; i < frequencyData.length; i++) {
          const barHeight = (frequencyData[i] / 255) * height * 0.5;
          const x = i * barWidth;

          // Color gradient from primary to accent
          const ratio = i / frequencyData.length;
          const gradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);

          // Primary blue to electric purple to cyan gradient
          if (ratio < 0.33) {
            gradient.addColorStop(0, 'rgba(0, 102, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 102, 255, 0.3)');
          } else if (ratio < 0.66) {
            gradient.addColorStop(0, 'rgba(143, 0, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(143, 0, 255, 0.3)');
          } else {
            gradient.addColorStop(0, 'rgba(0, 230, 230, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 230, 230, 0.3)');
          }

          ctx.fillStyle = gradient;
          ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);

          // Add glow effect for high frequencies
          if (frequencyData[i] > 200) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = ratio < 0.33 ? '#0066ff' : ratio < 0.66 ? '#8f00ff' : '#00e6e6';
            ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);
            ctx.shadowBlur = 0;
          }
        }
      }

      if (audioData) {
        // Waveform with gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#00e6e6');
        gradient.addColorStop(0.5, '#0066ff');
        gradient.addColorStop(1, '#8f00ff');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0066ff';
        ctx.beginPath();

        const sliceWidth = width / audioData.length;
        let x = 0;

        for (let i = 0; i < audioData.length; i++) {
          const v = audioData[i] * 0.5 + 0.5;
          const y = v * height;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioData, frequencyData, isActive]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: (isActive && (audioData || frequencyData)) ? 1 : 0.7,
        scale: (isActive && (audioData || frequencyData)) ? 1 : 0.98
      }}
      transition={{ duration: 0.3 }}
      className={`w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-dark-900/80 backdrop-blur-md border ${
        (isActive && (audioData || frequencyData)) ? 'border-primary-500/30 shadow-glow-primary' : 'border-white/5'
      } transition-all duration-300`}
    >
      <canvas
        ref={canvasRef}
        width={1200}
        height={256}
        className="w-full h-full"
      />
      {!isActive && !audioData && !frequencyData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Ready - Play a song or start listening</p>
        </div>
      )}
    </motion.div>
  );
};

