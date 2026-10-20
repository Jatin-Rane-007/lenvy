import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import type { ColorRole } from '@/theme/semantic';
import { Text, type TextTone } from './Text';

export type BadgeTone = Extract<TextTone, 'positive' | 'negative' | 'caution' | 'info' | 'accent' | 'muted'>;
export type BadgeSize = 'sm' | 'md';

const toneToRole: Record<BadgeTone, ColorRole> = {
  positive: 'positive',
  negative: 'negative',
  caution: 'caution',
  info: 'info',
  accent: 'accent',
  muted: 'inkMuted',
};

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Optional dot on the leading edge (used on budget state, category tags). */
  dot?: boolean;
  style?: ViewStyle;
};

export function Badge({ label, tone = 'muted', size = 'sm', dot, style }: BadgeProps) {
  const t = useTheme();
  const hue = t.colors[toneToRole[tone]];
  const padX = size === 'md' ? t.spacing[3] : t.spacing[2];
  const padY = size === 'md' ? 4 : 2;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: `${hue}1A`,
          borderColor: `${hue}55`,
          borderRadius: t.radii.xs,
          paddingHorizontal: padX,
          paddingVertical: padY,
        },
        style,
      ]}
    >
      {dot ? (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: hue,
            marginRight: t.spacing[2],
          }}
        />
      ) : null}
      <Text variant="micro" style={{ color: hue }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
