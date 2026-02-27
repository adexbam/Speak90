import { useCallback, useEffect, useRef, useState } from 'react';
import type { Day, SessionSection } from '../../data/day-model';
import { useAppProgressStore } from '../../state/app-progress-store';

type UseSessionPersistenceParams = {
  enabled?: boolean;
  mode: 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone';
  day?: Day;
  section?: SessionSection;
  isComplete: boolean;
  totalDays: number;
  sectionIndex: number;
  sentenceIndex: number;
  repRound: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  restoreFromDraft: (draft: { sectionIndex: number; sentenceIndex: number; repRound?: number }) => void;
  hydrateTimerFromDraft: (remainingSeconds: number, sessionElapsedSeconds: number) => void;
};

export function useSessionPersistence({
  enabled = true,
  mode,
  day,
  section,
  isComplete,
  totalDays,
  sectionIndex,
  sentenceIndex,
  repRound,
  remainingSeconds,
  sessionElapsedSeconds,
  restoreFromDraft,
  hydrateTimerFromDraft,
}: UseSessionPersistenceParams) {
  const loadSessionDraftAndSync = useAppProgressStore((s) => s.loadSessionDraftAndSync);
  const saveSessionDraftAndSync = useAppProgressStore((s) => s.saveSessionDraftAndSync);
  const clearSessionDraftAndSync = useAppProgressStore((s) => s.clearSessionDraftAndSync);
  const completeSessionAndSync = useAppProgressStore((s) => s.completeSessionAndSync);
  const [progressSaved, setProgressSaved] = useState(false);
  const [hydratedDraft, setHydratedDraft] = useState(false);
  const completionSavePromiseRef = useRef<Promise<void> | null>(null);

  const persistDraftNow = useCallback(async () => {
    if (!enabled || !day || !section || !hydratedDraft || isComplete) {
      return;
    }

    const draft = {
      dayNumber: day.dayNumber,
      mode,
      sectionIndex,
      sentenceIndex,
      repRound,
      remainingSeconds,
      sessionElapsedSeconds,
      savedAt: new Date().toISOString(),
    };
    await saveSessionDraftAndSync(draft);
  }, [
    enabled,
    mode,
    day,
    section,
    hydratedDraft,
    isComplete,
    sectionIndex,
    sentenceIndex,
    repRound,
    remainingSeconds,
    sessionElapsedSeconds,
    saveSessionDraftAndSync,
  ]);

  useEffect(() => {
    if (!enabled) {
      setHydratedDraft(true);
      return;
    }
    if (!day || hydratedDraft) {
      return;
    }

    let active = true;
    const hydrateDraft = async () => {
      const draft = await loadSessionDraftAndSync();
      if (!active) {
        return;
      }

      const draftMode = draft?.mode ?? 'new_day';
      if (draft && draft.dayNumber === day.dayNumber && draftMode === mode) {
        restoreFromDraft({
          sectionIndex: draft.sectionIndex,
          sentenceIndex: draft.sentenceIndex,
          repRound: draft.repRound,
        });

        const safeSection = day.sections[Math.min(draft.sectionIndex, Math.max(0, day.sections.length - 1))];
        hydrateTimerFromDraft(Math.min(draft.remainingSeconds, safeSection.duration), draft.sessionElapsedSeconds);
      }

      setHydratedDraft(true);
    };

    void hydrateDraft();

    return () => {
      active = false;
    };
  }, [enabled, mode, day, hydratedDraft, restoreFromDraft, hydrateTimerFromDraft, loadSessionDraftAndSync]);

  useEffect(() => {
    if (!enabled || !day || !section || !hydratedDraft || isComplete) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode,
        sectionIndex,
        sentenceIndex,
        repRound,
        remainingSeconds,
        sessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [
    enabled,
    mode,
    day,
    section,
    hydratedDraft,
    isComplete,
    sectionIndex,
    sentenceIndex,
    repRound,
    Math.floor(remainingSeconds / 5),
    Math.floor(sessionElapsedSeconds / 5),
    saveSessionDraftAndSync,
  ]);

  const persistCompletionNow = useCallback(async () => {
    if (!enabled || !isComplete || !day || progressSaved) {
      return;
    }

    if (!completionSavePromiseRef.current) {
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
  }, [enabled, isComplete, day, progressSaved, sessionElapsedSeconds, totalDays, completeSessionAndSync]);

  useEffect(() => {
    if (!enabled || !isComplete || !day || progressSaved) {
      return;
    }

    void persistCompletionNow();
  }, [enabled, isComplete, day, progressSaved, persistCompletionNow]);

  useEffect(() => {
    if (!enabled || !isComplete) {
      return;
    }
    void clearSessionDraftAndSync();
  }, [enabled, isComplete, clearSessionDraftAndSync]);

  return {
    hydratedDraft,
    progressSaved,
    persistCompletionNow,
    persistDraftNow,
  };
}
