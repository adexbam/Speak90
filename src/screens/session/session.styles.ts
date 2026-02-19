import { StyleSheet } from 'react-native';
import { colors, layout, radius, space } from '../../ui/tokens';

export const sessionStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },

  headerSide: {
    width: 72,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  sectionMeta: {
    marginTop: space.md,
    alignItems: 'center',
    gap: space.xs,
  },

  sentenceCard: {
    marginTop: space.lg,
    padding: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    alignItems: 'center',
  },

  sentence: {
    textAlign: 'center',
  },

  timerWrap: {
    marginTop: space.lg,
    alignItems: 'center',
    gap: space.xs,
  },

  actionBar: {
    marginTop: 'auto',
    paddingBottom: layout.ctaBottomPadding,
    gap: space.md,
  },

  rowActions: {
    flexDirection: 'row',
    gap: space.sm,
  },

  rowActionItem: {
    flex: 1,
  },

  secondaryAction: {
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },

  helperText: {
    marginTop: space.sm,
  },

  cueWrap: {
    marginTop: space.md,
    gap: space.xs,
    alignSelf: 'stretch',
  },

  completeWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
});
