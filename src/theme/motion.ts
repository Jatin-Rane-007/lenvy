import { Easing } from 'react-native-reanimated';

/**
 * Reanimated 4 spring presets. Pass to `withSpring(to, springs.snap)` etc.
 * See DESIGN.md "Motion".
 */
export const springs = {
  /** Buttons, row highlight — quick, no visible overshoot. */
  snap: { damping: 22, stiffness: 320, mass: 0.8, restDisplacementThreshold: 0.001, restSpeedThreshold: 0.001 },
  /** Sheets, tab crossfade, number roll — floats into place with a whisper of overshoot. */
  gentle: { damping: 20, stiffness: 140, mass: 1 },
  /** AI orb pop-in, budget-milestone tick — playful, one bounce. */
  bouncy: { damping: 12, stiffness: 180, mass: 1 },
} as const;

export const durations = { fast: 120, base: 220, slow: 420 } as const;

/** cubic-bezier(0.32, 0.72, 0, 1) — the "liquid glass" feel. */
export const standardEasing = Easing.bezier(0.32, 0.72, 0, 1);

export type SpringKey = keyof typeof springs;
export type DurationKey = keyof typeof durations;
