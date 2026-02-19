import { applyRecordingRetention } from './recordings-store';
import { runRecordingSweeper } from './recordings-sweeper';

jest.mock('./recordings-store', () => ({
  RECORDINGS_RETENTION_DAYS: 30,
  applyRecordingRetention: jest.fn(),
}));

const mockApplyRecordingRetention = applyRecordingRetention as jest.MockedFunction<typeof applyRecordingRetention>;

describe('recordings-sweeper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns kept count when retention succeeds', async () => {
    mockApplyRecordingRetention.mockResolvedValue([
      {
        id: '1',
        dayNumber: 1,
        sectionId: 'warmup',
        createdAt: '2099-01-01T00:00:00.000Z',
        fileUri: 'file:///a.m4a',
        durationMs: 1000,
      },
    ]);

    await expect(runRecordingSweeper()).resolves.toEqual({
      ok: true,
      keptCount: 1,
    });
  });

  it('swallows failures and returns non-crashing result', async () => {
    mockApplyRecordingRetention.mockRejectedValue(new Error('boom'));

    await expect(runRecordingSweeper()).resolves.toEqual({
      ok: false,
      keptCount: 0,
      error: 'boom',
    });
  });
});
