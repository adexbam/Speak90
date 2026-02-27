import { useSessionRuntimeModel } from './useSessionRuntimeModel';
import { useSessionModeModel } from './useSessionModeModel';
import { useSessionAudioModel } from './useSessionAudioModel';
import { useSessionActionHandlers } from './useSessionActionHandlers';

export function useSessionViewModel() {
  const runtime = useSessionRuntimeModel();
  const audio = useSessionAudioModel(runtime);
  const mode = useSessionModeModel(runtime, audio.recorder.hasLastRecording);
  const actions = useSessionActionHandlers({
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
  });

  return {
    ...runtime,
    modeControllers: mode.modeControllers,
    newDayController: mode.newDayController,
    ...audio,
    actions,
  };
}
