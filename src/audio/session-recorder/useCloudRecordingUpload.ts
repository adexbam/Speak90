import { useCallback, useState } from 'react';
import { addCloudUploadRecord } from '../../data/cloud-backup-store';
import { loadCloudAudioConsentAudit } from '../../data/cloud-audio-consent-store';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../../cloud/cloud-backup-config';
import { shouldUploadRecordingToCloud, uploadRecordingToCloud } from '../../cloud/recording-upload';

type UseCloudRecordingUploadParams = {
  dayNumber: number;
  sectionId: string;
  cloudBackupFlagEnabled: boolean;
  refreshCloudBackupSettings: () => Promise<{ enabled: boolean }>;
};

export function useCloudRecordingUpload({
  dayNumber,
  sectionId,
  cloudBackupFlagEnabled,
  refreshCloudBackupSettings,
}: UseCloudRecordingUploadParams) {
  const [cloudUploadStatusMessage, setCloudUploadStatusMessage] = useState<string | null>(null);

  const runCloudUpload = useCallback(async (params: { destinationUri: string; durationMs: number; safeSection: string }) => {
    const cloudBackupSettings = await refreshCloudBackupSettings();
    const cloudConsent = await loadCloudAudioConsentAudit();
    const shouldUpload = shouldUploadRecordingToCloud({
      cloudFlagEnabled: cloudBackupFlagEnabled,
      cloudBackupEnabled: cloudBackupSettings.enabled,
      consentDecision: cloudConsent?.decision ?? null,
    });

    if (shouldUpload) {
      const uploadResult = await uploadRecordingToCloud({
        fileUri: params.destinationUri,
        metadata: {
          dayNumber,
          sectionId,
          createdAt: new Date().toISOString(),
          durationMs: params.durationMs,
        },
        retentionDays: CLOUD_BACKUP_RETENTION_DAYS,
      });
      if (uploadResult.uploaded) {
        await addCloudUploadRecord({
          id: `${dayNumber}-${params.safeSection}-${Date.now()}-cloud`,
          dayNumber,
          sectionId,
          fileUri: params.destinationUri,
          createdAt: new Date().toISOString(),
          uploadedAt: new Date().toISOString(),
          durationMs: params.durationMs,
          retentionDays: CLOUD_BACKUP_RETENTION_DAYS,
        });
        setCloudUploadStatusMessage(`Cloud backup uploaded (retention ${CLOUD_BACKUP_RETENTION_DAYS} days).`);
      } else {
        setCloudUploadStatusMessage(uploadResult.reason ?? 'Cloud backup failed. Local recording is still available.');
      }
      return;
    }

    if (cloudBackupSettings.enabled) {
      if (cloudConsent?.decision === 'denied') {
        setCloudUploadStatusMessage('Cloud backup skipped (consent denied). Local-only mode active.');
      } else if (!cloudBackupFlagEnabled) {
        setCloudUploadStatusMessage('Cloud backup feature is currently disabled.');
      } else {
        setCloudUploadStatusMessage('Cloud backup requires consent.');
      }
      return;
    }

    setCloudUploadStatusMessage('Cloud backup is off. You can enable it from Home.');
  }, [cloudBackupFlagEnabled, dayNumber, refreshCloudBackupSettings, sectionId]);

  const resetCloudUploadStatus = useCallback(() => {
    setCloudUploadStatusMessage(null);
  }, []);

  return {
    cloudUploadStatusMessage,
    runCloudUpload,
    resetCloudUploadStatus,
  };
}
