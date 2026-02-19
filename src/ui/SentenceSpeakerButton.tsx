import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSentenceTTS } from '../audio/useSentenceTTS';
import { colors, radius, space } from './tokens';

type SentenceSpeakerButtonProps = {
  text: string;
  style?: ViewStyle | ViewStyle[];
};

export function SentenceSpeakerButton({ text, style }: SentenceSpeakerButtonProps) {
  const { isSpeaking, speak } = useSentenceTTS({ language: 'de-DE', rate: 0.92, pitch: 1 });
  const disabled = !text.trim();

  return (
    <Pressable
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Play pronunciation"
      disabled={disabled}
      onPress={() => {
        void speak(text);
      }}
      style={({ pressed }) => [
        styles.base,
        disabled ? styles.disabled : null,
        isSpeaking ? styles.active : null,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      <Ionicons name={isSpeaking ? 'volume-high' : 'volume-medium'} size={16} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  active: {
    borderColor: colors.accentSuccess,
    backgroundColor: '#1A3325',
  },
  disabled: {
    opacity: 0.5,
  },
});
