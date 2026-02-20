import React, { useState } from 'react';
import { GestureResponderEvent, Pressable, View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { sessionStyles } from '../session.styles';

type RecordingPlaybackProps = {
  hasLastRecording: boolean;
  playbackPositionMs: number;
  playbackDurationMs: number;
  errorMessage?: string | null;
  onSeek: (progressRatio: number) => void;
};

function formatPlaybackTime(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function RecordingPlayback({
  hasLastRecording,
  playbackPositionMs,
  playbackDurationMs,
  errorMessage,
  onSeek,
}: RecordingPlaybackProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const safeDuration = Math.max(0, playbackDurationMs);
  const safePosition = Math.min(Math.max(0, playbackPositionMs), safeDuration || playbackPositionMs);
  const progressRatio = safeDuration > 0 ? safePosition / safeDuration : 0;

  const handleSeek = (event: GestureResponderEvent) => {
    const width = trackWidth;
    const x = event.nativeEvent.locationX;
    if (width <= 0) {
      return;
    }
    const ratio = x / width;
    onSeek(ratio);
  };

  return (
    <View style={sessionStyles.playbackWrap}>
      <Pressable style={sessionStyles.playbackTrack} onPress={handleSeek} disabled={!hasLastRecording || safeDuration <= 0}>
        <View
          style={sessionStyles.playbackTrackBounds}
          onLayout={(event) => {
            setTrackWidth(event.nativeEvent.layout.width);
          }}
        >
          <View style={[sessionStyles.playbackFill, { width: `${Math.max(0, Math.min(100, progressRatio * 100))}%` }]} />
        </View>
      </Pressable>
      <AppText variant="caption" center muted>
        {formatPlaybackTime(safePosition)} / {formatPlaybackTime(safeDuration)}
      </AppText>
      {errorMessage ? (
        <AppText variant="caption" center muted>
          {errorMessage}
        </AppText>
      ) : null}
    </View>
  );
}
