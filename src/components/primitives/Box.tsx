import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import type { ElevationLevel } from '@/theme/elevation';
import type { ColorRole } from '@/theme/semantic';
import type { RadiusKey, SpacingKey } from '@/theme/tokens';

export type BoxSurface = 'transparent' | 'canvas' | 'surface' | 'surfaceRaised' | 'surfaceSunken';

const surfaceToRole: Partial<Record<BoxSurface, ColorRole>> = {
  canvas: 'canvas',
  surface: 'surface',
  surfaceRaised: 'surfaceRaised',
  surfaceSunken: 'surfaceSunken',
};

export type BoxProps = Omit<ViewProps, 'style'> & {
  surface?: BoxSurface;
  level?: ElevationLevel;
  radius?: RadiusKey;
  pad?: SpacingKey | number;
  padX?: SpacingKey | number;
  padY?: SpacingKey | number;
  gap?: SpacingKey | number;
  /** Force a hairline border even when the level wouldn't render one. */
  hairline?: boolean;
  style?: ViewStyle | ViewStyle[];
};

/**
 * The generic surface. Combines a background role, an elevation recipe, a
 * radius, and optional padding/gap from the token scale. Prefer this over
 * a bare <View> whenever something needs to sit on a layer.
 */
export function Box({
  surface = 'transparent',
  level = 'L0',
  radius = 'lg',
  pad,
  padX,
  padY,
  gap,
  hairline,
  style,
  children,
  ...rest
}: BoxProps) {
  const t = useTheme();
  const bg = surface === 'transparent' ? undefined : t.colors[surfaceToRole[surface]!];
  const { style: shadowStyle, hairline: levelHairline } = t.elevation(level);
  const showHairline = hairline ?? levelHairline;

  const resolve = (v: SpacingKey | number | undefined) =>
    v === undefined ? undefined : typeof v === 'number' ? v : t.spacing[v];

  const composed: ViewStyle = {
    backgroundColor: bg,
    borderRadius: t.radii[radius],
    padding: resolve(pad),
    paddingHorizontal: padX !== undefined ? resolve(padX) : undefined,
    paddingVertical: padY !== undefined ? resolve(padY) : undefined,
    gap: resolve(gap),
    ...(showHairline
      ? { borderWidth: 1, borderColor: t.colors.hairline }
      : null),
    ...shadowStyle,
  };

  return (
    <View style={[composed, style]} {...rest}>
      {children}
    </View>
  );
}
