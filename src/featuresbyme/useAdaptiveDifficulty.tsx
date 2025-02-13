
import { useMemo } from 'react';
import { Stats } from '../types';

// A simple hook that returns a difficulty level (e.g., 1-5) based on current stats
export function useAdaptiveDifficulty(stats: Stats): number {
  return useMemo(() => {
    // Example logic: higher accuracy and streak → higher difficulty.
    if (stats.questions === 0) return 1;
    if (stats.accuracy >= 95 && stats.streak >= 10) return 5;
    if (stats.accuracy >= 90 && stats.streak >= 8) return 4;
    if (stats.accuracy >= 80 && stats.streak >= 5) return 3;
    if (stats.accuracy >= 70) return 2;
    return 1;
  }, [stats]);
}
// Adaptive Difficulty Adjustment – A hook that computes a recommended difficulty based on user performance.
//basically skill based matchmaking