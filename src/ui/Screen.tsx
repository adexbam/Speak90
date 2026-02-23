import React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from './tokens';

type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, style, scrollable = false, contentContainerStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const [viewportHeight, setViewportHeight] = React.useState(0);
  const [contentHeight, setContentHeight] = React.useState(0);
  const shouldScroll = contentHeight > viewportHeight && viewportHeight > 0;

  if (scrollable) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.root, style]}
        onLayout={(event) => {
          setViewportHeight(event.nativeEvent.layout.height);
        }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          scrollEnabled={shouldScroll}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={(_, height) => {
            setContentHeight(height);
          }}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
      <View style={[styles.body, { paddingBottom: insets.bottom }, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingX,
  },
  body: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingX,
  },
});
