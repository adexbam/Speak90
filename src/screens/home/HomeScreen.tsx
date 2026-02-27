import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, View } from 'react-native';
import { loadDays } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { Screen } from '../../ui/Screen';
import { Speak90Logo } from '../../ui/Speak90Logo';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { useHomeProgress } from './useHomeProgress';
import { homeStyles } from './home.styles';
import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useDailyMode } from '../../review/useDailyMode';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { buildTodayPlanViewModel } from '../../review/today-plan-view-model';
import { useHomeReminderController } from './useHomeReminderController';
import { useHomeSessionController } from './useHomeSessionController';
import {
  HomeDebugFlagsCard,
  HomePracticeDaysCard,
  HomeProgressCard,
  HomeReminderCard,
  HomeStartSection,
  HomeTodayPlanCard,
} from './components/HomeSections';

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

      <HomeProgressCard
        currentDay={currentDay}
        streak={streak}
        averageMinutes={averageMinutes}
        totalMinutes={progress.totalMinutes}
        todayModeLabel={todayModeLabel}
        reinforcementReviewDay={dailyModeResolution?.reinforcementReviewDay}
      />

      <HomeTodayPlanCard
        todayModeLabel={todayModeLabel}
        todayModeDurationLabel={todayModeDurationLabel}
        todayChecklist={todayChecklist}
        reviewGuardrailMessage={reviewGuardrailMessage}
      />

      <HomeStartSection
        canResumeTodayPlan={canResumeTodayPlan}
        todayModeLabel={todayModeLabel}
        currentDay={currentDay}
        onGoToSession={sessionController.goToSession}
        onStartOver={sessionController.confirmStartOver}
        onViewStats={() => router.push('/stats')}
      />

      <View style={homeStyles.settingsWrap}>
        <HomePracticeDaysCard
          visible={sessionController.practiceDayOptions.length > 0}
          showPracticeDayDropdown={sessionController.showPracticeDayDropdown}
          selectedPracticeDay={sessionController.selectedPracticeDay}
          practiceDayOptions={sessionController.practiceDayOptions}
          setShowPracticeDayDropdown={sessionController.setShowPracticeDayDropdown}
          setSelectedPracticeDay={sessionController.setSelectedPracticeDay}
          onPracticeSelectedDay={sessionController.goToPracticeSession}
        />

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
        <HomeReminderCard
          reminderEnabled={reminderController.reminderSettings.enabled}
          localTimeLabel={reminderController.currentLocalTimeLabel}
          reminderTimeLabel={reminderController.formatReminderTime(
            reminderController.reminderSettings.hour,
            reminderController.reminderSettings.minute,
          )}
          showTimeDropdown={reminderController.showTimeDropdown}
          reminderTimeOptions={reminderController.reminderTimeOptions}
          reminderPresets={reminderController.reminderPresets}
          reminderHour={reminderController.reminderSettings.hour}
          reminderMinute={reminderController.reminderSettings.minute}
          snoozeEnabled={reminderController.reminderSettings.snoozeEnabled}
          reminderFeedback={reminderController.reminderFeedback}
          onToggleDropdown={() => reminderController.setShowTimeDropdown((prev) => !prev)}
          onUpdateReminderTime={reminderController.updateReminderTime}
          onToggleSnooze={reminderController.toggleSnooze}
          onToggleReminder={toggleReminder}
        />

        <Pressable onPress={sessionController.confirmClearRecordings} style={homeStyles.settingsActionChip}>
          <AppText variant="bodySecondary" center>
            Clear Local Recordings
          </AppText>
        </Pressable>
        <HomeDebugFlagsCard
          flags={flags}
          lastUpdatedAt={lastUpdatedAt}
          isFlagsLoading={isFlagsLoading}
          flagsErrorMessage={flagsErrorMessage}
          cloudBackupEnabled={reminderController.cloudBackupSettings.enabled}
          cloudBackupFeedback={reminderController.cloudBackupFeedback}
          onRefreshFlags={() => {
            void refreshFlags();
          }}
          onToggleCloudBackup={() => {
            void reminderController.toggleCloudBackup();
          }}
        />
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
