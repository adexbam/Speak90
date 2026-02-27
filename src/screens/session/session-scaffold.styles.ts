import { StyleSheet } from 'react-native';
import { colors, layout, radius, space } from '../../ui/tokens';

export const sessionScaffoldStyles = StyleSheet.create({
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
  stickyMiniTimer: {
    marginTop: space.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sentenceCard: {
    marginTop: space.lg,
    padding: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    position: 'relative',
  },
  speakerButton: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
  },
  sentence: {
    textAlign: 'center',
  },
  timerWrap: {
    marginTop: space.lg,
    alignItems: 'center',
    gap: space.xs,
  },
  completeWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  bannerWrap: {
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
