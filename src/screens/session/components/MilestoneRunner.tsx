import React from 'react';
import { Pressable, View } from 'react-native';
import type { RecordingMetadata } from '../../../data/recordings-store';
import { AppText } from '../../../ui/AppText';
import { sessionStyles } from '../session.styles';
import { ReviewRunnerScaffold } from './ReviewRunnerScaffold';

type MilestoneRunnerProps = {
  dayNumber: number;
  remainingSeconds: number;
  isRecording: boolean;
  hasLastRecording: boolean;
  isCurrentPlaybackActive: boolean;
  previousMilestones: RecordingMetadata[];
  previousPlayingUri: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayCurrent: () => void;
  onPlayPrevious: (uri: string) => void;
  onFinish: () => void;
  canFinish: boolean;
};

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function MilestoneRunner({
  dayNumber,
  remainingSeconds,
  isRecording,
  hasLastRecording,
  isCurrentPlaybackActive,
  previousMilestones,
  previousPlayingUri,
  onStartRecording,
  onStopRecording,
  onPlayCurrent,
  onPlayPrevious,
  onFinish,
  canFinish,
}: MilestoneRunnerProps) {
  return (
    <ReviewRunnerScaffold
      title={`Milestone Audit (Day ${dayNumber})`}
      subtitle="Speak continuously for 10 minutes. No stopping, no preparation."
      primaryAction={{
        label: 'Finish Milestone',
        onPress: onFinish,
        disabled: !canFinish,
      }}
    >
      <AppText variant="timer" center>
        {formatSeconds(remainingSeconds)}
      </AppText>
      <AppText variant="caption" center muted>
        Remaining in milestone
      </AppText>
      <View style={sessionStyles.recordingControlsWrap}>
        <View style={sessionStyles.rowActions}>
          <View style={sessionStyles.rowActionItem}>
            <PrimaryButton label="Record" onPress={onStartRecording} disabled={isRecording} />
          </View>
          <View style={sessionStyles.rowActionItem}>
            <PrimaryButton label="Stop" onPress={onStopRecording} disabled={!isRecording} />
          </View>
          <View style={sessionStyles.rowActionItem}>
            <PrimaryButton label={isCurrentPlaybackActive ? 'Pause Current' : 'Play Current'} onPress={onPlayCurrent} disabled={!hasLastRecording} />
          </View>
        </View>
      </View>
      <View style={sessionStyles.reviewBlockCard}>
        <AppText variant="caption" center muted>
          Previous milestone recordings
        </AppText>
        {previousMilestones.length === 0 ? (
          <AppText variant="caption" center muted>
            No previous milestone recording yet.
          </AppText>
        ) : (
          previousMilestones.map((recording) => (
            <Pressable key={recording.id} style={sessionStyles.settingsActionLike} onPress={() => onPlayPrevious(recording.fileUri)}>
              <AppText variant="bodySecondary" center>
                Day {recording.dayNumber} • {new Date(recording.createdAt).toLocaleDateString()}
              </AppText>
              <AppText variant="caption" center muted>
                {previousPlayingUri === recording.fileUri ? 'Playing...' : 'Tap to play'}
              </AppText>
            </Pressable>
          ))
        )}
      </View>
    </ReviewRunnerScaffold>
  );
}
