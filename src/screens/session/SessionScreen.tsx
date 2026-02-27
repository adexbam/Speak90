import React from 'react';
import { useSessionViewModel } from './useSessionViewModel';
import { useSessionLifecycleEffects } from './useSessionLifecycleEffects';
import { SessionRouteRenderer } from './components/SessionRouteRenderer';

export function SessionScreen() {
  const vm = useSessionViewModel();
  const { route, engine, timer, persistence, previousSoundRef } = vm;
  const { day } = route;
  const { section, isComplete, isWarmupSection } = engine;
  const { remainingSeconds } = timer;
  const { hydratedDraft, progressSaved } = persistence;
  const sections = day?.sections ?? [];

  useSessionLifecycleEffects({
    section,
    day,
    resetForSection: vm.store.resetForSection,
    sentenceIndex: engine.sentenceIndex,
    resetSentenceShown: timer.resetSentenceShown,
    resetForSentence: vm.store.resetForSentence,
    previousSoundRef,
    hydratedDraft,
    isWarmupSection,
    remainingSeconds,
    sectionIndex: engine.sectionIndex,
    sectionsCount: sections.length,
    advanceToNextSection: engine.advanceToNextSection,
    isComplete,
    progressSaved,
  });

  return <SessionRouteRenderer vm={vm} />;
}
