import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { addRecordingMetadata, getLatestRecordingForSection, RECORDINGS_DIR } from '../data/recordings-store';

type UseSessionRecorderParams = {
  dayNumber: number;
  sectionId: string;
};

export function useSessionRecorder({ dayNumber, sectionId }: UseSessionRecorderParams) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [playbackDurationMs, setPlaybackDurationMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadedSoundUriRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadLast = async () => {
      const latest = await getLatestRecordingForSection(dayNumber, sectionId);
      if (!active) {
        return;
      }
      setLastRecordingUri(latest?.fileUri ?? null);
      setPlaybackPositionMs(0);
      setPlaybackDurationMs(0);
      setIsPlaying(false);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      loadedSoundUriRef.current = null;
    };

    void loadLast();

    return () => {
      active = false;
    };
  }, [dayNumber, sectionId]);

  useEffect(() => {
    return () => {
      void recordingRef.current?.stopAndUnloadAsync();
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
  }, []);

  const ensureRecordingsDir = useCallback(async () => {
    const baseDir = RECORDINGS_DIR;
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
        return;
      }

      const dir = await ensureRecordingsDir();
      const yyyyMmDd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const safeSection = sectionId.replace(/[^a-zA-Z0-9_-]/g, '-');
      const fileName = `session_${yyyyMmDd}_day${dayNumber}_section${safeSection}_${Date.now()}.m4a`;
      const destinationUri = `${dir}/${fileName}`;

      await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
      setLastRecordingUri(destinationUri);

      await addRecordingMetadata({
        id: `${dayNumber}-${safeSection}-${Date.now()}`,
        dayNumber,
        sectionId: sectionId,
        createdAt: new Date().toISOString(),
        fileUri: destinationUri,
        durationMs,
      });
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
      const updatePlaybackStatus = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
          return;
        }
        setIsPlaying(status.isPlaying);
        setPlaybackPositionMs(status.positionMillis);
        setPlaybackDurationMs(status.durationMillis ?? 0);
      };

      if (!soundRef.current || loadedSoundUriRef.current !== lastRecordingUri) {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: lastRecordingUri },
          { shouldPlay: false },
          updatePlaybackStatus,
        );
        soundRef.current = sound;
        loadedSoundUriRef.current = lastRecordingUri;
      }

      const sound = soundRef.current;
      if (!sound) {
        return;
      }

      const currentStatus = await sound.getStatusAsync();
      if (!currentStatus.isLoaded) {
        return;
      }

      if (currentStatus.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (currentStatus.didJustFinish) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
      setIsPlaying(true);
    } catch {
      setErrorMessage('Could not play recording.');
      setIsPlaying(false);
    }
  }, [lastRecordingUri]);

  const seekLastRecording = useCallback(
    async (progressRatio: number) => {
      if (!lastRecordingUri) {
        return;
      }

      try {
        setErrorMessage(null);
        const clampedRatio = Math.min(1, Math.max(0, progressRatio));

        if (!soundRef.current || loadedSoundUriRef.current !== lastRecordingUri) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: lastRecordingUri },
            { shouldPlay: false },
            (status) => {
              if (!status.isLoaded) {
                return;
              }
              setIsPlaying(status.isPlaying);
              setPlaybackPositionMs(status.positionMillis);
              setPlaybackDurationMs(status.durationMillis ?? 0);
            },
          );
          soundRef.current = sound;
          loadedSoundUriRef.current = lastRecordingUri;
        }

        const sound = soundRef.current;
        if (!sound) {
          return;
        }
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          return;
        }
        const durationMs = status.durationMillis ?? playbackDurationMs;
        if (!durationMs || durationMs <= 0) {
          return;
        }

        const nextPosition = Math.round(durationMs * clampedRatio);
        await sound.setPositionAsync(nextPosition);
        setPlaybackPositionMs(nextPosition);
      } catch {
        setErrorMessage('Could not seek recording.');
      }
    },
    [lastRecordingUri, playbackDurationMs],
  );

  return {
    isRecording,
    isPlaying,
    hasLastRecording: !!lastRecordingUri,
    playbackPositionMs,
    playbackDurationMs,
    errorMessage,
    startRecording,
    stopRecording,
    playLastRecording,
    seekLastRecording,
  };
}
