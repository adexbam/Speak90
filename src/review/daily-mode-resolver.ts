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
  dateKey: string;
};

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeeklySlot(date: Date, reviewPlan: ReviewPlan): WeeklySlot {
  // Convert JS day index to Monday-first: Mon=0..Sun=6
  const mondayFirstIndex = (date.getDay() + 6) % 7;
  const { newDaysPerWeek, lightReviewDaysPerWeek } = reviewPlan.weeklyCadence;

  if (mondayFirstIndex < newDaysPerWeek) {
    return 'new';
  }

  if (mondayFirstIndex < newDaysPerWeek + lightReviewDaysPerWeek) {
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
  const weeklySlot = getWeeklySlot(date, reviewPlan);

  const reinforcementCheckpoint = reviewPlan.reinforcementCheckpoints.find((checkpoint) => checkpoint.currentDay === currentDay);
  const reinforcementReviewDay = reinforcementCheckpoint?.reviewDay ?? null;
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
    dateKey: toLocalDateKey(date),
  };
}
