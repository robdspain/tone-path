// Feedback HUD component for real-time practice feedback
import { motion } from 'framer-motion';
import type { PerformanceMetrics } from '@/types/learning';
import { getAccuracyColor, formatTimingDeviation, formatPitchError } from '@/lib/learning/metrics';

interface FeedbackHUDProps {
  metrics: PerformanceMetrics | null;
  isVisible?: boolean;
}

export const FeedbackHUD: React.FC<FeedbackHUDProps> = ({
  metrics,
  isVisible = true,
}) => {
  if (!metrics || !isVisible) return null;

  const accuracyColor = getAccuracyColor(metrics.accuracy);
  const accuracyPercent = Math.round(metrics.accuracy * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-xl z-50 min-w-[280px]"
    >
      <div className="text-xs text-gray-400 mb-2 font-semibold">Practice Feedback</div>
      
      <div className="space-y-2">
        {/* Accuracy */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">🎯 Accuracy</span>
          <span className={`text-lg font-bold ${accuracyColor}`}>
            {accuracyPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${
              accuracyPercent >= 90 ? 'bg-green-500' :
              accuracyPercent >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${accuracyPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Timing */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">⏱️ Timing</span>
          <span className={`text-sm font-semibold ${
            metrics.timingDeviation < 50 ? 'text-green-400' :
            metrics.timingDeviation < 100 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {formatTimingDeviation(metrics.timingDeviation)}
          </span>
        </div>

        {/* Pitch */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">🎵 Intonation</span>
          <span className={`text-sm font-semibold ${
            metrics.pitchError < 20 ? 'text-green-400' :
            metrics.pitchError < 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {formatPitchError(metrics.pitchError)}
          </span>
        </div>

        {/* Stats */}
        <div className="pt-2 border-t border-gray-700 flex justify-between text-xs text-gray-400">
          <span>{metrics.correctNotes}/{metrics.totalNotes} notes</span>
          <span>
            {metrics.totalNotes > 0 
              ? Math.round((metrics.correctNotes / metrics.totalNotes) * 100)
              : 0}% correct
          </span>
        </div>
      </div>
    </motion.div>
  );
};

