// src/ui/Card.tsx
import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { colors, radius, shadow } from './tokens';

type CardProps = ViewProps & {
  elevated?: boolean;
  style?: ViewStyle;
};

export function Card({ elevated = false, style, ...props }: CardProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: elevated ? colors.bgElevated : colors.bgSurface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.borderDefault,
        },
        elevated ? shadow.card : null,
        style,
      ]}
    />
  );
}
