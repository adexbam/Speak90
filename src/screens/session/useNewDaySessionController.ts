import { useEffect, useState } from 'react';
import type { Day } from '../../data/day-model';
import type { SrsCard } from '../../data/srs-store';
import { useNewDayCompletionEffects } from './useNewDayCompletionEffects';
import { useMicroReviewPreparation } from './useMicroReviewPreparation';

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

  useNewDayCompletionEffects({
    day,
    isPracticeMode,
    isNewDayMode,
    isComplete,
    progressSaved,
    modeCompletionSaved,
    setModeCompletionSaved,
    reinforcementSaved,
    setReinforcementSaved,
    reinforcementOfferedSaved,
    setReinforcementOfferedSaved,
    resolvedReinforcementDay,
    resolvedReinforcementCheckpointDay,
    incrementReviewModeCompletionAndSync,
    completeReinforcementCheckpointAndSync,
    markReinforcementCheckpointOfferedAndSync,
  });

  const { completeMicroReview } = useMicroReviewPreparation({
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
  });

  return {
    microReviewLoading,
    microReviewCompleted,
    microReviewCards,
    microReviewMemorySentences,
    microReviewSource,
    completeMicroReview,
  };
}
