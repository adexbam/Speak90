import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { loadDays } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { Speak90Logo } from '../../ui/Speak90Logo';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { useHomeProgress } from './useHomeProgress';
import { homeStyles } from './home.styles';
import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useDailyMode } from '../../review/useDailyMode';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../../cloud/cloud-backup-config';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { buildTodayPlanViewModel } from '../../review/today-plan-view-model';
import { useHomeReminderController } from './useHomeReminderController';
import { useHomeSessionController } from './useHomeSessionController';

export function HomeScreen() {
  const router = useRouter();

  const days = useMemo(() => loadDays(), []);
  const { progress, sessionDraft, currentDay, hasResumeForCurrentDay, startOver } = useHomeProgress({ totalDays: days.length });
  const { resolution: dailyModeResolution } = useDailyMode({ progress });
  const reminderController = useHomeReminderController({ currentDay });
  const sessionController = useHomeSessionController({
    router,
    currentDay,
    dailyModeResolution,
    startOver,
  });
  const reviewPlan = useMemo(() => loadReviewPlan(), []);
  const { flags, isLoading: isFlagsLoading, lastUpdatedAt, errorMessage: flagsErrorMessage, refreshFlags } = useFeatureFlags();
  const streak = progress.streak;
  const averageMinutes = progress.sessionsCompleted.length > 0 ? Math.round(progress.totalMinutes / progress.sessionsCompleted.length) : 0;

  const todayPlan = useMemo(
    () =>
      buildTodayPlanViewModel({
        currentDay,
        resolution: dailyModeResolution,
        reviewPlan,
        progress,
      }),
    [currentDay, dailyModeResolution, reviewPlan, progress],
  );
  const todayModeLabel = todayPlan.modeLabel;
  const todayModeKey = todayPlan.modeKey;
  const todayChecklist = todayPlan.checklist;
  const todayModeDurationLabel = todayPlan.durationLabel;
  const canResumeTodayPlan =
    !!sessionDraft &&
    sessionDraft.dayNumber === currentDay &&
    (sessionDraft.mode ?? 'new_day') === todayModeKey &&
    hasResumeForCurrentDay;
  const reviewGuardrailMessage = todayPlan.guardrailMessage;

  const confirmEnableReminders = () => {
    const proceed = async () => {
      await reminderController.enableReminder();
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
    if (!reminderController.reminderSettings.enabled) {
      confirmEnableReminders();
      return;
    }
    void reminderController.disableReminder();
  };

  return (
    <Screen style={homeStyles.container} scrollable>
      <View style={homeStyles.titleWrap}>
        <Speak90Logo compact subtitle="" />
      </View>

      <Card elevated style={homeStyles.progressCard}>
        <AppText variant="cardTitle">Day {currentDay} • Streak: {streak} 🔥 • {averageMinutes}min avg</AppText>

        <View style={homeStyles.progressRow}>
          <AppText variant="caption" muted>
            Goal: complete today&apos;s full session
          </AppText>
        </View>
        <View style={homeStyles.progressRow}>
          <AppText variant="caption" muted>
            Total time spent: {progress.totalMinutes} min
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
        {reviewGuardrailMessage ? (
          <AppText variant="caption" muted>
            Guardrail (70/30): {reviewGuardrailMessage}
          </AppText>
        ) : null}
      </Card>

      <View style={homeStyles.startWrap}>
        {canResumeTodayPlan ? (
          <View style={homeStyles.resumeCard}>
            <AppText variant="bodySecondary" center>
              You have an in-progress {todayModeLabel.toLowerCase()} plan for Day {currentDay}.
            </AppText>
            <PrimaryButton label={`Continue ${todayModeLabel}`} size="cta" onPress={sessionController.goToSession} />
            <Pressable onPress={sessionController.confirmStartOver}>
              <AppText variant="bodySecondary" center style={homeStyles.linkLikeText}>
                Start Over
              </AppText>
            </Pressable>
          </View>
        ) : (
          <PrimaryButton label={`Start ${todayModeLabel}`} size="cta" onPress={sessionController.goToSession} />
        )}
        <Pressable onPress={() => router.push('/stats')} style={homeStyles.settingsActionChip}>
          <AppText variant="bodySecondary" center style={homeStyles.linkLikeText}>
            View Stats
          </AppText>
        </Pressable>
      </View>

      <View style={homeStyles.settingsWrap}>
        {sessionController.practiceDayOptions.length > 0 ? (
          <View style={homeStyles.reminderCard}>
            <AppText variant="cardTitle">Practice Previous Days</AppText>
            <AppText variant="caption" muted>
              Revisit completed days without affecting your current-day progress.
            </AppText>
            <Pressable onPress={() => sessionController.setShowPracticeDayDropdown((prev) => !prev)} style={homeStyles.dropdownTrigger}>
              <AppText variant="bodySecondary">
                {sessionController.selectedPracticeDay
                  ? `Selected Day ${sessionController.selectedPracticeDay}`
                  : 'Choose a day to practice'}
              </AppText>
            </Pressable>
            {sessionController.showPracticeDayDropdown ? (
              <View style={homeStyles.dropdownMenu}>
                <ScrollView nestedScrollEnabled>
                  {sessionController.practiceDayOptions.map((dayNumber) => (
                    <Pressable
                      key={`practice-day-${dayNumber}`}
                      style={[
                        homeStyles.dropdownItem,
                        sessionController.selectedPracticeDay === dayNumber ? homeStyles.dropdownItemSelected : null,
                      ]}
                      onPress={() => {
                        sessionController.setSelectedPracticeDay(dayNumber);
                        sessionController.setShowPracticeDayDropdown(false);
                      }}
                    >
                      <AppText variant="bodySecondary">Day {dayNumber}</AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            <PrimaryButton
              label={
                sessionController.selectedPracticeDay
                  ? `Practice Day ${sessionController.selectedPracticeDay}`
                  : 'Practice Selected Day'
              }
              onPress={() => {
                if (!sessionController.selectedPracticeDay) {
                  return;
                }
                sessionController.goToPracticeSession(sessionController.selectedPracticeDay);
              }}
              disabled={!sessionController.selectedPracticeDay}
            />
          </View>
        ) : null}

        <Pressable
          onPress={() => {
            router.push('/onboarding');
          }}
          style={homeStyles.settingsActionChip}
        >
          <AppText variant="bodySecondary" center>
            Change Languages
          </AppText>
        </Pressable>
        <View style={homeStyles.reminderCard}>
          <AppText variant="cardTitle">Daily Reminder</AppText>
          <AppText variant="caption" muted>
            Status: {reminderController.reminderSettings.enabled ? 'On' : 'Off'}
          </AppText>
          <AppText variant="caption" muted>
            Local time now: {reminderController.currentLocalTimeLabel}
          </AppText>
          <AppText variant="caption" muted>
            Reminder time:{' '}
            {reminderController.formatReminderTime(
              reminderController.reminderSettings.hour,
              reminderController.reminderSettings.minute,
            )}{' '}
            (daily)
          </AppText>
          <Pressable onPress={() => reminderController.setShowTimeDropdown((prev) => !prev)} style={homeStyles.dropdownTrigger}>
            <AppText variant="bodySecondary">
              {reminderController.showTimeDropdown ? 'Hide time options' : 'Choose reminder time'}
            </AppText>
          </Pressable>
          {reminderController.showTimeDropdown ? (
            <View style={homeStyles.dropdownMenu}>
              <ScrollView nestedScrollEnabled>
                {reminderController.reminderTimeOptions.map((option) => {
                  const selected =
                    option.hour === reminderController.reminderSettings.hour &&
                    option.minute === reminderController.reminderSettings.minute;
                  return (
                    <Pressable
                      key={option.label}
                      style={[homeStyles.dropdownItem, selected ? homeStyles.dropdownItemSelected : null]}
                      onPress={() => reminderController.updateReminderTime(option.hour, option.minute)}
                    >
                      <AppText variant="bodySecondary">{option.label}</AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
          <View style={homeStyles.reminderPresetRow}>
            {reminderController.reminderPresets.map((preset) => {
              const isActive =
                preset.hour === reminderController.reminderSettings.hour &&
                preset.minute === reminderController.reminderSettings.minute;
              return (
                <Pressable
                  key={preset.label}
                  style={[homeStyles.reminderPresetChip, isActive ? homeStyles.reminderPresetChipActive : null]}
                  onPress={() => reminderController.updateReminderTime(preset.hour, preset.minute)}
                >
                  <AppText variant="bodySecondary">{preset.label}</AppText>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={[
              homeStyles.reminderPresetChip,
              reminderController.reminderSettings.snoozeEnabled ? homeStyles.reminderPresetChipActive : null,
            ]}
            onPress={reminderController.toggleSnooze}
          >
            <AppText variant="bodySecondary">Snooze (+30m): {reminderController.reminderSettings.snoozeEnabled ? 'On' : 'Off'}</AppText>
          </Pressable>
          <PrimaryButton
            label={reminderController.reminderSettings.enabled ? 'Disable Reminder' : 'Enable Reminder'}
            onPress={toggleReminder}
          />
          {reminderController.reminderFeedback ? (
            <AppText variant="caption" muted>
              {reminderController.reminderFeedback}
            </AppText>
          ) : null}
        </View>

        <Pressable onPress={sessionController.confirmClearRecordings} style={homeStyles.settingsActionChip}>
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
                label={reminderController.cloudBackupSettings.enabled ? 'Disable Cloud Backup' : 'Enable Cloud Backup'}
                onPress={() => {
                  void reminderController.toggleCloudBackup();
                }}
              />
              <AppText variant="caption" muted>
                Retention: {CLOUD_BACKUP_RETENTION_DAYS} days
              </AppText>
              {reminderController.cloudBackupFeedback ? (
                <AppText variant="caption" muted>
                  {reminderController.cloudBackupFeedback}
                </AppText>
              ) : null}
            </>
          ) : null}
        </View>
        {sessionController.clearFeedback ? (
          <AppText variant="caption" center>
            {sessionController.clearFeedback}
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
