import type { SessionModeGateProps } from './components/SessionModeGate';
import type { SessionViewModel } from './useSessionScreenModel.shared';

export function buildSessionModeGateProps(vm: SessionViewModel): SessionModeGateProps {
  const { route, modeControllers, newDayController, recorder } = vm;
  const day = route.day;

  return {
    day,
    isLightReviewMode: route.isLightReviewMode,
    isDeepConsolidationMode: route.isDeepConsolidationMode,
    isMilestoneMode: route.isMilestoneMode,
    isNewDayMode: route.isNewDayMode,
    shouldRunMicroReview: route.shouldRunMicroReview,
    onBackHome: () => {
      vm.router.replace('/');
    },
    lightReview: modeControllers.light,
    deepReview: modeControllers.deep,
    milestoneReview: modeControllers.milestone,
    lightReviewBlocks: vm.lightReviewBlocks,
    deepBlocks: vm.deepBlocks,
    deepVerbTargets: vm.deepVerbTargets,
    deepDurationMinutes: vm.reviewPlan.deepConsolidation.durationMinutes,
    microReview: {
      loading: newDayController.microReviewLoading,
      cards: newDayController.microReviewCards,
      memorySentences: newDayController.microReviewMemorySentences,
      source: newDayController.microReviewSource,
      completed: newDayController.microReviewCompleted,
      onContinue: newDayController.completeMicroReview,
    },
    milestoneRuntime: {
      dayNumber: day?.dayNumber,
      isRecording: recorder.isRecording,
      hasLastRecording: recorder.hasLastRecording,
      isPlaying: recorder.isPlaying,
      previousPlayingUri: vm.previousPlayingUri,
      onStartRecording: () => {
        void recorder.startRecording();
      },
      onStopRecording: () => {
        void recorder.stopRecording();
      },
      onPlayCurrent: () => {
        void recorder.playLastRecording();
      },
      onPlayPrevious: (uri) => {
        void vm.actions.handlePlayPreviousMilestone(uri);
      },
    },
  };
}
