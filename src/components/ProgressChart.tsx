// Progress chart component for displaying practice history
import { motion } from 'framer-motion';
import type { LessonProgress } from '@/types/learning';

interface ProgressChartProps {
  data: LessonProgress[];
  mode?: 'accuracy' | 'timing' | 'pitch';
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  mode = 'accuracy',
}) => {
  if (data.length === 0) {
    return (
      <div className="w-full bg-gray-800/50 rounded-lg p-6 text-center text-gray-400">
        No practice data yet. Start practicing to see your progress!
      </div>
    );
  }

  // Sort by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const maxValue = Math.max(
    ...sortedData.map(d => 
      mode === 'accuracy' ? d.accuracy :
      mode === 'timing' ? d.timingDeviation :
      d.avgPitchError
    )
  );

  const getValue = (d: LessonProgress): number => {
    return mode === 'accuracy' ? d.accuracy :
           mode === 'timing' ? d.timingDeviation :
           d.avgPitchError;
  };

  const formatValue = (value: number): string => {
    if (mode === 'accuracy') {
      return `${Math.round(value * 100)}%`;
    }
    if (mode === 'timing') {
      return `${Math.round(value)}ms`;
    }
    return `${Math.round(value)}c`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 rounded-lg p-4"
    >
      <div className="text-sm text-gray-400 mb-4 flex items-center justify-between">
        <span>Practice Progress</span>
        <div className="flex gap-2">
          {(['accuracy', 'timing', 'pitch'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {/* Update mode */}}
              className={`text-xs px-2 py-1 rounded ${
                mode === m
                  ? 'bg-teal text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {m === 'accuracy' ? 'Accuracy' : m === 'timing' ? 'Timing' : 'Pitch'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-2">
        {sortedData.slice(-10).map((entry, index) => {
          const value = getValue(entry);
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{formatDate(entry.date)}</span>
                <span className="text-gray-300 font-semibold">{formatValue(value)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    mode === 'accuracy'
                      ? value >= 0.9 ? 'bg-green-500' : value >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                      : mode === 'timing'
                      ? value < 50 ? 'bg-green-500' : value < 100 ? 'bg-yellow-500' : 'bg-red-500'
                      : value < 20 ? 'bg-green-500' : value < 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {sortedData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between text-xs text-gray-400">
          <span>Total Sessions: {sortedData.length}</span>
          <span>
            Avg {mode === 'accuracy' ? 'Accuracy' : mode === 'timing' ? 'Timing' : 'Pitch'}:{' '}
            {formatValue(
              sortedData.reduce((sum, d) => sum + getValue(d), 0) / sortedData.length
            )}
          </span>
        </div>
      )}
    </motion.div>
  );
};

