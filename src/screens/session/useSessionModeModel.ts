import { useAppProgressStore } from '../../state/app-progress-store';
import { useSessionModeControllers } from './useSessionModeControllers';
import { useNewDaySessionController } from './useNewDaySessionController';
import type { useSessionRuntimeModel } from './useSessionRuntimeModel';

type SessionRuntime = ReturnType<typeof useSessionRuntimeModel>;

export function useSessionModeModel(runtime: SessionRuntime) {
  const loadSessionDraftAndSync = useAppProgressStore((s) => s.loadSessionDraftAndSync);
  const saveSessionDraftAndSync = useAppProgressStore((s) => s.saveSessionDraftAndSync);
  const clearSessionDraftAndSync = useAppProgressStore((s) => s.clearSessionDraftAndSync);
  const completeLightReviewAndSync = useAppProgressStore((s) => s.completeLightReviewAndSync);
  const completeDeepConsolidationAndSync = useAppProgressStore((s) => s.completeDeepConsolidationAndSync);
  const completeReinforcementCheckpointAndSync = useAppProgressStore((s) => s.completeReinforcementCheckpointAndSync);
  const completeSessionAndSync = useAppProgressStore((s) => s.completeSessionAndSync);
  const incrementReviewModeCompletionAndSync = useAppProgressStore((s) => s.incrementReviewModeCompletionAndSync);
  const markMicroReviewShownAndSync = useAppProgressStore((s) => s.markMicroReviewShownAndSync);
  const markMicroReviewCompletedAndSync = useAppProgressStore((s) => s.markMicroReviewCompletedAndSync);
  const markReinforcementCheckpointOfferedAndSync = useAppProgressStore((s) => s.markReinforcementCheckpointOfferedAndSync);

  const modeControllers = useSessionModeControllers({
    day: runtime.route.day,
    allDaysCount: runtime.allDays.length,
    isPracticeMode: runtime.route.isPracticeMode,
    isLightReviewMode: runtime.route.isLightReviewMode,
    lightReviewBlocks: runtime.lightReviewBlocks,
    lightFallbackMinutes: runtime.reviewPlan.lightReview.durationMinutesMin,
    isDeepConsolidationMode: runtime.route.isDeepConsolidationMode,
    deepBlocks: runtime.deepBlocks,
    deepTotalMinutes: runtime.reviewPlan.deepConsolidation.durationMinutes,
    isMilestoneMode: runtime.route.isMilestoneMode,
    loadSessionDraftAndSync,
    saveSessionDraftAndSync,
    clearSessionDraftAndSync,
    completeLightReviewAndSync,
    completeDeepConsolidationAndSync,
    completeSessionAndSync,
    incrementReviewModeCompletionAndSync,
  });

  const newDayController = useNewDaySessionController({
    day: runtime.route.day,
    allDays: runtime.allDays,
    isNewDayMode: runtime.route.isNewDayMode,
    isPracticeMode: runtime.route.isPracticeMode,
    isComplete: runtime.engine.isComplete,
    progressSaved: runtime.persistence.progressSaved,
    shouldRunMicroReview: runtime.route.shouldRunMicroReview,
    resolvedReinforcementDay: runtime.route.resolvedReinforcementDay,
    resolvedReinforcementCheckpointDay: runtime.route.resolvedReinforcementCheckpointDay,
    incrementReviewModeCompletionAndSync: async () => incrementReviewModeCompletionAndSync('new_day'),
    completeReinforcementCheckpointAndSync,
    markReinforcementCheckpointOfferedAndSync,
    markMicroReviewShownAndSync,
    markMicroReviewCompletedAndSync,
  });

  return {
    modeControllers,
    newDayController,
  };
}
