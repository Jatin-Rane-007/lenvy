import { Pressable, View, type ViewStyle } from "react-native";

import { Text } from "@components/primitives";
import { useTheme } from "@/theme";

export type SegmentOption<K extends string> = { key: K; label: string };

export type SegmentedControlProps<K extends string> = {
  options: readonly SegmentOption<K>[];
  value: K;
  onChange: (key: K) => void;
  style?: ViewStyle;
};

/**
 * Form-tier SegmentedControl (DESIGN.md component inventory). Styles are
 * static objects computed from theme tokens — the React Compiler drops
 * render-prop Pressable styles on native (see auth-submit.tsx), so the
 * selected fill carries the affordance instead of a press animation.
 * Slots sit at 44 pt for the platform minimum touch target.
 */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<K>) {
  const t = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          gap: t.spacing[1],
          padding: t.spacing[1],
          borderRadius: t.radii.md,
          backgroundColor: t.colors.surfaceSunken,
          borderWidth: 1,
          borderColor: t.colors.hairline,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              borderRadius: t.radii.sm,
              backgroundColor: active ? t.colors.accentSoft : "transparent",
            }}
          >
            <Text variant="bodyStrong" tone={active ? "accent" : "muted"}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
