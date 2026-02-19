import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { colors, radius, shadow } from './tokens';

type CardProps = ViewProps & {
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ elevated = false, style, ...props }: CardProps) {
  return (
    <View
      {...props}
      style={[
        styles.base,
        elevated ? styles.elevatedBg : styles.surfaceBg,
        elevated ? shadow.card : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  surfaceBg: {
    backgroundColor: colors.bgSurface,
  },
  elevatedBg: {
    backgroundColor: colors.bgElevated,
  },
});
