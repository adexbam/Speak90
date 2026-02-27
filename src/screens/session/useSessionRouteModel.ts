import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import type { Day } from '../../data/day-model';
import type { DailyModeResolution } from '../../review/daily-mode-resolver';
import { parseSessionRouteParams, type SessionRouteParams } from './session-route-params';

type UseSessionRouteModelParams = {
  allDays: Day[];
  dailyModeResolution: DailyModeResolution | null;
};

export function useSessionRouteModel({
  allDays,
  dailyModeResolution,
}: UseSessionRouteModelParams) {
  const params = useLocalSearchParams<SessionRouteParams>();
  const parsedParams = useMemo(
    () =>
      parseSessionRouteParams({
        raw: params,
        totalDays: allDays.length,
        fallbackMode: dailyModeResolution?.mode,
        fallbackReinforcementDay: dailyModeResolution?.reinforcementReviewDay ?? null,
        fallbackReinforcementCheckpointDay: dailyModeResolution?.reinforcementCheckpointDay ?? null,
      }),
    [
      params,
      allDays.length,
      dailyModeResolution?.mode,
      dailyModeResolution?.reinforcementReviewDay,
      dailyModeResolution?.reinforcementCheckpointDay,
    ],
  );

  const selectedDayNumber = parsedParams.selectedDayNumber;
  const day = useMemo(() => allDays.find((d) => d.dayNumber === selectedDayNumber), [allDays, selectedDayNumber]);
  const resolvedMode = parsedParams.resolvedMode;
  const isLightReviewMode = resolvedMode === 'light_review';
  const isDeepConsolidationMode = resolvedMode === 'deep_consolidation';
  const isMilestoneMode = resolvedMode === 'milestone';
  const isNewDayMode = resolvedMode === 'new_day';
  const isPracticeMode = parsedParams.isPracticeMode;
  const resolvedReinforcementDay = parsedParams.resolvedReinforcementDay;
  const resolvedReinforcementCheckpointDay = parsedParams.resolvedReinforcementCheckpointDay;
  const shouldRunMicroReview = !!day && isNewDayMode && day.dayNumber > 1;

  return {
    day,
    resolvedMode,
    isLightReviewMode,
    isDeepConsolidationMode,
    isMilestoneMode,
    isNewDayMode,
    isPracticeMode,
    resolvedReinforcementDay,
    resolvedReinforcementCheckpointDay,
    shouldRunMicroReview,
  };
}

