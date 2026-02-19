// src/ui/promptCard.styles.ts
import { StyleSheet } from 'react-native';
import { colors, radius } from './tokens';

export const promptCardStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },

  active: {
    borderColor: colors.accentPrimary,
    // subtle "glow" approximation:
    shadowColor: colors.accentPrimary,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  completed: {
    opacity: 0.65,
    transform: [{ scale: 0.99 }],
  },
});
