import { useEffect, useState } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../../analytics/events';
import type { Day } from '../../../data/day-model';
import type { SessionDraft } from '../../../data/session-draft-store';

type ReviewBlock = {
  durationMinutes?: number;
};

type UseLightReviewControllerParams = {
  day?: Day;
  isPracticeMode: boolean;
  isLightReviewMode: boolean;
  lightReviewBlocks: ReviewBlock[];
  lightFallbackMinutes: number;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
  completeLightReviewAndSync: () => Promise<unknown>;
  incrementReviewModeCompletionAndSync: () => Promise<unknown>;
};

export function useLightReviewController({
  day,
  isPracticeMode,
  isLightReviewMode,
  lightReviewBlocks,
  lightFallbackMinutes,
  loadSessionDraftAndSync,
  saveSessionDraftAndSync,
  clearSessionDraftAndSync,
  completeLightReviewAndSync,
  incrementReviewModeCompletionAndSync,
}: UseLightReviewControllerParams) {
  const [blockIndex, setBlockIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLightReviewMode || !day) {
      setHydrated(true);
      return;
    }

    let active = true;
    const hydrate = async () => {
      const draft = await loadSessionDraftAndSync();
      if (!active) return;

      const firstBlockDuration = (lightReviewBlocks[0]?.durationMinutes ?? lightFallbackMinutes) * 60;
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === 'light_review') {
        const safeBlockIndex = Math.min(Math.max(0, draft.sectionIndex), Math.max(0, lightReviewBlocks.length - 1));
        const safeBlockDuration = (lightReviewBlocks[safeBlockIndex]?.durationMinutes ?? lightFallbackMinutes) * 60;
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
  }, [day, isLightReviewMode, lightReviewBlocks, lightFallbackMinutes, loadSessionDraftAndSync]);

  useEffect(() => {
    if (!isLightReviewMode || !hydrated || completed) return;
    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      setSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isLightReviewMode, hydrated, completed]);

  useEffect(() => {
    if (!isLightReviewMode || !hydrated || completed || !day) return;
    const timeoutId = setTimeout(() => {
      void saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode: 'light_review',
        sectionIndex: blockIndex,
        sentenceIndex: 0,
        remainingSeconds,
        sessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [isLightReviewMode, hydrated, completed, day, blockIndex, Math.floor(remainingSeconds / 5), Math.floor(sessionElapsedSeconds / 5), saveSessionDraftAndSync]);

  useEffect(() => {
    if (!isLightReviewMode || !hydrated || completed || remainingSeconds > 0) return;
    const isLastBlock = blockIndex >= lightReviewBlocks.length - 1;
    if (isLastBlock) {
      setCompleted(true);
      return;
    }
    const nextBlockIndex = blockIndex + 1;
    setBlockIndex(nextBlockIndex);
    setRemainingSeconds((lightReviewBlocks[nextBlockIndex]?.durationMinutes ?? 5) * 60);
  }, [isLightReviewMode, hydrated, completed, remainingSeconds, blockIndex, lightReviewBlocks]);

  useEffect(() => {
    if (isPracticeMode || !isLightReviewMode || !completed || saved) return;
    let active = true;
    const persist = async () => {
      await completeLightReviewAndSync();
      await incrementReviewModeCompletionAndSync();
      await clearSessionDraftAndSync();
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.light_review',
        }),
      );
      if (active) setSaved(true);
    };
    void persist();
    return () => {
      active = false;
    };
  }, [isPracticeMode, isLightReviewMode, completed, saved, day?.dayNumber, completeLightReviewAndSync, incrementReviewModeCompletionAndSync, clearSessionDraftAndSync]);

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
        mode: 'light_review',
        sectionIndex: blockIndex,
        sentenceIndex: 0,
        remainingSeconds,
        sessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    },
  };
}
