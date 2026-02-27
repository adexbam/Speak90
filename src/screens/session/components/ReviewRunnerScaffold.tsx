import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { sessionStyles } from '../session.styles';

type ReviewRunnerScaffoldProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
};

export function ReviewRunnerScaffold({ title, subtitle, children, primaryAction }: ReviewRunnerScaffoldProps) {
  return (
    <View style={sessionStyles.completeWrap}>
      <AppText variant="screenTitle" center>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="bodySecondary" center>
          {subtitle}
        </AppText>
      ) : null}
      {children}
      {primaryAction ? <PrimaryButton label={primaryAction.label} onPress={primaryAction.onPress} disabled={primaryAction.disabled} /> : null}
    </View>
  );
}
