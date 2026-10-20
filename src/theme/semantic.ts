/**
 * Semantic role → palette mapping per scheme. Components consume these
 * through `useTheme().colors`; they must never reach for `palette` directly.
 * Keys stay identical across schemes so a swap is a value change, not a
 * type change.
 */
import { palette } from './tokens';

/**
 * Interface form so both `lightColors` and `darkColors` satisfy the same
 * shape; string-literal narrowing would otherwise make them incompatible
 * unions in `useMemo`.
 */
export interface ColorTokens {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  overlay: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  inkInverse: string;
  hairline: string;
  hairlineStrong: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  positive: string;
  negative: string;
  caution: string;
  info: string;
  shadow: string;
}

export type ColorRole = keyof ColorTokens;

export const lightColors: ColorTokens = {
  canvas: palette.parchment,
  surface: palette.parchment2,
  surfaceRaised: palette.parchment3,
  surfaceSunken: palette.sandInset,
  overlay: palette.scrimLight,

  ink: palette.inkLight,
  inkMuted: palette.inkLightMuted,
  inkSubtle: palette.inkLightSubtle,
  inkInverse: palette.parchment2,

  hairline: palette.hairlineLight,
  hairlineStrong: palette.hairlineLightStrong,

  accent: palette.evergreen,
  accentSoft: palette.evergreenSoft,
  accentInk: palette.evergreenInk,

  positive: palette.incomeLight,
  negative: palette.expenseLight,
  caution: palette.cautionLight,
  info: palette.infoLight,

  /** Shadow colour is the ink hue, tinted — never pure black. */
  shadow: 'rgba(10, 13, 18, 1)',
};

export const darkColors: ColorTokens = {
  canvas: palette.slateDeep,
  surface: palette.slate0,
  surfaceRaised: palette.slate1,
  surfaceSunken: palette.slateVoid,
  overlay: palette.scrimDark,

  ink: palette.inkDark,
  inkMuted: palette.inkDarkMuted,
  inkSubtle: palette.inkDarkSubtle,
  inkInverse: palette.slateDeep,

  hairline: palette.hairlineDark,
  hairlineStrong: palette.hairlineDarkStrong,

  accent: palette.mintLuminous,
  accentSoft: palette.mintDeep,
  accentInk: palette.slateDeep,

  positive: palette.incomeDark,
  negative: palette.expenseDark,
  caution: palette.cautionDark,
  info: palette.infoDark,

  shadow: 'rgba(0, 0, 0, 1)',
};
