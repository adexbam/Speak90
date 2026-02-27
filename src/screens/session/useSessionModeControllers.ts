import type { Day } from '../../data/day-model';
import type { SessionDraft } from '../../data/session-draft-store';
import { useDeepConsolidationController } from './modes/useDeepConsolidationController';
import { useLightReviewController } from './modes/useLightReviewController';
import { useMilestoneController } from './modes/useMilestoneController';

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
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
  completeLightReviewAndSync: () => Promise<unknown>;
  completeDeepConsolidationAndSync: () => Promise<unknown>;
  completeSessionAndSync: (params: { completedDay: number; sessionSeconds: number; totalDays: number }) => Promise<unknown>;
  incrementReviewModeCompletionAndSync: (mode: 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone') => Promise<unknown>;
};

export function useSessionModeControllers(params: UseSessionModeControllersParams) {
  const light = useLightReviewController({
    day: params.day,
    isPracticeMode: params.isPracticeMode,
    isLightReviewMode: params.isLightReviewMode,
    lightReviewBlocks: params.lightReviewBlocks,
    lightFallbackMinutes: params.lightFallbackMinutes,
    loadSessionDraftAndSync: params.loadSessionDraftAndSync,
    saveSessionDraftAndSync: params.saveSessionDraftAndSync,
    clearSessionDraftAndSync: params.clearSessionDraftAndSync,
    completeLightReviewAndSync: params.completeLightReviewAndSync,
    incrementReviewModeCompletionAndSync: async () => params.incrementReviewModeCompletionAndSync('light_review'),
  });

  const deep = useDeepConsolidationController({
    day: params.day,
    isPracticeMode: params.isPracticeMode,
    isDeepConsolidationMode: params.isDeepConsolidationMode,
    deepBlocks: params.deepBlocks,
    deepTotalMinutes: params.deepTotalMinutes,
    loadSessionDraftAndSync: params.loadSessionDraftAndSync,
    saveSessionDraftAndSync: params.saveSessionDraftAndSync,
    clearSessionDraftAndSync: params.clearSessionDraftAndSync,
    completeDeepConsolidationAndSync: params.completeDeepConsolidationAndSync,
    incrementReviewModeCompletionAndSync: async () => params.incrementReviewModeCompletionAndSync('deep_consolidation'),
  });

  const milestone = useMilestoneController({
    day: params.day,
    allDaysCount: params.allDaysCount,
    isPracticeMode: params.isPracticeMode,
    isMilestoneMode: params.isMilestoneMode,
    loadSessionDraftAndSync: params.loadSessionDraftAndSync,
    saveSessionDraftAndSync: params.saveSessionDraftAndSync,
    clearSessionDraftAndSync: params.clearSessionDraftAndSync,
    completeSessionAndSync: params.completeSessionAndSync,
    incrementReviewModeCompletionAndSync: async () => params.incrementReviewModeCompletionAndSync('milestone'),
  });

  return {
    light,
    deep,
    milestone,
  };
}
