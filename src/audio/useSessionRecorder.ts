import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

type UseSessionRecorderParams = {
  dayNumber: number;
  sectionId: string;
};

export function useSessionRecorder({ dayNumber, sectionId }: UseSessionRecorderParams) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      void recordingRef.current?.stopAndUnloadAsync();
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
  }, []);

  const ensureRecordingsDir = useCallback(async () => {
    const baseDir = `${FileSystem.documentDirectory}speak90/recordings`;
    const dirInfo = await FileSystem.getInfoAsync(baseDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
    }
    return baseDir;
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
    } catch {
      setErrorMessage('Could not start recording right now.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      recordingRef.current = null;

      const sourceUri = recording.getURI();
      if (!sourceUri) {
        setErrorMessage('Recording stopped, but no audio file was created.');
        return;
      }

      const dir = await ensureRecordingsDir();
      const safeSection = sectionId.replace(/[^a-zA-Z0-9_-]/g, '-');
      const fileName = `session_day${dayNumber}_${safeSection}_${Date.now()}.m4a`;
      const destinationUri = `${dir}/${fileName}`;

      await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
      setLastRecordingUri(destinationUri);
    } catch {
      setErrorMessage('Could not save recording. You can continue the session.');
      setIsRecording(false);
      recordingRef.current = null;
    } finally {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    }
  }, [dayNumber, ensureRecordingsDir, sectionId]);

  const playLastRecording = useCallback(async () => {
    if (!lastRecordingUri) {
      setErrorMessage('No recording yet for this section.');
      return;
    }

    try {
      setErrorMessage(null);

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: lastRecordingUri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) {
            return;
          }
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        },
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch {
      setErrorMessage('Could not play recording.');
      setIsPlaying(false);
    }
  }, [lastRecordingUri]);

  return {
    isRecording,
    isPlaying,
    hasLastRecording: !!lastRecordingUri,
    errorMessage,
    startRecording,
    stopRecording,
    playLastRecording,
  };
}
