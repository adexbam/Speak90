import type { Day } from '../../../data/day-model';
import type { SessionDraft } from '../../../data/session-draft-store';
import { useReviewBlockModeController } from './useReviewBlockModeController';

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
  return useReviewBlockModeController({
    day,
    isPracticeMode,
    isModeActive: isLightReviewMode,
    mode: 'light_review',
    analyticsSectionId: 'review.light_review',
    blocks: lightReviewBlocks,
    fallbackMinutes: lightFallbackMinutes,
    loadSessionDraftAndSync,
    saveSessionDraftAndSync,
    clearSessionDraftAndSync,
    completeModeAndSync: completeLightReviewAndSync,
    incrementReviewModeCompletionAndSync,
  });
}
