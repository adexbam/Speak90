import { useEffect } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../../analytics/events';
import type { Day } from '../../../data/day-model';

type UseReviewBlockCompletionPersistenceParams = {
  day?: Day;
  isPracticeMode: boolean;
  isModeActive: boolean;
  completed: boolean;
  saved: boolean;
  setSaved: (next: boolean) => void;
  analyticsSectionId: 'review.light_review' | 'review.deep_consolidation';
  completeModeAndSync: () => Promise<unknown>;
  incrementReviewModeCompletionAndSync: () => Promise<unknown>;
  clearSessionDraftAndSync: () => Promise<void>;
};

export function useReviewBlockCompletionPersistence({
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
}: UseReviewBlockCompletionPersistenceParams) {
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
      if (active) {
        setSaved(true);
      }
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
    setSaved,
  ]);
}

