import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../../ui/tokens';

export const statsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  titleWrap: {
    paddingTop: space.xl,
    alignItems: 'center',
  },

  cardsWrap: {
    marginTop: space.lg,
    gap: space.md,
  },

  card: {
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    ...shadow.card,
    gap: space.xs,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  buttonWrap: {
    marginTop: space.lg,
  },

  bannerWrap: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    paddingTop: space.md,
    paddingBottom: space.md,
  },

  bannerBox: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
