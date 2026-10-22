import { View } from 'react-native';

import { useTheme } from '@/theme';
import type { ColorRole } from '@/theme/semantic';
import { PlatformIcon, type LucideIconName } from '@components/icons';

export type TintedGlyphProps = {
  ios: string;
  lucide: LucideIconName;
  tint: ColorRole;
  size?: number;
};

/**
 * The 40 pt tinted circle that fronts every settings and capture row. The fill
 * is a 12 % wash of the same hue the glyph is drawn in, so the pair always
 * agree — a grey circle around a coloured glyph reads as a mistake.
 *
 * `lucide` is typed rather than `string` on purpose: a name missing from the
 * map in `icons.tsx` renders nothing, and this is the cheapest place to catch
 * that at compile time instead of on a device.
 */
export function TintedGlyph({ ios, lucide, tint, size = 19 }: TintedGlyphProps) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${t.colors[tint]}1F`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PlatformIcon ios={ios} lucide={lucide} size={size} color={t.colors[tint]} />
    </View>
  );
}
