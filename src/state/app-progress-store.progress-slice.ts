import type { StateCreator } from 'zustand';
import {
  completeDeepConsolidationAndSave,
  completeLightReviewAndSave,
  completeReinforcementCheckpointAndSave,
  completeSessionAndSave,
  incrementReviewModeCompletionAndSave,
  loadUserProgress,
  markMicroReviewCompletedAndSave,
  markMicroReviewShownAndSave,
  markReinforcementCheckpointOfferedAndSave,
  type ReviewModeCompletionCounts,
  type UserProgress,
} from '../data/progress-store';
import type { AppProgressState, ProgressSlice } from './app-progress-store.types';

const EMPTY_REVIEW_COUNTS: ReviewModeCompletionCounts = {
  new_day: 0,
  light_review: 0,
  deep_consolidation: 0,
  milestone: 0,
};

export const EMPTY_PROGRESS: UserProgress = {
  currentDay: 1,
  streak: 0,
  sessionsCompleted: [],
  totalMinutes: 0,
  reviewModeCompletionCounts: EMPTY_REVIEW_COUNTS,
};

export type ProgressQueueRunner = <T>(task: () => Promise<T>) => Promise<T>;

type ProgressSliceOptions = {
  runProgressTask: ProgressQueueRunner;
};

export const createProgressSlice =
  ({ runProgressTask }: ProgressSliceOptions): StateCreator<AppProgressState, [], [], ProgressSlice> =>
  (set) => ({
    progress: EMPTY_PROGRESS,
    refreshProgress: async () => {
      const progress = await loadUserProgress();
      set({ progress });
    },
    applyProgressMutation: async (mutation) => runProgressTask(async () => {
      const progress = await mutation();
      set({ progress });
      return progress;
    }),
    completeSessionAndSync: async (params) =>
      runProgressTask(async () => {
        const progress = await completeSessionAndSave(params);
        set({ progress });
        return progress;
      }),
    completeLightReviewAndSync: async () =>
      runProgressTask(async () => {
        const progress = await completeLightReviewAndSave();
        set({ progress });
        return progress;
      }),
    completeDeepConsolidationAndSync: async () =>
      runProgressTask(async () => {
        const progress = await completeDeepConsolidationAndSave();
        set({ progress });
        return progress;
      }),
    completeReinforcementCheckpointAndSync: async (checkpointDay) =>
      runProgressTask(async () => {
        const progress = await completeReinforcementCheckpointAndSave(checkpointDay);
        set({ progress });
        return progress;
      }),
    markReinforcementCheckpointOfferedAndSync: async (checkpointDay) =>
      runProgressTask(async () => {
        const progress = await markReinforcementCheckpointOfferedAndSave(checkpointDay);
        set({ progress });
        return progress;
      }),
    markMicroReviewShownAndSync: async () =>
      runProgressTask(async () => {
        const progress = await markMicroReviewShownAndSave();
        set({ progress });
        return progress;
      }),
    markMicroReviewCompletedAndSync: async () =>
      runProgressTask(async () => {
        const progress = await markMicroReviewCompletedAndSave();
        set({ progress });
        return progress;
      }),
    incrementReviewModeCompletionAndSync: async (mode) =>
      runProgressTask(async () => {
        const progress = await incrementReviewModeCompletionAndSave(mode);
        set({ progress });
        return progress;
      }),
  });

