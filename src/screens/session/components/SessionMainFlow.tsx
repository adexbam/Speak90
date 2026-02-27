import React from 'react';
import type { SessionSection } from '../../../data/day-model';
import type { SttFeedbackState } from '../../../audio/stt-score';
import { SessionActions } from './SessionActions';
import { SessionCard } from './SessionCard';
import { SessionScaffold } from './SessionScaffold';
import { CloudConsentModal } from './CloudConsentModal';
import { SessionBannerFooter } from './SessionBannerFooter';
import { sectionHints } from '../session-copy';

type SessionMainFlowProps = {
  section: SessionSection;
  sectionsCount: number;
  sectionIndex: number;
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
  remainingLabel: string;
  timerColor: string;
  sectionMetaText: string;
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

export function SessionMainFlow({
  section,
  sectionsCount,
  sectionIndex,
  sentence,
  sentenceIndex,
  repRound,
  isRepEnforced,
  isFreeSection,
  isPatternSection,
  isAnkiSection,
  patternRevealed,
  ankiFlipped,
  patternPrompt,
  patternTarget,
  ankiFront,
  ankiBack,
  freePrompt,
  freeCues,
  speechText,
  sentenceShownLabel,
  remainingLabel,
  timerColor,
  sectionMetaText,
  patternCompletedForSentence,
  showRecordingControls,
  isRecording,
  isPlaying,
  hasLastRecording,
  playbackPositionMs,
  playbackDurationMs,
  recordingErrorMessage,
  sttScore,
  sttFeedback,
  sttStatusMessage,
  cloudUploadStatusMessage,
  showCloudAction,
  cloudStatusMessage,
  showNextSectionAction,
  showCloudConsentModal,
  onClose,
  onFlipAnki,
  onGradeAnki,
  onRevealPattern,
  onCompletePattern,
  onNext,
  onNextSection,
  onRestartTimer,
  onStartRecording,
  onStopRecording,
  onTogglePlayback,
  onSeekPlayback,
  onRunCloudScore,
  onApproveCloudConsent,
  onDenyCloudConsent,
  onDismissCloudConsent,
}: SessionMainFlowProps) {
  return (
    <SessionScaffold
      sectionTitle={section.title}
      sectionIndex={sectionIndex + 1}
      sectionsCount={sectionsCount}
      sectionType={section.type}
      sectionMetaText={sectionMetaText}
      remainingLabel={remainingLabel}
      timerColor={timerColor}
      onClose={onClose}
      footer={<SessionBannerFooter />}
    >
      <SessionCard
        sentence={sentence}
        speechText={speechText}
        isPatternSection={isPatternSection}
        isAnkiSection={isAnkiSection}
        isFreeSection={isFreeSection}
        patternRevealed={patternRevealed}
        ankiFlipped={ankiFlipped}
        patternPrompt={patternPrompt}
        patternTarget={patternTarget}
        ankiFront={ankiFront}
        ankiBack={ankiBack}
        freePrompt={freePrompt}
        freeCues={freeCues}
        sentenceShownLabel={sentenceShownLabel}
      />

      <SessionActions
        sectionType={section.type}
        section={section}
        repRound={repRound}
        sentenceIndex={sentenceIndex}
        isRepEnforced={isRepEnforced}
        ankiFlipped={ankiFlipped}
        patternRevealed={patternRevealed}
        patternCompletedForSentence={patternCompletedForSentence}
        hintText={sectionHints[section.type]}
        showRecordingControls={showRecordingControls}
        isRecording={isRecording}
        isPlaying={isPlaying}
        hasLastRecording={hasLastRecording}
        playbackPositionMs={playbackPositionMs}
        playbackDurationMs={playbackDurationMs}
        recordingErrorMessage={recordingErrorMessage}
        sttScore={sttScore}
        sttFeedback={sttFeedback}
        sttStatusMessage={sttStatusMessage}
        cloudUploadStatusMessage={cloudUploadStatusMessage}
        showCloudAction={showCloudAction}
        cloudStatusMessage={cloudStatusMessage}
        onFlipAnki={onFlipAnki}
        onGradeAnki={onGradeAnki}
        onRevealPattern={onRevealPattern}
        onCompletePattern={onCompletePattern}
        onNext={onNext}
        onNextSection={onNextSection}
        showNextSectionAction={showNextSectionAction}
        onRestartTimer={onRestartTimer}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onTogglePlayback={onTogglePlayback}
        onSeekPlayback={onSeekPlayback}
        onRunCloudScore={onRunCloudScore}
      />
      <CloudConsentModal
        visible={showCloudConsentModal}
        onApprove={onApproveCloudConsent}
        onDeny={onDenyCloudConsent}
        onDismiss={onDismissCloudConsent}
      />
    </SessionScaffold>
  );
}
