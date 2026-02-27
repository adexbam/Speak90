import type { Day } from '../../../data/day-model';
import type { SessionDraft } from '../../../data/session-draft-store';
import { useReviewBlockModeController } from './useReviewBlockModeController';

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
  const fallbackPerBlockMinutes = Math.max(1, Math.floor(deepTotalMinutes / Math.max(1, deepBlocks.length)));

  return useReviewBlockModeController({
    day,
    isPracticeMode,
    isModeActive: isDeepConsolidationMode,
    mode: 'deep_consolidation',
    analyticsSectionId: 'review.deep_consolidation',
    blocks: deepBlocks,
    fallbackMinutes: fallbackPerBlockMinutes,
    loadSessionDraftAndSync,
    saveSessionDraftAndSync,
    clearSessionDraftAndSync,
    completeModeAndSync: completeDeepConsolidationAndSync,
    incrementReviewModeCompletionAndSync,
  });
}
