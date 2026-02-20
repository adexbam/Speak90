import React from 'react';
import { SafeAreaView, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, layout } from './tokens';

type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, style, scrollable = false, contentContainerStyle }: ScreenProps) {
  if (scrollable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ flexGrow: 1, paddingHorizontal: layout.screenPaddingX }, style, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View style={[{ flex: 1, paddingHorizontal: layout.screenPaddingX }, style]}>{children}</View>
    </SafeAreaView>
  );
}
