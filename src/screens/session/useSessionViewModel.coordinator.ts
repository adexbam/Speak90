import type { useSessionAudioModel } from './useSessionAudioModel';
import type { useSessionModeModel } from './useSessionModeModel';
import type { useSessionRuntimeModel } from './useSessionRuntimeModel';
import type { UseSessionActionHandlersParams } from './useSessionActionHandlers';

type SessionRuntime = ReturnType<typeof useSessionRuntimeModel>;
type SessionAudio = ReturnType<typeof useSessionAudioModel>;
type SessionMode = ReturnType<typeof useSessionModeModel>;

export function buildSessionActionDeps(
  runtime: SessionRuntime,
  audio: SessionAudio,
  mode: SessionMode,
): UseSessionActionHandlersParams {
  return {
    router: runtime.router,
    persistDraftNow: runtime.persistence.persistDraftNow,
    requestCloudConsent: runtime.cloudConsent.requestCloudConsent,
    setCloudStatusMessage: audio.setCloudStatusMessage,
    hasLastRecording: audio.recorder.hasLastRecording,
    lightPersistDraftOnClose: mode.modeControllers.light.persistDraftOnClose,
    deepPersistDraftOnClose: mode.modeControllers.deep.persistDraftOnClose,
    milestonePersistDraftOnClose: mode.modeControllers.milestone.persistDraftOnClose,
    isLightReviewMode: runtime.route.isLightReviewMode,
    isDeepConsolidationMode: runtime.route.isDeepConsolidationMode,
    isMilestoneMode: runtime.route.isMilestoneMode,
    previousSound: audio.previousSoundRef.current,
    setPreviousSound: (sound) => {
      audio.previousSoundRef.current = sound;
    },
    previousPlayingUri: audio.previousPlayingUri,
    setPreviousPlayingUri: audio.setPreviousPlayingUri,
    day: runtime.route.day,
    section: runtime.section,
    sentence: runtime.sentence,
    sentenceIndex: runtime.engine.sentenceIndex,
    markPatternCompleted: runtime.store.markPatternCompleted,
    advancePatternCard: runtime.engine.advancePatternCard,
    advanceSentenceOrSection: runtime.engine.advanceSentenceOrSection,
  };
}
