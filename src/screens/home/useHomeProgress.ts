import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAppProgressStore } from '../../state/app-progress-store';

type UseHomeProgressParams = {
  totalDays: number;
};

export function useHomeProgress({ totalDays }: UseHomeProgressParams) {
  const progress = useAppProgressStore((s) => s.progress);
  const sessionDraft = useAppProgressStore((s) => s.sessionDraft);
  const hydrate = useAppProgressStore((s) => s.hydrate);
  const clearSessionDraftAndSync = useAppProgressStore((s) => s.clearSessionDraftAndSync);

  useFocusEffect(
    useCallback(() => {
      void hydrate();
    }, [hydrate]),
  );

  const currentDay = Math.min(progress.currentDay, totalDays || 1);
  const hasResumeForCurrentDay = !!sessionDraft && sessionDraft.dayNumber === currentDay;

  const startOver = useCallback(async () => {
    await clearSessionDraftAndSync();
  }, [clearSessionDraftAndSync]);

  return {
    progress,
    sessionDraft,
    currentDay,
    hasResumeForCurrentDay,
    startOver,
  };
}
