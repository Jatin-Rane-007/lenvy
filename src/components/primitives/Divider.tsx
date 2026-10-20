import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  /** 'hairline' by default; 'sunken' insets a groove; 'space' is a plain gap. */
  variant?: 'hairline' | 'sunken' | 'space';
  /** Spacing token for `space` variant, or length for the others. */
  thickness?: 1 | 2 | 4 | 8 | 12 | 16;
  style?: ViewStyle;
};

export function Divider({
  orientation = 'horizontal',
  variant = 'hairline',
  thickness,
  style,
}: DividerProps) {
  const t = useTheme();
  const isH = orientation === 'horizontal';

  if (variant === 'space') {
    return (
      <View
        style={[
          isH ? { height: thickness ?? t.spacing[4] } : { width: thickness ?? t.spacing[4] },
          style,
        ]}
      />
    );
  }

  const color = variant === 'sunken' ? t.colors.surfaceSunken : t.colors.hairline;
  const size = thickness ?? 1;

  return (
    <View
      accessibilityElementsHidden
      style={[
        { backgroundColor: color },
        isH ? { height: size, width: '100%' } : { width: size, alignSelf: 'stretch' },
        style,
      ]}
    />
  );
}
