/**
 * Elevation recipes (L0 → L4). Dark mode leans on surface step-up + hairline
 * because shadows barely register against near-black; light mode leans on
 * soft offset shadows. See DESIGN.md "Elevation".
 */
import type { ViewStyle } from 'react-native';

type Level = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

interface ElevationPart {
  style: ViewStyle;
  /** Whether the surface should also render a hairline border. */
  hairline?: boolean;
}

const light: Record<Level, ElevationPart> = {
  L0: { style: {} },
  L1: {
    hairline: true,
    style: {
      shadowColor: '#0A0D12',
      shadowOpacity: 0.06,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
  },
  L2: {
    style: {
      shadowColor: '#0A0D12',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  },
  L3: {
    style: {
      shadowColor: '#0A0D12',
      shadowOpacity: 0.12,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  },
  L4: {
    style: {
      shadowColor: '#0A0D12',
      shadowOpacity: 0.16,
      shadowRadius: 64,
      shadowOffset: { width: 0, height: 24 },
      elevation: 16,
    },
  },
};

const dark: Record<Level, ElevationPart> = {
  L0: { style: {} },
  L1: { hairline: true, style: {} },
  L2: {
    hairline: true,
    style: {
      shadowColor: '#000',
      shadowOpacity: 0.14,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  },
  L3: {
    hairline: true,
    style: {
      shadowColor: '#000',
      shadowOpacity: 0.24,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 16 },
      elevation: 8,
    },
  },
  L4: {
    hairline: true,
    style: {
      shadowColor: '#000',
      shadowOpacity: 0.32,
      shadowRadius: 64,
      shadowOffset: { width: 0, height: 24 },
      elevation: 16,
    },
  },
};

export const elevationRecipes = { light, dark } as const;
export type ElevationLevel = Level;
