import { StyleSheet } from 'react-native';
import { colors, radius, space } from '../../ui/tokens';

export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  wrap: {
    flex: 1,
    justifyContent: 'center',
    gap: space.md,
  },
  card: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    gap: space.sm,
  },
  dropdownTrigger: {
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgElevated,
  },
  dropdownMenu: {
    maxHeight: 180,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  dropdownItemSelected: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accentPrimary,
  },
});
