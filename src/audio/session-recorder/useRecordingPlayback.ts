import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { buildPlaybackStatusUpdater, trackPlaybackStarted, trackPlaybackStopped } from './playback-tracker';
import { ensurePlaybackSound, unloadPlaybackSound } from './playback-sound-manager';

type UseRecordingPlaybackParams = {
  dayNumber: number;
  sectionId: string;
  lastRecordingUri: string | null;
};

export function useRecordingPlayback({ dayNumber, sectionId, lastRecordingUri }: UseRecordingPlaybackParams) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [playbackDurationMs, setPlaybackDurationMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const loadedSoundUriRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
  }, []);

  const unloadSound = useCallback(async () => {
    await unloadPlaybackSound({ soundRef, loadedSoundUriRef });
  }, []);

  const resetPlaybackState = useCallback(() => {
    setPlaybackPositionMs(0);
    setPlaybackDurationMs(0);
    setIsPlaying(false);
  }, []);

  const playLastRecording = useCallback(async () => {
    if (!lastRecordingUri) {
      setErrorMessage('No recording yet for this section.');
      return;
    }

    try {
      setErrorMessage(null);
      const sound = await ensurePlaybackSound({
        refs: { soundRef, loadedSoundUriRef },
        uri: lastRecordingUri,
        onStatus: buildPlaybackStatusUpdater({
          dayNumber,
          sectionId,
          setIsPlaying,
          setPlaybackPositionMs,
          setPlaybackDurationMs,
        }),
      });

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
        trackPlaybackStopped({
          dayNumber,
          sectionId,
          positionMs: currentStatus.positionMillis,
          durationMs: currentStatus.durationMillis ?? playbackDurationMs,
        });
        return;
      }

      if (currentStatus.didJustFinish) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
      setIsPlaying(true);
      trackPlaybackStarted({
        dayNumber,
        sectionId,
        positionMs: currentStatus.positionMillis,
        durationMs: currentStatus.durationMillis ?? playbackDurationMs,
      });
    } catch {
      setErrorMessage('Could not play recording.');
      setIsPlaying(false);
    }
  }, [dayNumber, sectionId, lastRecordingUri, playbackDurationMs, unloadSound]);

  const seekLastRecording = useCallback(async (progressRatio: number) => {
    if (!lastRecordingUri) {
      return;
    }

    try {
      setErrorMessage(null);
      const clampedRatio = Math.min(1, Math.max(0, progressRatio));
      const sound = await ensurePlaybackSound({
        refs: { soundRef, loadedSoundUriRef },
        uri: lastRecordingUri,
        onStatus: (status) => {
          if (!status.isLoaded) {
            return;
          }
          setIsPlaying(status.isPlaying);
          setPlaybackPositionMs(status.positionMillis);
          setPlaybackDurationMs(status.durationMillis ?? 0);
        },
      });

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
  }, [lastRecordingUri, playbackDurationMs, unloadSound]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    isPlaying,
    playbackPositionMs,
    playbackDurationMs,
    errorMessage,
    playLastRecording,
    seekLastRecording,
    unloadSound,
    resetPlaybackState,
    clearError,
  };
}
