import React from 'react';
import { Pressable } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { sessionStyles } from '../session.styles';

type SessionNavActionsProps = {
  showNextSectionAction: boolean;
  onNextSection: () => void;
  onRestartTimer: () => void;
};

export function SessionNavActions({ showNextSectionAction, onNextSection, onRestartTimer }: SessionNavActionsProps) {
  return (
    <>
      {showNextSectionAction ? (
        <Pressable style={sessionStyles.confidentAction} onPress={onNextSection}>
          <AppText variant="bodySecondary" center>
            I&apos;m confident - Next Section
          </AppText>
        </Pressable>
      ) : null}
      <Pressable style={sessionStyles.secondaryAction} onPress={onRestartTimer}>
        <AppText variant="bodySecondary" center style={sessionStyles.linkLikeText}>
          Restart timer
        </AppText>
      </Pressable>
    </>
  );
}
