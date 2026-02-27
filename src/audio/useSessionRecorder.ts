import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { addRecordingMetadata, getLatestRecordingForSection, RECORDINGS_DIR } from '../data/recordings-store';
import { buildAnalyticsPayload, trackEvent } from '../analytics/events';
import { scorePronunciationLocally, type SttFeedbackState } from './stt-score';
import {
  addCloudUploadRecord,
} from '../data/cloud-backup-store';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../cloud/cloud-backup-config';
import { loadCloudAudioConsentAudit } from '../data/cloud-audio-consent-store';
import { shouldUploadRecordingToCloud, uploadRecordingToCloud } from '../cloud/recording-upload';
import { useAppSettingsStore } from '../state/app-settings-store';

type UseSessionRecorderParams = {
  dayNumber: number;
  sectionId: string;
  expectedText: string;
  cloudBackupFlagEnabled: boolean;
  recordingKind?: 'session' | 'milestone';
};

export function useSessionRecorder({ dayNumber, sectionId, expectedText, cloudBackupFlagEnabled, recordingKind = 'session' }: UseSessionRecorderParams) {
  const refreshCloudBackupSettings = useAppSettingsStore((s) => s.refreshCloudBackupSettings);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [playbackDurationMs, setPlaybackDurationMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);
  const [sttScore, setSttScore] = useState<number | null>(null);
  const [sttFeedback, setSttFeedback] = useState<SttFeedbackState | null>(null);
  const [sttStatusMessage, setSttStatusMessage] = useState<string | null>(null);
  const [cloudUploadStatusMessage, setCloudUploadStatusMessage] = useState<string | null>(null);

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
      setSttScore(null);
      setSttFeedback(null);
      setSttStatusMessage(null);
      setCloudUploadStatusMessage(null);
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
        kind: recordingKind,
      });
      trackEvent(
        'record_stop',
        buildAnalyticsPayload(
          {
            dayNumber,
            sectionId,
          },
          {
            durationMs,
            hasRecording: true,
          },
        ),
      );

      const cloudBackupSettings = await refreshCloudBackupSettings();
      const cloudConsent = await loadCloudAudioConsentAudit();
      const shouldUpload = shouldUploadRecordingToCloud({
        cloudFlagEnabled: cloudBackupFlagEnabled,
        cloudBackupEnabled: cloudBackupSettings.enabled,
        consentDecision: cloudConsent?.decision ?? null,
      });
      if (shouldUpload) {
        const uploadResult = await uploadRecordingToCloud({
          fileUri: destinationUri,
          metadata: {
            dayNumber,
            sectionId,
            createdAt: new Date().toISOString(),
            durationMs,
          },
          retentionDays: CLOUD_BACKUP_RETENTION_DAYS,
        });
        if (uploadResult.uploaded) {
          await addCloudUploadRecord({
            id: `${dayNumber}-${safeSection}-${Date.now()}-cloud`,
            dayNumber,
            sectionId,
            fileUri: destinationUri,
            createdAt: new Date().toISOString(),
            uploadedAt: new Date().toISOString(),
            durationMs,
            retentionDays: CLOUD_BACKUP_RETENTION_DAYS,
          });
          setCloudUploadStatusMessage(`Cloud backup uploaded (retention ${CLOUD_BACKUP_RETENTION_DAYS} days).`);
        } else {
          setCloudUploadStatusMessage(uploadResult.reason ?? 'Cloud backup failed. Local recording is still available.');
        }
      } else if (cloudBackupSettings.enabled) {
        if (cloudConsent?.decision === 'denied') {
          setCloudUploadStatusMessage('Cloud backup skipped (consent denied). Local-only mode active.');
        } else if (!cloudBackupFlagEnabled) {
          setCloudUploadStatusMessage('Cloud backup feature is currently disabled.');
        } else {
          setCloudUploadStatusMessage('Cloud backup requires consent.');
        }
      } else {
        setCloudUploadStatusMessage('Cloud backup is off. You can enable it from Home.');
      }

      const sttResult = scorePronunciationLocally({
        expectedText,
        durationMs,
      });
      if (sttResult.supported) {
        setSttScore(sttResult.score);
        setSttFeedback(sttResult.feedback);
        setSttStatusMessage(null);
        trackEvent(
          'stt_scored',
          buildAnalyticsPayload(
            {
              dayNumber,
              sectionId,
            },
            {
              supported: true,
              score: sttResult.score,
              feedback: sttResult.feedback,
              engine: sttResult.engine,
            },
          ),
        );
      } else {
        setSttScore(null);
        setSttFeedback(null);
        setSttStatusMessage(sttResult.reason);
        trackEvent(
          'stt_scored',
          buildAnalyticsPayload(
            {
              dayNumber,
              sectionId,
            },
            {
              supported: false,
              score: null,
              feedback: null,
              engine: sttResult.engine,
              reason: sttResult.reason,
            },
          ),
        );
      }
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
  }, [cloudBackupFlagEnabled, dayNumber, ensureRecordingsDir, expectedText, recordingKind, sectionId, refreshCloudBackupSettings]);

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
  }, [dayNumber, lastRecordingUri, playbackDurationMs, sectionId]);

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
    sttScore,
    sttFeedback,
    sttStatusMessage,
    cloudUploadStatusMessage,
    startRecording,
    stopRecording,
    playLastRecording,
    seekLastRecording,
  };
}
