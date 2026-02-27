import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';

export function ModeLoadingScreen({ label }: { label: string }) {
  return (
    <Screen style={sessionStyles.container}>
      <View style={sessionStyles.completeWrap}>
        <AppText variant="caption" center muted>
          {label}
        </AppText>
      </View>
    </Screen>
  );
}
