import type { AVPlaybackStatus } from 'expo-av';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';

export function buildPlaybackStatusUpdater(params: {
  dayNumber: number;
  sectionId: string;
  setIsPlaying: (value: boolean) => void;
  setPlaybackPositionMs: (value: number) => void;
  setPlaybackDurationMs: (value: number) => void;
}) {
  return (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }
    params.setIsPlaying(status.isPlaying);
    params.setPlaybackPositionMs(status.positionMillis);
    params.setPlaybackDurationMs(status.durationMillis ?? 0);
    if (status.didJustFinish) {
      trackEvent(
        'playback_stop',
        buildAnalyticsPayload(
          {
            dayNumber: params.dayNumber,
            sectionId: params.sectionId,
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
}

export function trackPlaybackStopped(params: {
  dayNumber: number;
  sectionId: string;
  positionMs: number;
  durationMs: number;
}) {
  trackEvent(
    'playback_stop',
    buildAnalyticsPayload(
      {
        dayNumber: params.dayNumber,
        sectionId: params.sectionId,
      },
      {
        reason: 'paused',
        positionMs: params.positionMs,
        durationMs: params.durationMs,
      },
    ),
  );
}

export function trackPlaybackStarted(params: {
  dayNumber: number;
  sectionId: string;
  positionMs: number;
  durationMs: number;
}) {
  trackEvent(
    'playback_start',
    buildAnalyticsPayload(
      {
        dayNumber: params.dayNumber,
        sectionId: params.sectionId,
      },
      {
        positionMs: params.positionMs,
        durationMs: params.durationMs,
      },
    ),
  );
}
