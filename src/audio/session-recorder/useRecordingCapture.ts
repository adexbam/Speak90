import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { RECORDINGS_DIR } from '../../data/recordings-store';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';

type UseRecordingCaptureParams = {
  dayNumber: number;
  sectionId: string;
};

export type RecordingCaptureResult = {
  destinationUri: string;
  durationMs: number;
  safeSection: string;
};

export function useRecordingCapture({ dayNumber, sectionId }: UseRecordingCaptureParams) {
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const ensureRecordingsDir = useCallback(async () => {
    const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
    }
    return RECORDINGS_DIR;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Microphone permission denied. You can still continue the session.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      trackEvent(
        'record_start',
        buildAnalyticsPayload({
          dayNumber,
          sectionId,
        }),
      );
    } catch {
      setErrorMessage('Could not start recording right now.');
    }
  }, [dayNumber, sectionId]);

  const stopRecording = useCallback(async (): Promise<RecordingCaptureResult | null> => {
    const recording = recordingRef.current;
    if (!recording) {
      return null;
    }

    try {
      let durationMs = 0;
      try {
        const status = await recording.getStatusAsync();
        if (typeof status.durationMillis === 'number') {
          durationMs = status.durationMillis;
        }
      } catch {
        durationMs = 0;
      }

      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      recordingRef.current = null;

      const sourceUri = recording.getURI();
      if (!sourceUri) {
        setErrorMessage('Recording stopped, but no audio file was created.');
        return null;
      }

      const dir = await ensureRecordingsDir();
      const yyyyMmDd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const safeSection = sectionId.replace(/[^a-zA-Z0-9_-]/g, '-');
      const fileName = `session_${yyyyMmDd}_day${dayNumber}_section${safeSection}_${Date.now()}.m4a`;
      const destinationUri = `${dir}/${fileName}`;
      await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
      return { destinationUri, durationMs, safeSection };
    } catch {
      setErrorMessage('Could not save recording. You can continue the session.');
      setIsRecording(false);
      recordingRef.current = null;
      return null;
    } finally {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    }
  }, [dayNumber, sectionId, ensureRecordingsDir]);

  const stopAndUnloadOnCleanup = useCallback(async () => {
    try {
      await recordingRef.current?.stopAndUnloadAsync();
    } catch {
      // ignore cleanup failures
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    isRecording,
    errorMessage,
    startRecording,
    stopRecording,
    stopAndUnloadOnCleanup,
    clearError,
  };
}
