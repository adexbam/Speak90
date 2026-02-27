import React from 'react';
import { colors } from '../../ui/tokens';
import { blurActiveElement } from '../../utils/blurActiveElement';
import { SessionModeGate } from './components/SessionModeGate';
import { useSessionViewModel } from './useSessionViewModel';
import { SessionCompleteView } from './components/SessionCompleteView';
import { SessionTransitionView } from './components/SessionTransitionView';
import { SessionMainFlow, type SessionMainFlowHandlers, type SessionMainFlowModel } from './components/SessionMainFlow';
import { useSessionLifecycleEffects } from './useSessionLifecycleEffects';

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function SessionScreen() {
  const vm = useSessionViewModel();
  const { route, engine, timer, persistence, modeControllers, newDayController, recorder, store, actions, cloudConsent } = vm;
  const { day, isLightReviewMode, isDeepConsolidationMode, isMilestoneMode, isNewDayMode, isPracticeMode, shouldRunMicroReview, resolvedReinforcementDay } = route;
  const { section, sentence, sectionIndex, sentenceIndex, repRound, sectionTransition, isComplete, isWarmupSection, isRepEnforced } = engine;
  const { remainingSeconds, sentenceShownSeconds, sessionElapsedSeconds } = timer;
  const { hydratedDraft, progressSaved, persistCompletionNow } = persistence;
  const lightReview = modeControllers.light;
  const deepReview = modeControllers.deep;
  const milestoneReview = modeControllers.milestone;
  const {
    isRecording,
    isPlaying,
    hasLastRecording,
    playbackPositionMs,
    playbackDurationMs,
    errorMessage: recordingErrorMessage,
    sttScore,
    sttFeedback,
    sttStatusMessage,
    cloudUploadStatusMessage,
    startRecording,
    stopRecording,
    playLastRecording,
    seekLastRecording,
  } = recorder;
  const sections = day?.sections ?? [];
  const lightReviewBlocks = vm.lightReviewBlocks;
  const deepBlocks = vm.deepBlocks;
  const deepVerbTargets = vm.deepVerbTargets;
  const reviewPlan = vm.reviewPlan;
  const previousPlayingUri = vm.previousPlayingUri;
  const previousSoundRef = vm.previousSoundRef;
  const router = vm.router;
  const showInterstitialIfReady = vm.showInterstitialIfReady;
  const isFreeSection = vm.isFreeSection;
  const freePrompt = vm.freePrompt;
  const freeCues = vm.freeCues;
  const isPatternSection = vm.isPatternSection;
  const isAnkiSection = vm.isAnkiSection;
  const patternPrompt = vm.patternPrompt;
  const patternTarget = vm.patternTarget;
  const ankiFront = vm.ankiFront;
  const ankiBack = vm.ankiBack;
  const speechText = vm.speechText;
  const showRecordingControls = vm.showRecordingControls;
  const showCloudScoringAction = vm.showCloudScoringAction;
  const cloudStatusMessage = vm.cloudStatusMessage;
  const { resetForSection, resetForSentence, patternRevealed, ankiFlipped, patternCompleted, setPatternRevealed, setAnkiFlipped } = store;
  const { resetSentenceShown, restartSectionTimer } = timer;
  const { advanceToNextSection, continueFromTransition, advanceSentenceOrSection } = engine;
  const {
    handleCloseSession,
    handleRunCloudScore,
    handlePlayPreviousMilestone,
    handleMarkPatternComplete,
    handleAnkiGrade,
  } = actions;
  const {
    isModalVisible: showCloudConsentModal,
    approveCloudConsent,
    denyCloudConsent,
    dismissConsentModal,
  } = cloudConsent;

  useSessionLifecycleEffects({
    section,
    day,
    resetForSection,
    sentenceIndex,
    resetSentenceShown,
    resetForSentence,
    previousSoundRef,
    hydratedDraft,
    isWarmupSection,
    remainingSeconds,
    sectionIndex,
    sectionsCount: sections.length,
    advanceToNextSection,
    isComplete,
    progressSaved,
  });

  const gate = SessionModeGate({
    day,
    isLightReviewMode,
    isDeepConsolidationMode,
    isMilestoneMode,
    isNewDayMode,
    shouldRunMicroReview,
    onBackHome: () => {
      router.replace('/');
    },
    lightReview,
    deepReview,
    milestoneReview,
    lightReviewBlocks,
    deepBlocks,
    deepVerbTargets,
    deepDurationMinutes: reviewPlan.deepConsolidation.durationMinutes,
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
      isRecording,
      hasLastRecording,
      isPlaying,
      previousPlayingUri,
      onStartRecording: () => {
        void startRecording();
      },
      onStopRecording: () => {
        void stopRecording();
      },
      onPlayCurrent: () => {
        void playLastRecording();
      },
      onPlayPrevious: (uri) => {
        void handlePlayPreviousMilestone(uri);
      },
    },
  });
  if (gate) {
    return gate;
  }

  if (sectionTransition) {
    return (
      <SessionTransitionView
        completedTitle={sectionTransition.completedTitle}
        nextTitle={sectionTransition.nextTitle}
        nextType={sectionTransition.nextType}
        onContinue={continueFromTransition}
      />
    );
  }

  if (isComplete) {
    return (
      <SessionCompleteView
        dayNumber={day?.dayNumber ?? 1}
        elapsedLabel={formatSeconds(sessionElapsedSeconds)}
        progressSaved={progressSaved}
        isPracticeMode={isPracticeMode}
        onViewStats={async () => {
          blurActiveElement();
          await persistCompletionNow();
          router.push('/stats');
        }}
        onBackHome={async () => {
          blurActiveElement();
          await persistCompletionNow();
          await showInterstitialIfReady();
          router.replace('/');
        }}
      />
    );
  }

  const timerColor =
    remainingSeconds === 0
      ? colors.accentSuccess
      : remainingSeconds <= 10
        ? colors.accentWarning
        : colors.textPrimary;

  const sectionMetaText = isFreeSection
    ? 'Free output timer running'
    : isRepEnforced
      ? `Round ${repRound}/${section.reps} - Sentence ${sentenceIndex + 1}/${section.sentences.length}`
      : `Sentence ${sentenceIndex + 1}/${section.sentences.length} - x${section.reps} reps`;

  const modeLabel = 'New Day';
  const sectionMetaWithMode = `${sectionMetaText} • Mode: ${modeLabel}${resolvedReinforcementDay ? ` • Reinforce Day ${resolvedReinforcementDay}` : ''}`;

  const mainFlowModel: SessionMainFlowModel = {
    section,
    sectionsCount: sections.length,
    sectionIndex,
    sectionMetaText: sectionMetaWithMode,
    remainingLabel: formatSeconds(remainingSeconds),
    timerColor,
    sentence,
    sentenceIndex,
    repRound,
    isRepEnforced,
    isFreeSection,
    isPatternSection,
    isAnkiSection,
    patternRevealed,
    ankiFlipped,
    patternPrompt,
    patternTarget,
    ankiFront,
    ankiBack,
    freePrompt,
    freeCues,
    speechText,
    sentenceShownLabel: formatSeconds(sentenceShownSeconds),
    patternCompletedForSentence: !!patternCompleted[sentenceIndex],
    showRecordingControls,
    isRecording,
    isPlaying,
    hasLastRecording,
    playbackPositionMs,
    playbackDurationMs,
    recordingErrorMessage,
    sttScore,
    sttFeedback,
    sttStatusMessage,
    cloudUploadStatusMessage,
    showCloudAction: showCloudScoringAction,
    cloudStatusMessage,
    showNextSectionAction: sectionIndex < sections.length - 1,
    showCloudConsentModal,
  };

  const mainFlowHandlers: SessionMainFlowHandlers = {
    onClose: () => {
      void handleCloseSession();
    },
    onFlipAnki: () => setAnkiFlipped(true),
    onGradeAnki: handleAnkiGrade,
    onRevealPattern: () => setPatternRevealed(true),
    onCompletePattern: handleMarkPatternComplete,
    onNext: () => {
      if (section.type === 'free') {
        advanceToNextSection();
        return;
      }
      advanceSentenceOrSection();
    },
    onNextSection: advanceToNextSection,
    onRestartTimer: () => {
      restartSectionTimer(section.duration);
    },
    onStartRecording: () => {
      void startRecording();
    },
    onStopRecording: () => {
      void stopRecording();
    },
    onTogglePlayback: () => {
      void playLastRecording();
    },
    onSeekPlayback: (progressRatio) => {
      void seekLastRecording(progressRatio);
    },
    onRunCloudScore: () => {
      void handleRunCloudScore();
    },
    onApproveCloudConsent: () => {
      void approveCloudConsent();
    },
    onDenyCloudConsent: () => {
      void denyCloudConsent();
    },
    onDismissCloudConsent: dismissConsentModal,
  };

  return (
    <SessionMainFlow
      model={mainFlowModel}
      handlers={mainFlowHandlers}
    />
  );
}
