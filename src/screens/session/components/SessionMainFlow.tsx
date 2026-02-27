import React from 'react';
import type { SessionSection } from '../../../data/day-model';
import type { SttFeedbackState } from '../../../audio/stt-score';
import { SessionActions } from './SessionActions';
import { SessionCard } from './SessionCard';
import { SessionScaffold } from './SessionScaffold';
import { CloudConsentModal } from './CloudConsentModal';
import { SessionBannerFooter } from './SessionBannerFooter';
import { sectionHints } from '../session-copy';

export type SessionMainFlowModel = {
  section: SessionSection;
  sectionsCount: number;
  sectionIndex: number;
  sectionMetaText: string;
  remainingLabel: string;
  timerColor: string;
  sentence: string;
  sentenceIndex: number;
  repRound: number;
  isRepEnforced: boolean;
  isFreeSection: boolean;
  isPatternSection: boolean;
  isAnkiSection: boolean;
  patternRevealed: boolean;
  ankiFlipped: boolean;
  patternPrompt: string;
  patternTarget: string;
  ankiFront: string;
  ankiBack: string;
  freePrompt: string;
  freeCues: string[];
  speechText: string;
  sentenceShownLabel: string;
  patternCompletedForSentence: boolean;
  showRecordingControls: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  hasLastRecording: boolean;
  playbackPositionMs: number;
  playbackDurationMs: number;
  recordingErrorMessage: string | null;
  sttScore: number | null;
  sttFeedback: SttFeedbackState | null;
  sttStatusMessage: string | null;
  cloudUploadStatusMessage: string | null;
  showCloudAction: boolean;
  cloudStatusMessage: string | null;
  showNextSectionAction: boolean;
  showCloudConsentModal: boolean;
};

export type SessionMainFlowHandlers = {
  onClose: () => void;
  onFlipAnki: () => void;
  onGradeAnki: (grade: 'again' | 'good' | 'easy') => void;
  onRevealPattern: () => void;
  onCompletePattern: () => void;
  onNext: () => void;
  onNextSection: () => void;
  onRestartTimer: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTogglePlayback: () => void;
  onSeekPlayback: (progressRatio: number) => void;
  onRunCloudScore: () => void;
  onApproveCloudConsent: () => void;
  onDenyCloudConsent: () => void;
  onDismissCloudConsent: () => void;
};

type SessionMainFlowProps = {
  model: SessionMainFlowModel;
  handlers: SessionMainFlowHandlers;
};

export function SessionMainFlow({ model, handlers }: SessionMainFlowProps) {
  return (
    <SessionScaffold
      sectionTitle={model.section.title}
      sectionIndex={model.sectionIndex + 1}
      sectionsCount={model.sectionsCount}
      sectionType={model.section.type}
      sectionMetaText={model.sectionMetaText}
      remainingLabel={model.remainingLabel}
      timerColor={model.timerColor}
      onClose={handlers.onClose}
      footer={<SessionBannerFooter />}
    >
      <SessionCard
        sentence={model.sentence}
        speechText={model.speechText}
        isPatternSection={model.isPatternSection}
        isAnkiSection={model.isAnkiSection}
        isFreeSection={model.isFreeSection}
        patternRevealed={model.patternRevealed}
        ankiFlipped={model.ankiFlipped}
        patternPrompt={model.patternPrompt}
        patternTarget={model.patternTarget}
        ankiFront={model.ankiFront}
        ankiBack={model.ankiBack}
        freePrompt={model.freePrompt}
        freeCues={model.freeCues}
        sentenceShownLabel={model.sentenceShownLabel}
      />

      <SessionActions
        sectionType={model.section.type}
        section={model.section}
        repRound={model.repRound}
        sentenceIndex={model.sentenceIndex}
        isRepEnforced={model.isRepEnforced}
        ankiFlipped={model.ankiFlipped}
        patternRevealed={model.patternRevealed}
        patternCompletedForSentence={model.patternCompletedForSentence}
        hintText={sectionHints[model.section.type]}
        showRecordingControls={model.showRecordingControls}
        isRecording={model.isRecording}
        isPlaying={model.isPlaying}
        hasLastRecording={model.hasLastRecording}
        playbackPositionMs={model.playbackPositionMs}
        playbackDurationMs={model.playbackDurationMs}
        recordingErrorMessage={model.recordingErrorMessage}
        sttScore={model.sttScore}
        sttFeedback={model.sttFeedback}
        sttStatusMessage={model.sttStatusMessage}
        cloudUploadStatusMessage={model.cloudUploadStatusMessage}
        showCloudAction={model.showCloudAction}
        cloudStatusMessage={model.cloudStatusMessage}
        onFlipAnki={handlers.onFlipAnki}
        onGradeAnki={handlers.onGradeAnki}
        onRevealPattern={handlers.onRevealPattern}
        onCompletePattern={handlers.onCompletePattern}
        onNext={handlers.onNext}
        onNextSection={handlers.onNextSection}
        showNextSectionAction={model.showNextSectionAction}
        onRestartTimer={handlers.onRestartTimer}
        onStartRecording={handlers.onStartRecording}
        onStopRecording={handlers.onStopRecording}
        onTogglePlayback={handlers.onTogglePlayback}
        onSeekPlayback={handlers.onSeekPlayback}
        onRunCloudScore={handlers.onRunCloudScore}
      />
      <CloudConsentModal
        visible={model.showCloudConsentModal}
        onApprove={handlers.onApproveCloudConsent}
        onDeny={handlers.onDenyCloudConsent}
        onDismiss={handlers.onDismissCloudConsent}
      />
    </SessionScaffold>
  );
}
