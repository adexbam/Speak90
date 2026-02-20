import * as FileSystem from 'expo-file-system/legacy';
import { CLOUD_BACKUP_RETENTION_DAYS } from './cloud-backup-config';

export type RecordingUploadMetadata = {
  dayNumber: number;
  sectionId: string;
  createdAt: string;
  durationMs: number;
};

export type RecordingUploadResult = {
  uploaded: boolean;
  reason?: string;
};

export function shouldUploadRecordingToCloud(params: {
  cloudFlagEnabled: boolean;
  cloudBackupEnabled: boolean;
  consentDecision: 'granted' | 'denied' | null;
}): boolean {
  return params.cloudFlagEnabled && params.cloudBackupEnabled && params.consentDecision === 'granted';
}

function getCloudUploadUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_CLOUD_UPLOAD_URL?.trim();
  return raw ? raw : null;
}

export async function uploadRecordingToCloud(params: {
  fileUri: string;
  metadata: RecordingUploadMetadata;
  retentionDays?: number;
}): Promise<RecordingUploadResult> {
  const endpoint = getCloudUploadUrl();
  if (!endpoint) {
    return { uploaded: false, reason: 'Cloud upload endpoint is not configured.' };
  }

  const retentionDays = params.retentionDays ?? CLOUD_BACKUP_RETENTION_DAYS;

  try {
    const response = await FileSystem.uploadAsync(endpoint, params.fileUri, {
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: 'audio/m4a',
      parameters: {
        dayNumber: String(params.metadata.dayNumber),
        sectionId: params.metadata.sectionId,
        createdAt: params.metadata.createdAt,
        durationMs: String(params.metadata.durationMs),
        retentionDays: String(retentionDays),
      },
      httpMethod: 'POST',
    });

    if (response.status >= 200 && response.status < 300) {
      return { uploaded: true };
    }

    return {
      uploaded: false,
      reason: `Upload failed with status ${response.status}.`,
    };
  } catch {
    return { uploaded: false, reason: 'Upload request failed.' };
  }
}
