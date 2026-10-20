import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export type IconButtonProps = {
  onPress?: () => void;
  accessibilityLabel: string;
  children: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
};

export function IconButton({
  onPress,
  accessibilityLabel,
  children,
  variant = 'ghost',
  size = 'md',
  disabled,
  style,
}: IconButtonProps) {
  const t = useTheme();

  const dim = size === 'sm' ? 32 : size === 'lg' ? 52 : 44;
  const palette =
    variant === 'primary'
      ? { bg: t.colors.accent, fg: t.colors.accentInk, border: undefined as string | undefined }
      : variant === 'secondary'
        ? { bg: t.colors.surface, fg: t.colors.ink, border: t.colors.hairlineStrong }
        : { bg: 'transparent', fg: t.colors.ink, border: undefined };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={disabled ? undefined : onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        {
          width: dim,
          height: dim,
          borderRadius: t.radii.sm,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.border ? 1 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
          transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
