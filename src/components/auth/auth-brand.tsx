import { Image } from "expo-image";
import { View } from "react-native";

import { Text } from "@components/primitives";
import { useTheme } from "@/theme";

/**
 * Lenvy wordmark + tagline shown atop the auth screens. Uses the new brand
 * assets (replacing the old Expo iconography) and swaps logo art per scheme.
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
      ? require("@/assets/images/lenvy_app_logo_dark.png")
      : require("@/assets/images/lenvy_app_logo_light.png");

  return (
    <View className="items-center gap-4">
      <Image
        source={logo}
        style={{ width: 72, height: 72 }}
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
