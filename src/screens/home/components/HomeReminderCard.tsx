import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { homeStyles } from '../home.styles';
import type { ReminderOption, ReminderPreset } from './home-section.types';

type HomeReminderCardProps = {
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
}: HomeReminderCardProps) {
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
