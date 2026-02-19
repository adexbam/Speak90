import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, layout, radius, shadow } from './tokens';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  size?: 'default' | 'cta';
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  size = 'default',
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === 'cta' ? styles.cta : styles.default,
        disabled ? styles.disabled : null,
        pressed && !(disabled || loading) ? styles.pressed : null,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
    >
      {loading ? <ActivityIndicator /> : <AppText variant="bodyPrimary" style={styles.label}>{label}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    minHeight: layout.minTap,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.md,
    ...shadow.card,
  },
  default: { height: 56 },
  cta: { height: 64, borderRadius: radius.lg },
  label: { fontWeight: '700', color: colors.textPrimary },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  disabled: { backgroundColor: '#333333', opacity: 0.6, shadowOpacity: 0, elevation: 0 },
});
