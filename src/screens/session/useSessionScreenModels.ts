import { colors } from '../../ui/tokens';
import type { SessionModeGateProps } from './components/SessionModeGate';
import type { SessionMainFlowHandlers, SessionMainFlowModel } from './components/SessionMainFlow';
import type { useSessionViewModel } from './useSessionViewModel';

type SessionViewModel = ReturnType<typeof useSessionViewModel>;

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function getSessionElapsedLabel(vm: SessionViewModel): string {
  return formatSeconds(vm.timer.sessionElapsedSeconds);
}

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

export function buildSessionMainFlow(vm: SessionViewModel): {
  model: SessionMainFlowModel;
  handlers: SessionMainFlowHandlers;
} {
  const { route, engine, timer, store, recorder, actions, cloudConsent } = vm;
  const section = engine.section;
  const sections = route.day?.sections ?? [];

  const timerColor =
    timer.remainingSeconds === 0
      ? colors.accentSuccess
      : timer.remainingSeconds <= 10
        ? colors.accentWarning
        : colors.textPrimary;

  const sectionMetaText = vm.isFreeSection
    ? 'Free output timer running'
    : engine.isRepEnforced
      ? `Round ${engine.repRound}/${section.reps} - Sentence ${engine.sentenceIndex + 1}/${section.sentences.length}`
      : `Sentence ${engine.sentenceIndex + 1}/${section.sentences.length} - x${section.reps} reps`;

  const modeLabel = 'New Day';
  const sectionMetaWithMode = `${sectionMetaText} • Mode: ${modeLabel}${route.resolvedReinforcementDay ? ` • Reinforce Day ${route.resolvedReinforcementDay}` : ''}`;

  return {
    model: {
      section,
      sectionsCount: sections.length,
      sectionIndex: engine.sectionIndex,
      sectionMetaText: sectionMetaWithMode,
      remainingLabel: formatSeconds(timer.remainingSeconds),
      timerColor,
      sentence: engine.sentence,
      sentenceIndex: engine.sentenceIndex,
      repRound: engine.repRound,
      isRepEnforced: engine.isRepEnforced,
      isFreeSection: vm.isFreeSection,
      isPatternSection: vm.isPatternSection,
      isAnkiSection: vm.isAnkiSection,
      patternRevealed: store.patternRevealed,
      ankiFlipped: store.ankiFlipped,
      patternPrompt: vm.patternPrompt,
      patternTarget: vm.patternTarget,
      ankiFront: vm.ankiFront,
      ankiBack: vm.ankiBack,
      freePrompt: vm.freePrompt,
      freeCues: vm.freeCues,
      speechText: vm.speechText,
      sentenceShownLabel: formatSeconds(timer.sentenceShownSeconds),
      patternCompletedForSentence: !!store.patternCompleted[engine.sentenceIndex],
      showRecordingControls: vm.showRecordingControls,
      isRecording: recorder.isRecording,
      isPlaying: recorder.isPlaying,
      hasLastRecording: recorder.hasLastRecording,
      playbackPositionMs: recorder.playbackPositionMs,
      playbackDurationMs: recorder.playbackDurationMs,
      recordingErrorMessage: recorder.errorMessage,
      sttScore: recorder.sttScore,
      sttFeedback: recorder.sttFeedback,
      sttStatusMessage: recorder.sttStatusMessage,
      cloudUploadStatusMessage: recorder.cloudUploadStatusMessage,
      showCloudAction: vm.showCloudScoringAction,
      cloudStatusMessage: vm.cloudStatusMessage,
      showNextSectionAction: engine.sectionIndex < sections.length - 1,
      showCloudConsentModal: cloudConsent.isModalVisible,
    },
    handlers: {
      onClose: () => {
        void actions.handleCloseSession();
      },
      onFlipAnki: () => store.setAnkiFlipped(true),
      onGradeAnki: actions.handleAnkiGrade,
      onRevealPattern: () => store.setPatternRevealed(true),
      onCompletePattern: actions.handleMarkPatternComplete,
      onNext: () => {
        if (section.type === 'free') {
          engine.advanceToNextSection();
          return;
        }
        engine.advanceSentenceOrSection();
      },
      onNextSection: engine.advanceToNextSection,
      onRestartTimer: () => {
        timer.restartSectionTimer(section.duration);
      },
      onStartRecording: () => {
        void recorder.startRecording();
      },
      onStopRecording: () => {
        void recorder.stopRecording();
      },
      onTogglePlayback: () => {
        void recorder.playLastRecording();
      },
      onSeekPlayback: (progressRatio) => {
        void recorder.seekLastRecording(progressRatio);
      },
      onRunCloudScore: () => {
        void actions.handleRunCloudScore();
      },
      onApproveCloudConsent: () => {
        void cloudConsent.approveCloudConsent();
      },
      onDenyCloudConsent: () => {
        void cloudConsent.denyCloudConsent();
      },
      onDismissCloudConsent: cloudConsent.dismissConsentModal,
    },
  };
}
