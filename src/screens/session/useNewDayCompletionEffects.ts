import { useEffect } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import type { Day } from '../../data/day-model';

type UseNewDayCompletionEffectsParams = {
  day?: Day;
  isPracticeMode: boolean;
  isNewDayMode: boolean;
  isComplete: boolean;
  progressSaved: boolean;
  modeCompletionSaved: boolean;
  setModeCompletionSaved: (value: boolean) => void;
  reinforcementSaved: boolean;
  setReinforcementSaved: (value: boolean) => void;
  reinforcementOfferedSaved: boolean;
  setReinforcementOfferedSaved: (value: boolean) => void;
  resolvedReinforcementDay: string | null;
  resolvedReinforcementCheckpointDay: string | null;
  incrementReviewModeCompletionAndSync: (mode: 'new_day') => Promise<unknown>;
  completeReinforcementCheckpointAndSync: (checkpointDay: number) => Promise<unknown>;
  markReinforcementCheckpointOfferedAndSync: (checkpointDay: number) => Promise<unknown>;
};

export function useNewDayCompletionEffects({
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
}: UseNewDayCompletionEffectsParams) {
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
  }, [isPracticeMode, isNewDayMode, isComplete, progressSaved, modeCompletionSaved, day?.dayNumber, incrementReviewModeCompletionAndSync, setModeCompletionSaved]);

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
    setReinforcementSaved,
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
  }, [isPracticeMode, isNewDayMode, resolvedReinforcementCheckpointDay, reinforcementOfferedSaved, markReinforcementCheckpointOfferedAndSync, setReinforcementOfferedSaved]);
}
