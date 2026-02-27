import { useEffect, useMemo, useState } from 'react';
import { getLatestRecordingForSection } from '../data/recordings-store';
import { useRecordingCapture } from './session-recorder/useRecordingCapture';
import { useRecordingPlayback } from './session-recorder/useRecordingPlayback';
import { useRecordingPostProcessing } from './session-recorder/useRecordingPostProcessing';

type UseSessionRecorderParams = {
  dayNumber: number;
  sectionId: string;
  expectedText: string;
  cloudBackupFlagEnabled: boolean;
  recordingKind?: 'session' | 'milestone';
};

export function useSessionRecorder({
  dayNumber,
  sectionId,
  expectedText,
  cloudBackupFlagEnabled,
  recordingKind = 'session',
}: UseSessionRecorderParams) {
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);

  const capture = useRecordingCapture({ dayNumber, sectionId });
  const playback = useRecordingPlayback({ dayNumber, sectionId, lastRecordingUri });
  const postProcessing = useRecordingPostProcessing({
    dayNumber,
    sectionId,
    expectedText,
    cloudBackupFlagEnabled,
    recordingKind,
  });

  useEffect(() => {
    let active = true;
    const loadLast = async () => {
      const latest = await getLatestRecordingForSection(dayNumber, sectionId);
      if (!active) {
        return;
      }
      setLastRecordingUri(latest?.fileUri ?? null);
      playback.resetPlaybackState();
      postProcessing.reset();
      playback.clearError();
      capture.clearError();
      await playback.unloadSound();
    };
    void loadLast();
    return () => {
      active = false;
    };
  }, [
    dayNumber,
    sectionId,
    playback.resetPlaybackState,
    postProcessing.reset,
    playback.clearError,
    capture.clearError,
    playback.unloadSound,
  ]);

  useEffect(() => {
    return () => {
      void capture.stopAndUnloadOnCleanup();
      void playback.unloadSound();
    };
  }, [capture.stopAndUnloadOnCleanup, playback.unloadSound]);

  const stopRecording = async () => {
    const result = await capture.stopRecording();
    if (!result) {
      return;
    }
    setLastRecordingUri(result.destinationUri);
    playback.resetPlaybackState();
    await postProcessing.processRecording(result);
  };

  const errorMessage = useMemo(
    () => capture.errorMessage ?? playback.errorMessage,
    [capture.errorMessage, playback.errorMessage],
  );

  return {
    isRecording: capture.isRecording,
    isPlaying: playback.isPlaying,
    hasLastRecording: !!lastRecordingUri,
    playbackPositionMs: playback.playbackPositionMs,
    playbackDurationMs: playback.playbackDurationMs,
    errorMessage,
    sttScore: postProcessing.sttScore,
    sttFeedback: postProcessing.sttFeedback,
    sttStatusMessage: postProcessing.sttStatusMessage,
    cloudUploadStatusMessage: postProcessing.cloudUploadStatusMessage,
    startRecording: capture.startRecording,
    stopRecording,
    playLastRecording: playback.playLastRecording,
    seekLastRecording: playback.seekLastRecording,
  };
}
