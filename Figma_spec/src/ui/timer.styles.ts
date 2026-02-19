// src/ui/timer.styles.ts
import { StyleSheet } from 'react-native';
import { colors } from './tokens';

export const timerStyles = StyleSheet.create({
  normal: { color: colors.textPrimary },
  warning: { color: colors.accentWarning },
  complete: { color: colors.accentSuccess },
});
