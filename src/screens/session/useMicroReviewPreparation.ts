import { useCallback, useEffect } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import type { Day } from '../../data/day-model';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { loadSrsCards, type SrsCard } from '../../data/srs-store';
import { resolveMicroReviewPlan } from '../../review/micro-review-plan';

type UseMicroReviewPreparationParams = {
  day?: Day;
  allDays: Day[];
  isNewDayMode: boolean;
  shouldRunMicroReview: boolean;
  isPracticeMode: boolean;
  microReviewAnalyticsSaved: boolean;
  setMicroReviewAnalyticsSaved: (value: boolean) => void;
  setMicroReviewLoading: (value: boolean) => void;
  setMicroReviewCompleted: (value: boolean) => void;
  setMicroReviewCards: (value: SrsCard[]) => void;
  setMicroReviewMemorySentences: (value: string[]) => void;
  setMicroReviewSource: (value: 'previous_day' | 'none') => void;
  microReviewSource: 'previous_day' | 'none';
  microReviewCards: SrsCard[];
  microReviewMemorySentences: string[];
  markMicroReviewShownAndSync: () => Promise<unknown>;
  markMicroReviewCompletedAndSync: () => Promise<unknown>;
};

export function useMicroReviewPreparation({
  day,
  allDays,
  isNewDayMode,
  shouldRunMicroReview,
  isPracticeMode,
  microReviewAnalyticsSaved,
  setMicroReviewAnalyticsSaved,
  setMicroReviewLoading,
  setMicroReviewCompleted,
  setMicroReviewCards,
  setMicroReviewMemorySentences,
  setMicroReviewSource,
  microReviewSource,
  microReviewCards,
  microReviewMemorySentences,
  markMicroReviewShownAndSync,
  markMicroReviewCompletedAndSync,
}: UseMicroReviewPreparationParams) {
  useEffect(() => {
    let active = true;
    const prepareMicroReview = async () => {
      if (!day || !isNewDayMode || !shouldRunMicroReview) {
        if (active) {
          setMicroReviewCompleted(true);
          setMicroReviewLoading(false);
          setMicroReviewCards([]);
          setMicroReviewMemorySentences([]);
          setMicroReviewSource('none');
        }
        return;
      }

      setMicroReviewLoading(true);
      setMicroReviewCompleted(false);
      try {
        if (!isPracticeMode) {
          await markMicroReviewShownAndSync();
        }
        const plan = loadReviewPlan();
        const cards = await loadSrsCards();
        if (!active) return;
        const resolvedMicroReview = resolveMicroReviewPlan({
          allDays,
          cards,
          currentDayNumber: day.dayNumber,
          reviewPlan: plan,
        });
        setMicroReviewCards(resolvedMicroReview.cards);
        setMicroReviewMemorySentences(resolvedMicroReview.memorySentences);
        setMicroReviewSource(resolvedMicroReview.source);
      } catch {
        if (!active) return;
        setMicroReviewCards([]);
        setMicroReviewMemorySentences([]);
        setMicroReviewSource('none');
      } finally {
        if (active) {
          setMicroReviewLoading(false);
        }
      }
    };
    void prepareMicroReview();
    return () => {
      active = false;
    };
  }, [day, isNewDayMode, shouldRunMicroReview, isPracticeMode, allDays, markMicroReviewShownAndSync, setMicroReviewCards, setMicroReviewCompleted, setMicroReviewLoading, setMicroReviewMemorySentences, setMicroReviewSource]);

  const completeMicroReview = useCallback(() => {
    if (!day) {
      return;
    }
    if (!isPracticeMode) {
      void markMicroReviewCompletedAndSync();
    }
    if (!microReviewAnalyticsSaved) {
      trackEvent(
        'micro_review_completed',
        buildAnalyticsPayload(
          {
            dayNumber: day.dayNumber,
            sectionId: 'review.micro',
          },
          {
            source: microReviewSource,
            oldCardsCount: microReviewCards.length,
            memorySentencesCount: microReviewMemorySentences.length,
          },
        ),
      );
      setMicroReviewAnalyticsSaved(true);
    }
    setMicroReviewCompleted(true);
  }, [
    day,
    isPracticeMode,
    markMicroReviewCompletedAndSync,
    microReviewAnalyticsSaved,
    microReviewSource,
    microReviewCards.length,
    microReviewMemorySentences.length,
    setMicroReviewAnalyticsSaved,
    setMicroReviewCompleted,
  ]);

  return {
    completeMicroReview,
  };
}
