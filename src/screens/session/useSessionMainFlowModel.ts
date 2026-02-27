import { colors } from '../../ui/tokens';
import type { SessionMainFlowModel } from './components/SessionMainFlow';
import { formatSeconds } from './useSessionScreenModel.shared';
import type { SessionViewModel } from './useSessionScreenModel.shared';

export function buildSessionMainFlowModel(vm: SessionViewModel): SessionMainFlowModel {
  const { route, engine, timer, store, recorder, cloudConsent } = vm;
  const section = engine.section;
  const sections = route.day?.sections ?? [];

  const timerColor =
    timer.remainingSeconds === 0
      ? colors.accentSuccess
      : timer.remainingSeconds <= 10
        ? colors.accentWarning
        : colors.textPrimary;

  const sectionMetaText = vm.isFreeSection
    ? 'Free output timer running'
    : engine.isRepEnforced
      ? `Round ${engine.repRound}/${section.reps} - Sentence ${engine.sentenceIndex + 1}/${section.sentences.length}`
      : `Sentence ${engine.sentenceIndex + 1}/${section.sentences.length} - x${section.reps} reps`;

  const modeLabel = 'New Day';
  const sectionMetaWithMode = `${sectionMetaText} • Mode: ${modeLabel}${route.resolvedReinforcementDay ? ` • Reinforce Day ${route.resolvedReinforcementDay}` : ''}`;

  return {
    section,
    sectionsCount: sections.length,
    sectionIndex: engine.sectionIndex,
    sectionMetaText: sectionMetaWithMode,
    remainingLabel: formatSeconds(timer.remainingSeconds),
    timerColor,
    sentence: engine.sentence,
    sentenceIndex: engine.sentenceIndex,
    repRound: engine.repRound,
    isRepEnforced: engine.isRepEnforced,
    isFreeSection: vm.isFreeSection,
    isPatternSection: vm.isPatternSection,
    isAnkiSection: vm.isAnkiSection,
    patternRevealed: store.patternRevealed,
    ankiFlipped: store.ankiFlipped,
    patternPrompt: vm.patternPrompt,
    patternTarget: vm.patternTarget,
    ankiFront: vm.ankiFront,
    ankiBack: vm.ankiBack,
    freePrompt: vm.freePrompt,
    freeCues: vm.freeCues,
    speechText: vm.speechText,
    sentenceShownLabel: formatSeconds(timer.sentenceShownSeconds),
    patternCompletedForSentence: !!store.patternCompleted[engine.sentenceIndex],
    showRecordingControls: vm.showRecordingControls,
    isRecording: recorder.isRecording,
    isPlaying: recorder.isPlaying,
    hasLastRecording: recorder.hasLastRecording,
    playbackPositionMs: recorder.playbackPositionMs,
    playbackDurationMs: recorder.playbackDurationMs,
    recordingErrorMessage: recorder.errorMessage,
    sttScore: recorder.sttScore,
    sttFeedback: recorder.sttFeedback,
    sttStatusMessage: recorder.sttStatusMessage,
    cloudUploadStatusMessage: recorder.cloudUploadStatusMessage,
    showCloudAction: vm.showCloudScoringAction,
    cloudStatusMessage: vm.cloudStatusMessage,
    showNextSectionAction: engine.sectionIndex < sections.length - 1,
    showCloudConsentModal: cloudConsent.isModalVisible,
  };
}
