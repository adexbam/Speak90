import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../cloud/cloud-backup-config';

const CLOUD_BACKUP_SETTINGS_KEY = 'speak90:cloud-backup-settings:v1';
const CLOUD_UPLOAD_RECORDS_KEY = 'speak90:cloud-upload-records:v1';

export type CloudBackupSettings = {
  enabled: boolean;
};

export type CloudUploadRecord = {
  id: string;
  dayNumber: number;
  sectionId: string;
  fileUri: string;
  createdAt: string;
  uploadedAt: string;
  durationMs: number;
  retentionDays: number;
};

export const DEFAULT_CLOUD_BACKUP_SETTINGS: CloudBackupSettings = {
  enabled: false,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function sanitizeCloudBackupSettings(value: unknown): CloudBackupSettings {
  if (!isObject(value)) {
    return DEFAULT_CLOUD_BACKUP_SETTINGS;
  }
  return {
    enabled: value.enabled === true,
  };
}

function isValidUploadRecord(value: unknown): value is CloudUploadRecord {
  if (!isObject(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.dayNumber === 'number' &&
    typeof value.sectionId === 'string' &&
    typeof value.fileUri === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.uploadedAt === 'string' &&
    typeof value.durationMs === 'number' &&
    typeof value.retentionDays === 'number'
  );
}

export async function loadCloudBackupSettings(): Promise<CloudBackupSettings> {
  const raw = await AsyncStorage.getItem(CLOUD_BACKUP_SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_CLOUD_BACKUP_SETTINGS;
  }

  try {
    return sanitizeCloudBackupSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_CLOUD_BACKUP_SETTINGS;
  }
}

export async function saveCloudBackupSettings(settings: CloudBackupSettings): Promise<void> {
  await AsyncStorage.setItem(CLOUD_BACKUP_SETTINGS_KEY, JSON.stringify(sanitizeCloudBackupSettings(settings)));
}

export async function loadCloudUploadRecords(): Promise<CloudUploadRecord[]> {
  const raw = await AsyncStorage.getItem(CLOUD_UPLOAD_RECORDS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidUploadRecord).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
  } catch {
    return [];
  }
}

async function saveCloudUploadRecords(records: CloudUploadRecord[]): Promise<void> {
  await AsyncStorage.setItem(CLOUD_UPLOAD_RECORDS_KEY, JSON.stringify(records));
}

export async function addCloudUploadRecord(record: CloudUploadRecord): Promise<CloudUploadRecord[]> {
  const current = await loadCloudUploadRecords();
  const next = [record, ...current];
  await saveCloudUploadRecords(next);
  return applyCloudUploadRetention(record.retentionDays || CLOUD_BACKUP_RETENTION_DAYS);
}

export async function applyCloudUploadRetention(retentionDays = CLOUD_BACKUP_RETENTION_DAYS): Promise<CloudUploadRecord[]> {
  const nowMs = Date.now();
  const maxAgeMs = Math.max(1, retentionDays) * 24 * 60 * 60 * 1000;
  const current = await loadCloudUploadRecords();
  const kept = current.filter((item) => {
    const uploadedAtMs = Date.parse(item.uploadedAt);
    if (Number.isNaN(uploadedAtMs)) {
      return false;
    }
    return nowMs - uploadedAtMs <= maxAgeMs;
  });
  await saveCloudUploadRecords(kept);
  return kept;
}
