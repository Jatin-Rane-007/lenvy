/**
 * Lenvy raw tokens. Values only — role mapping lives in `semantic.ts`.
 * Components never import this file directly; they go through `useTheme()`.
 */

export const palette = {
  // Light neutrals — warm parchment family
  parchment: '#F4F2EE',
  parchment2: '#FBFAF7',
  parchment3: '#FFFFFF',
  sandInset: '#EAE6DE',

  // Dark neutrals — cool slate family
  slateDeep: '#0A0D12',
  slate0: '#11151C',
  slate1: '#171C25',
  slateVoid: '#06080C',

  // Ink
  inkLight: '#0A0D12',
  inkLightMuted: '#5B6572',
  inkLightSubtle: '#8A94A2',
  inkDark: '#F4F2EE',
  inkDarkMuted: '#96A0AE',
  inkDarkSubtle: '#6A7380',

  // Brand — Evergreen
  evergreen: '#1E4D3B',
  evergreenSoft: '#D7E7DC',
  evergreenInk: '#0F2A20',
  mintLuminous: '#7CD3A0',
  mintDeep: '#143825',

  // Semantic states
  incomeLight: '#3F8F5A',
  incomeDark: '#6BD08C',
  expenseLight: '#B8452F',
  expenseDark: '#E67A5C',
  cautionLight: '#C58A1F',
  cautionDark: '#E6B455',
  infoLight: '#2D5A8A',
  infoDark: '#79ABD9',

  // Scrim
  scrimLight: 'rgba(10, 13, 18, 0.48)',
  scrimDark: 'rgba(0, 0, 0, 0.62)',

  // Hairlines
  hairlineLight: 'rgba(10, 13, 18, 0.09)',
  hairlineLightStrong: 'rgba(10, 13, 18, 0.16)',
  hairlineDark: 'rgba(244, 242, 238, 0.08)',
  hairlineDarkStrong: 'rgba(244, 242, 238, 0.14)',
} as const;

/** Ten muted category swatches — used by charts, chips, account glyphs. */
export const categorySwatches = {
  moss: '#4C6B5E',
  tan: '#7E6B4F',
  harbor: '#3E5A7A',
  terracotta: '#8C5A4A',
  periwinkle: '#6A5B8C',
  sage: '#5F7D6E',
  ochre: '#9A7A48',
  steel: '#486B85',
  rust: '#874F58',
  olive: '#6E6A55',
} as const;

export type CategorySwatch = keyof typeof categorySwatches;

/** 4-pt scale. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 56,
  10: 80,
  11: 112,
} as const;

export type SpacingKey = keyof typeof spacing;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 40,
  full: 99_999,
} as const;

export type RadiusKey = keyof typeof radii;

/**
 * Font families are registered under per-weight names so RN honours the
 * correct weight on both iOS and Android. See `fonts.ts`.
 */
export const fontFamilies = {
  fraunces: 'Fraunces',
  inter: 'Inter',
  interMedium: 'Inter-Medium',
  interSemiBold: 'Inter-SemiBold',
  interBold: 'Inter-Bold',
  jetbrains: 'JetBrainsMono-Medium',
} as const;

export const typography = {
  displayXl: {
    fontFamily: fontFamilies.fraunces,
    fontSize: 56,
    lineHeight: 68,
    letterSpacing: -1,
  },
  displayL: {
    fontFamily: fontFamilies.fraunces,
    fontSize: 40,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: fontFamilies.fraunces,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  subhead: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamilies.inter,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyStrong: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamilies.interMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  micro: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
  },
  numericL: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  numericM: {
    fontFamily: fontFamilies.interMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  mono: {
    fontFamily: fontFamilies.jetbrains,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
} as const;

export type TypographyKey = keyof typeof typography;
