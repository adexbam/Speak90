import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useSessionRecorder } from '../../audio/useSessionRecorder';
import { useCloudAudioConsent } from '../../audio/useCloudAudioConsent';
import { ensureSrsCardsForDay, loadSrsCards, reviewSrsCard, type SrsCard } from '../../data/srs-store';
import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useDailyMode } from '../../review/useDailyMode';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { buildMicroReviewPayload } from '../../review/micro-review';
import { completeDeepConsolidationAndSave, completeLightReviewAndSave, completeReinforcementCheckpointAndSave } from '../../data/progress-store';
import { clearSessionDraft, loadSessionDraft, saveSessionDraft } from '../../data/session-draft-store';
import { LightReviewRunner } from './components/LightReviewRunner';
import { DeepConsolidationRunner } from './components/DeepConsolidationRunner';
import { buildDeepConsolidationVerbTargets } from '../../review/deep-consolidation';

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
  const [lightReviewBlockIndex, setLightReviewBlockIndex] = useState(0);
  const [lightReviewRemainingSeconds, setLightReviewRemainingSeconds] = useState(0);
  const [lightReviewSessionElapsedSeconds, setLightReviewSessionElapsedSeconds] = useState(0);
  const [lightReviewHydrated, setLightReviewHydrated] = useState(false);
  const [lightReviewCompleted, setLightReviewCompleted] = useState(false);
  const [lightReviewSaved, setLightReviewSaved] = useState(false);
  const [deepBlockIndex, setDeepBlockIndex] = useState(0);
  const [deepRemainingSeconds, setDeepRemainingSeconds] = useState(0);
  const [deepSessionElapsedSeconds, setDeepSessionElapsedSeconds] = useState(0);
  const [deepHydrated, setDeepHydrated] = useState(false);
  const [deepCompleted, setDeepCompleted] = useState(false);
  const [deepSaved, setDeepSaved] = useState(false);
  const [reinforcementSaved, setReinforcementSaved] = useState(false);
  const params = useLocalSearchParams<{ day?: string; mode?: string; reinforcementReviewDay?: string; reinforcementCheckpointDay?: string }>();
  const allDays = useMemo(() => loadDays(), []);
  const requestedDay = Number(params.day);
  const selectedDayNumber =
    Number.isInteger(requestedDay) && requestedDay > 0
      ? Math.min(requestedDay, allDays.length)
      : 1;
  const day = useMemo(() => allDays.find((d) => d.dayNumber === selectedDayNumber), [allDays, selectedDayNumber]);
  const { flags } = useFeatureFlags();
  const { resolution: dailyModeResolution } = useDailyMode();
  const resolvedModeParam = params.mode;
  const resolvedMode =
    resolvedModeParam === 'new_day' ||
    resolvedModeParam === 'light_review' ||
    resolvedModeParam === 'deep_consolidation' ||
    resolvedModeParam === 'milestone'
      ? resolvedModeParam
      : dailyModeResolution?.mode ?? 'new_day';
  const isLightReviewMode = resolvedMode === 'light_review';
  const isDeepConsolidationMode = resolvedMode === 'deep_consolidation';
  const isNewDayMode = resolvedMode === 'new_day';
  const resolvedReinforcementDay = params.reinforcementReviewDay ?? (dailyModeResolution?.reinforcementReviewDay ? String(dailyModeResolution.reinforcementReviewDay) : null);
  const resolvedReinforcementCheckpointDay =
    params.reinforcementCheckpointDay ??
    (dailyModeResolution?.reinforcementCheckpointDay ? String(dailyModeResolution.reinforcementCheckpointDay) : null);
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
    sectionId: section?.id ?? 'section',
    expectedText: speechText,
    cloudBackupFlagEnabled: flags.v3_cloud_backup,
  });
  const { remainingSeconds, sentenceShownSeconds, sessionElapsedSeconds, resetSentenceShown, restartSectionTimer, hydrateFromDraft } =
    useSessionTimer({
      isComplete,
      sectionIndex,
      sectionId: section?.id,
      sectionDuration: section?.duration,
    });
  const { hydratedDraft, progressSaved, persistDraftNow } = useSessionPersistence({
    enabled: !isLightReviewMode && !isDeepConsolidationMode,
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
    if (isLightReviewMode && day) {
      if (!lightReviewCompleted && lightReviewHydrated) {
        await saveSessionDraft({
          dayNumber: day.dayNumber,
          mode: 'light_review',
          sectionIndex: lightReviewBlockIndex,
          sentenceIndex: 0,
          remainingSeconds: lightReviewRemainingSeconds,
          sessionElapsedSeconds: lightReviewSessionElapsedSeconds,
          savedAt: new Date().toISOString(),
        });
      }
    } else if (isDeepConsolidationMode && day) {
      if (!deepCompleted && deepHydrated) {
        await saveSessionDraft({
          dayNumber: day.dayNumber,
          mode: 'deep_consolidation',
          sectionIndex: deepBlockIndex,
          sentenceIndex: 0,
          remainingSeconds: deepRemainingSeconds,
          sessionElapsedSeconds: deepSessionElapsedSeconds,
          savedAt: new Date().toISOString(),
        });
      }
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
    if (!isLightReviewMode || !day) {
      setLightReviewHydrated(true);
      return;
    }

    let active = true;
    const hydrate = async () => {
      const draft = await loadSessionDraft();
      if (!active) {
        return;
      }

      const firstBlockDuration = (lightReviewBlocks[0]?.durationMinutes ?? reviewPlan.lightReview.durationMinutesMin) * 60;
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === 'light_review') {
        const safeBlockIndex = Math.min(Math.max(0, draft.sectionIndex), Math.max(0, lightReviewBlocks.length - 1));
        const safeBlockDuration = (lightReviewBlocks[safeBlockIndex]?.durationMinutes ?? reviewPlan.lightReview.durationMinutesMin) * 60;
        setLightReviewBlockIndex(safeBlockIndex);
        setLightReviewRemainingSeconds(Math.min(draft.remainingSeconds, safeBlockDuration));
        setLightReviewSessionElapsedSeconds(draft.sessionElapsedSeconds);
      } else {
        setLightReviewBlockIndex(0);
        setLightReviewRemainingSeconds(firstBlockDuration);
        setLightReviewSessionElapsedSeconds(0);
      }
      setLightReviewCompleted(false);
      setLightReviewSaved(false);
      setLightReviewHydrated(true);
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [day, isLightReviewMode, lightReviewBlocks, reviewPlan.lightReview.durationMinutesMin]);

  useEffect(() => {
    if (!isLightReviewMode || !lightReviewHydrated || lightReviewCompleted) {
      return;
    }

    const intervalId = setInterval(() => {
      setLightReviewRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      setLightReviewSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isLightReviewMode, lightReviewHydrated, lightReviewCompleted]);

  useEffect(() => {
    if (!isLightReviewMode || !lightReviewHydrated || lightReviewCompleted || !day) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void saveSessionDraft({
        dayNumber: day.dayNumber,
        mode: 'light_review',
        sectionIndex: lightReviewBlockIndex,
        sentenceIndex: 0,
        remainingSeconds: lightReviewRemainingSeconds,
        sessionElapsedSeconds: lightReviewSessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [
    isLightReviewMode,
    lightReviewHydrated,
    lightReviewCompleted,
    day,
    lightReviewBlockIndex,
    Math.floor(lightReviewRemainingSeconds / 5),
    Math.floor(lightReviewSessionElapsedSeconds / 5),
  ]);

  useEffect(() => {
    if (!isLightReviewMode || !lightReviewHydrated || lightReviewCompleted || lightReviewRemainingSeconds > 0) {
      return;
    }

    const isLastBlock = lightReviewBlockIndex >= lightReviewBlocks.length - 1;
    if (isLastBlock) {
      setLightReviewCompleted(true);
      return;
    }

    const nextBlockIndex = lightReviewBlockIndex + 1;
    setLightReviewBlockIndex(nextBlockIndex);
    setLightReviewRemainingSeconds((lightReviewBlocks[nextBlockIndex]?.durationMinutes ?? 5) * 60);
  }, [isLightReviewMode, lightReviewHydrated, lightReviewCompleted, lightReviewRemainingSeconds, lightReviewBlockIndex, lightReviewBlocks]);

  useEffect(() => {
    if (!isLightReviewMode || !lightReviewCompleted || lightReviewSaved) {
      return;
    }

    let active = true;
    const persist = async () => {
      await completeLightReviewAndSave();
      await clearSessionDraft();
      if (active) {
        setLightReviewSaved(true);
      }
    };
    void persist();

    return () => {
      active = false;
    };
  }, [isLightReviewMode, lightReviewCompleted, lightReviewSaved]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !day) {
      setDeepHydrated(true);
      return;
    }

    let active = true;
    const hydrate = async () => {
      const draft = await loadSessionDraft();
      if (!active) {
        return;
      }

      const fallbackPerBlockMinutes = Math.max(1, Math.floor(reviewPlan.deepConsolidation.durationMinutes / Math.max(1, deepBlocks.length)));
      const firstBlockDuration = (deepBlocks[0]?.durationMinutes ?? fallbackPerBlockMinutes) * 60;
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === 'deep_consolidation') {
        const safeBlockIndex = Math.min(Math.max(0, draft.sectionIndex), Math.max(0, deepBlocks.length - 1));
        const safeBlockDuration = (deepBlocks[safeBlockIndex]?.durationMinutes ?? fallbackPerBlockMinutes) * 60;
        setDeepBlockIndex(safeBlockIndex);
        setDeepRemainingSeconds(Math.min(draft.remainingSeconds, safeBlockDuration));
        setDeepSessionElapsedSeconds(draft.sessionElapsedSeconds);
      } else {
        setDeepBlockIndex(0);
        setDeepRemainingSeconds(firstBlockDuration);
        setDeepSessionElapsedSeconds(0);
      }
      setDeepCompleted(false);
      setDeepSaved(false);
      setDeepHydrated(true);
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [day, isDeepConsolidationMode, deepBlocks, reviewPlan.deepConsolidation.durationMinutes]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !deepHydrated || deepCompleted) {
      return;
    }

    const intervalId = setInterval(() => {
      setDeepRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      setDeepSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isDeepConsolidationMode, deepHydrated, deepCompleted]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !deepHydrated || deepCompleted || !day) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void saveSessionDraft({
        dayNumber: day.dayNumber,
        mode: 'deep_consolidation',
        sectionIndex: deepBlockIndex,
        sentenceIndex: 0,
        remainingSeconds: deepRemainingSeconds,
        sessionElapsedSeconds: deepSessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [
    isDeepConsolidationMode,
    deepHydrated,
    deepCompleted,
    day,
    deepBlockIndex,
    Math.floor(deepRemainingSeconds / 5),
    Math.floor(deepSessionElapsedSeconds / 5),
  ]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !deepHydrated || deepCompleted || deepRemainingSeconds > 0) {
      return;
    }

    const isLastBlock = deepBlockIndex >= deepBlocks.length - 1;
    if (isLastBlock) {
      setDeepCompleted(true);
      return;
    }

    const fallbackPerBlockMinutes = Math.max(1, Math.floor(reviewPlan.deepConsolidation.durationMinutes / Math.max(1, deepBlocks.length)));
    const nextBlockIndex = deepBlockIndex + 1;
    setDeepBlockIndex(nextBlockIndex);
    setDeepRemainingSeconds((deepBlocks[nextBlockIndex]?.durationMinutes ?? fallbackPerBlockMinutes) * 60);
  }, [
    isDeepConsolidationMode,
    deepHydrated,
    deepCompleted,
    deepRemainingSeconds,
    deepBlockIndex,
    deepBlocks,
    reviewPlan.deepConsolidation.durationMinutes,
  ]);

  useEffect(() => {
    if (!isDeepConsolidationMode || !deepCompleted || deepSaved) {
      return;
    }

    let active = true;
    const persist = async () => {
      await completeDeepConsolidationAndSave();
      await clearSessionDraft();
      if (active) {
        setDeepSaved(true);
      }
    };
    void persist();

    return () => {
      active = false;
    };
  }, [isDeepConsolidationMode, deepCompleted, deepSaved]);

  useEffect(() => {
    if (!isNewDayMode || !isComplete || reinforcementSaved || !resolvedReinforcementCheckpointDay) {
      return;
    }

    const checkpointDay = Number(resolvedReinforcementCheckpointDay);
    if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
      return;
    }

    let active = true;
    const persist = async () => {
      await completeReinforcementCheckpointAndSave(checkpointDay);
      if (active) {
        setReinforcementSaved(true);
      }
    };

    void persist();
    return () => {
      active = false;
    };
  }, [isNewDayMode, isComplete, reinforcementSaved, resolvedReinforcementCheckpointDay]);

  useEffect(() => {
    let active = true;

    const prepareMicroReview = async () => {
      if (!day || !isNewDayMode) {
        if (active) {
          setMicroReviewCompleted(true);
          setMicroReviewLoading(false);
          setMicroReviewCards([]);
          setMicroReviewMemorySentences([]);
        }
        return;
      }

      setMicroReviewLoading(true);
      setMicroReviewCompleted(false);

      try {
        const reviewPlan = loadReviewPlan();
        const cards = await loadSrsCards();
        if (!active) {
          return;
        }
        const payload = buildMicroReviewPayload({
          cards,
          currentDay: day.dayNumber,
          reviewPlan,
        });
        setMicroReviewCards(payload.cards);
        setMicroReviewMemorySentences(payload.memorySentences);
      } catch {
        if (!active) {
          return;
        }
        setMicroReviewCards([]);
        setMicroReviewMemorySentences([]);
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
  }, [day, isNewDayMode]);

  useEffect(() => {
    // Wait for draft hydration to avoid false expiry on initial mount.
    const shouldAutoAdvanceOnTimerEnd = !!section && (isWarmupSection || section.type === 'patterns');
    if (!hydratedDraft || !shouldAutoAdvanceOnTimerEnd || remainingSeconds > 0) {
      return;
    }

    advanceToNextSection();
  }, [hydratedDraft, section, isWarmupSection, remainingSeconds, sectionIndex, sections.length, advanceToNextSection]);

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
    if (!lightReviewHydrated) {
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

    if (lightReviewCompleted) {
      return (
        <Screen style={sessionStyles.container}>
          <View style={sessionStyles.completeWrap}>
            <AppText variant="screenTitle" center>
              Light Review Complete
            </AppText>
            <AppText variant="bodySecondary" center>
              You completed all 3 light review blocks.
            </AppText>
            {!lightReviewSaved ? (
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
          blockIndex={lightReviewBlockIndex}
          remainingSeconds={lightReviewRemainingSeconds}
          sessionElapsedSeconds={lightReviewSessionElapsedSeconds}
          onNextBlock={() => {
            const isLastBlock = lightReviewBlockIndex >= lightReviewBlocks.length - 1;
            if (isLastBlock) {
              setLightReviewCompleted(true);
              return;
            }
            const nextBlockIndex = lightReviewBlockIndex + 1;
            setLightReviewBlockIndex(nextBlockIndex);
            setLightReviewRemainingSeconds((lightReviewBlocks[nextBlockIndex]?.durationMinutes ?? 5) * 60);
          }}
          onFinish={() => {
            setLightReviewCompleted(true);
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
    if (!deepHydrated) {
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

    if (deepCompleted) {
      return (
        <Screen style={sessionStyles.container}>
          <View style={sessionStyles.completeWrap}>
            <AppText variant="screenTitle" center>
              Deep Consolidation Complete
            </AppText>
            <AppText variant="bodySecondary" center>
              You completed all 3 deep consolidation blocks.
            </AppText>
            {!deepSaved ? (
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
          blockIndex={deepBlockIndex}
          remainingSeconds={deepRemainingSeconds}
          sessionElapsedSeconds={deepSessionElapsedSeconds}
          verbTargets={deepVerbTargets}
          onNextBlock={() => {
            const isLastBlock = deepBlockIndex >= deepBlocks.length - 1;
            if (isLastBlock) {
              setDeepCompleted(true);
              return;
            }
            const fallbackPerBlockMinutes = Math.max(1, Math.floor(reviewPlan.deepConsolidation.durationMinutes / Math.max(1, deepBlocks.length)));
            const nextBlockIndex = deepBlockIndex + 1;
            setDeepBlockIndex(nextBlockIndex);
            setDeepRemainingSeconds((deepBlocks[nextBlockIndex]?.durationMinutes ?? fallbackPerBlockMinutes) * 60);
          }}
          onFinish={() => {
            setDeepCompleted(true);
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

  if (isNewDayMode && !microReviewCompleted) {
    return (
      <Screen style={sessionStyles.container} scrollable>
        <View style={sessionStyles.completeWrap}>
          <AppText variant="screenTitle" center>
            Micro Review
          </AppText>
          <AppText variant="bodySecondary" center>
            Before new material: review old Anki and memory sentences.
          </AppText>
          {microReviewLoading ? (
            <AppText variant="caption" center muted>
              Preparing 30+ day review cards...
            </AppText>
          ) : microReviewCards.length > 0 ? (
            <View style={sessionStyles.microReviewWrap}>
              <AppText variant="caption" center muted>
                Old Anki cards ({microReviewCards.length})
              </AppText>
              {microReviewCards.map((card) => (
                <AppText key={card.id} variant="bodySecondary" center>
                  {card.prompt}
                </AppText>
              ))}
              <AppText variant="caption" center muted>
                Memory sentences ({microReviewMemorySentences.length})
              </AppText>
              {microReviewMemorySentences.map((sentence) => (
                <AppText key={sentence} variant="bodySecondary" center>
                  {sentence}
                </AppText>
              ))}
            </View>
          ) : (
            <AppText variant="caption" center muted>
              Not enough 30+ day cards yet. Continue to main session.
            </AppText>
          )}
          <PrimaryButton
            label="Start Main Session"
            onPress={() => {
              setMicroReviewCompleted(true);
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
            You completed Day {day.dayNumber}.
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
            onPress={() => {
              blurActiveElement();
              router.push('/stats');
            }}
          />
          <PrimaryButton
            label="Back Home"
            onPress={async () => {
              blurActiveElement();
              await showInterstitialIfReady();
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

  const modeLabel =
    resolvedMode === 'light_review'
      ? 'Light Review'
      : resolvedMode === 'deep_consolidation'
        ? 'Deep Consolidation'
        : resolvedMode === 'milestone'
          ? 'Milestone'
          : 'New Day';
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
