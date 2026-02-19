// src/screens/home/home.styles.ts
import { StyleSheet } from 'react-native';
import { colors, space, radius, shadow, layout } from '../../ui/tokens';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  titleWrap: {
    paddingTop: space.xl,
    alignItems: 'center',
  },

  progressCard: {
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    ...shadow.card,
  },

  progressRow: {
    marginTop: space.sm,
  },

  startWrap: {
    marginTop: space.xl,
  },

  bannerWrap: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    // NOTE: keep banner outside Screen padding if you prefer full-width
  },

  subtleLink: {
    marginTop: space.md,
    alignSelf: 'center',
  },
});
