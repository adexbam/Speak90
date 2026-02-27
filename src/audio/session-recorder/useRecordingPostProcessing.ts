import { useCallback, useState } from 'react';
import { addRecordingMetadata } from '../../data/recordings-store';
import { addCloudUploadRecord } from '../../data/cloud-backup-store';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../../cloud/cloud-backup-config';
import { loadCloudAudioConsentAudit } from '../../data/cloud-audio-consent-store';
import { shouldUploadRecordingToCloud, uploadRecordingToCloud } from '../../cloud/recording-upload';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import { scorePronunciationLocally, type SttFeedbackState } from '../stt-score';
import { useAppSettingsStore } from '../../state/app-settings-store';

type UseRecordingPostProcessingParams = {
  dayNumber: number;
  sectionId: string;
  expectedText: string;
  cloudBackupFlagEnabled: boolean;
  recordingKind: 'session' | 'milestone';
};

type ProcessRecordingParams = {
  destinationUri: string;
  durationMs: number;
  safeSection: string;
};

export function useRecordingPostProcessing({
  dayNumber,
  sectionId,
  expectedText,
  cloudBackupFlagEnabled,
  recordingKind,
}: UseRecordingPostProcessingParams) {
  const refreshCloudBackupSettings = useAppSettingsStore((s) => s.refreshCloudBackupSettings);
  const [sttScore, setSttScore] = useState<number | null>(null);
  const [sttFeedback, setSttFeedback] = useState<SttFeedbackState | null>(null);
  const [sttStatusMessage, setSttStatusMessage] = useState<string | null>(null);
  const [cloudUploadStatusMessage, setCloudUploadStatusMessage] = useState<string | null>(null);

  const processRecording = useCallback(async ({ destinationUri, durationMs, safeSection }: ProcessRecordingParams) => {
    await addRecordingMetadata({
      id: `${dayNumber}-${safeSection}-${Date.now()}`,
      dayNumber,
      sectionId,
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
  }, [dayNumber, sectionId, recordingKind, refreshCloudBackupSettings, cloudBackupFlagEnabled, expectedText]);

  const reset = useCallback(() => {
    setSttScore(null);
    setSttFeedback(null);
    setSttStatusMessage(null);
    setCloudUploadStatusMessage(null);
  }, []);

  return {
    sttScore,
    sttFeedback,
    sttStatusMessage,
    cloudUploadStatusMessage,
    processRecording,
    reset,
  };
}
