import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { loadDays } from '../../data/day-loader';
import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useDailyMode } from '../../review/useDailyMode';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { buildDeepConsolidationVerbTargets } from '../../review/deep-consolidation';
import { useSessionStore } from '../../state/session-store';
import { useAppProgressStore } from '../../state/app-progress-store';
import { useSessionEngine } from './useSessionEngine';
import { useInterstitialOnComplete } from '../../ads/useInterstitialOnComplete';
import { parseBilingualPair } from './session-parsers';
import { useSessionRecorder } from '../../audio/useSessionRecorder';
import { useSessionTimer } from './useSessionTimer';
import { useSessionPersistence } from './useSessionPersistence';
import { useSessionModeControllers } from './useSessionModeControllers';
import { useNewDaySessionController } from './useNewDaySessionController';
import { useSessionActionHandlers } from './useSessionActionHandlers';
import { useCloudAudioConsent } from '../../audio/useCloudAudioConsent';
import { useSessionRouteModel } from './useSessionRouteModel';

export function useSessionViewModel() {
  const router = useRouter();
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string | null>(null);
  const [previousPlayingUri, setPreviousPlayingUri] = useState<string | null>(null);
  const previousSoundRef = useRef<Audio.Sound | null>(null);

  const { resolution: dailyModeResolution } = useDailyMode();
  const allDays = useMemo(() => loadDays(), []);
  const route = useSessionRouteModel({ allDays, dailyModeResolution });

  const { flags } = useFeatureFlags();
  const reviewPlan = useMemo(() => loadReviewPlan(), []);
  const lightReviewBlocks = reviewPlan.lightReview.blocks;
  const deepBlocks = reviewPlan.deepConsolidation.blocks;
  const deepVerbTargets = useMemo(() => buildDeepConsolidationVerbTargets(allDays), [allDays]);
  const cloudConsent = useCloudAudioConsent();

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

  const sections = route.day?.sections ?? [];
  const engine = useSessionEngine(sections);
  const showInterstitialIfReady = useInterstitialOnComplete();
  const section = engine.section;
  const sentence = engine.sentence;
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

  const recorder = useSessionRecorder({
    dayNumber: route.day?.dayNumber ?? 1,
    sectionId: route.isMilestoneMode ? 'milestone-audit' : section?.id ?? 'section',
    expectedText: speechText,
    cloudBackupFlagEnabled: flags.v3_cloud_backup,
    recordingKind: route.isMilestoneMode ? 'milestone' : 'session',
  });

  const timer = useSessionTimer({
    isComplete: engine.isComplete,
    sectionIndex: engine.sectionIndex,
    sectionId: section?.id,
    sectionDuration: section?.duration,
  });

  const persistence = useSessionPersistence({
    enabled: !route.isLightReviewMode && !route.isDeepConsolidationMode && !route.isMilestoneMode,
    persistCompletion: !route.isPracticeMode,
    mode: route.resolvedMode,
    day: route.day,
    section,
    isComplete: engine.isComplete,
    totalDays: allDays.length,
    sectionIndex: engine.sectionIndex,
    sentenceIndex: engine.sentenceIndex,
    repRound: engine.repRound,
    remainingSeconds: timer.remainingSeconds,
    sessionElapsedSeconds: timer.sessionElapsedSeconds,
    restoreFromDraft: engine.restoreFromDraft,
    hydrateTimerFromDraft: timer.hydrateFromDraft,
  });

  const modeControllers = useSessionModeControllers({
    day: route.day,
    allDaysCount: allDays.length,
    isPracticeMode: route.isPracticeMode,
    isLightReviewMode: route.isLightReviewMode,
    lightReviewBlocks,
    lightFallbackMinutes: reviewPlan.lightReview.durationMinutesMin,
    isDeepConsolidationMode: route.isDeepConsolidationMode,
    deepBlocks,
    deepTotalMinutes: reviewPlan.deepConsolidation.durationMinutes,
    isMilestoneMode: route.isMilestoneMode,
    hasLastRecording: recorder.hasLastRecording,
    loadSessionDraftAndSync,
    saveSessionDraftAndSync,
    clearSessionDraftAndSync,
    completeLightReviewAndSync,
    completeDeepConsolidationAndSync,
    completeSessionAndSync,
    incrementReviewModeCompletionAndSync,
  });

  const newDayController = useNewDaySessionController({
    day: route.day,
    allDays,
    isNewDayMode: route.isNewDayMode,
    isPracticeMode: route.isPracticeMode,
    isComplete: engine.isComplete,
    progressSaved: persistence.progressSaved,
    shouldRunMicroReview: route.shouldRunMicroReview,
    resolvedReinforcementDay: route.resolvedReinforcementDay,
    resolvedReinforcementCheckpointDay: route.resolvedReinforcementCheckpointDay,
    incrementReviewModeCompletionAndSync: async () => incrementReviewModeCompletionAndSync('new_day'),
    completeReinforcementCheckpointAndSync,
    markReinforcementCheckpointOfferedAndSync,
    markMicroReviewShownAndSync,
    markMicroReviewCompletedAndSync,
  });

  const actions = useSessionActionHandlers({
    router,
    persistDraftNow: persistence.persistDraftNow,
    requestCloudConsent: cloudConsent.requestCloudConsent,
    setCloudStatusMessage,
    hasLastRecording: recorder.hasLastRecording,
    lightPersistDraftOnClose: modeControllers.light.persistDraftOnClose,
    deepPersistDraftOnClose: modeControllers.deep.persistDraftOnClose,
    milestonePersistDraftOnClose: modeControllers.milestone.persistDraftOnClose,
    isLightReviewMode: route.isLightReviewMode,
    isDeepConsolidationMode: route.isDeepConsolidationMode,
    isMilestoneMode: route.isMilestoneMode,
    previousSound: previousSoundRef.current,
    setPreviousSound: (sound) => {
      previousSoundRef.current = sound;
    },
    previousPlayingUri,
    setPreviousPlayingUri,
    day: route.day,
    section,
    sentence,
    sentenceIndex: engine.sentenceIndex,
    markPatternCompleted,
    advancePatternCard: engine.advancePatternCard,
    advanceSentenceOrSection: engine.advanceSentenceOrSection,
  });

  return {
    router,
    allDays,
    route,
    flags,
    reviewPlan,
    lightReviewBlocks,
    deepBlocks,
    deepVerbTargets,
    cloudConsent,
    store: {
      patternRevealed,
      ankiFlipped,
      patternCompleted,
      setPatternRevealed,
      setAnkiFlipped,
      resetForSection,
      resetForSentence,
    },
    engine,
    section,
    sentence,
    isFreeSection,
    freePrompt,
    freeCues,
    isPatternSection,
    isAnkiSection,
    patternPrompt,
    patternTarget,
    ankiFront,
    ankiBack,
    speechText,
    showRecordingControls,
    showCloudScoringAction,
    recorder,
    timer,
    persistence,
    modeControllers,
    newDayController,
    actions,
    previousSoundRef,
    previousPlayingUri,
    cloudStatusMessage,
    showInterstitialIfReady,
  };
}

