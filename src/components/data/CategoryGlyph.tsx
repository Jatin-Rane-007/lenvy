import { View, type ViewStyle } from "react-native";

import { PlatformIcon } from "@components/icons";
import { getCategoryVisual } from "@components/data/categoryVisuals";
import { useTheme } from "@/theme";

export type CategoryGlyphProps = {
  /** Category key from the ledger (`food`, `salary`, …). */
  category: string;
  size?: number;
  /** Icon size override; defaults to 45 % of the glyph diameter. */
  iconSize?: number;
  style?: ViewStyle;
};

/**
 * CategoryGlyph (Data tier). The swatch tints the disc at ~12 % alpha and the
 * glyph takes the full swatch hue, so a list of rows reads as colour first,
 * icon second — the way DESIGN.md wants data to scan.
 */
export function CategoryGlyph({
  category,
  size = 40,
  iconSize,
  style,
}: CategoryGlyphProps) {
  const t = useTheme();
  const visual = getCategoryVisual(category);
  const hue = t.categories[visual.swatch];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${hue}1F`,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <PlatformIcon
        ios={visual.ios}
        lucide={visual.lucide}
        size={iconSize ?? Math.round(size * 0.45)}
        color={hue}
      />
    </View>
  );
}
