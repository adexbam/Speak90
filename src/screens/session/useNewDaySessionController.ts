import { useCallback, useEffect, useState } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import type { Day } from '../../data/day-model';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { loadSrsCards, type SrsCard } from '../../data/srs-store';
import { resolveMicroReviewPlan } from '../../review/micro-review-plan';

type UseNewDaySessionControllerParams = {
  day?: Day;
  allDays: Day[];
  isNewDayMode: boolean;
  isPracticeMode: boolean;
  isComplete: boolean;
  progressSaved: boolean;
  shouldRunMicroReview: boolean;
  resolvedReinforcementDay: string | null;
  resolvedReinforcementCheckpointDay: string | null;
  incrementReviewModeCompletionAndSync: (mode: 'new_day') => Promise<unknown>;
  completeReinforcementCheckpointAndSync: (checkpointDay: number) => Promise<unknown>;
  markReinforcementCheckpointOfferedAndSync: (checkpointDay: number) => Promise<unknown>;
  markMicroReviewShownAndSync: () => Promise<unknown>;
  markMicroReviewCompletedAndSync: () => Promise<unknown>;
};

export function useNewDaySessionController({
  day,
  allDays,
  isNewDayMode,
  isPracticeMode,
  isComplete,
  progressSaved,
  shouldRunMicroReview,
  resolvedReinforcementDay,
  resolvedReinforcementCheckpointDay,
  incrementReviewModeCompletionAndSync,
  completeReinforcementCheckpointAndSync,
  markReinforcementCheckpointOfferedAndSync,
  markMicroReviewShownAndSync,
  markMicroReviewCompletedAndSync,
}: UseNewDaySessionControllerParams) {
  const [modeCompletionSaved, setModeCompletionSaved] = useState(false);
  const [reinforcementSaved, setReinforcementSaved] = useState(false);
  const [reinforcementOfferedSaved, setReinforcementOfferedSaved] = useState(false);
  const [microReviewLoading, setMicroReviewLoading] = useState(false);
  const [microReviewCompleted, setMicroReviewCompleted] = useState(false);
  const [microReviewCards, setMicroReviewCards] = useState<SrsCard[]>([]);
  const [microReviewMemorySentences, setMicroReviewMemorySentences] = useState<string[]>([]);
  const [microReviewSource, setMicroReviewSource] = useState<'previous_day' | 'none'>('none');
  const [microReviewAnalyticsSaved, setMicroReviewAnalyticsSaved] = useState(false);

  useEffect(() => {
    setModeCompletionSaved(false);
    setMicroReviewAnalyticsSaved(false);
    setReinforcementOfferedSaved(false);
    setReinforcementSaved(false);
  }, [day?.dayNumber, isNewDayMode]);

  useEffect(() => {
    if (isPracticeMode || !isNewDayMode || !isComplete || !progressSaved || modeCompletionSaved) {
      return;
    }
    let active = true;
    const persist = async () => {
      await incrementReviewModeCompletionAndSync('new_day');
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.new_day',
        }),
      );
      if (active) {
        setModeCompletionSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [isPracticeMode, isNewDayMode, isComplete, progressSaved, modeCompletionSaved, day?.dayNumber, incrementReviewModeCompletionAndSync]);

  useEffect(() => {
    if (isPracticeMode || !isNewDayMode || !isComplete || !progressSaved || reinforcementSaved || !resolvedReinforcementCheckpointDay) {
      return;
    }
    const checkpointDay = Number(resolvedReinforcementCheckpointDay);
    if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
      return;
    }
    let active = true;
    const persist = async () => {
      await completeReinforcementCheckpointAndSync(checkpointDay);
      trackEvent(
        'reinforcement_completed',
        buildAnalyticsPayload(
          {
            dayNumber: day?.dayNumber ?? 1,
            sectionId: 'review.reinforcement',
          },
          {
            checkpointDay,
            reviewDay: resolvedReinforcementDay ? Number(resolvedReinforcementDay) : null,
          },
        ),
      );
      if (active) {
        setReinforcementSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [
    isPracticeMode,
    isNewDayMode,
    isComplete,
    progressSaved,
    reinforcementSaved,
    resolvedReinforcementCheckpointDay,
    day?.dayNumber,
    resolvedReinforcementDay,
    completeReinforcementCheckpointAndSync,
  ]);

  useEffect(() => {
    if (isPracticeMode || !isNewDayMode || !resolvedReinforcementCheckpointDay || reinforcementOfferedSaved) {
      return;
    }
    const checkpointDay = Number(resolvedReinforcementCheckpointDay);
    if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
      return;
    }
    let active = true;
    const persist = async () => {
      await markReinforcementCheckpointOfferedAndSync(checkpointDay);
      if (active) {
        setReinforcementOfferedSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [isPracticeMode, isNewDayMode, resolvedReinforcementCheckpointDay, reinforcementOfferedSaved, markReinforcementCheckpointOfferedAndSync]);

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
  }, [day, isNewDayMode, shouldRunMicroReview, isPracticeMode, allDays, markMicroReviewShownAndSync]);

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
  ]);

  return {
    microReviewLoading,
    microReviewCompleted,
    microReviewCards,
    microReviewMemorySentences,
    microReviewSource,
    completeMicroReview,
  };
}
