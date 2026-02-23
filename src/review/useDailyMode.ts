import { useEffect, useState } from 'react';
import { loadUserProgress, type UserProgress } from '../data/progress-store';
import { loadReviewPlan } from '../data/review-plan-loader';
import { resolveDailyMode, type DailyModeResolution } from './daily-mode-resolver';

type UseDailyModeParams = {
  progress?: UserProgress;
  date?: Date;
};

type UseDailyModeResult = {
  resolution: DailyModeResolution | null;
  isLoading: boolean;
};

export function useDailyMode(params?: UseDailyModeParams): UseDailyModeResult {
  const [resolution, setResolution] = useState<DailyModeResolution | null>(null);
  const [isLoading, setIsLoading] = useState(!params?.progress);

  useEffect(() => {
    let active = true;
    const reviewPlan = loadReviewPlan();

    const apply = async () => {
      const progress = params?.progress ?? (await loadUserProgress());
      if (!active) {
        return;
      }

      setResolution(
        resolveDailyMode({
          progress,
          date: params?.date,
          reviewPlan,
        }),
      );
      setIsLoading(false);
    };

    void apply();

    return () => {
      active = false;
    };
  }, [params?.date, params?.progress]);

  return { resolution, isLoading };
}
