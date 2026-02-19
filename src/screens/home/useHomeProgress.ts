import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { clearSessionDraft, loadSessionDraft, type SessionDraft } from '../../data/session-draft-store';
import { loadUserProgress, type UserProgress } from '../../data/progress-store';

type UseHomeProgressParams = {
  totalDays: number;
};

export function useHomeProgress({ totalDays }: UseHomeProgressParams) {
  const [progress, setProgress] = useState<UserProgress>({
    currentDay: 1,
    streak: 0,
    sessionsCompleted: [],
    totalMinutes: 0,
  });
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        const [nextProgress, draft] = await Promise.all([loadUserProgress(), loadSessionDraft()]);
        if (!active) {
          return;
        }
        setProgress(nextProgress);
        setSessionDraft(draft);
      };

      void load();

      return () => {
        active = false;
      };
    }, []),
  );

  const currentDay = Math.min(progress.currentDay, totalDays || 1);
  const hasResumeForCurrentDay = !!sessionDraft && sessionDraft.dayNumber === currentDay;

  const startOver = useCallback(async () => {
    await clearSessionDraft();
    setSessionDraft(null);
  }, []);

  return {
    progress,
    sessionDraft,
    currentDay,
    hasResumeForCurrentDay,
    startOver,
  };
}
