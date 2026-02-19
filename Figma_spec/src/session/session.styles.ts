// src/screens/session/session.styles.ts
import { StyleSheet } from 'react-native';
import { colors, space, radius, layout } from '../ui/tokens';

export const sessionStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },

  headerSide: { width: 60 },
  headerCenter: { flex: 1, alignItems: 'center' },

  sectionMeta: {
    marginTop: space.md,
    alignItems: 'center',
  },

  promptCard: {
    marginTop: space.lg,
    padding: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    marginHorizontal: 0, // Screen already applies paddingX
    alignItems: 'center',
  },

  sentence: {
    textAlign: 'center',
    maxWidth: '90%',
  },

  timerWrap: {
    marginTop: space.lg,
    alignItems: 'center',
  },

  actionBar: {
    marginTop: 'auto',
    paddingBottom: layout.ctaBottomPadding,
  },

  secondaryAction: {
    marginTop: space.md,
    alignSelf: 'center',
  },
});
