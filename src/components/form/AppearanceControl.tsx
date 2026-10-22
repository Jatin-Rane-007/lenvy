import * as Haptics from "expo-haptics";
import { View } from "react-native";

import {
  themePreferenceOptions,
  useTheme,
  type ThemePreference,
} from "@/theme";
import { SegmentedControl } from "@components/form/SegmentedControl";
import { Text, TintedGlyph } from "@components/primitives";
import { useThemeStore } from "@store/themeStore";

/**
 * Appearance setting — three slots, one tap, no sheet. It is the only setting
 * whose effect is visible the instant it lands, so burying it behind a second
 * surface would hide the confirmation.
 *
 * The store write and the selection tick live here rather than on the screen
 * that hosts it, so Profile and the design-system preview stay in sync for
 * free.
 */
export function AppearanceControl() {
  const t = useTheme();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  const handleChange = (next: ThemePreference) => {
    // The palette swaps on the same frame, so the haptic is the only
    // confirmation that the tap registered at all.
    void Haptics.selectionAsync().catch(() => {});
    setPreference(next);
  };

  return (
    <View style={{ gap: t.spacing[3] }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[4] }}>
        <TintedGlyph ios="circle.lefthalf.filled" lucide="SunMoon" tint="accent" />
        <Text variant="body" tone="ink">
          Appearance
        </Text>
      </View>
      <SegmentedControl
        options={themePreferenceOptions}
        value={preference}
        onChange={handleChange}
      />
    </View>
  );
}
