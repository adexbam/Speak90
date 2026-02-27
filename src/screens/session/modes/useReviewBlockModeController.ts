import { useCallback, useEffect, useState } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../../analytics/events';
import type { Day } from '../../../data/day-model';
import type { SessionDraft } from '../../../data/session-draft-store';
import { useModeCountdown } from './useModeCountdown';
import { useModeDraftAutosave } from './useModeDraftAutosave';

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
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isModeActive || !day) {
      setHydrated(true);
      return;
    }

    let active = true;
    const hydrate = async () => {
      const draft = await loadSessionDraftAndSync();
      if (!active) return;

      const firstBlockDuration = (blocks[0]?.durationMinutes ?? fallbackMinutes) * 60;
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === mode) {
        const safeBlockIndex = Math.min(Math.max(0, draft.sectionIndex), Math.max(0, blocks.length - 1));
        const safeBlockDuration = (blocks[safeBlockIndex]?.durationMinutes ?? fallbackMinutes) * 60;
        setBlockIndex(safeBlockIndex);
        setRemainingSeconds(Math.min(draft.remainingSeconds, safeBlockDuration));
        setSessionElapsedSeconds(draft.sessionElapsedSeconds);
      } else {
        setBlockIndex(0);
        setRemainingSeconds(firstBlockDuration);
        setSessionElapsedSeconds(0);
      }
      setCompleted(false);
      setSaved(false);
      setHydrated(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [blocks, day, fallbackMinutes, isModeActive, loadSessionDraftAndSync, mode]);

  const tick = useCallback(() => {
    setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
    setSessionElapsedSeconds((prev) => prev + 1);
  }, []);
  useModeCountdown({
    enabled: isModeActive && hydrated && !completed,
    onTick: tick,
  });

  const saveDraft = useCallback(async () => {
    if (!isModeActive || !hydrated || completed || !day) {
      return;
    }
    await saveSessionDraftAndSync({
      dayNumber: day.dayNumber,
      mode,
      sectionIndex: blockIndex,
      sentenceIndex: 0,
      remainingSeconds,
      sessionElapsedSeconds,
      savedAt: new Date().toISOString(),
    });
  }, [blockIndex, completed, day, hydrated, isModeActive, mode, remainingSeconds, saveSessionDraftAndSync, sessionElapsedSeconds]);
  const autosaveKey = blockIndex * 100000 + Math.floor(remainingSeconds / 5) * 100 + Math.floor(sessionElapsedSeconds / 5);
  useModeDraftAutosave({
    enabled: isModeActive && hydrated && !completed && !!day,
    save: saveDraft,
    dependencyKey: autosaveKey,
  });

  useEffect(() => {
    if (!isModeActive || !hydrated || completed || remainingSeconds > 0) return;
    const isLastBlock = blockIndex >= blocks.length - 1;
    if (isLastBlock) {
      setCompleted(true);
      return;
    }
    const nextBlockIndex = blockIndex + 1;
    setBlockIndex(nextBlockIndex);
    setRemainingSeconds((blocks[nextBlockIndex]?.durationMinutes ?? fallbackMinutes) * 60);
  }, [isModeActive, hydrated, completed, remainingSeconds, blockIndex, blocks, fallbackMinutes]);

  useEffect(() => {
    if (isPracticeMode || !isModeActive || !completed || saved) return;
    let active = true;
    const persist = async () => {
      await completeModeAndSync();
      await incrementReviewModeCompletionAndSync();
      await clearSessionDraftAndSync();
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: analyticsSectionId,
        }),
      );
      if (active) setSaved(true);
    };
    void persist();
    return () => {
      active = false;
    };
  }, [
    analyticsSectionId,
    clearSessionDraftAndSync,
    completeModeAndSync,
    completed,
    day?.dayNumber,
    incrementReviewModeCompletionAndSync,
    isModeActive,
    isPracticeMode,
    saved,
  ]);

  return {
    blockIndex,
    setBlockIndex,
    remainingSeconds,
    setRemainingSeconds,
    sessionElapsedSeconds,
    hydrated,
    completed,
    setCompleted,
    saved,
    persistDraftOnClose: saveDraft,
  };
}
