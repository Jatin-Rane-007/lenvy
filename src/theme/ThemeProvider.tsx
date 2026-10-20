import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { elevationRecipes, type ElevationLevel } from './elevation';
import { lightColors, darkColors, type ColorRole, type ColorTokens } from './semantic';
import {
  categorySwatches,
  fontFamilies,
  radii,
  spacing,
  typography,
  type RadiusKey,
  type SpacingKey,
  type TypographyKey,
} from './tokens';
import { durations, springs, standardEasing } from './motion';

export type Scheme = 'light' | 'dark';

export interface ThemeValue {
  scheme: Scheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  fonts: typeof fontFamilies;
  categories: typeof categorySwatches;
  motion: {
    springs: typeof springs;
    durations: typeof durations;
    easing: typeof standardEasing;
  };
  /** Resolve an elevation level to its per-scheme style + hairline flag. */
  elevation: (level: ElevationLevel) => { style: object; hairline: boolean };
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({
  children,
  override,
}: PropsWithChildren<{ override?: Scheme }>) {
  const system = useColorScheme();
  const scheme: Scheme = override ?? (system === 'dark' ? 'dark' : 'light');

  const value = useMemo<ThemeValue>(() => {
    const colors = scheme === 'dark' ? darkColors : lightColors;
    const recipes = elevationRecipes[scheme];
    return {
      scheme,
      colors,
      spacing,
      radii,
      typography,
      fonts: fontFamilies,
      categories: categorySwatches,
      motion: { springs, durations, easing: standardEasing },
      elevation: (level) => ({
        style: recipes[level].style,
        hairline: Boolean(recipes[level].hairline),
      }),
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be called inside <ThemeProvider>');
  }
  return ctx;
}

export type {
  ColorRole,
  ColorTokens,
  ElevationLevel,
  RadiusKey,
  SpacingKey,
  TypographyKey,
};
