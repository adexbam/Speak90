import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { loadDays } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/tokens';
import { useInterstitialOnComplete } from '../../ads/useInterstitialOnComplete';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { blurActiveElement } from '../../utils/blurActiveElement';
import { SessionActions } from './components/SessionActions';
import { SessionCard } from './components/SessionCard';
import { nextSectionExpectations, sectionHints } from './session-copy';
import { parseBilingualPair } from './session-parsers';
import { SessionScaffold } from './components/SessionScaffold';
import { CloudConsentModal } from './components/CloudConsentModal';
import { useSessionEngine } from './useSessionEngine';
import { useSessionPersistence } from './useSessionPersistence';
import { useSessionTimer } from './useSessionTimer';
import { sessionStyles } from './session.styles';
import { useSessionStore } from '../../state/session-store';
import { useAppProgressStore } from '../../state/app-progress-store';
import { useSessionRecorder } from '../../audio/useSessionRecorder';
import { useCloudAudioConsent } from '../../audio/useCloudAudioConsent';
import { ensureSrsCardsForDay } from '../../data/srs-store';
import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useDailyMode } from '../../review/useDailyMode';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { buildDeepConsolidationVerbTargets } from '../../review/deep-consolidation';
import { useSessionModeControllers } from './useSessionModeControllers';
import { useNewDaySessionController } from './useNewDaySessionController';
import { SessionModeGate } from './components/SessionModeGate';
import { useSessionRouteModel } from './useSessionRouteModel';
import { useSessionActionHandlers } from './useSessionActionHandlers';

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function SessionScreen() {
  const router = useRouter();
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string | null>(null);
  const [previousPlayingUri, setPreviousPlayingUri] = useState<string | null>(null);
  const previousSoundRef = useRef<Audio.Sound | null>(null);
  const { resolution: dailyModeResolution } = useDailyMode();
  const allDays = useMemo(() => loadDays(), []);
  const {
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
  } = useSessionRouteModel({ allDays, dailyModeResolution });
  const { flags } = useFeatureFlags();
  const reviewPlan = useMemo(() => loadReviewPlan(), []);
  const lightReviewBlocks = reviewPlan.lightReview.blocks;
  const deepBlocks = reviewPlan.deepConsolidation.blocks;
  const deepVerbTargets = useMemo(() => buildDeepConsolidationVerbTargets(allDays), [allDays]);
  const {
    requestCloudConsent,
    isModalVisible: showCloudConsentModal,
    approveCloudConsent,
    denyCloudConsent,
    dismissConsentModal,
  } = useCloudAudioConsent();

  const patternRevealed = useSessionStore((s) => s.patternRevealed);
  const ankiFlipped = useSessionStore((s) => s.ankiFlipped);
  const patternCompleted = useSessionStore((s) => s.patternCompleted);
  const setPatternRevealed = useSessionStore((s) => s.setPatternRevealed);
  const setAnkiFlipped = useSessionStore((s) => s.setAnkiFlipped);
  const markPatternCompleted = useSessionStore((s) => s.markPatternCompleted);
  const resetForSection = useSessionStore((s) => s.resetForSection);
  const resetForSentence = useSessionStore((s) => s.resetForSentence);
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

  const sections = day?.sections ?? [];
  const {
    sectionIndex,
    sentenceIndex,
    repRound,
    sectionTransition,
    section,
    sentence,
    isComplete,
    isWarmupSection,
    isRepEnforced,
    restoreFromDraft,
    advanceToNextSection,
    continueFromTransition,
    advanceSentenceOrSection,
    advancePatternCard,
  } = useSessionEngine(sections);
  const showInterstitialIfReady = useInterstitialOnComplete();
  const isFreeSection = section?.type === 'free';
  const freePrompt = isFreeSection ? section.sentences[0] ?? '' : '';
  const freeCues = isFreeSection ? section.sentences.slice(1) : [];
  const isPatternSection = section?.type === 'patterns';
  const isAnkiSection = section?.type === 'anki';
  const patternPair = isPatternSection ? parseBilingualPair(sentence) : { front: sentence, back: sentence };
  const ankiPair = isAnkiSection ? parseBilingualPair(sentence) : { front: sentence, back: sentence };
  const patternPrompt = patternPair.front;
  const patternTarget = patternPair.back;
  const ankiFront = ankiPair.front;
  const ankiBack = ankiPair.back;
  const speechText = isPatternSection ? patternTarget : isAnkiSection ? ankiBack : sentence;
  const showRecordingControls = section?.type !== 'free';
  const showCloudScoringAction = flags.v3_stt_cloud_opt_in;
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
  } = useSessionRecorder({
    dayNumber: day?.dayNumber ?? 1,
    sectionId: isMilestoneMode ? 'milestone-audit' : section?.id ?? 'section',
    expectedText: speechText,
    cloudBackupFlagEnabled: flags.v3_cloud_backup,
    recordingKind: isMilestoneMode ? 'milestone' : 'session',
  });
  const { remainingSeconds, sentenceShownSeconds, sessionElapsedSeconds, resetSentenceShown, restartSectionTimer, hydrateFromDraft } =
    useSessionTimer({
      isComplete,
      sectionIndex,
      sectionId: section?.id,
    sectionDuration: section?.duration,
    });
  const modeControllers = useSessionModeControllers({
    day,
    allDaysCount: allDays.length,
    isPracticeMode,
    isLightReviewMode,
    lightReviewBlocks,
    lightFallbackMinutes: reviewPlan.lightReview.durationMinutesMin,
    isDeepConsolidationMode,
    deepBlocks,
    deepTotalMinutes: reviewPlan.deepConsolidation.durationMinutes,
    isMilestoneMode,
    hasLastRecording,
    loadSessionDraftAndSync,
    saveSessionDraftAndSync,
    clearSessionDraftAndSync,
    completeLightReviewAndSync,
    completeDeepConsolidationAndSync,
    completeSessionAndSync,
    incrementReviewModeCompletionAndSync,
  });
  const lightReview = modeControllers.light;
  const deepReview = modeControllers.deep;
  const milestoneReview = modeControllers.milestone;
  const { hydratedDraft, progressSaved, persistCompletionNow, persistDraftNow } = useSessionPersistence({
    enabled: !isLightReviewMode && !isDeepConsolidationMode && !isMilestoneMode,
    persistCompletion: !isPracticeMode,
    mode: resolvedMode,
    day,
    section,
    isComplete,
    totalDays: allDays.length,
    sectionIndex,
    sentenceIndex,
    repRound,
    remainingSeconds,
    sessionElapsedSeconds,
    restoreFromDraft,
    hydrateTimerFromDraft: hydrateFromDraft,
  });
  const newDayController = useNewDaySessionController({
    day,
    allDays,
    isNewDayMode,
    isPracticeMode,
    isComplete,
    progressSaved,
    shouldRunMicroReview,
    resolvedReinforcementDay,
    resolvedReinforcementCheckpointDay,
    incrementReviewModeCompletionAndSync: async () => incrementReviewModeCompletionAndSync('new_day'),
    completeReinforcementCheckpointAndSync,
    markReinforcementCheckpointOfferedAndSync,
    markMicroReviewShownAndSync,
    markMicroReviewCompletedAndSync,
  });
  const {
    handleCloseSession,
    handleRunCloudScore,
    handlePlayPreviousMilestone,
    handleMarkPatternComplete,
    handleAnkiGrade,
  } = useSessionActionHandlers({
    router,
    persistDraftNow,
    requestCloudConsent,
    setCloudStatusMessage,
    hasLastRecording,
    lightPersistDraftOnClose: lightReview.persistDraftOnClose,
    deepPersistDraftOnClose: deepReview.persistDraftOnClose,
    milestonePersistDraftOnClose: milestoneReview.persistDraftOnClose,
    isLightReviewMode,
    isDeepConsolidationMode,
    isMilestoneMode,
    previousSound: previousSoundRef.current,
    setPreviousSound: (sound) => {
      previousSoundRef.current = sound;
    },
    previousPlayingUri,
    setPreviousPlayingUri,
    day,
    section,
    sentence,
    sentenceIndex,
    markPatternCompleted,
    advancePatternCard,
    advanceSentenceOrSection,
  });

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
