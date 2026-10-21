import { Image } from "expo-image";
import { View } from "react-native";

import { Text } from "@components/primitives";
import { useTheme } from "@/theme";

/**
 * Lenvy wordmark + tagline shown atop the auth and onboarding screens. Uses
 * the brand kit mark and swaps art per scheme (ink mark on light, light mark
 * on dark).
 */
export function AuthBrand({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const t = useTheme();
  const logo =
    t.scheme === "dark"
      ? require("@/assets/lenvy-brand-assets/png/lenvy-mark-on-dark.png")
      : require("@/assets/lenvy-brand-assets/png/lenvy-mark.png");

  return (
    <View className="items-center gap-4">
      <Image
        source={logo}
        style={{ width: 66, height: 88 }}
        contentFit="contain"
        accessibilityLabel="Lenvy"
      />
      <View className="items-center gap-2">
        <Text variant="displayL" tone="ink" align="center">
          {title}
        </Text>
        <Text variant="body" tone="muted" align="center" className="px-2">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
