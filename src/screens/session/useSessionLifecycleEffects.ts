import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import type { RefObject } from 'react';
import type { Day, SessionSection } from '../../data/day-model';
import { ensureSrsCardsForDay } from '../../data/srs-store';

type UseSessionLifecycleEffectsParams = {
  section?: SessionSection;
  day?: Day;
  resetForSection: () => void;
  sentenceIndex: number;
  resetSentenceShown: () => void;
  resetForSentence: () => void;
  previousSoundRef: RefObject<{ unloadAsync: () => Promise<unknown> } | null>;
  hydratedDraft: boolean;
  isWarmupSection: boolean;
  remainingSeconds: number;
  sectionIndex: number;
  sectionsCount: number;
  advanceToNextSection: () => void;
  isComplete: boolean;
  progressSaved: boolean;
};

export function useSessionLifecycleEffects({
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
  sectionsCount,
  advanceToNextSection,
  isComplete,
  progressSaved,
}: UseSessionLifecycleEffectsParams) {
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
  }, [previousSoundRef]);

  useEffect(() => {
    const shouldAutoAdvanceOnTimerEnd = !!section && (isWarmupSection || section.type === 'patterns');
    if (!hydratedDraft || !shouldAutoAdvanceOnTimerEnd || remainingSeconds > 0) {
      return;
    }

    advanceToNextSection();
  }, [hydratedDraft, section, isWarmupSection, remainingSeconds, sectionIndex, sectionsCount, advanceToNextSection]);

  useEffect(() => {
    if (!isComplete || progressSaved) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [isComplete, progressSaved]);
}
