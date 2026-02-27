import { useCallback, useEffect } from 'react';
import type { Day, SessionSection } from '../../data/day-model';
import type { SessionDraft } from '../../data/session-draft-store';

type UseSessionDraftPersistenceParams = {
  enabled: boolean;
  mode: 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone';
  day?: Day;
  section?: SessionSection;
  isComplete: boolean;
  sectionIndex: number;
  sentenceIndex: number;
  repRound: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  hydratedDraft: boolean;
  setHydratedDraft: (value: boolean) => void;
  setPhase: (phase: 'hydrating' | 'active') => void;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  restoreFromDraft: (draft: { sectionIndex: number; sentenceIndex: number; repRound?: number }) => void;
  hydrateTimerFromDraft: (remainingSeconds: number, sessionElapsedSeconds: number) => void;
};

export function useSessionDraftPersistence({
  enabled,
  mode,
  day,
  section,
  isComplete,
  sectionIndex,
  sentenceIndex,
  repRound,
  remainingSeconds,
  sessionElapsedSeconds,
  hydratedDraft,
  setHydratedDraft,
  setPhase,
  loadSessionDraftAndSync,
  saveSessionDraftAndSync,
  restoreFromDraft,
  hydrateTimerFromDraft,
}: UseSessionDraftPersistenceParams) {
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
      setPhase('active');
      return;
    }
    if (!day || hydratedDraft) {
      return;
    }

    let active = true;
    setPhase('hydrating');
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
      setPhase('active');
    };

    void hydrateDraft();

    return () => {
      active = false;
    };
  }, [enabled, mode, day, hydratedDraft, restoreFromDraft, hydrateTimerFromDraft, loadSessionDraftAndSync, setHydratedDraft, setPhase]);

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

  return {
    persistDraftNow,
  };
}
