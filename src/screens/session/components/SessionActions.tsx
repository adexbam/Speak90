import React from 'react';
import { View } from 'react-native';
import type { SessionSection, SessionSectionType } from '../../../data/day-model';
import { AppText } from '../../../ui/AppText';
import { sessionStyles } from '../session.styles';
import type { SttFeedbackState } from '../../../audio/stt-score';
import { SessionRecordingControls } from './SessionRecordingControls';
import { SessionPromptActions } from './SessionPromptActions';
import { SessionNavActions } from './SessionNavActions';

type SessionActionsProps = {
  sectionType: SessionSectionType;
  section: SessionSection;
  repRound: number;
  sentenceIndex: number;
  isRepEnforced: boolean;
  ankiFlipped: boolean;
  patternRevealed: boolean;
  patternCompletedForSentence: boolean;
  hintText: string;
  showRecordingControls: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  hasLastRecording: boolean;
  playbackPositionMs: number;
  playbackDurationMs: number;
  recordingErrorMessage?: string | null;
  sttScore: number | null;
  sttFeedback: SttFeedbackState | null;
  sttStatusMessage?: string | null;
  cloudUploadStatusMessage?: string | null;
  showCloudAction: boolean;
  cloudStatusMessage?: string | null;
  onFlipAnki: () => void;
  onGradeAnki: (grade: 'again' | 'good' | 'easy') => void;
  onRevealPattern: () => void;
  onCompletePattern: () => void;
  onNext: () => void;
  onNextSection: () => void;
  showNextSectionAction?: boolean;
  onRestartTimer: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTogglePlayback: () => void;
  onSeekPlayback: (progressRatio: number) => void;
  onRunCloudScore: () => void;
};

export function SessionActions({
  sectionType,
  section,
  repRound,
  sentenceIndex,
  isRepEnforced,
  ankiFlipped,
  patternRevealed,
  patternCompletedForSentence,
  hintText,
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
  onFlipAnki,
  onGradeAnki,
  onRevealPattern,
  onCompletePattern,
  onNext,
  onNextSection,
  showNextSectionAction = true,
  onRestartTimer,
  onStartRecording,
  onStopRecording,
  onTogglePlayback,
  onSeekPlayback,
  onRunCloudScore,
}: SessionActionsProps) {
  return (
    <View style={sessionStyles.actionBar}>
      <AppText variant="caption" muted center>
        {hintText}
      </AppText>
      {showRecordingControls ? (
        <SessionRecordingControls
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
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onTogglePlayback={onTogglePlayback}
          onSeekPlayback={onSeekPlayback}
          onRunCloudScore={onRunCloudScore}
        />
      ) : null}
      <SessionPromptActions
        sectionType={sectionType}
        section={section}
        repRound={repRound}
        isRepEnforced={isRepEnforced}
        ankiFlipped={ankiFlipped}
        patternRevealed={patternRevealed}
        patternCompletedForSentence={patternCompletedForSentence}
        onFlipAnki={onFlipAnki}
        onGradeAnki={onGradeAnki}
        onRevealPattern={onRevealPattern}
        onCompletePattern={onCompletePattern}
        onNext={onNext}
      />
      <SessionNavActions
        showNextSectionAction={showNextSectionAction}
        onNextSection={onNextSection}
        onRestartTimer={onRestartTimer}
      />
    </View>
  );
}
