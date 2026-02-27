import { useEffect, useState } from 'react';
import type { UserProgress } from '../data/progress-store';
import { loadReviewPlan } from '../data/review-plan-loader';
import { resolveDailyMode, type DailyModeResolution } from './daily-mode-resolver';
import { useAppProgressStore } from '../state/app-progress-store';

type UseDailyModeParams = {
  progress?: UserProgress;
  date?: Date;
};

type UseDailyModeResult = {
  resolution: DailyModeResolution | null;
  isLoading: boolean;
};

export function useDailyMode(params?: UseDailyModeParams): UseDailyModeResult {
  const storeProgress = useAppProgressStore((s) => s.progress);
  const hydratedOnce = useAppProgressStore((s) => s.hydratedOnce);
  const hydrate = useAppProgressStore((s) => s.hydrate);
  const [resolution, setResolution] = useState<DailyModeResolution | null>(null);
  const [isLoading, setIsLoading] = useState(!params?.progress && !hydratedOnce);

  useEffect(() => {
    let active = true;
    const reviewPlan = loadReviewPlan();

    const apply = async () => {
      if (!params?.progress && !hydratedOnce) {
        await hydrate();
      }
      const progress = params?.progress ?? storeProgress;
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
  }, [hydrate, hydratedOnce, params?.date, params?.progress, storeProgress]);

  return { resolution, isLoading };
}
