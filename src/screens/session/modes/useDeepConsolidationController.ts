import { useEffect, useState } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../../analytics/events';
import type { Day } from '../../../data/day-model';
import type { SessionDraft } from '../../../data/session-draft-store';

type ReviewBlock = {
  durationMinutes?: number;
};

type UseDeepConsolidationControllerParams = {
  day?: Day;
  isPracticeMode: boolean;
  isDeepConsolidationMode: boolean;
  deepBlocks: ReviewBlock[];
  deepTotalMinutes: number;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
  completeDeepConsolidationAndSync: () => Promise<unknown>;
  incrementReviewModeCompletionAndSync: () => Promise<unknown>;
};

export function useDeepConsolidationController({
  day,
  isPracticeMode,
  isDeepConsolidationMode,
  deepBlocks,
  deepTotalMinutes,
  loadSessionDraftAndSync,
  saveSessionDraftAndSync,
  clearSessionDraftAndSync,
  completeDeepConsolidationAndSync,
  incrementReviewModeCompletionAndSync,
}: UseDeepConsolidationControllerParams) {
  const [blockIndex, setBlockIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isDeepConsolidationMode || !day) {
      setHydrated(true);
      return;
    }
    let active = true;
    const hydrate = async () => {
      const draft = await loadSessionDraftAndSync();
      if (!active) return;
      const fallbackPerBlockMinutes = Math.max(1, Math.floor(deepTotalMinutes / Math.max(1, deepBlocks.length)));
      const firstBlockDuration = (deepBlocks[0]?.durationMinutes ?? fallbackPerBlockMinutes) * 60;
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === 'deep_consolidation') {
        const safeBlockIndex = Math.min(Math.max(0, draft.sectionIndex), Math.max(0, deepBlocks.length - 1));
        const safeBlockDuration = (deepBlocks[safeBlockIndex]?.durationMinutes ?? fallbackPerBlockMinutes) * 60;
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
  }, [day, isDeepConsolidationMode, deepBlocks, deepTotalMinutes, loadSessionDraftAndSync]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !hydrated || completed) return;
    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      setSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isDeepConsolidationMode, hydrated, completed]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !hydrated || completed || !day) return;
    const timeoutId = setTimeout(() => {
      void saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode: 'deep_consolidation',
        sectionIndex: blockIndex,
        sentenceIndex: 0,
        remainingSeconds,
        sessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [isDeepConsolidationMode, hydrated, completed, day, blockIndex, Math.floor(remainingSeconds / 5), Math.floor(sessionElapsedSeconds / 5), saveSessionDraftAndSync]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !hydrated || completed || remainingSeconds > 0) return;
    const isLastBlock = blockIndex >= deepBlocks.length - 1;
    if (isLastBlock) {
      setCompleted(true);
      return;
    }
    const fallbackPerBlockMinutes = Math.max(1, Math.floor(deepTotalMinutes / Math.max(1, deepBlocks.length)));
    const nextBlockIndex = blockIndex + 1;
    setBlockIndex(nextBlockIndex);
    setRemainingSeconds((deepBlocks[nextBlockIndex]?.durationMinutes ?? fallbackPerBlockMinutes) * 60);
  }, [isDeepConsolidationMode, hydrated, completed, remainingSeconds, blockIndex, deepBlocks, deepTotalMinutes]);

  useEffect(() => {
    if (isPracticeMode || !isDeepConsolidationMode || !completed || saved) return;
    let active = true;
    const persist = async () => {
      await completeDeepConsolidationAndSync();
      await incrementReviewModeCompletionAndSync();
      await clearSessionDraftAndSync();
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.deep_consolidation',
        }),
      );
      if (active) setSaved(true);
    };
    void persist();
    return () => {
      active = false;
    };
  }, [isPracticeMode, isDeepConsolidationMode, completed, saved, day?.dayNumber, completeDeepConsolidationAndSync, incrementReviewModeCompletionAndSync, clearSessionDraftAndSync]);

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
    persistDraftOnClose: async () => {
      if (!day || completed || !hydrated) return;
      await saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode: 'deep_consolidation',
        sectionIndex: blockIndex,
        sentenceIndex: 0,
        remainingSeconds,
        sessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    },
  };
}
