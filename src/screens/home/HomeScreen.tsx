import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { Screen } from '../../ui/Screen';
import { Speak90Logo } from '../../ui/Speak90Logo';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { homeStyles } from './home.styles';
import {
  HomeDebugFlagsCard,
  HomePracticeDaysCard,
  HomeProgressCard,
  HomeReminderCard,
  HomeStartSection,
  HomeTodayPlanCard,
} from './components/HomeSections';
import { useHomeViewModel } from './useHomeViewModel';

export function HomeScreen() {
  const vm = useHomeViewModel();

  return (
    <Screen style={homeStyles.container} scrollable>
      <View style={homeStyles.titleWrap}>
        <Speak90Logo compact subtitle="" />
      </View>

      <HomeProgressCard
        currentDay={vm.currentDay}
        streak={vm.streak}
        averageMinutes={vm.averageMinutes}
        totalMinutes={vm.progress.totalMinutes}
        todayModeLabel={vm.todayModeLabel}
        reinforcementReviewDay={vm.dailyModeResolution?.reinforcementReviewDay}
      />

      <HomeTodayPlanCard
        todayModeLabel={vm.todayModeLabel}
        todayModeDurationLabel={vm.todayPlan.durationLabel}
        todayChecklist={vm.todayPlan.checklist}
        reviewGuardrailMessage={vm.todayPlan.guardrailMessage}
      />

      <HomeStartSection
        canResumeTodayPlan={vm.canResumeTodayPlan}
        todayModeLabel={vm.todayModeLabel}
        currentDay={vm.currentDay}
        onGoToSession={vm.sessionController.goToSession}
        onStartOver={vm.sessionController.confirmStartOver}
        onViewStats={vm.goToStats}
      />

      <View style={homeStyles.settingsWrap}>
        <HomePracticeDaysCard
          visible={vm.sessionController.practiceDayOptions.length > 0}
          showPracticeDayDropdown={vm.sessionController.showPracticeDayDropdown}
          selectedPracticeDay={vm.sessionController.selectedPracticeDay}
          practiceDayOptions={vm.sessionController.practiceDayOptions}
          setShowPracticeDayDropdown={vm.sessionController.setShowPracticeDayDropdown}
          setSelectedPracticeDay={vm.sessionController.setSelectedPracticeDay}
          onPracticeSelectedDay={vm.sessionController.goToPracticeSession}
        />

        <Pressable
          onPress={vm.goToOnboarding}
          style={homeStyles.settingsActionChip}
        >
          <AppText variant="bodySecondary" center>
            Change Languages
          </AppText>
        </Pressable>
        <HomeReminderCard
          reminderEnabled={vm.reminderController.reminderSettings.enabled}
          localTimeLabel={vm.reminderController.currentLocalTimeLabel}
          reminderTimeLabel={vm.reminderController.formatReminderTime(
            vm.reminderController.reminderSettings.hour,
            vm.reminderController.reminderSettings.minute,
          )}
          showTimeDropdown={vm.reminderController.showTimeDropdown}
          reminderTimeOptions={vm.reminderController.reminderTimeOptions}
          reminderPresets={vm.reminderController.reminderPresets}
          reminderHour={vm.reminderController.reminderSettings.hour}
          reminderMinute={vm.reminderController.reminderSettings.minute}
          snoozeEnabled={vm.reminderController.reminderSettings.snoozeEnabled}
          reminderFeedback={vm.reminderController.reminderFeedback}
          onToggleDropdown={() => vm.reminderController.setShowTimeDropdown((prev) => !prev)}
          onUpdateReminderTime={vm.reminderController.updateReminderTime}
          onToggleSnooze={vm.reminderController.toggleSnooze}
          onToggleReminder={() => {
            void vm.reminderGate.toggleReminder();
          }}
        />

        <Pressable onPress={vm.sessionController.confirmClearRecordings} style={homeStyles.settingsActionChip}>
          <AppText variant="bodySecondary" center>
            Clear Local Recordings
          </AppText>
        </Pressable>
        <HomeDebugFlagsCard
          flags={vm.flags}
          lastUpdatedAt={vm.lastUpdatedAt}
          isFlagsLoading={vm.isFlagsLoading}
          flagsErrorMessage={vm.flagsErrorMessage}
          cloudBackupEnabled={vm.reminderController.cloudBackupSettings.enabled}
          cloudBackupFeedback={vm.reminderController.cloudBackupFeedback}
          onRefreshFlags={() => {
            void vm.refreshFlags();
          }}
          onToggleCloudBackup={() => {
            void vm.reminderController.toggleCloudBackup();
          }}
        />
        {vm.sessionController.clearFeedback ? (
          <AppText variant="caption" center>
            {vm.sessionController.clearFeedback}
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
