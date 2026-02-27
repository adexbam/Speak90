import type { Router } from 'expo-router';
import type { Day, SessionSection } from '../../data/day-model';
import { useSessionLearningActions } from './useSessionLearningActions';
import { useSessionNavigationActions } from './useSessionNavigationActions';
import { useSessionPlaybackActions } from './useSessionPlaybackActions';
import { Audio } from 'expo-av';

export type UseSessionActionHandlersParams = {
  router: Router;
  persistDraftNow: () => Promise<void>;
  requestCloudConsent: () => Promise<boolean>;
  setCloudStatusMessage: (value: string | null) => void;
  hasLastRecording: boolean;
  lightPersistDraftOnClose: () => Promise<void>;
  deepPersistDraftOnClose: () => Promise<void>;
  milestonePersistDraftOnClose: () => Promise<void>;
  isLightReviewMode: boolean;
  isDeepConsolidationMode: boolean;
  isMilestoneMode: boolean;
  previousSound: Audio.Sound | null;
  setPreviousSound: (sound: Audio.Sound | null) => void;
  previousPlayingUri: string | null;
  setPreviousPlayingUri: (value: string | null) => void;
  day?: Day;
  section?: SessionSection;
  sentence: string;
  sentenceIndex: number;
  markPatternCompleted: (sentenceIndex: number) => void;
  advancePatternCard: () => void;
  advanceSentenceOrSection: () => void;
};

export function useSessionActionHandlers(params: UseSessionActionHandlersParams) {
  const navigation = useSessionNavigationActions({
    router: params.router,
    persistDraftNow: params.persistDraftNow,
    lightPersistDraftOnClose: params.lightPersistDraftOnClose,
    deepPersistDraftOnClose: params.deepPersistDraftOnClose,
    milestonePersistDraftOnClose: params.milestonePersistDraftOnClose,
    isLightReviewMode: params.isLightReviewMode,
    isDeepConsolidationMode: params.isDeepConsolidationMode,
    isMilestoneMode: params.isMilestoneMode,
  });

  const playback = useSessionPlaybackActions({
    previousSound: params.previousSound,
    setPreviousSound: params.setPreviousSound,
    previousPlayingUri: params.previousPlayingUri,
    setPreviousPlayingUri: params.setPreviousPlayingUri,
    setCloudStatusMessage: params.setCloudStatusMessage,
    hasLastRecording: params.hasLastRecording,
    requestCloudConsent: params.requestCloudConsent,
  });

  const learning = useSessionLearningActions({
    day: params.day,
    section: params.section,
    sentence: params.sentence,
    sentenceIndex: params.sentenceIndex,
    markPatternCompleted: params.markPatternCompleted,
    advancePatternCard: params.advancePatternCard,
    advanceSentenceOrSection: params.advanceSentenceOrSection,
  });

  return {
    ...navigation,
    ...playback,
    ...learning,
  };
}
