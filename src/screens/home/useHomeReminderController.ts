import { useEffect, useMemo, useState } from 'react';
import { useAppSettingsStore } from '../../state/app-settings-store';
import {
  buildReminderPresets,
  buildReminderTimeOptions,
  formatReminderTime,
} from './reminder-settings.service';
import { useReminderLifecycle } from './useReminderLifecycle';
import { useReminderSettingsActions } from './useReminderSettingsActions';

type UseHomeReminderControllerParams = {
  currentDay: number;
};

export function useHomeReminderController({ currentDay }: UseHomeReminderControllerParams) {
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
  const [cloudBackupFeedback, setCloudBackupFeedback] = useState<string | null>(null);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [localNow, setLocalNow] = useState(() => new Date());

  const reminderSettings = useAppSettingsStore((s) => s.reminderSettings);
  const cloudBackupSettings = useAppSettingsStore((s) => s.cloudBackupSettings);
  const hydrateSettings = useAppSettingsStore((s) => s.hydrate);
  const refreshReminderSettings = useAppSettingsStore((s) => s.refreshReminderSettings);
  const saveReminderSettingsAndSync = useAppSettingsStore((s) => s.saveReminderSettingsAndSync);
  const saveCloudBackupSettingsAndSync = useAppSettingsStore((s) => s.saveCloudBackupSettingsAndSync);

  const reminderTimeOptions = useMemo(() => buildReminderTimeOptions(), []);

  const currentLocalTimeLabel = useMemo(() => formatReminderTime(localNow.getHours(), localNow.getMinutes()), [localNow]);
  const reminderPresets = useMemo(() => buildReminderPresets(localNow), [localNow]);

  const reminderActions = useReminderSettingsActions({
    currentDay,
    reminderSettings,
    cloudBackupEnabled: cloudBackupSettings.enabled,
    saveReminderSettingsAndSync,
    saveCloudBackupSettingsAndSync,
    setReminderFeedback,
    setCloudBackupFeedback,
    setShowTimeDropdown,
  });

  useEffect(() => {
    void hydrateSettings();
  }, [hydrateSettings]);
  useReminderLifecycle({
    latestReminderOpRef: reminderActions.latestReminderOpRef,
    refreshReminderSettings,
    setReminderFeedback,
    setCloudBackupFeedback,
    setLocalNow,
    reminderFeedback,
    cloudBackupFeedback,
  });

  return {
    reminderSettings,
    cloudBackupSettings,
    reminderFeedback,
    cloudBackupFeedback,
    showTimeDropdown,
    setShowTimeDropdown,
    reminderTimeOptions,
    currentLocalTimeLabel,
    reminderPresets,
    formatReminderTime,
    updateReminderTime: reminderActions.updateReminderTime,
    toggleSnooze: reminderActions.toggleSnooze,
    disableReminder: reminderActions.disableReminder,
    enableReminder: reminderActions.enableReminder,
    toggleCloudBackup: reminderActions.toggleCloudBackup,
  };
}
