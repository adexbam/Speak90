// src/ui/AppText.tsx
import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors, type } from './tokens';

type Variant = 'screenTitle' | 'cardTitle' | 'bodyPrimary' | 'bodySecondary' | 'caption' | 'timer';

const variantStyle: Record<Variant, TextStyle> = {
  screenTitle: { fontSize: type.screenTitle, fontWeight: '700', color: colors.textPrimary, lineHeight: Math.round(type.screenTitle * 1.3) },
  cardTitle: { fontSize: type.cardTitle, fontWeight: '600', color: colors.textPrimary, lineHeight: Math.round(type.cardTitle * 1.4) },
  bodyPrimary: { fontSize: type.bodyPrimary, fontWeight: '400', color: colors.textPrimary, lineHeight: Math.round(type.bodyPrimary * 1.4) },
  bodySecondary: { fontSize: type.bodySecondary, fontWeight: '400', color: colors.textSecondary, lineHeight: Math.round(type.bodySecondary * 1.4) },
  caption: { fontSize: type.caption, fontWeight: '400', color: colors.textSecondary, lineHeight: Math.round(type.caption * 1.3) },
  timer: { fontSize: type.timer, fontWeight: '700', color: colors.textPrimary, lineHeight: Math.round(type.timer * 1.1) },
};

type AppTextProps = TextProps & {
  variant?: Variant;
  muted?: boolean;
  center?: boolean;
  style?: TextStyle;
};

export function AppText({ variant = 'bodyPrimary', muted, center, style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        variantStyle[variant],
        muted ? { color: colors.textMuted } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}
