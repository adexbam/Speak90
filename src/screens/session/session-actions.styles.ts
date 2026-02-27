import { StyleSheet } from 'react-native';
import { colors, layout, radius, space } from '../../ui/tokens';

export const sessionActionStyles = StyleSheet.create({
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
  microReviewWrap: {
    marginTop: space.sm,
    gap: space.xs,
    alignSelf: 'stretch',
  },
  settingsActionLike: {
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgElevated,
    gap: space.xs,
  },
});
