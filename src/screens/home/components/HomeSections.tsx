import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { Card } from '../../../ui/Card';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { homeStyles } from '../home.styles';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../../../cloud/cloud-backup-config';

export function HomeProgressCard({
  currentDay,
  streak,
  averageMinutes,
  totalMinutes,
  todayModeLabel,
  reinforcementReviewDay,
}: {
  currentDay: number;
  streak: number;
  averageMinutes: number;
  totalMinutes: number;
  todayModeLabel: string;
  reinforcementReviewDay?: number | null;
}) {
  return (
    <Card elevated style={homeStyles.progressCard}>
      <AppText variant="cardTitle">Day {currentDay} • Streak: {streak} 🔥 • {averageMinutes}min avg</AppText>
      <View style={homeStyles.progressRow}>
        <AppText variant="caption" muted>
          Goal: complete today&apos;s full session
        </AppText>
      </View>
      <View style={homeStyles.progressRow}>
        <AppText variant="caption" muted>
          Total time spent: {totalMinutes} min
        </AppText>
      </View>
      <View style={homeStyles.progressRow}>
        <AppText variant="caption" muted>
          Today&apos;s mode: {todayModeLabel}
          {reinforcementReviewDay ? ` • Reinforce Day ${reinforcementReviewDay}` : ''}
        </AppText>
      </View>
    </Card>
  );
}

export function HomeTodayPlanCard({
  todayModeLabel,
  todayModeDurationLabel,
  todayChecklist,
  reviewGuardrailMessage,
}: {
  todayModeLabel: string;
  todayModeDurationLabel: string;
  todayChecklist: string[];
  reviewGuardrailMessage: string | null;
}) {
  return (
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
  );
}

export function HomeStartSection({
  canResumeTodayPlan,
  todayModeLabel,
  currentDay,
  onGoToSession,
  onStartOver,
  onViewStats,
}: {
  canResumeTodayPlan: boolean;
  todayModeLabel: string;
  currentDay: number;
  onGoToSession: () => void;
  onStartOver: () => void;
  onViewStats: () => void;
}) {
  return (
    <View style={homeStyles.startWrap}>
      {canResumeTodayPlan ? (
        <View style={homeStyles.resumeCard}>
          <AppText variant="bodySecondary" center>
            You have an in-progress {todayModeLabel.toLowerCase()} plan for Day {currentDay}.
          </AppText>
          <PrimaryButton label={`Continue ${todayModeLabel}`} size="cta" onPress={onGoToSession} />
          <Pressable onPress={onStartOver}>
            <AppText variant="bodySecondary" center style={homeStyles.linkLikeText}>
              Start Over
            </AppText>
          </Pressable>
        </View>
      ) : (
        <PrimaryButton label={`Start ${todayModeLabel}`} size="cta" onPress={onGoToSession} />
      )}
      <Pressable onPress={onViewStats} style={homeStyles.settingsActionChip}>
        <AppText variant="bodySecondary" center style={homeStyles.linkLikeText}>
          View Stats
        </AppText>
      </Pressable>
    </View>
  );
}

export function HomePracticeDaysCard({
  visible,
  showPracticeDayDropdown,
  selectedPracticeDay,
  practiceDayOptions,
  setShowPracticeDayDropdown,
  setSelectedPracticeDay,
  onPracticeSelectedDay,
}: {
  visible: boolean;
  showPracticeDayDropdown: boolean;
  selectedPracticeDay: number | null;
  practiceDayOptions: number[];
  setShowPracticeDayDropdown: (updater: (previous: boolean) => boolean) => void;
  setSelectedPracticeDay: (dayNumber: number) => void;
  onPracticeSelectedDay: (dayNumber: number) => void;
}) {
  if (!visible) {
    return null;
  }
  return (
    <View style={homeStyles.reminderCard}>
      <AppText variant="cardTitle">Practice Previous Days</AppText>
      <AppText variant="caption" muted>
        Revisit completed days without affecting your current-day progress.
      </AppText>
      <Pressable onPress={() => setShowPracticeDayDropdown((prev) => !prev)} style={homeStyles.dropdownTrigger}>
        <AppText variant="bodySecondary">{selectedPracticeDay ? `Selected Day ${selectedPracticeDay}` : 'Choose a day to practice'}</AppText>
      </Pressable>
      {showPracticeDayDropdown ? (
        <View style={homeStyles.dropdownMenu}>
          <ScrollView nestedScrollEnabled>
            {practiceDayOptions.map((dayNumber) => (
              <Pressable
                key={`practice-day-${dayNumber}`}
                style={[homeStyles.dropdownItem, selectedPracticeDay === dayNumber ? homeStyles.dropdownItemSelected : null]}
                onPress={() => {
                  setSelectedPracticeDay(dayNumber);
                  setShowPracticeDayDropdown(() => false);
                }}
              >
                <AppText variant="bodySecondary">Day {dayNumber}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
      <PrimaryButton
        label={selectedPracticeDay ? `Practice Day ${selectedPracticeDay}` : 'Practice Selected Day'}
        onPress={() => {
          if (!selectedPracticeDay) {
            return;
          }
          onPracticeSelectedDay(selectedPracticeDay);
        }}
        disabled={!selectedPracticeDay}
      />
    </View>
  );
}

type ReminderPreset = {
  hour: number;
  minute: number;
  label: string;
};

type ReminderOption = {
  label: string;
  hour: number;
  minute: number;
};

export function HomeReminderCard({
  reminderEnabled,
  localTimeLabel,
  reminderTimeLabel,
  showTimeDropdown,
  reminderTimeOptions,
  reminderPresets,
  reminderHour,
  reminderMinute,
  snoozeEnabled,
  reminderFeedback,
  onToggleDropdown,
  onUpdateReminderTime,
  onToggleSnooze,
  onToggleReminder,
}: {
  reminderEnabled: boolean;
  localTimeLabel: string;
  reminderTimeLabel: string;
  showTimeDropdown: boolean;
  reminderTimeOptions: ReminderOption[];
  reminderPresets: ReminderPreset[];
  reminderHour: number;
  reminderMinute: number;
  snoozeEnabled: boolean;
  reminderFeedback: string | null;
  onToggleDropdown: () => void;
  onUpdateReminderTime: (hour: number, minute: number) => void;
  onToggleSnooze: () => void;
  onToggleReminder: () => void;
}) {
  return (
    <View style={homeStyles.reminderCard}>
      <AppText variant="cardTitle">Daily Reminder</AppText>
      <AppText variant="caption" muted>
        Status: {reminderEnabled ? 'On' : 'Off'}
      </AppText>
      <AppText variant="caption" muted>
        Local time now: {localTimeLabel}
      </AppText>
      <AppText variant="caption" muted>
        Reminder time: {reminderTimeLabel} (daily)
      </AppText>
      <Pressable onPress={onToggleDropdown} style={homeStyles.dropdownTrigger}>
        <AppText variant="bodySecondary">{showTimeDropdown ? 'Hide time options' : 'Choose reminder time'}</AppText>
      </Pressable>
      {showTimeDropdown ? (
        <View style={homeStyles.dropdownMenu}>
          <ScrollView nestedScrollEnabled>
            {reminderTimeOptions.map((option) => {
              const selected = option.hour === reminderHour && option.minute === reminderMinute;
              return (
                <Pressable
                  key={option.label}
                  style={[homeStyles.dropdownItem, selected ? homeStyles.dropdownItemSelected : null]}
                  onPress={() => onUpdateReminderTime(option.hour, option.minute)}
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
          const isActive = preset.hour === reminderHour && preset.minute === reminderMinute;
          return (
            <Pressable
              key={preset.label}
              style={[homeStyles.reminderPresetChip, isActive ? homeStyles.reminderPresetChipActive : null]}
              onPress={() => onUpdateReminderTime(preset.hour, preset.minute)}
            >
              <AppText variant="bodySecondary">{preset.label}</AppText>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={[homeStyles.reminderPresetChip, snoozeEnabled ? homeStyles.reminderPresetChipActive : null]}
        onPress={onToggleSnooze}
      >
        <AppText variant="bodySecondary">Snooze (+30m): {snoozeEnabled ? 'On' : 'Off'}</AppText>
      </Pressable>
      <PrimaryButton label={reminderEnabled ? 'Disable Reminder' : 'Enable Reminder'} onPress={onToggleReminder} />
      {reminderFeedback ? (
        <AppText variant="caption" muted>
          {reminderFeedback}
        </AppText>
      ) : null}
    </View>
  );
}

type FeatureFlags = {
  v3_stt_on_device: boolean;
  v3_stt_cloud_opt_in: boolean;
  v3_cloud_backup: boolean;
  v3_premium_iap: boolean;
};

export function HomeDebugFlagsCard({
  flags,
  lastUpdatedAt,
  isFlagsLoading,
  flagsErrorMessage,
  cloudBackupEnabled,
  cloudBackupFeedback,
  onRefreshFlags,
  onToggleCloudBackup,
}: {
  flags: FeatureFlags;
  lastUpdatedAt: string | number | null;
  isFlagsLoading: boolean;
  flagsErrorMessage: string | null;
  cloudBackupEnabled: boolean;
  cloudBackupFeedback: string | null;
  onRefreshFlags: () => void;
  onToggleCloudBackup: () => void;
}) {
  return (
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
      <PrimaryButton label={isFlagsLoading ? 'Refreshing...' : 'Refresh Flags'} onPress={onRefreshFlags} disabled={isFlagsLoading} />
      {flagsErrorMessage ? (
        <AppText variant="caption" muted>
          {flagsErrorMessage}
        </AppText>
      ) : null}
      {flags.v3_cloud_backup ? (
        <>
          <PrimaryButton
            label={cloudBackupEnabled ? 'Disable Cloud Backup' : 'Enable Cloud Backup'}
            onPress={onToggleCloudBackup}
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
  );
}
