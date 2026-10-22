import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import { elevationRecipes, type ElevationLevel } from './elevation';
import { resolveScheme, type Scheme, type ThemePreference } from './preference';
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
import { applyWebScheme } from './webScheme';

export type { Scheme, ThemePreference };

export interface ThemeValue {
  /** What the user picked: `system`, or an explicit `light` / `dark` pin. */
  preference: ThemePreference;
  /** What that resolves to right now. Every visual decision reads this. */
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
  preference = 'system',
}: PropsWithChildren<{ preference?: ThemePreference }>) {
  const system = useColorScheme();
  const scheme = resolveScheme(preference, system);

  // Web only: mirror the resolved scheme onto <html data-theme> so the CSS
  // variables in global.css follow a pin, not just the OS.
  useEffect(() => {
    applyWebScheme(scheme);
  }, [scheme]);

  const value = useMemo<ThemeValue>(() => {
    const colors = scheme === 'dark' ? darkColors : lightColors;
    const recipes = elevationRecipes[scheme];
    return {
      preference,
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
  }, [preference, scheme]);

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
