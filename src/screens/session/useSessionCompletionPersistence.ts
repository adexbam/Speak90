import { useCallback, useEffect, useRef } from 'react';
import type { Day } from '../../data/day-model';

type UseSessionCompletionPersistenceParams = {
  enabled: boolean;
  persistCompletion: boolean;
  day?: Day;
  isComplete: boolean;
  progressSaved: boolean;
  totalDays: number;
  sessionElapsedSeconds: number;
  setProgressSaved: (value: boolean) => void;
  setPhase: (phase: 'completing' | 'completed') => void;
  completeSessionAndSync: (params: { completedDay: number; sessionSeconds: number; totalDays: number }) => Promise<unknown>;
  clearSessionDraftAndSync: () => Promise<void>;
};

export function useSessionCompletionPersistence({
  enabled,
  persistCompletion,
  day,
  isComplete,
  progressSaved,
  totalDays,
  sessionElapsedSeconds,
  setProgressSaved,
  setPhase,
  completeSessionAndSync,
  clearSessionDraftAndSync,
}: UseSessionCompletionPersistenceParams) {
  const completionSavePromiseRef = useRef<Promise<void> | null>(null);

  const persistCompletionNow = useCallback(async () => {
    if (!persistCompletion) {
      setProgressSaved(true);
      return;
    }

    if (!enabled || !isComplete || !day || progressSaved) {
      return;
    }

    if (!completionSavePromiseRef.current) {
      setPhase('completing');
      completionSavePromiseRef.current = (async () => {
        await completeSessionAndSync({
          completedDay: day.dayNumber,
          sessionSeconds: sessionElapsedSeconds,
          totalDays,
        });
        setProgressSaved(true);
      })().finally(() => {
        completionSavePromiseRef.current = null;
      });
    }

    await completionSavePromiseRef.current;
  }, [enabled, persistCompletion, isComplete, day, progressSaved, sessionElapsedSeconds, totalDays, completeSessionAndSync, setProgressSaved, setPhase]);

  useEffect(() => {
    if (!persistCompletion || !enabled || !isComplete || !day || progressSaved) {
      return;
    }

    void persistCompletionNow();
  }, [enabled, persistCompletion, isComplete, day, progressSaved, persistCompletionNow]);

  useEffect(() => {
    if (!persistCompletion) {
      setProgressSaved(true);
    }
  }, [persistCompletion, setProgressSaved]);

  useEffect(() => {
    if (!enabled || !isComplete) {
      return;
    }
    void clearSessionDraftAndSync();
  }, [enabled, isComplete, clearSessionDraftAndSync]);

  return {
    persistCompletionNow,
  };
}
