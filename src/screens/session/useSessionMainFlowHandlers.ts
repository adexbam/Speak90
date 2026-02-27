import type { SessionMainFlowHandlers } from './components/SessionMainFlow';
import type { SessionViewModel } from './useSessionScreenModel.shared';

export function buildSessionMainFlowHandlers(vm: SessionViewModel): SessionMainFlowHandlers {
  const { engine, timer, store, recorder, actions, cloudConsent } = vm;
  const section = engine.section;

  return {
    onClose: () => {
      void actions.handleCloseSession();
    },
    onFlipAnki: () => store.setAnkiFlipped(true),
    onGradeAnki: actions.handleAnkiGrade,
    onRevealPattern: () => store.setPatternRevealed(true),
    onCompletePattern: actions.handleMarkPatternComplete,
    onNext: () => {
      if (section.type === 'free') {
        engine.advanceToNextSection();
        return;
      }
      engine.advanceSentenceOrSection();
    },
    onNextSection: engine.advanceToNextSection,
    onRestartTimer: () => {
      timer.restartSectionTimer(section.duration);
    },
    onStartRecording: () => {
      void recorder.startRecording();
    },
    onStopRecording: () => {
      void recorder.stopRecording();
    },
    onTogglePlayback: () => {
      void recorder.playLastRecording();
    },
    onSeekPlayback: (progressRatio) => {
      void recorder.seekLastRecording(progressRatio);
    },
    onRunCloudScore: () => {
      void actions.handleRunCloudScore();
    },
    onApproveCloudConsent: () => {
      void cloudConsent.approveCloudConsent();
    },
    onDenyCloudConsent: () => {
      void cloudConsent.denyCloudConsent();
    },
    onDismissCloudConsent: cloudConsent.dismissConsentModal,
  };
}
