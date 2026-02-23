import { useCallback, useEffect, useState } from 'react';
import { completeSessionAndSave } from '../../data/progress-store';
import { clearSessionDraft, loadSessionDraft, saveSessionDraft } from '../../data/session-draft-store';
import type { Day, SessionSection } from '../../data/day-model';

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
  const [progressSaved, setProgressSaved] = useState(false);
  const [hydratedDraft, setHydratedDraft] = useState(false);

  const persistDraftNow = useCallback(async () => {
    if (!enabled || !day || !section || !hydratedDraft || isComplete) {
      return;
    }

    await saveSessionDraft({
      dayNumber: day.dayNumber,
      mode,
      sectionIndex,
      sentenceIndex,
      repRound,
      remainingSeconds,
      sessionElapsedSeconds,
      savedAt: new Date().toISOString(),
    });
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
      const draft = await loadSessionDraft();
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
  }, [enabled, mode, day, hydratedDraft, restoreFromDraft, hydrateTimerFromDraft]);

  useEffect(() => {
    if (!enabled || !day || !section || !hydratedDraft || isComplete) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void saveSessionDraft({
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
  ]);

  useEffect(() => {
    if (!enabled || !isComplete || !day || progressSaved) {
      return;
    }

    let active = true;
    const persist = async () => {
      await completeSessionAndSave({
        completedDay: day.dayNumber,
        sessionSeconds: sessionElapsedSeconds,
        totalDays,
      });
      if (active) {
        setProgressSaved(true);
      }
    };

    void persist();

    return () => {
      active = false;
    };
  }, [enabled, isComplete, day, progressSaved, sessionElapsedSeconds, totalDays]);

  useEffect(() => {
    if (!enabled || !isComplete) {
      return;
    }
    void clearSessionDraft();
  }, [enabled, isComplete]);

  return {
    hydratedDraft,
    progressSaved,
    persistDraftNow,
  };
}
