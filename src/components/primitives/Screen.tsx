import type { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export type ScreenProps = PropsWithChildren<{
  /** Skip the safe area inset if the screen draws its own (e.g. a full-bleed sheet). */
  unsafe?: boolean;
  /** Background role — defaults to canvas; use `surface` for modals and detail screens. */
  background?: 'canvas' | 'surface';
  edges?: readonly Edge[];
  style?: ViewStyle | ViewStyle[];
}>;

/**
 * Full-viewport container. Sets the canvas background, respects safe areas,
 * and exposes a consistent gutter for children to lay out against.
 */
export function Screen({
  children,
  unsafe,
  background = 'canvas',
  edges = ['top', 'bottom'],
  style,
}: ScreenProps) {
  const t = useTheme();
  const Wrapper = unsafe ? View : SafeAreaView;
  return (
    <Wrapper
      style={[{ flex: 1, backgroundColor: t.colors[background] }, style]}
      {...(unsafe ? null : { edges })}
    >
      {children}
    </Wrapper>
  );
}
