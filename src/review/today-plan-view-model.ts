import type { UserProgress } from '../data/progress-store';
import type { ReviewPlan } from '../data/review-plan-loader';
import type { DailyModeResolution } from './daily-mode-resolver';
import { computeReviewGuardrail } from './review-guardrail';

export type TodayPlanViewModel = {
  modeKey: NonNullable<DailyModeResolution['mode']>;
  modeLabel: string;
  durationLabel: string;
  checklist: string[];
  guardrailMessage: string | null;
};

function modeLabelFor(mode: DailyModeResolution['mode']): string {
  if (mode === 'light_review') {
    return 'Light Review';
  }
  if (mode === 'deep_consolidation') {
    return 'Deep Consolidation';
  }
  if (mode === 'milestone') {
    return 'Milestone';
  }
  return 'New Day';
}

export function buildTodayPlanViewModel(params: {
  currentDay: number;
  resolution: DailyModeResolution | null;
  reviewPlan: ReviewPlan;
  progress: UserProgress;
}): TodayPlanViewModel {
  const modeKey = params.resolution?.mode ?? 'new_day';
  const modeLabel = modeLabelFor(modeKey);

  const checklist =
    modeKey === 'light_review'
      ? params.reviewPlan.lightReview.blocks.map((block) => `${block.title}${block.durationMinutes ? ` (${block.durationMinutes}m)` : ''}`)
      : modeKey === 'deep_consolidation'
        ? params.reviewPlan.deepConsolidation.blocks.map((block) => `${block.title}${block.durationMinutes ? ` (${block.durationMinutes}m)` : ''}`)
        : modeKey === 'milestone'
          ? ['10-minute continuous fluency recording', 'Replay and compare with previous milestones']
          : [
              params.currentDay > 1 ? 'Micro-review: Session 1 previous-day Anki + Session 2 memory drill' : null,
              params.resolution?.reinforcementReviewDay ? `Spaced reinforcement: review Day ${params.resolution.reinforcementReviewDay}` : null,
              'Main session: 7 sections',
            ].filter((item): item is string => !!item);

  const durationLabel =
    modeKey === 'light_review'
      ? `${params.reviewPlan.lightReview.durationMinutesMin}-${params.reviewPlan.lightReview.durationMinutesMax} min`
      : modeKey === 'deep_consolidation'
        ? `${params.reviewPlan.deepConsolidation.durationMinutes} min`
        : modeKey === 'milestone'
          ? '10 min'
          : '40-45 min';

  return {
    modeKey,
    modeLabel,
    durationLabel,
    checklist,
    guardrailMessage: computeReviewGuardrail(params.progress).message ?? null,
  };
}

