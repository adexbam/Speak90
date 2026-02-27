import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { ensureSrsCardsForDay, loadSrsCards, reviewSrsCard, type SrsCard } from '../../data/srs-store';
import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useDailyMode } from '../../review/useDailyMode';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { resolveMicroReviewPlan } from '../../review/micro-review-plan';
import { LightReviewRunner } from './components/LightReviewRunner';
import { DeepConsolidationRunner } from './components/DeepConsolidationRunner';
import { buildDeepConsolidationVerbTargets } from '../../review/deep-consolidation';
import { MilestoneRunner } from './components/MilestoneRunner';
import { MicroReviewRunner } from './components/MicroReviewRunner';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import { parseSessionRouteParams, type SessionRouteParams } from './session-route-params';
import { useSessionModeControllers } from './useSessionModeControllers';

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
  const [microReviewLoading, setMicroReviewLoading] = useState(false);
  const [microReviewCompleted, setMicroReviewCompleted] = useState(false);
  const [microReviewCards, setMicroReviewCards] = useState<SrsCard[]>([]);
  const [microReviewMemorySentences, setMicroReviewMemorySentences] = useState<string[]>([]);
  const [microReviewSource, setMicroReviewSource] = useState<'previous_day' | 'none'>('none');
  const [reinforcementSaved, setReinforcementSaved] = useState(false);
  const [previousPlayingUri, setPreviousPlayingUri] = useState<string | null>(null);
  const previousSoundRef = useRef<Audio.Sound | null>(null);
  const [newDayModeCompletionSaved, setNewDayModeCompletionSaved] = useState(false);
  const [microReviewAnalyticsSaved, setMicroReviewAnalyticsSaved] = useState(false);
  const [reinforcementOfferedSaved, setReinforcementOfferedSaved] = useState(false);
  const params = useLocalSearchParams<SessionRouteParams>();
  const { resolution: dailyModeResolution } = useDailyMode();
  const allDays = useMemo(() => loadDays(), []);
  const parsedParams = useMemo(
    () =>
      parseSessionRouteParams({
        raw: params,
        totalDays: allDays.length,
        fallbackMode: dailyModeResolution?.mode,
        fallbackReinforcementDay: dailyModeResolution?.reinforcementReviewDay ?? null,
        fallbackReinforcementCheckpointDay: dailyModeResolution?.reinforcementCheckpointDay ?? null,
      }),
    [allDays.length, dailyModeResolution?.mode, dailyModeResolution?.reinforcementCheckpointDay, dailyModeResolution?.reinforcementReviewDay, params],
  );
  const selectedDayNumber = parsedParams.selectedDayNumber;
  const day = useMemo(() => allDays.find((d) => d.dayNumber === selectedDayNumber), [allDays, selectedDayNumber]);
  const { flags } = useFeatureFlags();
  const resolvedMode = parsedParams.resolvedMode;
  const isLightReviewMode = resolvedMode === 'light_review';
  const isDeepConsolidationMode = resolvedMode === 'deep_consolidation';
  const isMilestoneMode = resolvedMode === 'milestone';
  const isNewDayMode = resolvedMode === 'new_day';
  const isPracticeMode = parsedParams.isPracticeMode;
  const resolvedReinforcementDay = parsedParams.resolvedReinforcementDay;
  const resolvedReinforcementCheckpointDay = parsedParams.resolvedReinforcementCheckpointDay;
  const reviewPlan = useMemo(() => loadReviewPlan(), []);
  const shouldRunMicroReview = !!day && isNewDayMode && day.dayNumber > 1;
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

  const handleCloseSession = async () => {
    blurActiveElement();
    if (isLightReviewMode) {
      await lightReview.persistDraftOnClose();
    } else if (isDeepConsolidationMode) {
      await deepReview.persistDraftOnClose();
    } else if (isMilestoneMode) {
      await milestoneReview.persistDraftOnClose();
    } else {
      await persistDraftNow();
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const handleRunCloudScore = async () => {
    setCloudStatusMessage(null);
    if (!hasLastRecording) {
      setCloudStatusMessage('Record audio first to use cloud scoring.');
      return;
    }
    const granted = await requestCloudConsent();
    if (!granted) {
      setCloudStatusMessage('Cloud consent denied. You can keep using local-only mode.');
      return;
    }
    setCloudStatusMessage('Cloud scoring is not configured yet. Local-only mode is still active.');
  };

  const handlePlayPreviousMilestone = async (uri: string) => {
    try {
      if (!uri) {
        return;
      }

      if (previousSoundRef.current) {
        const status = await previousSoundRef.current.getStatusAsync();
        if (status.isLoaded && previousPlayingUri === uri && status.isPlaying) {
          await previousSoundRef.current.pauseAsync();
          setPreviousPlayingUri(null);
          return;
        }
        await previousSoundRef.current.unloadAsync();
        previousSoundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      previousSoundRef.current = sound;
      setPreviousPlayingUri(uri);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          return;
        }
        if (status.didJustFinish) {
          setPreviousPlayingUri(null);
        }
      });
    } catch {
      setPreviousPlayingUri(null);
    }
  };

  useEffect(() => {
    if (!section) {
      return;
    }
    resetForSection();
  }, [section?.id, section, resetForSection]);

  useEffect(() => {
    setNewDayModeCompletionSaved(false);
    setMicroReviewAnalyticsSaved(false);
    setReinforcementOfferedSaved(false);
    setReinforcementSaved(false);
  }, [day?.dayNumber, resolvedMode]);

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
    if (isPracticeMode || !isNewDayMode || !isComplete || !progressSaved || newDayModeCompletionSaved) {
      return;
    }
    let active = true;
    const persist = async () => {
      await incrementReviewModeCompletionAndSync('new_day');
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.new_day',
        }),
      );
      if (active) {
        setNewDayModeCompletionSaved(true);
      }
    };
    void persist();

    return () => {
      active = false;
    };
  }, [isPracticeMode, isNewDayMode, isComplete, progressSaved, newDayModeCompletionSaved, day?.dayNumber]);

  useEffect(() => {
    if (isPracticeMode || !isNewDayMode || !isComplete || !progressSaved || reinforcementSaved || !resolvedReinforcementCheckpointDay) {
      return;
    }

    const checkpointDay = Number(resolvedReinforcementCheckpointDay);
    if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
      return;
    }

    let active = true;
    const persist = async () => {
      await completeReinforcementCheckpointAndSync(checkpointDay);
      trackEvent(
        'reinforcement_completed',
        buildAnalyticsPayload(
          {
            dayNumber: day?.dayNumber ?? 1,
            sectionId: 'review.reinforcement',
          },
          {
            checkpointDay,
            reviewDay: resolvedReinforcementDay ? Number(resolvedReinforcementDay) : null,
          },
        ),
      );
      if (active) {
        setReinforcementSaved(true);
      }
    };

    void persist();
    return () => {
      active = false;
    };
  }, [
    isPracticeMode,
    isNewDayMode,
    isComplete,
    progressSaved,
    reinforcementSaved,
    resolvedReinforcementCheckpointDay,
    day?.dayNumber,
    resolvedReinforcementDay,
  ]);

  useEffect(() => {
    if (isPracticeMode || !isNewDayMode || !resolvedReinforcementCheckpointDay || reinforcementOfferedSaved) {
      return;
    }
    const checkpointDay = Number(resolvedReinforcementCheckpointDay);
    if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
      return;
    }
    let active = true;
    const persist = async () => {
      await markReinforcementCheckpointOfferedAndSync(checkpointDay);
      if (active) {
        setReinforcementOfferedSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [isPracticeMode, isNewDayMode, resolvedReinforcementCheckpointDay, reinforcementOfferedSaved]);

  useEffect(() => {
    let active = true;

    const prepareMicroReview = async () => {
      if (!day || !isNewDayMode || !shouldRunMicroReview) {
        if (active) {
          setMicroReviewCompleted(true);
          setMicroReviewLoading(false);
          setMicroReviewCards([]);
          setMicroReviewMemorySentences([]);
          setMicroReviewSource('none');
        }
        return;
      }

      setMicroReviewLoading(true);
      setMicroReviewCompleted(false);

      try {
        if (!isPracticeMode) {
          await markMicroReviewShownAndSync();
        }
        const reviewPlan = loadReviewPlan();
        const cards = await loadSrsCards();
        if (!active) {
          return;
        }
        const resolvedMicroReview = resolveMicroReviewPlan({
          allDays,
          cards,
          currentDayNumber: day.dayNumber,
          reviewPlan,
        });
        setMicroReviewCards(resolvedMicroReview.cards);
        setMicroReviewMemorySentences(resolvedMicroReview.memorySentences);
        setMicroReviewSource(resolvedMicroReview.source);
      } catch {
        if (!active) {
          return;
        }
        setMicroReviewCards([]);
        setMicroReviewMemorySentences([]);
        setMicroReviewSource('none');
      } finally {
        if (active) {
          setMicroReviewLoading(false);
        }
      }
    };

    void prepareMicroReview();

    return () => {
      active = false;
    };
  }, [day, isNewDayMode, shouldRunMicroReview, isPracticeMode]);

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

  if (!day) {
    return (
      <Screen style={sessionStyles.container}>
        <View style={sessionStyles.completeWrap}>
          <AppText variant="cardTitle" center>
            Session data missing
          </AppText>
          <PrimaryButton label="Back Home" onPress={() => router.replace('/')} />
        </View>
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
    );
  }

  if (isLightReviewMode) {
    if (!lightReview.hydrated) {
      return (
        <Screen style={sessionStyles.container}>
          <View style={sessionStyles.completeWrap}>
            <AppText variant="caption" center muted>
              Loading light review...
            </AppText>
          </View>
        </Screen>
      );
    }

    if (lightReview.completed) {
      return (
        <Screen style={sessionStyles.container}>
          <View style={sessionStyles.completeWrap}>
            <AppText variant="screenTitle" center>
              Light Review Complete
            </AppText>
            <AppText variant="bodySecondary" center>
              You completed all 3 light review blocks.
            </AppText>
            {!lightReview.saved ? (
              <AppText variant="caption" center muted>
                Saving completion...
              </AppText>
            ) : null}
            <PrimaryButton
              label="Back Home"
              onPress={() => {
                router.replace('/');
              }}
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

    return (
      <Screen style={sessionStyles.container} scrollable>
        <LightReviewRunner
          blocks={lightReviewBlocks}
          blockIndex={lightReview.blockIndex}
          remainingSeconds={lightReview.remainingSeconds}
          sessionElapsedSeconds={lightReview.sessionElapsedSeconds}
          onNextBlock={() => {
            const isLastBlock = lightReview.blockIndex >= lightReviewBlocks.length - 1;
            if (isLastBlock) {
              lightReview.setCompleted(true);
              return;
            }
            const nextBlockIndex = lightReview.blockIndex + 1;
            lightReview.setBlockIndex(nextBlockIndex);
            lightReview.setRemainingSeconds((lightReviewBlocks[nextBlockIndex]?.durationMinutes ?? 5) * 60);
          }}
          onFinish={() => {
            lightReview.setCompleted(true);
          }}
        />
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
    );
  }

  if (isDeepConsolidationMode) {
    if (!deepReview.hydrated) {
      return (
        <Screen style={sessionStyles.container}>
          <View style={sessionStyles.completeWrap}>
            <AppText variant="caption" center muted>
              Loading deep consolidation...
            </AppText>
          </View>
        </Screen>
      );
    }

    if (deepReview.completed) {
      return (
        <Screen style={sessionStyles.container}>
          <View style={sessionStyles.completeWrap}>
            <AppText variant="screenTitle" center>
              Deep Consolidation Complete
            </AppText>
            <AppText variant="bodySecondary" center>
              You completed all 3 deep consolidation blocks.
            </AppText>
            {!deepReview.saved ? (
              <AppText variant="caption" center muted>
                Saving completion...
              </AppText>
            ) : null}
            <PrimaryButton
              label="Back Home"
              onPress={() => {
                router.replace('/');
              }}
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

    return (
      <Screen style={sessionStyles.container} scrollable>
        <DeepConsolidationRunner
          blocks={deepBlocks}
          blockIndex={deepReview.blockIndex}
          remainingSeconds={deepReview.remainingSeconds}
          sessionElapsedSeconds={deepReview.sessionElapsedSeconds}
          verbTargets={deepVerbTargets}
          onNextBlock={() => {
            const isLastBlock = deepReview.blockIndex >= deepBlocks.length - 1;
            if (isLastBlock) {
              deepReview.setCompleted(true);
              return;
            }
            const fallbackPerBlockMinutes = Math.max(1, Math.floor(reviewPlan.deepConsolidation.durationMinutes / Math.max(1, deepBlocks.length)));
            const nextBlockIndex = deepReview.blockIndex + 1;
            deepReview.setBlockIndex(nextBlockIndex);
            deepReview.setRemainingSeconds((deepBlocks[nextBlockIndex]?.durationMinutes ?? fallbackPerBlockMinutes) * 60);
          }}
          onFinish={() => {
            deepReview.setCompleted(true);
          }}
        />
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
    );
  }

  if (isMilestoneMode) {
    if (!milestoneReview.hydrated) {
      return (
        <Screen style={sessionStyles.container}>
          <View style={sessionStyles.completeWrap}>
            <AppText variant="caption" center muted>
              Loading milestone audit...
            </AppText>
          </View>
        </Screen>
      );
    }

    if (milestoneReview.completed) {
      return (
        <Screen style={sessionStyles.container}>
          <View style={sessionStyles.completeWrap}>
            <AppText variant="screenTitle" center>
              Milestone Complete
            </AppText>
            <AppText variant="bodySecondary" center>
              Your 10-minute milestone recording is saved.
            </AppText>
            <PrimaryButton
              label="Back Home"
              onPress={() => {
                router.replace('/');
              }}
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

    return (
      <Screen style={sessionStyles.container} scrollable>
        <MilestoneRunner
          dayNumber={day.dayNumber}
          remainingSeconds={milestoneReview.remainingSeconds}
          isRecording={isRecording}
          hasLastRecording={hasLastRecording}
          isCurrentPlaybackActive={isPlaying}
          previousMilestones={milestoneReview.records}
          previousPlayingUri={previousPlayingUri}
          onStartRecording={() => {
            void startRecording();
          }}
          onStopRecording={() => {
            void stopRecording();
          }}
          onPlayCurrent={() => {
            void playLastRecording();
          }}
          onPlayPrevious={(uri) => {
            void handlePlayPreviousMilestone(uri);
          }}
          onFinish={() => {
            milestoneReview.setCompleted(true);
          }}
          canFinish={milestoneReview.remainingSeconds === 0}
        />
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
    );
  }

  const handleMarkPatternComplete = () => {
    markPatternCompleted(sentenceIndex);
    advancePatternCard();
  };

  const handleAnkiGrade = (grade: 'again' | 'good' | 'easy') => {
    if (day && section) {
      void reviewSrsCard({
        dayNumber: day.dayNumber,
        sectionId: section.id,
        sentenceIndex,
        sentence,
        grade,
      });
    }
    advanceSentenceOrSection();
  };

  if (isNewDayMode && shouldRunMicroReview && !microReviewCompleted) {
    return (
      <Screen style={sessionStyles.container} scrollable>
        <MicroReviewRunner
          isLoading={microReviewLoading}
          cards={microReviewCards}
          memorySentences={microReviewMemorySentences}
          source={microReviewSource}
          onContinue={() => {
            if (!isPracticeMode) {
              void markMicroReviewCompletedAndSync();
            }
            if (!microReviewAnalyticsSaved) {
              trackEvent(
                'micro_review_completed',
                buildAnalyticsPayload(
                  {
                    dayNumber: day.dayNumber,
                    sectionId: 'review.micro',
                  },
                  {
                    source: microReviewSource,
                    oldCardsCount: microReviewCards.length,
                    memorySentencesCount: microReviewMemorySentences.length,
                  },
                ),
              );
              setMicroReviewAnalyticsSaved(true);
            }
            setMicroReviewCompleted(true);
          }}
        />
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
    );
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
            {isPracticeMode ? `Practice complete for Day ${day.dayNumber}.` : `You completed Day ${day.dayNumber}.`}
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
