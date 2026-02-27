import { Audio } from 'expo-av';
import type { Router } from 'expo-router';
import { blurActiveElement } from '../../utils/blurActiveElement';
import { reviewSrsCard } from '../../data/srs-store';
import { useCallback } from 'react';
import type { Day, SessionSection } from '../../data/day-model';

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

export function useSessionActionHandlers({
  router,
  persistDraftNow,
  requestCloudConsent,
  setCloudStatusMessage,
  hasLastRecording,
  lightPersistDraftOnClose,
  deepPersistDraftOnClose,
  milestonePersistDraftOnClose,
  isLightReviewMode,
  isDeepConsolidationMode,
  isMilestoneMode,
  previousSound,
  setPreviousSound,
  previousPlayingUri,
  setPreviousPlayingUri,
  day,
  section,
  sentence,
  sentenceIndex,
  markPatternCompleted,
  advancePatternCard,
  advanceSentenceOrSection,
}: UseSessionActionHandlersParams) {
  const handleCloseSession = useCallback(async () => {
    blurActiveElement();
    if (isLightReviewMode) {
      await lightPersistDraftOnClose();
    } else if (isDeepConsolidationMode) {
      await deepPersistDraftOnClose();
    } else if (isMilestoneMode) {
      await milestonePersistDraftOnClose();
    } else {
      await persistDraftNow();
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }, [
    deepPersistDraftOnClose,
    isDeepConsolidationMode,
    isLightReviewMode,
    isMilestoneMode,
    lightPersistDraftOnClose,
    milestonePersistDraftOnClose,
    persistDraftNow,
    router,
  ]);

  const handleRunCloudScore = useCallback(async () => {
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
  }, [hasLastRecording, requestCloudConsent, setCloudStatusMessage]);

  const handlePlayPreviousMilestone = useCallback(async (uri: string) => {
    try {
      if (!uri) {
        return;
      }

      if (previousSound) {
        const status = await previousSound.getStatusAsync();
        if (status.isLoaded && previousPlayingUri === uri && status.isPlaying) {
          await previousSound.pauseAsync();
          setPreviousPlayingUri(null);
          return;
        }
        await previousSound.unloadAsync();
        setPreviousSound(null);
      }

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      setPreviousSound(sound);
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
  }, [previousPlayingUri, previousSound, setPreviousPlayingUri, setPreviousSound]);

  const handleMarkPatternComplete = useCallback(() => {
    markPatternCompleted(sentenceIndex);
    advancePatternCard();
  }, [advancePatternCard, markPatternCompleted, sentenceIndex]);

  const handleAnkiGrade = useCallback((grade: 'again' | 'good' | 'easy') => {
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
  }, [advanceSentenceOrSection, day, section, sentence, sentenceIndex]);

  return {
    handleCloseSession,
    handleRunCloudScore,
    handlePlayPreviousMilestone,
    handleMarkPatternComplete,
    handleAnkiGrade,
  };
}
