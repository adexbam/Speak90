import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_CLOUD_BACKUP_SETTINGS,
  addCloudUploadRecord,
  applyCloudUploadRetention,
  loadCloudBackupSettings,
  loadCloudUploadRecords,
  saveCloudBackupSettings,
} from './cloud-backup-store';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../cloud/cloud-backup-config';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('cloud-backup-store', () => {
  let state: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    state = {};
    storage.getItem.mockImplementation(async (key: string) => state[key] ?? null);
    storage.setItem.mockImplementation(async (key: string, value: string) => {
      state[key] = value;
    });
  });

  it('defaults backup setting to disabled', async () => {
    await expect(loadCloudBackupSettings()).resolves.toEqual(DEFAULT_CLOUD_BACKUP_SETTINGS);
  });

  it('saves and loads backup setting', async () => {
    await saveCloudBackupSettings({ enabled: true });
    await expect(loadCloudBackupSettings()).resolves.toEqual({ enabled: true });
  });

  it('retains upload records by retention window', async () => {
    const oldUploadedAt = new Date(Date.now() - (CLOUD_BACKUP_RETENTION_DAYS + 5) * 24 * 60 * 60 * 1000).toISOString();
    await addCloudUploadRecord({
      id: 'old',
      dayNumber: 1,
      sectionId: 'warmup',
      fileUri: 'file:///old.m4a',
      createdAt: oldUploadedAt,
      uploadedAt: oldUploadedAt,
      durationMs: 3000,
      retentionDays: CLOUD_BACKUP_RETENTION_DAYS,
    });
    await addCloudUploadRecord({
      id: 'new',
      dayNumber: 1,
      sectionId: 'warmup',
      fileUri: 'file:///new.m4a',
      createdAt: new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
      durationMs: 3200,
      retentionDays: CLOUD_BACKUP_RETENTION_DAYS,
    });

    await applyCloudUploadRetention(CLOUD_BACKUP_RETENTION_DAYS);
    const kept = await loadCloudUploadRecords();
    expect(kept.map((x) => x.id)).toEqual(['new']);
  });
});
