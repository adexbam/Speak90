import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const RECORDINGS_KEY = 'speak90:recordings:v1';
export const RECORDINGS_RETENTION_DAYS = 30;
export const RECORDINGS_DIR = `${FileSystem.documentDirectory}speak90/recordings`;

export interface RecordingMetadata {
  id: string;
  dayNumber: number;
  sectionId: string;
  createdAt: string;
  fileUri: string;
  durationMs: number;
  kind?: 'session' | 'milestone';
}

function isValidRecording(value: unknown): value is RecordingMetadata {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Partial<RecordingMetadata>;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    Number.isInteger(item.dayNumber) &&
    (item.dayNumber ?? 0) > 0 &&
    typeof item.sectionId === 'string' &&
    item.sectionId.length > 0 &&
    typeof item.createdAt === 'string' &&
    item.createdAt.length > 0 &&
    typeof item.fileUri === 'string' &&
    item.fileUri.length > 0 &&
    Number.isFinite(item.durationMs) &&
    (item.durationMs ?? -1) >= 0 &&
    (item.kind === undefined || item.kind === 'session' || item.kind === 'milestone')
  );
}

async function saveRecordingMetadataList(items: RecordingMetadata[]): Promise<void> {
  await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(items));
}

async function deleteFileQuietly(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Ignore deletion failures to avoid blocking user flow.
  }
}

function retentionCutoffIso(retentionDays: number): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff.toISOString();
}

export async function loadRecordingMetadataList(): Promise<RecordingMetadata[]> {
  const raw = await AsyncStorage.getItem(RECORDINGS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidRecording).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}

export async function applyRecordingRetention(retentionDays = RECORDINGS_RETENTION_DAYS): Promise<RecordingMetadata[]> {
  const all = await loadRecordingMetadataList();
  const cutoff = retentionCutoffIso(retentionDays);
  const kept: RecordingMetadata[] = [];
  const removed: RecordingMetadata[] = [];

  for (const item of all) {
    if (item.createdAt < cutoff) {
      removed.push(item);
    } else {
      kept.push(item);
    }
  }

  await Promise.all(removed.map((item) => deleteFileQuietly(item.fileUri)));
  await saveRecordingMetadataList(kept);
  return kept;
}

export async function addRecordingMetadata(
  item: RecordingMetadata,
  retentionDays = RECORDINGS_RETENTION_DAYS,
): Promise<RecordingMetadata[]> {
  const current = await loadRecordingMetadataList();
  const deduped = current.filter((x) => x.id !== item.id && x.fileUri !== item.fileUri);
  const next = [item, ...deduped];
  await saveRecordingMetadataList(next);
  return applyRecordingRetention(retentionDays);
}

export async function getLatestRecordingForSection(dayNumber: number, sectionId: string): Promise<RecordingMetadata | null> {
  const items = await loadRecordingMetadataList();
  const match = items.find((item) => item.dayNumber === dayNumber && item.sectionId === sectionId);
  return match ?? null;
}

export async function clearAllRecordings(): Promise<void> {
  const items = await loadRecordingMetadataList();
  await Promise.all(items.map((item) => deleteFileQuietly(item.fileUri)));
  await AsyncStorage.removeItem(RECORDINGS_KEY);
  try {
    const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(RECORDINGS_DIR, { idempotent: true });
    }
  } catch {
    // Ignore cleanup failures.
  }
}

export async function loadMilestoneRecordings(): Promise<RecordingMetadata[]> {
  const items = await loadRecordingMetadataList();
  return items.filter((item) => item.kind === 'milestone');
}
