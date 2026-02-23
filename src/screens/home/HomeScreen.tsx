import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useDailyMode } from '../../review/useDailyMode';
import {
  DEFAULT_CLOUD_BACKUP_SETTINGS,
  type CloudBackupSettings,
  loadCloudBackupSettings,
  saveCloudBackupSettings,
} from '../../data/cloud-backup-store';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../../cloud/cloud-backup-config';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { computeReviewGuardrail } from '../../review/review-guardrail';

export function HomeScreen() {
  const router = useRouter();
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
  const [cloudBackupSettings, setCloudBackupSettings] = useState<CloudBackupSettings>(DEFAULT_CLOUD_BACKUP_SETTINGS);
  const [cloudBackupFeedback, setCloudBackupFeedback] = useState<string | null>(null);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [localNow, setLocalNow] = useState(() => new Date());
  const latestReminderOpRef = useRef(0);

  const days = useMemo(() => loadDays(), []);
  const { progress, sessionDraft, currentDay, hasResumeForCurrentDay, startOver } = useHomeProgress({ totalDays: days.length });
  const { resolution: dailyModeResolution } = useDailyMode({ progress });
  const reviewPlan = useMemo(() => loadReviewPlan(), []);
  const { flags, isLoading: isFlagsLoading, lastUpdatedAt, errorMessage: flagsErrorMessage, refreshFlags } = useFeatureFlags();
  const streak = progress.streak;
  const averageMinutes = progress.sessionsCompleted.length > 0 ? Math.round(progress.totalMinutes / progress.sessionsCompleted.length) : 0;

  const goToSession = () => {
    blurActiveElement();
    router.push({
      pathname: '/session',
      params: {
        day: String(currentDay),
        mode: dailyModeResolution?.mode ?? 'new_day',
        reinforcementReviewDay: dailyModeResolution?.reinforcementReviewDay ? String(dailyModeResolution.reinforcementReviewDay) : undefined,
        reinforcementCheckpointDay: dailyModeResolution?.reinforcementCheckpointDay
          ? String(dailyModeResolution.reinforcementCheckpointDay)
          : undefined,
      },
    });
  };

  const todayModeLabel = dailyModeResolution
    ? dailyModeResolution.mode === 'new_day'
      ? 'New Day'
      : dailyModeResolution.mode === 'light_review'
        ? 'Light Review'
        : dailyModeResolution.mode === 'deep_consolidation'
          ? 'Deep Consolidation'
          : 'Milestone'
    : 'Loading...';
  const todayModeKey = dailyModeResolution?.mode ?? 'new_day';
  const todayChecklist = useMemo(() => {
    if (todayModeKey === 'light_review') {
      return reviewPlan.lightReview.blocks.map((block) => `${block.title}${block.durationMinutes ? ` (${block.durationMinutes}m)` : ''}`);
    }
    if (todayModeKey === 'deep_consolidation') {
      return reviewPlan.deepConsolidation.blocks.map((block) => `${block.title}${block.durationMinutes ? ` (${block.durationMinutes}m)` : ''}`);
    }
    if (todayModeKey === 'milestone') {
      return ['10-minute continuous fluency recording', 'Replay and compare with previous milestones'];
    }
    const reinforcement = dailyModeResolution?.reinforcementReviewDay
      ? `Spaced reinforcement: review Day ${dailyModeResolution.reinforcementReviewDay}`
      : null;
    return [
      'Micro-review: 5 old Anki cards + 5 memory sentences',
      reinforcement,
      'Main session: 7 sections',
    ].filter((item): item is string => !!item);
  }, [dailyModeResolution?.reinforcementReviewDay, reviewPlan.deepConsolidation.blocks, reviewPlan.lightReview.blocks, todayModeKey]);
  const todayModeDurationLabel = useMemo(() => {
    if (todayModeKey === 'light_review') {
      return `${reviewPlan.lightReview.durationMinutesMin}-${reviewPlan.lightReview.durationMinutesMax} min`;
    }
    if (todayModeKey === 'deep_consolidation') {
      return `${reviewPlan.deepConsolidation.durationMinutes} min`;
    }
    if (todayModeKey === 'milestone') {
      return '10 min';
    }
    return '40-45 min';
  }, [reviewPlan.deepConsolidation.durationMinutes, reviewPlan.lightReview.durationMinutesMax, reviewPlan.lightReview.durationMinutesMin, todayModeKey]);
  const canResumeTodayPlan =
    !!sessionDraft &&
    sessionDraft.dayNumber === currentDay &&
    (sessionDraft.mode ?? 'new_day') === todayModeKey &&
    hasResumeForCurrentDay;
  const reviewGuardrail = useMemo(() => computeReviewGuardrail(progress), [progress]);

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

  const currentLocalTimeLabel = useMemo(() => formatReminderTime(localNow.getHours(), localNow.getMinutes()), [localNow]);
  const reminderPresets = useMemo(
    () => [
      {
        hour: (localNow.getHours() + Math.floor((localNow.getMinutes() + 15) / 60)) % 24,
        minute: (localNow.getMinutes() + 15) % 60,
        label: 'In 15m',
      },
      {
        hour: (localNow.getHours() + Math.floor((localNow.getMinutes() + 30) / 60)) % 24,
        minute: (localNow.getMinutes() + 30) % 60,
        label: 'In 30m',
      },
      {
        hour: (localNow.getHours() + Math.floor((localNow.getMinutes() + 60) / 60)) % 24,
        minute: (localNow.getMinutes() + 60) % 60,
        label: 'In 1h',
      },
    ],
    [localNow],
  );

  const applyReminderSettings = async (
    next: ReminderSettings,
    options: {
      shouldSync: boolean;
      trackOptIn?: boolean;
      onSavedMessage?: string;
    },
  ) => {
    const operationId = latestReminderOpRef.current + 1;
    latestReminderOpRef.current = operationId;
    const previousSettings = reminderSettings;
    let settingsSaved = false;

    try {
      setReminderSettings(next);
      await saveReminderSettings(next);
      settingsSaved = true;
      if (latestReminderOpRef.current !== operationId) {
        return;
      }

      if (options.onSavedMessage) {
        setReminderFeedback(options.onSavedMessage);
      }

      if (!options.shouldSync) {
        return;
      }

      const result = await syncDailyReminder(next);
      if (latestReminderOpRef.current !== operationId) {
        return;
      }

      if (!result.available) {
        setReminderFeedback(result.reason ?? 'Notifications not available on this platform.');
        return;
      }
      if (next.enabled && !result.permissionGranted) {
        const disabled = { ...next, enabled: false };
        await saveReminderSettings(disabled);
        if (latestReminderOpRef.current !== operationId) {
          return;
        }
        setReminderSettings(disabled);
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
    } catch {
      if (latestReminderOpRef.current !== operationId) {
        return;
      }
      if (!settingsSaved) {
        setReminderSettings(previousSettings);
      }
      setReminderFeedback('Could not update reminders right now. Please try again.');
    }
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
    const totalMinutesInDay = 24 * 60;
    const totalInputMinutes = nextHour * 60 + nextMinute;
    const normalizedTotalMinutes = ((totalInputMinutes % totalMinutesInDay) + totalMinutesInDay) % totalMinutesInDay;
    const normalizedHour = Math.floor(normalizedTotalMinutes / 60);
    const normalizedMinute = normalizedTotalMinutes % 60;
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

  const toggleCloudBackup = async () => {
    const next = { enabled: !cloudBackupSettings.enabled };
    try {
      await saveCloudBackupSettings(next);
      setCloudBackupSettings(next);
      setCloudBackupFeedback(next.enabled ? `Cloud backup enabled (${CLOUD_BACKUP_RETENTION_DAYS}d retention).` : 'Cloud backup disabled. Future uploads stopped.');
    } catch {
      setCloudBackupFeedback('Could not update cloud backup setting right now.');
    }
  };

  useEffect(() => {
    const updateClock = () => {
      setLocalNow(new Date());
    };

    updateClock();
    const intervalId = setInterval(updateClock, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrapGuard = latestReminderOpRef.current;
    const bootstrapReminders = async () => {
      try {
        await initializeReminders();
        const loaded = await loadReminderSettings();
        if (!active || latestReminderOpRef.current !== bootstrapGuard) {
          return;
        }
        setReminderSettings(loaded);
        if (loaded.enabled) {
          const result = await syncDailyReminder(loaded);
          if (active && latestReminderOpRef.current === bootstrapGuard && !result.permissionGranted) {
            setReminderFeedback('Reminder permission is required. Enable reminders again after granting permission.');
          }
        }
      } catch {
        if (!active || latestReminderOpRef.current !== bootstrapGuard) {
          return;
        }
        setReminderFeedback('Could not initialize reminders right now.');
      }
    };

    void bootstrapReminders();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCloudBackup = async () => {
      const loaded = await loadCloudBackupSettings();
      if (!active) {
        return;
      }
      setCloudBackupSettings(loaded);
    };
    void loadCloudBackup();
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

  useEffect(() => {
    if (!cloudBackupFeedback) {
      return;
    }
    const timer = setTimeout(() => {
      setCloudBackupFeedback(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [cloudBackupFeedback]);

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
        <View style={homeStyles.progressRow}>
          <AppText variant="caption" muted>
            Today&apos;s mode: {todayModeLabel}
            {dailyModeResolution?.reinforcementReviewDay ? ` • Reinforce Day ${dailyModeResolution.reinforcementReviewDay}` : ''}
          </AppText>
        </View>
      </Card>

      <Card elevated style={homeStyles.planCard}>
        <AppText variant="cardTitle">Today&apos;s Plan</AppText>
        <AppText variant="caption" muted>
          Mode: {todayModeLabel} • Expected: {todayModeDurationLabel}
        </AppText>
        <View style={homeStyles.planChecklist}>
          {todayChecklist.map((item) => (
            <View key={item} style={homeStyles.planChecklistItem}>
              <AppText variant="bodySecondary">• {item}</AppText>
            </View>
          ))}
        </View>
        {reviewGuardrail.message ? (
          <AppText variant="caption" muted>
            Guardrail (70/30): {reviewGuardrail.message}
          </AppText>
        ) : null}
      </Card>

      <View style={homeStyles.startWrap}>
        {canResumeTodayPlan ? (
          <View style={homeStyles.resumeCard}>
            <AppText variant="bodySecondary" center>
              You have an in-progress {todayModeLabel.toLowerCase()} plan for Day {currentDay}.
            </AppText>
            <PrimaryButton label={`Continue ${todayModeLabel}`} size="cta" onPress={goToSession} />
            <Pressable onPress={confirmStartOver}>
              <AppText variant="bodySecondary" center style={homeStyles.linkLikeText}>
                Start Over
              </AppText>
            </Pressable>
          </View>
        ) : (
          <PrimaryButton label={`Start ${todayModeLabel}`} size="cta" onPress={goToSession} />
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
        <View style={homeStyles.reminderCard}>
          <AppText variant="cardTitle">QA Debug: Feature Flags</AppText>
          <AppText variant="caption" muted>
            v3_stt_on_device: {String(flags.v3_stt_on_device)}
          </AppText>
          <AppText variant="caption" muted>
            v3_stt_cloud_opt_in: {String(flags.v3_stt_cloud_opt_in)}
          </AppText>
          <AppText variant="caption" muted>
            v3_cloud_backup: {String(flags.v3_cloud_backup)}
          </AppText>
          <AppText variant="caption" muted>
            v3_premium_iap: {String(flags.v3_premium_iap)}
          </AppText>
          <AppText variant="caption" muted>
            Last refresh: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : 'never'}
          </AppText>
          <PrimaryButton label={isFlagsLoading ? 'Refreshing...' : 'Refresh Flags'} onPress={() => void refreshFlags()} disabled={isFlagsLoading} />
          {flagsErrorMessage ? (
            <AppText variant="caption" muted>
              {flagsErrorMessage}
            </AppText>
          ) : null}
          {flags.v3_cloud_backup ? (
            <>
              <PrimaryButton
                label={cloudBackupSettings.enabled ? 'Disable Cloud Backup' : 'Enable Cloud Backup'}
                onPress={() => {
                  void toggleCloudBackup();
                }}
              />
              <AppText variant="caption" muted>
                Retention: {CLOUD_BACKUP_RETENTION_DAYS} days
              </AppText>
              {cloudBackupFeedback ? (
                <AppText variant="caption" muted>
                  {cloudBackupFeedback}
                </AppText>
              ) : null}
            </>
          ) : null}
        </View>
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
