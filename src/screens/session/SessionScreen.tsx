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
import { buildMicroReviewPayload } from '../../review/micro-review';
import {
  completeDeepConsolidationAndSave,
  completeLightReviewAndSave,
  completeReinforcementCheckpointAndSave,
  completeSessionAndSave,
  incrementReviewModeCompletionAndSave,
  markMicroReviewCompletedAndSave,
  markMicroReviewShownAndSave,
  markReinforcementCheckpointOfferedAndSave,
} from '../../data/progress-store';
import { loadSessionDraft } from '../../data/session-draft-store';
import { LightReviewRunner } from './components/LightReviewRunner';
import { DeepConsolidationRunner } from './components/DeepConsolidationRunner';
import { buildDeepConsolidationVerbTargets } from '../../review/deep-consolidation';
import { loadMilestoneRecordings, type RecordingMetadata } from '../../data/recordings-store';
import { MilestoneRunner } from './components/MilestoneRunner';
import { MicroReviewRunner } from './components/MicroReviewRunner';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';

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
  const [microReviewSource, setMicroReviewSource] = useState<'old' | 'recent' | 'none'>('none');
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
  const [milestoneRemainingSeconds, setMilestoneRemainingSeconds] = useState(600);
  const [milestoneHydrated, setMilestoneHydrated] = useState(false);
  const [milestoneCompleted, setMilestoneCompleted] = useState(false);
  const [milestoneSaved, setMilestoneSaved] = useState(false);
  const [milestoneRecords, setMilestoneRecords] = useState<RecordingMetadata[]>([]);
  const [previousPlayingUri, setPreviousPlayingUri] = useState<string | null>(null);
  const previousSoundRef = useRef<Audio.Sound | null>(null);
  const [newDayModeCompletionSaved, setNewDayModeCompletionSaved] = useState(false);
  const [microReviewAnalyticsSaved, setMicroReviewAnalyticsSaved] = useState(false);
  const [reinforcementOfferedSaved, setReinforcementOfferedSaved] = useState(false);
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
  const isMilestoneMode = resolvedMode === 'milestone';
  const isNewDayMode = resolvedMode === 'new_day';
  const resolvedReinforcementDay = params.reinforcementReviewDay ?? (dailyModeResolution?.reinforcementReviewDay ? String(dailyModeResolution.reinforcementReviewDay) : null);
  const resolvedReinforcementCheckpointDay =
    params.reinforcementCheckpointDay ??
    (dailyModeResolution?.reinforcementCheckpointDay ? String(dailyModeResolution.reinforcementCheckpointDay) : null);
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
  const saveSessionDraftAndSync = useAppProgressStore((s) => s.saveSessionDraftAndSync);
  const clearSessionDraftAndSync = useAppProgressStore((s) => s.clearSessionDraftAndSync);

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
  const { hydratedDraft, progressSaved, persistCompletionNow, persistDraftNow } = useSessionPersistence({
    enabled: !isLightReviewMode && !isDeepConsolidationMode && !isMilestoneMode,
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
        await saveSessionDraftAndSync({
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
        await saveSessionDraftAndSync({
          dayNumber: day.dayNumber,
          mode: 'deep_consolidation',
          sectionIndex: deepBlockIndex,
          sentenceIndex: 0,
          remainingSeconds: deepRemainingSeconds,
          sessionElapsedSeconds: deepSessionElapsedSeconds,
          savedAt: new Date().toISOString(),
        });
      }
    } else if (isMilestoneMode && day) {
      if (!milestoneCompleted && milestoneHydrated) {
        await saveSessionDraftAndSync({
          dayNumber: day.dayNumber,
          mode: 'milestone',
          sectionIndex: 0,
          sentenceIndex: 0,
          remainingSeconds: milestoneRemainingSeconds,
          sessionElapsedSeconds: 600 - milestoneRemainingSeconds,
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
      void saveSessionDraftAndSync({
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
      await incrementReviewModeCompletionAndSave('light_review');
      await clearSessionDraftAndSync();
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.light_review',
        }),
      );
      if (active) {
        setLightReviewSaved(true);
      }
    };
    void persist();

    return () => {
      active = false;
    };
  }, [isLightReviewMode, lightReviewCompleted, lightReviewSaved, day?.dayNumber]);

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
      void saveSessionDraftAndSync({
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
      await incrementReviewModeCompletionAndSave('deep_consolidation');
      await clearSessionDraftAndSync();
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.deep_consolidation',
        }),
      );
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
    if (!isNewDayMode || !isComplete || !progressSaved || newDayModeCompletionSaved) {
      return;
    }
    let active = true;
    const persist = async () => {
      await incrementReviewModeCompletionAndSave('new_day');
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
  }, [isNewDayMode, isComplete, progressSaved, newDayModeCompletionSaved, day?.dayNumber]);

  useEffect(() => {
    if (!isNewDayMode || !isComplete || !progressSaved || reinforcementSaved || !resolvedReinforcementCheckpointDay) {
      return;
    }

    const checkpointDay = Number(resolvedReinforcementCheckpointDay);
    if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
      return;
    }

    let active = true;
    const persist = async () => {
      await completeReinforcementCheckpointAndSave(checkpointDay);
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
    isNewDayMode,
    isComplete,
    progressSaved,
    reinforcementSaved,
    resolvedReinforcementCheckpointDay,
    day?.dayNumber,
    resolvedReinforcementDay,
  ]);

  useEffect(() => {
    if (!isNewDayMode || !resolvedReinforcementCheckpointDay || reinforcementOfferedSaved) {
      return;
    }
    const checkpointDay = Number(resolvedReinforcementCheckpointDay);
    if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
      return;
    }
    let active = true;
    const persist = async () => {
      await markReinforcementCheckpointOfferedAndSave(checkpointDay);
      if (active) {
        setReinforcementOfferedSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [isNewDayMode, resolvedReinforcementCheckpointDay, reinforcementOfferedSaved]);

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
        await markMicroReviewShownAndSave();
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
        setMicroReviewSource(payload.source);
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
  }, [day, isNewDayMode, shouldRunMicroReview]);

  useEffect(() => {
    return () => {
      if (previousSoundRef.current) {
        void previousSoundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (!isMilestoneMode || !day) {
      setMilestoneHydrated(true);
      return;
    }

    let active = true;
    const hydrate = async () => {
      const [draft, milestones] = await Promise.all([loadSessionDraft(), loadMilestoneRecordings()]);
      if (!active) {
        return;
      }

      const previous = milestones.filter((m) => m.dayNumber < day.dayNumber).sort((a, b) => (a.dayNumber < b.dayNumber ? 1 : -1));
      setMilestoneRecords(previous);

      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === 'milestone') {
        setMilestoneRemainingSeconds(Math.min(600, Math.max(0, draft.remainingSeconds)));
      } else {
        setMilestoneRemainingSeconds(600);
      }
      setMilestoneCompleted(false);
      setMilestoneSaved(false);
      setMilestoneHydrated(true);
    };
    void hydrate();

    return () => {
      active = false;
    };
  }, [day, isMilestoneMode, hasLastRecording]);

  useEffect(() => {
    if (!isMilestoneMode || !milestoneHydrated || milestoneCompleted) {
      return;
    }

    const intervalId = setInterval(() => {
      setMilestoneRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isMilestoneMode, milestoneHydrated, milestoneCompleted]);

  useEffect(() => {
    if (!isMilestoneMode || !milestoneHydrated || milestoneCompleted || !day) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode: 'milestone',
        sectionIndex: 0,
        sentenceIndex: 0,
        remainingSeconds: milestoneRemainingSeconds,
        sessionElapsedSeconds: 600 - milestoneRemainingSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [isMilestoneMode, milestoneHydrated, milestoneCompleted, day, Math.floor(milestoneRemainingSeconds / 5)]);

  useEffect(() => {
    if (!isMilestoneMode || !milestoneHydrated || milestoneCompleted || milestoneRemainingSeconds > 0) {
      return;
    }
    setMilestoneCompleted(true);
  }, [isMilestoneMode, milestoneHydrated, milestoneCompleted, milestoneRemainingSeconds]);

  useEffect(() => {
    if (!isMilestoneMode || !milestoneCompleted) {
      return;
    }
    void clearSessionDraftAndSync();
  }, [isMilestoneMode, milestoneCompleted]);

  useEffect(() => {
    if (!isMilestoneMode || !milestoneCompleted || milestoneSaved) {
      return;
    }
    let active = true;
    const persist = async () => {
      if (day) {
        await completeSessionAndSave({
          completedDay: day.dayNumber,
          sessionSeconds: 600,
          totalDays: allDays.length,
        });
      }
      await incrementReviewModeCompletionAndSave('milestone');
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.milestone',
        }),
      );
      if (active) {
        setMilestoneSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [isMilestoneMode, milestoneCompleted, milestoneSaved, day, allDays.length]);

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

  if (isMilestoneMode) {
    if (!milestoneHydrated) {
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

    if (milestoneCompleted) {
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
          remainingSeconds={milestoneRemainingSeconds}
          isRecording={isRecording}
          hasLastRecording={hasLastRecording}
          isCurrentPlaybackActive={isPlaying}
          previousMilestones={milestoneRecords}
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
            setMilestoneCompleted(true);
          }}
          canFinish={milestoneRemainingSeconds === 0}
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
            void markMicroReviewCompletedAndSave();
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
