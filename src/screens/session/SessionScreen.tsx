import React, { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/tokens';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { blurActiveElement } from '../../utils/blurActiveElement';
import { SessionActions } from './components/SessionActions';
import { SessionCard } from './components/SessionCard';
import { nextSectionExpectations, sectionHints } from './session-copy';
import { SessionScaffold } from './components/SessionScaffold';
import { CloudConsentModal } from './components/CloudConsentModal';
import { sessionStyles } from './session.styles';
import { ensureSrsCardsForDay } from '../../data/srs-store';
import { SessionModeGate } from './components/SessionModeGate';
import { useSessionViewModel } from './useSessionViewModel';

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

  useEffect(() => {
    if (!section) {
      return;
    }
    resetForSection();
  }, [section?.id, section, resetForSection]);

  useEffect(() => {
    resetSentenceShown();
    resetForSentence();
  }, [sentenceIndex, resetSentenceShown, resetForSentence]);

  useEffect(() => {
    if (!day) {
      return;
    }
    void ensureSrsCardsForDay(day);
  }, [day]);

  useEffect(() => {
    return () => {
      if (previousSoundRef.current) {
        void previousSoundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Wait for draft hydration to avoid false expiry on initial mount.
    const shouldAutoAdvanceOnTimerEnd = !!section && (isWarmupSection || section.type === 'patterns');
    if (!hydratedDraft || !shouldAutoAdvanceOnTimerEnd || remainingSeconds > 0) {
      return;
    }

    advanceToNextSection();
  }, [hydratedDraft, section, isWarmupSection, remainingSeconds, sectionIndex, sections.length, advanceToNextSection]);

  useEffect(() => {
    if (!isComplete || progressSaved) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [isComplete, progressSaved]);

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
      <Screen style={sessionStyles.container}>
        <View style={sessionStyles.completeWrap}>
          <AppText variant="screenTitle" center>
            Section Complete
          </AppText>
          <AppText variant="bodySecondary" center>
            Great work on {sectionTransition.completedTitle}.
          </AppText>
          <AppText variant="cardTitle" center>
            Up next: {sectionTransition.nextTitle}
          </AppText>
          <AppText variant="caption" center muted>
            {nextSectionExpectations[sectionTransition.nextType]}
          </AppText>
          <PrimaryButton
            label="Continue to Next Section"
            onPress={continueFromTransition}
          />
        </View>
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
    );
  }

  if (isComplete) {
    const elapsedLabel = formatSeconds(sessionElapsedSeconds);
    return (
      <Screen style={sessionStyles.container}>
        <View style={sessionStyles.completeWrap}>
          <AppText variant="screenTitle" center>
            Session Complete
          </AppText>
          <AppText variant="bodySecondary" center>
            {isPracticeMode ? `Practice complete for Day ${day?.dayNumber ?? 1}.` : `You completed Day ${day?.dayNumber ?? 1}.`}
          </AppText>
          <AppText variant="cardTitle" center>
            Total elapsed: {elapsedLabel}
          </AppText>
          <AppText variant="caption" center muted>
            Saved as elapsed session time in progress stats.
          </AppText>
          {!progressSaved ? (
            <AppText variant="caption" center muted>
              Saving progress...
            </AppText>
          ) : null}
          <PrimaryButton
            label="View Stats"
            onPress={async () => {
              blurActiveElement();
              await persistCompletionNow();
              router.push('/stats');
            }}
            disabled={!progressSaved}
          />
          <PrimaryButton
            label="Back Home"
            onPress={async () => {
              blurActiveElement();
              await persistCompletionNow();
              await showInterstitialIfReady();
              router.replace('/');
            }}
            disabled={!progressSaved}
          />
        </View>
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
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

  return (
    <SessionScaffold
      sectionTitle={section.title}
      sectionIndex={sectionIndex + 1}
      sectionsCount={sections.length}
      sectionType={section.type}
      sectionMetaText={sectionMetaWithMode}
      remainingLabel={formatSeconds(remainingSeconds)}
      timerColor={timerColor}
      onClose={() => void handleCloseSession()}
      footer={
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      }
    >
      <SessionCard
        sentence={sentence}
        speechText={speechText}
        isPatternSection={isPatternSection}
        isAnkiSection={isAnkiSection}
        isFreeSection={isFreeSection}
        patternRevealed={patternRevealed}
        ankiFlipped={ankiFlipped}
        patternPrompt={patternPrompt}
        patternTarget={patternTarget}
        ankiFront={ankiFront}
        ankiBack={ankiBack}
        freePrompt={freePrompt}
        freeCues={freeCues}
        sentenceShownLabel={formatSeconds(sentenceShownSeconds)}
      />

      <SessionActions
        sectionType={section.type}
        section={section}
        repRound={repRound}
        sentenceIndex={sentenceIndex}
        isRepEnforced={isRepEnforced}
        ankiFlipped={ankiFlipped}
        patternRevealed={patternRevealed}
        patternCompletedForSentence={!!patternCompleted[sentenceIndex]}
        hintText={sectionHints[section.type]}
        showRecordingControls={showRecordingControls}
        isRecording={isRecording}
        isPlaying={isPlaying}
        hasLastRecording={hasLastRecording}
        playbackPositionMs={playbackPositionMs}
        playbackDurationMs={playbackDurationMs}
        recordingErrorMessage={recordingErrorMessage}
        sttScore={sttScore}
        sttFeedback={sttFeedback}
        sttStatusMessage={sttStatusMessage}
        cloudUploadStatusMessage={cloudUploadStatusMessage}
        showCloudAction={showCloudScoringAction}
        cloudStatusMessage={cloudStatusMessage}
        onFlipAnki={() => setAnkiFlipped(true)}
        onGradeAnki={handleAnkiGrade}
        onRevealPattern={() => setPatternRevealed(true)}
        onCompletePattern={handleMarkPatternComplete}
        onNext={() => {
          if (section.type === 'free') {
            advanceToNextSection();
            return;
          }
          advanceSentenceOrSection();
        }}
        onNextSection={advanceToNextSection}
        showNextSectionAction={sectionIndex < sections.length - 1}
        onRestartTimer={() => {
          restartSectionTimer(section.duration);
        }}
        onStartRecording={() => {
          void startRecording();
        }}
        onStopRecording={() => {
          void stopRecording();
        }}
        onTogglePlayback={() => {
          void playLastRecording();
        }}
        onSeekPlayback={(progressRatio) => {
          void seekLastRecording(progressRatio);
        }}
        onRunCloudScore={() => {
          void handleRunCloudScore();
        }}
      />
      <CloudConsentModal
        visible={showCloudConsentModal}
        onApprove={() => {
          void approveCloudConsent();
        }}
        onDeny={() => {
          void denyCloudConsent();
        }}
        onDismiss={dismissConsentModal}
      />
    </SessionScaffold>
  );
}
