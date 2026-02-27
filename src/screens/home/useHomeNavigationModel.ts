import { useRouter } from 'expo-router';
import type { DailyModeResolution } from '../../review/daily-mode-resolver';
import { useHomeSessionController } from './useHomeSessionController';

type UseHomeNavigationModelParams = {
  currentDay: number;
  dailyModeResolution: DailyModeResolution | null;
  startOver: () => Promise<void>;
};

export function useHomeNavigationModel({
  currentDay,
  dailyModeResolution,
  startOver,
}: UseHomeNavigationModelParams) {
  const router = useRouter();
  const sessionController = useHomeSessionController({
    router,
    currentDay,
    dailyModeResolution,
    startOver,
  });

  return {
    sessionController,
    goToOnboarding: () => {
      router.push('/onboarding');
    },
    goToStats: () => {
      router.push('/stats');
    },
  };
}

