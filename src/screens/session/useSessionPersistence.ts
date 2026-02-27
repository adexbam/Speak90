import { useCallback, useReducer } from 'react';
import type { Day, SessionSection } from '../../data/day-model';
import { useAppProgressStore } from '../../state/app-progress-store';
import { useSessionDraftPersistence } from './useSessionDraftPersistence';
import { useSessionCompletionPersistence } from './useSessionCompletionPersistence';

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

function reducer(current: PersistenceState, action: PersistenceAction): PersistenceState {
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
}

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

  const [state, dispatch] = useReducer(reducer, {
    phase: persistCompletion ? 'initial' : 'completed',
    hydratedDraft: false,
    progressSaved: !persistCompletion,
  });

  const setPhase = useCallback((value: PersistencePhase) => dispatch({ type: 'SET_PHASE', value }), []);
  const setHydratedDraft = useCallback((value: boolean) => dispatch({ type: 'SET_HYDRATED', value }), []);
  const setProgressSaved = useCallback((value: boolean) => dispatch({ type: 'SET_PROGRESS_SAVED', value }), []);

  const draft = useSessionDraftPersistence({
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
    hydratedDraft: state.hydratedDraft,
    setHydratedDraft,
    setPhase,
    loadSessionDraftAndSync,
    saveSessionDraftAndSync,
    restoreFromDraft,
    hydrateTimerFromDraft,
  });

  const completion = useSessionCompletionPersistence({
    enabled,
    persistCompletion,
    day,
    isComplete,
    progressSaved: state.progressSaved,
    totalDays,
    sessionElapsedSeconds,
    setProgressSaved,
    setPhase,
    completeSessionAndSync,
    clearSessionDraftAndSync,
  });

  return {
    hydratedDraft: state.hydratedDraft,
    progressSaved: state.progressSaved,
    persistCompletionNow: completion.persistCompletionNow,
    persistDraftNow: draft.persistDraftNow,
  };
}
