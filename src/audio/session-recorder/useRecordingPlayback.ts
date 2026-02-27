import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';

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
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    loadedSoundUriRef.current = null;
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
      const updatePlaybackStatus = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
          return;
        }
        setIsPlaying(status.isPlaying);
        setPlaybackPositionMs(status.positionMillis);
        setPlaybackDurationMs(status.durationMillis ?? 0);
        if (status.didJustFinish) {
          trackEvent(
            'playback_stop',
            buildAnalyticsPayload(
              {
                dayNumber,
                sectionId,
              },
              {
                reason: 'finished',
                positionMs: status.positionMillis,
                durationMs: status.durationMillis ?? 0,
              },
            ),
          );
        }
      };

      if (!soundRef.current || loadedSoundUriRef.current !== lastRecordingUri) {
        await unloadSound();
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
        trackEvent(
          'playback_stop',
          buildAnalyticsPayload(
            {
              dayNumber,
              sectionId,
            },
            {
              reason: 'paused',
              positionMs: currentStatus.positionMillis,
              durationMs: currentStatus.durationMillis ?? playbackDurationMs,
            },
          ),
        );
        return;
      }

      if (currentStatus.didJustFinish) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
      setIsPlaying(true);
      trackEvent(
        'playback_start',
        buildAnalyticsPayload(
          {
            dayNumber,
            sectionId,
          },
          {
            positionMs: currentStatus.positionMillis,
            durationMs: currentStatus.durationMillis ?? playbackDurationMs,
          },
        ),
      );
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

      if (!soundRef.current || loadedSoundUriRef.current !== lastRecordingUri) {
        await unloadSound();
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
