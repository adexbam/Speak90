import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Day, SessionSection } from '../../data/day-model';
import { useAppProgressStore } from '../../state/app-progress-store';

type UseSessionPersistenceParams = {
  enabled?: boolean;
  persistCompletion?: boolean;
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
  persistCompletion = true,
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
  type PersistencePhase = 'initial' | 'hydrating' | 'active' | 'completing' | 'completed';
  type PersistenceState = {
    phase: PersistencePhase;
    hydratedDraft: boolean;
    progressSaved: boolean;
  };
  type PersistenceAction =
    | { type: 'SET_HYDRATED'; value: boolean }
    | { type: 'SET_PROGRESS_SAVED'; value: boolean }
    | { type: 'SET_PHASE'; value: PersistencePhase };

  const [state, dispatch] = useReducer((current: PersistenceState, action: PersistenceAction): PersistenceState => {
    if (action.type === 'SET_HYDRATED') {
      return { ...current, hydratedDraft: action.value };
    }
    if (action.type === 'SET_PROGRESS_SAVED') {
      return {
        ...current,
        progressSaved: action.value,
        phase: action.value ? 'completed' : current.phase,
      };
    }
    return { ...current, phase: action.value };
  }, {
    phase: persistCompletion ? 'initial' : 'completed',
    hydratedDraft: false,
    progressSaved: !persistCompletion,
  });

  const hydratedDraft = state.hydratedDraft;
  const progressSaved = state.progressSaved;
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
      dispatch({ type: 'SET_HYDRATED', value: true });
      dispatch({ type: 'SET_PHASE', value: 'active' });
      return;
    }
    if (!day || hydratedDraft) {
      return;
    }

    let active = true;
    dispatch({ type: 'SET_PHASE', value: 'hydrating' });
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

      dispatch({ type: 'SET_HYDRATED', value: true });
      dispatch({ type: 'SET_PHASE', value: 'active' });
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
    if (!persistCompletion) {
      dispatch({ type: 'SET_PROGRESS_SAVED', value: true });
      return;
    }

    if (!enabled || !isComplete || !day || progressSaved) {
      return;
    }

    if (!completionSavePromiseRef.current) {
      dispatch({ type: 'SET_PHASE', value: 'completing' });
      completionSavePromiseRef.current = (async () => {
        await completeSessionAndSync({
          completedDay: day.dayNumber,
          sessionSeconds: sessionElapsedSeconds,
          totalDays,
        });
        dispatch({ type: 'SET_PROGRESS_SAVED', value: true });
      })().finally(() => {
        completionSavePromiseRef.current = null;
      });
    }

    await completionSavePromiseRef.current;
  }, [enabled, persistCompletion, isComplete, day, progressSaved, sessionElapsedSeconds, totalDays, completeSessionAndSync]);

  useEffect(() => {
    if (!persistCompletion || !enabled || !isComplete || !day || progressSaved) {
      return;
    }

    void persistCompletionNow();
  }, [enabled, persistCompletion, isComplete, day, progressSaved, persistCompletionNow]);

  useEffect(() => {
    if (!persistCompletion) {
      dispatch({ type: 'SET_PROGRESS_SAVED', value: true });
    }
  }, [persistCompletion]);

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
