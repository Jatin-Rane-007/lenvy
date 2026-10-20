import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/theme';
import { Text } from './Text';

export type AvatarSize = 'sm' | 'md' | 'lg';

export type AvatarProps = {
  /** Full name or handle; initials derived from the first two word starts. */
  name: string;
  /** Optional remote image URL. Falls back to initials on failure. */
  uri?: string | null;
  size?: AvatarSize;
  /** Override the derived initials (e.g. show only one letter). */
  initials?: string;
  style?: ViewStyle;
};

const dims: Record<AvatarSize, number> = { sm: 28, md: 40, lg: 64 };

export function Avatar({ name, uri, size = 'md', initials, style }: AvatarProps) {
  const t = useTheme();
  const dim = dims[size];
  const text = (initials ?? deriveInitials(name)).slice(0, 2);

  return (
    <View
      style={[
        styles.base,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: t.colors.accentSoft,
          borderColor: t.colors.hairline,
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: dim, height: dim, borderRadius: dim / 2 }} contentFit="cover" />
      ) : (
        <Text variant={size === 'lg' ? 'subhead' : 'caption'} tone="accent">
          {text}
        </Text>
      )}
    </View>
  );
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
});
