import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/semantic';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = PropsWithChildren<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: ViewStyle;
}>;

/**
 * The primary action. Uses Pressable's `pressed` style callback so the
 * interaction stays React-Compiler-safe (no shared-value mutation) while
 * still giving the tactile dip on press. Reanimated spring entrances will
 * layer on top when we build overlays.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  label,
  children,
  onPress,
  disabled,
  loading,
  fullWidth,
  leading,
  trailing,
  style,
}: ButtonProps) {
  const t = useTheme();
  const palette = buttonPalette(t.colors, variant);
  const sizing = buttonSize(size);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.border ? 1 : 0,
          borderRadius: t.radii.md,
          paddingHorizontal: sizing.padX,
          paddingVertical: sizing.padY,
          minHeight: sizing.height,
          opacity: inactive ? 0.55 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !inactive ? 0.97 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {leading}
          {children ?? (
            <Text
              variant={size === 'lg' ? 'subhead' : 'bodyStrong'}
              style={{ color: palette.fg }}
            >
              {label}
            </Text>
          )}
          {trailing}
        </>
      )}
    </Pressable>
  );
}

function buttonPalette(
  colors: ColorTokens,
  variant: ButtonVariant,
): { bg: string; fg: string; border?: string } {
  switch (variant) {
    case 'primary':
      return { bg: colors.accent, fg: colors.accentInk };
    case 'secondary':
      return { bg: colors.surface, fg: colors.ink, border: colors.hairlineStrong };
    case 'ghost':
      return { bg: 'transparent', fg: colors.ink };
    case 'destructive':
      return { bg: colors.negative, fg: colors.inkInverse };
    case 'link':
      return { bg: 'transparent', fg: colors.accent };
  }
}

function buttonSize(size: ButtonSize) {
  switch (size) {
    case 'sm':
      return { padX: 12, padY: 8, height: 36 };
    case 'lg':
      return { padX: 24, padY: 16, height: 52 };
    default:
      return { padX: 18, padY: 12, height: 44 };
  }
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
