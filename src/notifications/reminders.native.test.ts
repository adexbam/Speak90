import type { ReminderSettings } from '../data/reminder-settings-store';

type MockNotifications = {
  AndroidImportance: { HIGH: number };
  setNotificationHandler: jest.Mock;
  setNotificationCategoryAsync: jest.Mock;
  setNotificationChannelAsync: jest.Mock;
  addNotificationResponseReceivedListener: jest.Mock;
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
  getAllScheduledNotificationsAsync?: jest.Mock;
  cancelScheduledNotificationAsync?: jest.Mock;
  cancelAllScheduledNotificationsAsync?: jest.Mock;
  scheduleNotificationAsync: jest.Mock;
};

function createNotificationsMock(overrides?: Partial<MockNotifications>): MockNotifications {
  return {
    AndroidImportance: { HIGH: 4 },
    setNotificationHandler: jest.fn(),
    setNotificationCategoryAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => {}),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    getPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    getAllScheduledNotificationsAsync: jest.fn(async () => []),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
    scheduleNotificationAsync: jest.fn(async () => 'notif-id'),
    ...overrides,
  };
}

async function loadRemindersWithMock(notifications: MockNotifications) {
  jest.resetModules();
  jest.doMock('expo-notifications', () => notifications);
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  return require('./reminders.native') as typeof import('./reminders.native');
}

const enabledSettings: ReminderSettings = {
  enabled: true,
  hour: 19,
  minute: 0,
  snoozeEnabled: false,
};

describe('reminders.native', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('cancels only Speak90-marked reminders when selective cancellation APIs exist', async () => {
    const notifications = createNotificationsMock({
      getAllScheduledNotificationsAsync: jest.fn(async () => [
        {
          identifier: 'reminder-1',
          content: { title: 'Speak90 Reminder', data: { source: 'speak90-reminder' } },
        },
        {
          identifier: 'same-title-other-feature',
          content: { title: 'Speak90 Reminder', data: { source: 'other-feature' } },
        },
      ]),
    });
    const { syncDailyReminder } = await loadRemindersWithMock(notifications);

    await syncDailyReminder({ ...enabledSettings, enabled: false });

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('reminder-1');
    expect(notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });

  it('falls back to cancelAll when selective cancellation APIs are unavailable', async () => {
    const notifications = createNotificationsMock({
      getAllScheduledNotificationsAsync: undefined,
      cancelScheduledNotificationAsync: undefined,
    });
    const { syncDailyReminder } = await loadRemindersWithMock(notifications);

    await syncDailyReminder({ ...enabledSettings, enabled: false });

    expect(notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });

  it('tags daily reminder notifications with a stable source marker', async () => {
    const notifications = createNotificationsMock();
    const { syncDailyReminder } = await loadRemindersWithMock(notifications);

    await syncDailyReminder(enabledSettings);

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          data: { source: 'speak90-reminder' },
        }),
      }),
    );
  });
});
