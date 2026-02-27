import React from 'react';
import { View } from 'react-native';
import type { SttFeedbackState } from '../../../audio/stt-score';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { sessionStyles } from '../session.styles';
import { RecordingPlayback } from './RecordingPlayback';

type SessionRecordingControlsProps = {
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
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTogglePlayback: () => void;
  onSeekPlayback: (progressRatio: number) => void;
  onRunCloudScore: () => void;
};

export function SessionRecordingControls({
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
  onStartRecording,
  onStopRecording,
  onTogglePlayback,
  onSeekPlayback,
  onRunCloudScore,
}: SessionRecordingControlsProps) {
  return (
    <View style={sessionStyles.recordingControlsWrap}>
      <View style={sessionStyles.rowActions}>
        <View style={sessionStyles.recordingActionGroup}>
          <View style={sessionStyles.rowActionItem}>
            <PrimaryButton label="Record" onPress={onStartRecording} disabled={isRecording} />
          </View>
          <View style={sessionStyles.rowActionItem}>
            <PrimaryButton label="Stop" onPress={onStopRecording} disabled={!isRecording} />
          </View>
          <View style={sessionStyles.rowActionItem}>
            <PrimaryButton label={isPlaying ? 'Pause' : 'Play Last'} onPress={onTogglePlayback} disabled={!hasLastRecording} />
          </View>
        </View>
      </View>
      <RecordingPlayback
        hasLastRecording={hasLastRecording}
        playbackPositionMs={playbackPositionMs}
        playbackDurationMs={playbackDurationMs}
        errorMessage={recordingErrorMessage}
        onSeek={onSeekPlayback}
      />
      {sttScore !== null ? (
        <View style={sessionStyles.sttScoreWrap}>
          <AppText variant="caption" center muted>
            Pronunciation Score: {sttScore}/100
          </AppText>
          <AppText
            variant="caption"
            center
            style={sttFeedback === 'good' ? sessionStyles.sttFeedbackGood : sessionStyles.sttFeedbackNeedsWork}
          >
            {sttFeedback === 'good' ? 'good' : 'needs work'}
          </AppText>
        </View>
      ) : sttStatusMessage ? (
        <AppText variant="caption" center muted>
          {sttStatusMessage}
        </AppText>
      ) : null}
      {showCloudAction ? <PrimaryButton label="Run Cloud Score" onPress={onRunCloudScore} disabled={!hasLastRecording} /> : null}
      {cloudUploadStatusMessage ? (
        <AppText variant="caption" center muted>
          {cloudUploadStatusMessage}
        </AppText>
      ) : null}
      {cloudStatusMessage ? (
        <AppText variant="caption" center muted>
          {cloudStatusMessage}
        </AppText>
      ) : null}
    </View>
  );
}
