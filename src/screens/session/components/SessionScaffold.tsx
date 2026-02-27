import React from 'react';
import { Pressable, View } from 'react-native';
import type { SessionSectionType } from '../../../data/day-model';
import { AppText } from '../../../ui/AppText';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';

type SessionScaffoldProps = {
  sectionTitle: string;
  sectionIndex: number;
  sectionsCount: number;
  sectionType: SessionSectionType;
  sectionMetaText: string;
  remainingLabel: string;
  timerColor: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function SessionScaffold({
  sectionTitle,
  sectionIndex,
  sectionsCount,
  sectionType,
  sectionMetaText,
  remainingLabel,
  timerColor,
  onClose,
  children,
  footer,
}: SessionScaffoldProps) {
  return (
    <Screen style={sessionStyles.container} scrollable stickyHeaderIndices={[1]}>
      <View style={sessionStyles.header}>
        <View style={sessionStyles.headerSide}>
          <Pressable hitSlop={12} onPress={onClose}>
            <AppText variant="bodySecondary">Close</AppText>
          </Pressable>
        </View>

        <View style={sessionStyles.headerCenter}>
          <AppText variant="bodyPrimary" style={{ fontWeight: '700' }}>
            {sectionTitle}
          </AppText>
        </View>

        <View style={sessionStyles.headerSide} />
      </View>

      <View style={sessionStyles.stickyMiniTimer}>
        <AppText variant="caption" muted>
          Time left
        </AppText>
        <AppText variant="bodyPrimary" style={{ color: timerColor, fontWeight: '700' }}>
          {remainingLabel}
        </AppText>
      </View>

      <View style={sessionStyles.sectionMeta}>
        <AppText variant="bodySecondary" center>
          Section {sectionIndex}/{sectionsCount} - {sectionType}
        </AppText>
        <AppText variant="caption" center muted>
          {sectionMetaText}
        </AppText>
      </View>

      {children}

      <View style={sessionStyles.timerWrap}>
        <AppText variant="timer" style={{ color: timerColor }}>
          {remainingLabel}
        </AppText>
        <AppText variant="caption" muted>
          Remaining in section
        </AppText>
      </View>

      {footer}
    </Screen>
  );
}
