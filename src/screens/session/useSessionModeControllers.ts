import { useEffect, useState } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import type { Day } from '../../data/day-model';
import { loadMilestoneRecordings, type RecordingMetadata } from '../../data/recordings-store';
import type { SessionDraft } from '../../data/session-draft-store';

type ReviewBlock = {
  durationMinutes?: number;
};

type UseSessionModeControllersParams = {
  day?: Day;
  allDaysCount: number;
  isPracticeMode: boolean;
  isLightReviewMode: boolean;
  lightReviewBlocks: ReviewBlock[];
  lightFallbackMinutes: number;
  isDeepConsolidationMode: boolean;
  deepBlocks: ReviewBlock[];
  deepTotalMinutes: number;
  isMilestoneMode: boolean;
  hasLastRecording: boolean;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
  completeLightReviewAndSync: () => Promise<unknown>;
  completeDeepConsolidationAndSync: () => Promise<unknown>;
  completeSessionAndSync: (params: { completedDay: number; sessionSeconds: number; totalDays: number }) => Promise<unknown>;
  incrementReviewModeCompletionAndSync: (mode: 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone') => Promise<unknown>;
};

export function useSessionModeControllers({
  day,
  allDaysCount,
  isPracticeMode,
  isLightReviewMode,
  lightReviewBlocks,
  lightFallbackMinutes,
  isDeepConsolidationMode,
  deepBlocks,
  deepTotalMinutes,
  isMilestoneMode,
  hasLastRecording,
  loadSessionDraftAndSync,
  saveSessionDraftAndSync,
  clearSessionDraftAndSync,
  completeLightReviewAndSync,
  completeDeepConsolidationAndSync,
  completeSessionAndSync,
  incrementReviewModeCompletionAndSync,
}: UseSessionModeControllersParams) {
  const [lightReviewBlockIndex, setLightReviewBlockIndex] = useState(0);
  const [lightReviewRemainingSeconds, setLightReviewRemainingSeconds] = useState(0);
  const [lightReviewSessionElapsedSeconds, setLightReviewSessionElapsedSeconds] = useState(0);
  const [lightReviewHydrated, setLightReviewHydrated] = useState(false);
  const [lightReviewCompleted, setLightReviewCompleted] = useState(false);
  const [lightReviewSaved, setLightReviewSaved] = useState(false);

  const [deepBlockIndex, setDeepBlockIndex] = useState(0);
  const [deepRemainingSeconds, setDeepRemainingSeconds] = useState(0);
  const [deepSessionElapsedSeconds, setDeepSessionElapsedSeconds] = useState(0);
  const [deepHydrated, setDeepHydrated] = useState(false);
  const [deepCompleted, setDeepCompleted] = useState(false);
  const [deepSaved, setDeepSaved] = useState(false);

  const [milestoneRemainingSeconds, setMilestoneRemainingSeconds] = useState(600);
  const [milestoneHydrated, setMilestoneHydrated] = useState(false);
  const [milestoneCompleted, setMilestoneCompleted] = useState(false);
  const [milestoneSaved, setMilestoneSaved] = useState(false);
  const [milestoneRecords, setMilestoneRecords] = useState<RecordingMetadata[]>([]);

  useEffect(() => {
    if (!isLightReviewMode || !day) {
      setLightReviewHydrated(true);
      return;
    }

    let active = true;
    const hydrate = async () => {
      const draft = await loadSessionDraftAndSync();
      if (!active) {
        return;
      }

      const firstBlockDuration = (lightReviewBlocks[0]?.durationMinutes ?? lightFallbackMinutes) * 60;
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === 'light_review') {
        const safeBlockIndex = Math.min(Math.max(0, draft.sectionIndex), Math.max(0, lightReviewBlocks.length - 1));
        const safeBlockDuration = (lightReviewBlocks[safeBlockIndex]?.durationMinutes ?? lightFallbackMinutes) * 60;
        setLightReviewBlockIndex(safeBlockIndex);
        setLightReviewRemainingSeconds(Math.min(draft.remainingSeconds, safeBlockDuration));
        setLightReviewSessionElapsedSeconds(draft.sessionElapsedSeconds);
      } else {
        setLightReviewBlockIndex(0);
        setLightReviewRemainingSeconds(firstBlockDuration);
        setLightReviewSessionElapsedSeconds(0);
      }
      setLightReviewCompleted(false);
      setLightReviewSaved(false);
      setLightReviewHydrated(true);
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [day, isLightReviewMode, lightReviewBlocks, lightFallbackMinutes, loadSessionDraftAndSync]);

  useEffect(() => {
    if (!isLightReviewMode || !lightReviewHydrated || lightReviewCompleted) {
      return;
    }
    const intervalId = setInterval(() => {
      setLightReviewRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      setLightReviewSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isLightReviewMode, lightReviewHydrated, lightReviewCompleted]);

  useEffect(() => {
    if (!isLightReviewMode || !lightReviewHydrated || lightReviewCompleted || !day) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode: 'light_review',
        sectionIndex: lightReviewBlockIndex,
        sentenceIndex: 0,
        remainingSeconds: lightReviewRemainingSeconds,
        sessionElapsedSeconds: lightReviewSessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [
    isLightReviewMode,
    lightReviewHydrated,
    lightReviewCompleted,
    day,
    lightReviewBlockIndex,
    Math.floor(lightReviewRemainingSeconds / 5),
    Math.floor(lightReviewSessionElapsedSeconds / 5),
    saveSessionDraftAndSync,
  ]);

  useEffect(() => {
    if (!isLightReviewMode || !lightReviewHydrated || lightReviewCompleted || lightReviewRemainingSeconds > 0) {
      return;
    }
    const isLastBlock = lightReviewBlockIndex >= lightReviewBlocks.length - 1;
    if (isLastBlock) {
      setLightReviewCompleted(true);
      return;
    }
    const nextBlockIndex = lightReviewBlockIndex + 1;
    setLightReviewBlockIndex(nextBlockIndex);
    setLightReviewRemainingSeconds((lightReviewBlocks[nextBlockIndex]?.durationMinutes ?? 5) * 60);
  }, [isLightReviewMode, lightReviewHydrated, lightReviewCompleted, lightReviewRemainingSeconds, lightReviewBlockIndex, lightReviewBlocks]);

  useEffect(() => {
    if (isPracticeMode || !isLightReviewMode || !lightReviewCompleted || lightReviewSaved) {
      return;
    }
    let active = true;
    const persist = async () => {
      await completeLightReviewAndSync();
      await incrementReviewModeCompletionAndSync('light_review');
      await clearSessionDraftAndSync();
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.light_review',
        }),
      );
      if (active) {
        setLightReviewSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [
    isPracticeMode,
    isLightReviewMode,
    lightReviewCompleted,
    lightReviewSaved,
    day?.dayNumber,
    completeLightReviewAndSync,
    incrementReviewModeCompletionAndSync,
    clearSessionDraftAndSync,
  ]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !day) {
      setDeepHydrated(true);
      return;
    }
    let active = true;
    const hydrate = async () => {
      const draft = await loadSessionDraftAndSync();
      if (!active) {
        return;
      }
      const fallbackPerBlockMinutes = Math.max(1, Math.floor(deepTotalMinutes / Math.max(1, deepBlocks.length)));
      const firstBlockDuration = (deepBlocks[0]?.durationMinutes ?? fallbackPerBlockMinutes) * 60;
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === 'deep_consolidation') {
        const safeBlockIndex = Math.min(Math.max(0, draft.sectionIndex), Math.max(0, deepBlocks.length - 1));
        const safeBlockDuration = (deepBlocks[safeBlockIndex]?.durationMinutes ?? fallbackPerBlockMinutes) * 60;
        setDeepBlockIndex(safeBlockIndex);
        setDeepRemainingSeconds(Math.min(draft.remainingSeconds, safeBlockDuration));
        setDeepSessionElapsedSeconds(draft.sessionElapsedSeconds);
      } else {
        setDeepBlockIndex(0);
        setDeepRemainingSeconds(firstBlockDuration);
        setDeepSessionElapsedSeconds(0);
      }
      setDeepCompleted(false);
      setDeepSaved(false);
      setDeepHydrated(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [day, isDeepConsolidationMode, deepBlocks, deepTotalMinutes, loadSessionDraftAndSync]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !deepHydrated || deepCompleted) {
      return;
    }
    const intervalId = setInterval(() => {
      setDeepRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      setDeepSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isDeepConsolidationMode, deepHydrated, deepCompleted]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !deepHydrated || deepCompleted || !day) {
      return;
    }
    const timeoutId = setTimeout(() => {
      void saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode: 'deep_consolidation',
        sectionIndex: deepBlockIndex,
        sentenceIndex: 0,
        remainingSeconds: deepRemainingSeconds,
        sessionElapsedSeconds: deepSessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [
    isDeepConsolidationMode,
    deepHydrated,
    deepCompleted,
    day,
    deepBlockIndex,
    Math.floor(deepRemainingSeconds / 5),
    Math.floor(deepSessionElapsedSeconds / 5),
    saveSessionDraftAndSync,
  ]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !deepHydrated || deepCompleted || deepRemainingSeconds > 0) {
      return;
    }
    const isLastBlock = deepBlockIndex >= deepBlocks.length - 1;
    if (isLastBlock) {
      setDeepCompleted(true);
      return;
    }
    const fallbackPerBlockMinutes = Math.max(1, Math.floor(deepTotalMinutes / Math.max(1, deepBlocks.length)));
    const nextBlockIndex = deepBlockIndex + 1;
    setDeepBlockIndex(nextBlockIndex);
    setDeepRemainingSeconds((deepBlocks[nextBlockIndex]?.durationMinutes ?? fallbackPerBlockMinutes) * 60);
  }, [isDeepConsolidationMode, deepHydrated, deepCompleted, deepRemainingSeconds, deepBlockIndex, deepBlocks, deepTotalMinutes]);

  useEffect(() => {
    if (isPracticeMode || !isDeepConsolidationMode || !deepCompleted || deepSaved) {
      return;
    }
    let active = true;
    const persist = async () => {
      await completeDeepConsolidationAndSync();
      await incrementReviewModeCompletionAndSync('deep_consolidation');
      await clearSessionDraftAndSync();
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.deep_consolidation',
        }),
      );
      if (active) {
        setDeepSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [
    isPracticeMode,
    isDeepConsolidationMode,
    deepCompleted,
    deepSaved,
    day?.dayNumber,
    completeDeepConsolidationAndSync,
    incrementReviewModeCompletionAndSync,
    clearSessionDraftAndSync,
  ]);

  useEffect(() => {
    if (!isMilestoneMode || !day) {
      setMilestoneHydrated(true);
      return;
    }
    let active = true;
    const hydrate = async () => {
      const [draft, milestones] = await Promise.all([loadSessionDraftAndSync(), loadMilestoneRecordings()]);
      if (!active) {
        return;
      }
      const previous = milestones.filter((m) => m.dayNumber < day.dayNumber).sort((a, b) => (a.dayNumber < b.dayNumber ? 1 : -1));
      setMilestoneRecords(previous);
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === 'milestone') {
        setMilestoneRemainingSeconds(Math.min(600, Math.max(0, draft.remainingSeconds)));
      } else {
        setMilestoneRemainingSeconds(600);
      }
      setMilestoneCompleted(false);
      setMilestoneSaved(false);
      setMilestoneHydrated(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [day, isMilestoneMode, hasLastRecording, loadSessionDraftAndSync]);

  useEffect(() => {
    if (!isMilestoneMode || !milestoneHydrated || milestoneCompleted) {
      return;
    }
    const intervalId = setInterval(() => {
      setMilestoneRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isMilestoneMode, milestoneHydrated, milestoneCompleted]);

  useEffect(() => {
    if (!isMilestoneMode || !milestoneHydrated || milestoneCompleted || !day) {
      return;
    }
    const timeoutId = setTimeout(() => {
      void saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode: 'milestone',
        sectionIndex: 0,
        sentenceIndex: 0,
        remainingSeconds: milestoneRemainingSeconds,
        sessionElapsedSeconds: 600 - milestoneRemainingSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [isMilestoneMode, milestoneHydrated, milestoneCompleted, day, Math.floor(milestoneRemainingSeconds / 5), saveSessionDraftAndSync]);

  useEffect(() => {
    if (!isMilestoneMode || !milestoneHydrated || milestoneCompleted || milestoneRemainingSeconds > 0) {
      return;
    }
    setMilestoneCompleted(true);
  }, [isMilestoneMode, milestoneHydrated, milestoneCompleted, milestoneRemainingSeconds]);

  useEffect(() => {
    if (!isMilestoneMode || !milestoneCompleted) {
      return;
    }
    void clearSessionDraftAndSync();
  }, [isMilestoneMode, milestoneCompleted, clearSessionDraftAndSync]);

  useEffect(() => {
    if (isPracticeMode || !isMilestoneMode || !milestoneCompleted || milestoneSaved) {
      return;
    }
    let active = true;
    const persist = async () => {
      if (day) {
        await completeSessionAndSync({
          completedDay: day.dayNumber,
          sessionSeconds: 600,
          totalDays: allDaysCount,
        });
      }
      await incrementReviewModeCompletionAndSync('milestone');
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.milestone',
        }),
      );
      if (active) {
        setMilestoneSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [
    isPracticeMode,
    isMilestoneMode,
    milestoneCompleted,
    milestoneSaved,
    day,
    allDaysCount,
    completeSessionAndSync,
    incrementReviewModeCompletionAndSync,
  ]);

  return {
    light: {
      blockIndex: lightReviewBlockIndex,
      setBlockIndex: setLightReviewBlockIndex,
      remainingSeconds: lightReviewRemainingSeconds,
      setRemainingSeconds: setLightReviewRemainingSeconds,
      sessionElapsedSeconds: lightReviewSessionElapsedSeconds,
      hydrated: lightReviewHydrated,
      completed: lightReviewCompleted,
      setCompleted: setLightReviewCompleted,
      saved: lightReviewSaved,
      persistDraftOnClose: async () => {
        if (!day || lightReviewCompleted || !lightReviewHydrated) {
          return;
        }
        await saveSessionDraftAndSync({
          dayNumber: day.dayNumber,
          mode: 'light_review',
          sectionIndex: lightReviewBlockIndex,
          sentenceIndex: 0,
          remainingSeconds: lightReviewRemainingSeconds,
          sessionElapsedSeconds: lightReviewSessionElapsedSeconds,
          savedAt: new Date().toISOString(),
        });
      },
    },
    deep: {
      blockIndex: deepBlockIndex,
      setBlockIndex: setDeepBlockIndex,
      remainingSeconds: deepRemainingSeconds,
      setRemainingSeconds: setDeepRemainingSeconds,
      sessionElapsedSeconds: deepSessionElapsedSeconds,
      hydrated: deepHydrated,
      completed: deepCompleted,
      setCompleted: setDeepCompleted,
      saved: deepSaved,
      persistDraftOnClose: async () => {
        if (!day || deepCompleted || !deepHydrated) {
          return;
        }
        await saveSessionDraftAndSync({
          dayNumber: day.dayNumber,
          mode: 'deep_consolidation',
          sectionIndex: deepBlockIndex,
          sentenceIndex: 0,
          remainingSeconds: deepRemainingSeconds,
          sessionElapsedSeconds: deepSessionElapsedSeconds,
          savedAt: new Date().toISOString(),
        });
      },
    },
    milestone: {
      records: milestoneRecords,
      remainingSeconds: milestoneRemainingSeconds,
      hydrated: milestoneHydrated,
      completed: milestoneCompleted,
      setCompleted: setMilestoneCompleted,
      saved: milestoneSaved,
      persistDraftOnClose: async () => {
        if (!day || milestoneCompleted || !milestoneHydrated) {
          return;
        }
        await saveSessionDraftAndSync({
          dayNumber: day.dayNumber,
          mode: 'milestone',
          sectionIndex: 0,
          sentenceIndex: 0,
          remainingSeconds: milestoneRemainingSeconds,
          sessionElapsedSeconds: 600 - milestoneRemainingSeconds,
          savedAt: new Date().toISOString(),
        });
      },
    },
  };
}

