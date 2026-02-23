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

  actionBar: {
    marginTop: space.lg,
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

  recordingControlsWrap: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    padding: space.sm,
    gap: space.sm,
  },

  recordingActionGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: space.sm,
  },

  playbackWrap: {
    gap: space.xs,
  },
  
  sttScoreWrap: {
    gap: space.xs,
  },

  sttFeedbackGood: {
    color: colors.accentSuccess,
    textTransform: 'capitalize',
  },

  sttFeedbackNeedsWork: {
    color: colors.accentWarning,
    textTransform: 'capitalize',
  },

  playbackTrack: {
    height: 8,
    borderRadius: radius.round,
    backgroundColor: colors.borderDefault,
    overflow: 'hidden',
  },

  playbackTrackBounds: {
    flex: 1,
  },

  playbackFill: {
    height: '100%',
    backgroundColor: colors.accentPrimary,
  },

  secondaryAction: {
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },

  confidentAction: {
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
  },

  linkLikeText: {
    textDecorationLine: 'underline',
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: space.lg,
  },

  modalCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
});
