import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, View } from 'react-native';
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

export function HomeScreen() {
  const router = useRouter();
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);

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

  const applyReminderSettings = async (next: ReminderSettings) => {
    setReminderSettings(next);
    await saveReminderSettings(next);
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
      return;
    }
    setReminderFeedback(next.enabled ? `Daily reminder set for ${formatReminderTime(next.hour, next.minute)}.` : 'Daily reminders turned off.');
  };

  const confirmEnableReminders = () => {
    const proceed = async () => {
      await applyReminderSettings({ ...reminderSettings, enabled: true });
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
    void applyReminderSettings({ ...reminderSettings, enabled: false });
  };

  const updateReminderTime = (nextHour: number, nextMinute: number) => {
    const normalizedHour = (nextHour + 24) % 24;
    const normalizedMinute = (nextMinute + 60) % 60;
    void applyReminderSettings({
      ...reminderSettings,
      hour: normalizedHour,
      minute: normalizedMinute,
    });
  };

  const toggleSnooze = () => {
    void applyReminderSettings({
      ...reminderSettings,
      snoozeEnabled: !reminderSettings.snoozeEnabled,
    });
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
    <Screen style={homeStyles.container}>
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
              <AppText variant="bodySecondary" center>
                Start Over
              </AppText>
            </Pressable>
          </View>
        ) : (
          <PrimaryButton label="Start Session" size="cta" onPress={goToSession} />
        )}
        <Pressable onPress={() => router.push('/stats')}>
          <AppText variant="bodySecondary" center>
            View Stats
          </AppText>
        </Pressable>
      </View>

      <View style={homeStyles.settingsWrap}>
        <View style={homeStyles.reminderCard}>
          <AppText variant="cardTitle">Daily Reminder</AppText>
          <AppText variant="caption" muted>
            Time: {formatReminderTime(reminderSettings.hour, reminderSettings.minute)}
          </AppText>
          <View style={homeStyles.reminderRow}>
            <Pressable onPress={() => updateReminderTime(reminderSettings.hour - 1, reminderSettings.minute)}>
              <AppText variant="bodySecondary">Hour -</AppText>
            </Pressable>
            <Pressable onPress={() => updateReminderTime(reminderSettings.hour + 1, reminderSettings.minute)}>
              <AppText variant="bodySecondary">Hour +</AppText>
            </Pressable>
            <Pressable onPress={() => updateReminderTime(reminderSettings.hour, reminderSettings.minute - 5)}>
              <AppText variant="bodySecondary">Min -5</AppText>
            </Pressable>
            <Pressable onPress={() => updateReminderTime(reminderSettings.hour, reminderSettings.minute + 5)}>
              <AppText variant="bodySecondary">Min +5</AppText>
            </Pressable>
          </View>
          <Pressable onPress={toggleSnooze}>
            <AppText variant="bodySecondary">
              Snooze (+30m): {reminderSettings.snoozeEnabled ? 'On' : 'Off'}
            </AppText>
          </Pressable>
          <Pressable onPress={toggleReminder}>
            <AppText variant="bodySecondary">{reminderSettings.enabled ? 'Disable Reminder' : 'Enable Reminder'}</AppText>
          </Pressable>
          {reminderFeedback ? (
            <AppText variant="caption" muted>
              {reminderFeedback}
            </AppText>
          ) : null}
        </View>

        <Pressable onPress={confirmClearRecordings}>
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
