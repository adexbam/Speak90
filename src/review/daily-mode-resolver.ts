import type { UserProgress } from '../data/progress-store';
import { DEFAULT_REVIEW_PLAN, loadReviewPlan, type ReviewPlan } from '../data/review-plan-loader';

export type DailyMode = 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone';
type WeeklySlot = 'new' | 'light' | 'deep';

export type DailyModeResolution = {
  mode: DailyMode;
  weeklySlot: WeeklySlot;
  currentDay: number;
  isMilestoneDay: boolean;
  reinforcementReviewDay: number | null;
  reinforcementCheckpointDay: number | null;
  pendingReinforcementCheckpointDays: number[];
  dateKey: string;
};

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCadenceSlotFromProgress(progress: UserProgress, reviewPlan: ReviewPlan): WeeklySlot {
  const { newDaysPerWeek, lightReviewDaysPerWeek, deepConsolidationDaysPerWeek } = reviewPlan.weeklyCadence;
  const cadenceSpan = newDaysPerWeek + lightReviewDaysPerWeek + deepConsolidationDaysPerWeek;
  if (cadenceSpan <= 0) {
    return 'new';
  }

  const counts = progress.reviewModeCompletionCounts;
  const completedInCadence =
    (counts?.new_day ?? 0) +
    (counts?.light_review ?? 0) +
    (counts?.deep_consolidation ?? 0);
  const cycleIndex = ((completedInCadence % cadenceSpan) + cadenceSpan) % cadenceSpan;

  if (cycleIndex < newDaysPerWeek) {
    return 'new';
  }
  if (cycleIndex < newDaysPerWeek + lightReviewDaysPerWeek) {
    return 'light';
  }
  return 'deep';
}

export function resolveDailyMode(params: {
  progress: UserProgress;
  date?: Date;
  reviewPlan?: ReviewPlan;
}): DailyModeResolution {
  const date = params.date ?? new Date();
  const reviewPlan = params.reviewPlan ?? loadReviewPlan() ?? DEFAULT_REVIEW_PLAN;
  const currentDay = Math.max(1, params.progress.currentDay);
  const weeklySlot = getCadenceSlotFromProgress(params.progress, reviewPlan);

  const completedCheckpointDays = new Set(params.progress.completedReinforcementCheckpointDays ?? []);
  const pendingCheckpoints = reviewPlan.reinforcementCheckpoints
    .filter((checkpoint) => checkpoint.currentDay <= currentDay && !completedCheckpointDays.has(checkpoint.currentDay))
    .sort((a, b) => a.currentDay - b.currentDay);

  const pendingCheckpoint = pendingCheckpoints.length > 0 ? pendingCheckpoints[pendingCheckpoints.length - 1] : null;

  const reinforcementCheckpoint = pendingCheckpoint ?? null;
  const reinforcementReviewDay = reinforcementCheckpoint?.reviewDay ?? null;
  const reinforcementCheckpointDay = reinforcementCheckpoint?.currentDay ?? null;
  const isMilestoneDay = reviewPlan.milestoneDays.includes(currentDay);

  let mode: DailyMode = 'new_day';
  if (isMilestoneDay) {
    mode = 'milestone';
  } else if (weeklySlot === 'light') {
    mode = 'light_review';
  } else if (weeklySlot === 'deep') {
    mode = 'deep_consolidation';
  }

  return {
    mode,
    weeklySlot,
    currentDay,
    isMilestoneDay,
    reinforcementReviewDay,
    reinforcementCheckpointDay,
    pendingReinforcementCheckpointDays: pendingCheckpoints.map((checkpoint) => checkpoint.currentDay),
    dateKey: toLocalDateKey(date),
  };
}
