export const colors = {
  bgPrimary: '#1A1A1A',
  bgSurface: '#222222',
  bgElevated: '#2A2A2A',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',

  accentPrimary: '#10B981',
  accentRecord: '#EF4444',
  accentWarning: '#F59E0B',
  accentSuccess: '#22C55E',

  borderDefault: 'rgba(255,255,255,0.12)',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  round: 999,
} as const;

export const type = {
  timer: 48,
  screenTitle: 24,
  cardTitle: 20,
  bodyPrimary: 18,
  bodySecondary: 16,
  caption: 14,
} as const;

export const layout = {
  screenPaddingX: 20,
  ctaBottomPadding: 24,
  headerHeight: 56,
  minTap: 44,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
} as const;
