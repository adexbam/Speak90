// src/ui/Screen.tsx
import React from 'react';
import { SafeAreaView, View, ViewStyle } from 'react-native';
import { colors, layout } from './tokens';

type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Screen({ children, style }: ScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View style={[{ flex: 1, paddingHorizontal: layout.screenPaddingX }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
