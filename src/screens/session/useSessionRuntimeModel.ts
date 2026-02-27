import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { loadDays } from '../../data/day-loader';
import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useDailyMode } from '../../review/useDailyMode';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { buildDeepConsolidationVerbTargets } from '../../review/deep-consolidation';
import { useSessionStore } from '../../state/session-store';
import { useSessionEngine } from './useSessionEngine';
import { parseBilingualPair } from './session-parsers';
import { useSessionTimer } from './useSessionTimer';
import { useSessionPersistence } from './useSessionPersistence';
import { useCloudAudioConsent } from '../../audio/useCloudAudioConsent';
import { useSessionRouteModel } from './useSessionRouteModel';

export function useSessionRuntimeModel() {
  const router = useRouter();
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

  const sections = route.day?.sections ?? [];
  const engine = useSessionEngine(sections);
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
      markPatternCompleted,
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
    timer,
    persistence,
  };
}
