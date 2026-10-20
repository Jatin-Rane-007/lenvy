import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme';
import type { ColorRole } from '@/theme/semantic';
import type { TypographyKey } from '@/theme/tokens';

export type TextTone =
  | 'ink'
  | 'muted'
  | 'subtle'
  | 'inverse'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'caution'
  | 'info';

const toneToRole: Record<TextTone, ColorRole> = {
  ink: 'ink',
  muted: 'inkMuted',
  subtle: 'inkSubtle',
  inverse: 'inkInverse',
  accent: 'accent',
  positive: 'positive',
  negative: 'negative',
  caution: 'caution',
  info: 'info',
};

export type LenvyTextProps = Omit<TextProps, 'style'> & {
  variant?: TypographyKey;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
  numberOfLines?: number | string;
  style?: TextStyle | TextStyle[];
};

/**
 * The only text component screens should reach for. Variant picks the
 * typography token, tone picks the semantic colour. Never set fontSize or
 * color by hand on this — that breaks the theme contract.
 */
export function Text({
  variant = 'body',
  tone = 'ink',
  align,
  style,
  ...rest
}: LenvyTextProps) {
  const t = useTheme();
  const variantStyle = t.typography[variant] as TextStyle;
  const color = t.colors[toneToRole[tone]];
  const alignStyle: TextStyle | undefined = align ? { textAlign: align } : undefined;

  return (
    <RNText style={[variantStyle, { color }, alignStyle, style]} {...rest} />
  );
}
