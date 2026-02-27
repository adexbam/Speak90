import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { homeStyles } from '../home.styles';

type HomePracticeDaysCardProps = {
  visible: boolean;
  showPracticeDayDropdown: boolean;
  selectedPracticeDay: number | null;
  practiceDayOptions: number[];
  setShowPracticeDayDropdown: (updater: (previous: boolean) => boolean) => void;
  setSelectedPracticeDay: (dayNumber: number) => void;
  onPracticeSelectedDay: (dayNumber: number) => void;
};

export function HomePracticeDaysCard({
  visible,
  showPracticeDayDropdown,
  selectedPracticeDay,
  practiceDayOptions,
  setShowPracticeDayDropdown,
  setSelectedPracticeDay,
  onPracticeSelectedDay,
}: HomePracticeDaysCardProps) {
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
