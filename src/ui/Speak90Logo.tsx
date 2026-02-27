import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, space } from './tokens';

type Speak90LogoProps = {
  subtitle?: string;
  compact?: boolean;
};

export function Speak90Logo({ subtitle = 'Speak in 90 Days', compact = false }: Speak90LogoProps) {
  return (
    <View style={[styles.container, compact ? styles.containerCompact : null]}>
      <View style={[styles.badge, compact ? styles.badgeCompact : null]}>
        <AppText variant="bodySecondary" center style={[styles.badgeText, compact ? styles.badgeTextCompact : null]}>
          S90
        </AppText>
      </View>
      <AppText variant="screenTitle" center style={[styles.wordmark, compact ? styles.wordmarkCompact : null]}>
        speak90
      </AppText>
      {subtitle ? (
        <AppText variant="caption" center muted style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: space.sm,
  },
  containerCompact: {
    gap: space.xs,
  },
  badge: {
    minWidth: 66,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.accentPrimary,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentPrimary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  badgeCompact: {
    minWidth: 50,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  badgeText: {
    color: colors.accentPrimary,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  badgeTextCompact: {
    letterSpacing: 0.8,
  },
  wordmark: {
    letterSpacing: 0.5,
    fontWeight: '800',
    textTransform: 'lowercase',
  },
  wordmarkCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  subtitle: {
    letterSpacing: 0.3,
  },
});
