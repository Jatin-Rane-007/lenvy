import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './Text';

export type ChipVariant = 'filter' | 'category' | 'suggestion';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** For category chips — pass one of the theme category swatches (hex). */
  swatch?: string;
  variant?: ChipVariant;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, swatch, variant = 'filter', style }: ChipProps) {
  const t = useTheme();

  const bg = selected
    ? variant === 'category' && swatch
      ? `${swatch}22`
      : t.colors.accentSoft
    : 'transparent';

  const borderColor = selected
    ? variant === 'category' && swatch
      ? swatch
      : t.colors.accent
    : t.colors.hairline;

  const fg = selected
    ? variant === 'category' && swatch
      ? swatch
      : t.colors.accent
    : t.colors.inkMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      hitSlop={6}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderRadius: t.radii.sm,
          paddingHorizontal: t.spacing[3],
          paddingVertical: t.spacing[2],
        },
        style,
      ]}
    >
      <Text variant="caption" tone={selected ? 'ink' : 'muted'} style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
  },
});
