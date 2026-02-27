import type { ReminderSettings } from '../../data/reminder-settings-store';
import { applyReminderSettingsWithSync } from './reminder-sync.service';

const mockSyncDailyReminder = jest.fn();
const mockTrackEvent = jest.fn();

jest.mock('../../notifications/reminders', () => ({
  syncDailyReminder: (...args: unknown[]) => mockSyncDailyReminder(...args),
}));

jest.mock('../../analytics/events', () => ({
  buildAnalyticsPayload: jest.fn((base: Record<string, unknown>, extras?: Record<string, unknown>) => ({
    ...base,
    ...(extras ?? {}),
  })),
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

const previousSettings: ReminderSettings = {
  enabled: false,
  hour: 19,
  minute: 0,
  snoozeEnabled: true,
};

const nextSettings: ReminderSettings = {
  enabled: true,
  hour: 8,
  minute: 30,
  snoozeEnabled: false,
};

describe('applyReminderSettingsWithSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables reminders when permission is denied after enabling', async () => {
    const saveReminderSettingsAndSync = jest.fn(async () => undefined);
    const setReminderFeedback = jest.fn();
    mockSyncDailyReminder.mockResolvedValue({
      available: true,
      permissionGranted: false,
    });

    await applyReminderSettingsWithSync({
      currentDay: 2,
      operationId: 1,
      latestOperationRef: { current: 1 },
      previousSettings,
      nextSettings,
      options: { shouldSync: true, trackOptIn: true },
      saveReminderSettingsAndSync,
      setReminderFeedback,
      formatReminderTime: () => '08:30',
    });

    expect(saveReminderSettingsAndSync).toHaveBeenCalledTimes(2);
    expect(saveReminderSettingsAndSync.mock.calls[1][0]).toEqual({
      ...nextSettings,
      enabled: false,
    });
    expect(setReminderFeedback).toHaveBeenCalledWith('Reminder permission denied. Reminders remain disabled.');
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'notification_opt_in',
      expect.objectContaining({ enabled: false, status: 'denied' }),
    );
  });

  it('applies success feedback and tracks opt-in grant', async () => {
    const saveReminderSettingsAndSync = jest.fn(async () => undefined);
    const setReminderFeedback = jest.fn();
    mockSyncDailyReminder.mockResolvedValue({
      available: true,
      permissionGranted: true,
    });

    await applyReminderSettingsWithSync({
      currentDay: 4,
      operationId: 2,
      latestOperationRef: { current: 2 },
      previousSettings,
      nextSettings,
      options: { shouldSync: true, trackOptIn: true },
      saveReminderSettingsAndSync,
      setReminderFeedback,
      formatReminderTime: () => '08:30',
    });

    expect(saveReminderSettingsAndSync).toHaveBeenCalledTimes(1);
    expect(setReminderFeedback).toHaveBeenLastCalledWith('Daily reminder set for 08:30.');
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'notification_opt_in',
      expect.objectContaining({ enabled: true, status: 'granted' }),
    );
  });

  it('ignores stale operation after save', async () => {
    const saveReminderSettingsAndSync = jest.fn(async () => undefined);
    const setReminderFeedback = jest.fn();
    const latestOperationRef = { current: 9 };
    mockSyncDailyReminder.mockResolvedValue({
      available: true,
      permissionGranted: true,
    });

    await applyReminderSettingsWithSync({
      currentDay: 1,
      operationId: 8,
      latestOperationRef,
      previousSettings,
      nextSettings,
      options: { shouldSync: true, trackOptIn: true },
      saveReminderSettingsAndSync,
      setReminderFeedback,
      formatReminderTime: () => '08:30',
    });

    expect(saveReminderSettingsAndSync).toHaveBeenCalledTimes(1);
    expect(mockSyncDailyReminder).not.toHaveBeenCalled();
    expect(setReminderFeedback).not.toHaveBeenCalled();
  });
});

