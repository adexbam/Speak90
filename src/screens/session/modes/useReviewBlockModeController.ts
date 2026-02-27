import { useState } from 'react';
import type { Day } from '../../../data/day-model';
import type { SessionDraft } from '../../../data/session-draft-store';
import { useReviewBlockCompletionPersistence } from './useReviewBlockCompletionPersistence';
import { useReviewBlockDraftPersistence } from './useReviewBlockDraftPersistence';
import { useReviewBlockTimer } from './useReviewBlockTimer';

type ReviewBlock = {
  durationMinutes?: number;
};

type UseReviewBlockModeControllerParams = {
  day?: Day;
  isPracticeMode: boolean;
  isModeActive: boolean;
  mode: 'light_review' | 'deep_consolidation';
  analyticsSectionId: 'review.light_review' | 'review.deep_consolidation';
  blocks: ReviewBlock[];
  fallbackMinutes: number;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
  completeModeAndSync: () => Promise<unknown>;
  incrementReviewModeCompletionAndSync: () => Promise<unknown>;
};

export function useReviewBlockModeController({
  day,
  isPracticeMode,
  isModeActive,
  mode,
  analyticsSectionId,
  blocks,
  fallbackMinutes,
  loadSessionDraftAndSync,
  saveSessionDraftAndSync,
  clearSessionDraftAndSync,
  completeModeAndSync,
  incrementReviewModeCompletionAndSync,
}: UseReviewBlockModeControllerParams) {
  const [blockIndex, setBlockIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);

  const draft = useReviewBlockDraftPersistence({
    day,
    mode,
    isModeActive,
    blocks,
    fallbackMinutes,
    blockIndex,
    setBlockIndex,
    remainingSeconds,
    setRemainingSeconds,
    sessionElapsedSeconds,
    setSessionElapsedSeconds,
    completed,
    setCompleted,
    setSaved,
    loadSessionDraftAndSync,
    saveSessionDraftAndSync,
  });
  useReviewBlockTimer({
    isModeActive,
    hydrated: draft.hydrated,
    completed,
    blockIndex,
    blocks,
    fallbackMinutes,
    setBlockIndex,
    remainingSeconds,
    setRemainingSeconds,
    setSessionElapsedSeconds,
    setCompleted,
  });

  useReviewBlockCompletionPersistence({
    day,
    isPracticeMode,
    isModeActive,
    completed,
    saved,
    setSaved,
    analyticsSectionId,
    completeModeAndSync,
    incrementReviewModeCompletionAndSync,
    clearSessionDraftAndSync,
  });

  return {
    blockIndex,
    setBlockIndex,
    remainingSeconds,
    setRemainingSeconds,
    sessionElapsedSeconds,
    hydrated: draft.hydrated,
    completed,
    setCompleted,
    saved,
    persistDraftOnClose: draft.persistDraftOnClose,
  };
}
