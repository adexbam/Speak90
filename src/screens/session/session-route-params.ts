import type { DailyMode } from '../../review/daily-mode-resolver';

export type SessionRouteParams = {
  day?: string;
  mode?: string;
  reinforcementReviewDay?: string;
  reinforcementCheckpointDay?: string;
  practice?: string;
};

type ParsedSessionRouteParams = {
  selectedDayNumber: number;
  resolvedMode: DailyMode;
  isPracticeMode: boolean;
  resolvedReinforcementDay: string | null;
  resolvedReinforcementCheckpointDay: string | null;
};

function isDailyMode(value: string | undefined): value is DailyMode {
  return value === 'new_day' || value === 'light_review' || value === 'deep_consolidation' || value === 'milestone';
}

export function parseSessionRouteParams(params: {
  raw: SessionRouteParams;
  totalDays: number;
  fallbackMode?: DailyMode;
  fallbackReinforcementDay?: number | null;
  fallbackReinforcementCheckpointDay?: number | null;
}): ParsedSessionRouteParams {
  const requestedDay = Number(params.raw.day);
  const selectedDayNumber =
    Number.isInteger(requestedDay) && requestedDay > 0
      ? Math.min(requestedDay, params.totalDays)
      : 1;

  const resolvedMode = isDailyMode(params.raw.mode) ? params.raw.mode : params.fallbackMode ?? 'new_day';
  const isPracticeMode = params.raw.practice === '1';
  const resolvedReinforcementDay =
    params.raw.reinforcementReviewDay ??
    (params.fallbackReinforcementDay ? String(params.fallbackReinforcementDay) : null);
  const resolvedReinforcementCheckpointDay =
    params.raw.reinforcementCheckpointDay ??
    (params.fallbackReinforcementCheckpointDay ? String(params.fallbackReinforcementCheckpointDay) : null);

  return {
    selectedDayNumber,
    resolvedMode,
    isPracticeMode,
    resolvedReinforcementDay,
    resolvedReinforcementCheckpointDay,
  };
}

