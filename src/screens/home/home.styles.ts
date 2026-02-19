import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space } from '../../ui/tokens';

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
    gap: space.sm,
  },

  settingsWrap: {
    marginTop: space.md,
    gap: space.xs,
  },

  reminderCard: {
    marginTop: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    gap: space.sm,
  },

  reminderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },

  resumeCard: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    gap: space.sm,
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
