import { applyRecordingRetention, RECORDINGS_RETENTION_DAYS } from './recordings-store';

export const RECORDINGS_SWEEPER_INTERVAL_MS = 6 * 60 * 60 * 1000;

export type RecordingSweeperResult = {
  ok: boolean;
  keptCount: number;
  error?: string;
};

export async function runRecordingSweeper(retentionDays = RECORDINGS_RETENTION_DAYS): Promise<RecordingSweeperResult> {
  try {
    const kept = await applyRecordingRetention(retentionDays);
    return {
      ok: true,
      keptCount: kept.length,
    };
  } catch (error) {
    return {
      ok: false,
      keptCount: 0,
      error: error instanceof Error ? error.message : 'unknown_error',
    };
  }
}
