import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { loadDays } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { blurActiveElement } from '../../utils/blurActiveElement';
import { useHomeProgress } from './useHomeProgress';
import { homeStyles } from './home.styles';
import { clearAllRecordings } from '../../data/recordings-store';
import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
  loadReminderSettings,
  saveReminderSettings,
} from '../../data/reminder-settings-store';
import { initializeReminders, syncDailyReminder } from '../../notifications/reminders';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';

export function HomeScreen() {
  const router = useRouter();
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  const days = useMemo(() => loadDays(), []);
  const { progress, currentDay, hasResumeForCurrentDay, startOver } = useHomeProgress({ totalDays: days.length });
  const streak = progress.streak;
  const averageMinutes = progress.sessionsCompleted.length > 0 ? Math.round(progress.totalMinutes / progress.sessionsCompleted.length) : 0;

  const goToSession = () => {
    blurActiveElement();
    router.push({ pathname: '/session', params: { day: String(currentDay) } });
  };

  const confirmStartOver = () => {
    const proceed = async () => {
      await startOver();
      goToSession();
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Start over and lose your current session progress?') : false;
      if (ok) {
        void proceed();
      }
      return;
    }

    Alert.alert('Start Over?', 'You will lose your current in-progress session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start Over',
        style: 'destructive',
        onPress: () => {
          void proceed();
        },
      },
    ]);
  };

  const confirmClearRecordings = () => {
    const proceed = async () => {
      await clearAllRecordings();
      setClearFeedback('Recordings cleared.');
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Clear all local recordings from this device?') : false;
      if (ok) {
        void proceed();
      }
      return;
    }

    Alert.alert('Clear recordings?', 'This will delete all local recordings on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void proceed();
        },
      },
    ]);
  };

  const formatReminderTime = (hour: number, minute: number) =>
    `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  const reminderTimeOptions = useMemo(() => {
    const options: Array<{ label: string; hour: number; minute: number }> = [];
    for (let h = 0; h < 24; h += 1) {
      for (let m = 0; m < 60; m += 15) {
        options.push({
          label: formatReminderTime(h, m),
          hour: h,
          minute: m,
        });
      }
    }
    return options;
  }, []);

  const localNow = new Date();
  const currentLocalTimeLabel = formatReminderTime(localNow.getHours(), localNow.getMinutes());
  const reminderPresets = [
    { hour: (localNow.getHours() + Math.floor((localNow.getMinutes() + 15) / 60)) % 24, minute: (localNow.getMinutes() + 15) % 60, label: 'In 15m' },
    { hour: (localNow.getHours() + Math.floor((localNow.getMinutes() + 30) / 60)) % 24, minute: (localNow.getMinutes() + 30) % 60, label: 'In 30m' },
    { hour: (localNow.getHours() + Math.floor((localNow.getMinutes() + 60) / 60)) % 24, minute: (localNow.getMinutes() + 60) % 60, label: 'In 1h' },
  ];

  const applyReminderSettings = async (
    next: ReminderSettings,
    options: {
      shouldSync: boolean;
      trackOptIn?: boolean;
      onSavedMessage?: string;
    },
  ) => {
    setReminderSettings(next);
    await saveReminderSettings(next);
    if (options.onSavedMessage) {
      setReminderFeedback(options.onSavedMessage);
    }

    if (!options.shouldSync) {
      return;
    }

    const result = await syncDailyReminder(next);
    if (!result.available) {
      setReminderFeedback(result.reason ?? 'Notifications not available on this platform.');
      return;
    }
    if (next.enabled && !result.permissionGranted) {
      const disabled = { ...next, enabled: false };
      setReminderSettings(disabled);
      await saveReminderSettings(disabled);
      setReminderFeedback('Reminder permission denied. Reminders remain disabled.');
      trackEvent(
        'notification_opt_in',
        buildAnalyticsPayload(
          {
            dayNumber: currentDay,
            sectionId: 'system.notifications',
          },
          {
            enabled: false,
            status: 'denied',
            hour: next.hour,
            minute: next.minute,
          },
        ),
      );
      return;
    }
    if (next.enabled && options.trackOptIn) {
      trackEvent(
        'notification_opt_in',
        buildAnalyticsPayload(
          {
            dayNumber: currentDay,
            sectionId: 'system.notifications',
          },
          {
            enabled: true,
            status: 'granted',
            hour: next.hour,
            minute: next.minute,
            snoozeEnabled: next.snoozeEnabled,
          },
        ),
      );
    }
    setReminderFeedback(next.enabled ? `Daily reminder set for ${formatReminderTime(next.hour, next.minute)}.` : 'Daily reminders turned off.');
  };

  const confirmEnableReminders = () => {
    const proceed = async () => {
      await applyReminderSettings(
        { ...reminderSettings, enabled: true },
        {
          shouldSync: true,
          trackOptIn: true,
        },
      );
    };

    const message = 'Speak90 would like to send one daily reminder. You can disable this anytime.';
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(message) : false;
      if (ok) {
        void proceed();
      }
      return;
    }

    Alert.alert('Enable Daily Reminder?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Enable',
        onPress: () => {
          void proceed();
        },
      },
    ]);
  };

  const toggleReminder = () => {
    if (!reminderSettings.enabled) {
      confirmEnableReminders();
      return;
    }
    void applyReminderSettings(
      { ...reminderSettings, enabled: false },
      {
        shouldSync: true,
      },
    );
  };

  const updateReminderTime = (nextHour: number, nextMinute: number) => {
    const normalizedHour = (nextHour + 24) % 24;
    const normalizedMinute = (nextMinute + 60) % 60;
    void applyReminderSettings(
      {
        ...reminderSettings,
        hour: normalizedHour,
        minute: normalizedMinute,
      },
      {
        shouldSync: reminderSettings.enabled,
        onSavedMessage: reminderSettings.enabled ? undefined : `Reminder time saved: ${formatReminderTime(normalizedHour, normalizedMinute)}.`,
      },
    );
    setShowTimeDropdown(false);
  };

  const toggleSnooze = () => {
    const nextSnoozeEnabled = !reminderSettings.snoozeEnabled;
    void applyReminderSettings(
      {
        ...reminderSettings,
        snoozeEnabled: nextSnoozeEnabled,
      },
      {
        shouldSync: reminderSettings.enabled,
        onSavedMessage: reminderSettings.enabled ? undefined : `Snooze is now ${nextSnoozeEnabled ? 'On' : 'Off'}.`,
      },
    );
  };

  useEffect(() => {
    let active = true;
    const bootstrapReminders = async () => {
      await initializeReminders();
      const loaded = await loadReminderSettings();
      if (!active) {
        return;
      }
      setReminderSettings(loaded);
      if (loaded.enabled) {
        const result = await syncDailyReminder(loaded);
        if (active && !result.permissionGranted) {
          setReminderFeedback('Reminder permission is required. Enable reminders again after granting permission.');
        }
      }
    };

    void bootstrapReminders();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!clearFeedback) {
      return;
    }

    const timer = setTimeout(() => {
      setClearFeedback(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [clearFeedback]);

  useEffect(() => {
    if (!reminderFeedback) {
      return;
    }
    const timer = setTimeout(() => {
      setReminderFeedback(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [reminderFeedback]);

  return (
    <Screen style={homeStyles.container} scrollable>
      <View style={homeStyles.titleWrap}>
        <AppText variant="screenTitle" center>
          speak90
        </AppText>
      </View>

      <Card elevated style={homeStyles.progressCard}>
        <AppText variant="cardTitle">Day {currentDay} • Streak: {streak} 🔥 • {averageMinutes}min avg</AppText>

        <View style={homeStyles.progressRow}>
          <AppText variant="caption" muted>
            Goal: complete today&apos;s full session ({progress.totalMinutes} min total)
          </AppText>
        </View>
      </Card>

      <View style={homeStyles.startWrap}>
        {hasResumeForCurrentDay ? (
          <View style={homeStyles.resumeCard}>
            <AppText variant="bodySecondary" center>
              You have an in-progress session for Day {currentDay}.
            </AppText>
            <PrimaryButton label="Continue Session" size="cta" onPress={goToSession} />
            <Pressable onPress={confirmStartOver}>
              <AppText variant="bodySecondary" center style={homeStyles.linkLikeText}>
                Start Over
              </AppText>
            </Pressable>
          </View>
        ) : (
          <PrimaryButton label="Start Session" size="cta" onPress={goToSession} />
        )}
        <Pressable onPress={() => router.push('/stats')} style={homeStyles.settingsActionChip}>
          <AppText variant="bodySecondary" center style={homeStyles.linkLikeText}>
            View Stats
          </AppText>
        </Pressable>
      </View>

      <View style={homeStyles.settingsWrap}>
        <View style={homeStyles.reminderCard}>
          <AppText variant="cardTitle">Daily Reminder</AppText>
          <AppText variant="caption" muted>
            Status: {reminderSettings.enabled ? 'On' : 'Off'}
          </AppText>
          <AppText variant="caption" muted>
            Local time now: {currentLocalTimeLabel}
          </AppText>
          <AppText variant="caption" muted>
            Reminder time: {formatReminderTime(reminderSettings.hour, reminderSettings.minute)} (daily)
          </AppText>
          <Pressable onPress={() => setShowTimeDropdown((prev) => !prev)} style={homeStyles.dropdownTrigger}>
            <AppText variant="bodySecondary">
              {showTimeDropdown ? 'Hide time options' : 'Choose reminder time'}
            </AppText>
          </Pressable>
          {showTimeDropdown ? (
            <View style={homeStyles.dropdownMenu}>
              <ScrollView nestedScrollEnabled>
                {reminderTimeOptions.map((option) => {
                  const selected = option.hour === reminderSettings.hour && option.minute === reminderSettings.minute;
                  return (
                    <Pressable
                      key={option.label}
                      style={[homeStyles.dropdownItem, selected ? homeStyles.dropdownItemSelected : null]}
                      onPress={() => updateReminderTime(option.hour, option.minute)}
                    >
                      <AppText variant="bodySecondary">{option.label}</AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
          <View style={homeStyles.reminderPresetRow}>
            {reminderPresets.map((preset) => {
              const isActive = preset.hour === reminderSettings.hour && preset.minute === reminderSettings.minute;
              return (
                <Pressable
                  key={preset.label}
                  style={[homeStyles.reminderPresetChip, isActive ? homeStyles.reminderPresetChipActive : null]}
                  onPress={() => updateReminderTime(preset.hour, preset.minute)}
                >
                  <AppText variant="bodySecondary">{preset.label}</AppText>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={[homeStyles.reminderPresetChip, reminderSettings.snoozeEnabled ? homeStyles.reminderPresetChipActive : null]}
            onPress={toggleSnooze}
          >
            <AppText variant="bodySecondary">Snooze (+30m): {reminderSettings.snoozeEnabled ? 'On' : 'Off'}</AppText>
          </Pressable>
          <PrimaryButton label={reminderSettings.enabled ? 'Disable Reminder' : 'Enable Reminder'} onPress={toggleReminder} />
          {reminderFeedback ? (
            <AppText variant="caption" muted>
              {reminderFeedback}
            </AppText>
          ) : null}
        </View>

        <Pressable onPress={confirmClearRecordings} style={homeStyles.settingsActionChip}>
          <AppText variant="bodySecondary" center>
            Clear Local Recordings
          </AppText>
        </Pressable>
        {clearFeedback ? (
          <AppText variant="caption" center>
            {clearFeedback}
          </AppText>
        ) : null}
      </View>

      <View style={homeStyles.bannerWrap}>
        <View style={homeStyles.bannerBox}>
          <BannerAdSlot />
        </View>
      </View>
    </Screen>
  );
}
