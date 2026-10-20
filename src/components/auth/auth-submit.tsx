import { useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";

import { Text } from "@components/primitives";
import { useTheme } from "@/theme";

export type AuthSubmitProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * Primary auth action. Deliberately uses a static Pressable style (computed
 * from theme tokens) rather than the shared Button primitive's render-prop
 * style, which the experimental React Compiler drops on native. Gives a full
 * width, comfortably tall target with a tactile dip on press.
 */
export function AuthSubmit({
  label,
  onPress,
  loading,
  disabled,
}: AuthSubmitProps) {
  const t = useTheme();
  const [pressed, setPressed] = useState(false);
  const inactive = Boolean(disabled) || Boolean(loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      onPress={inactive ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: t.spacing[2],
        minHeight: 56,
        paddingHorizontal: t.spacing[6],
        borderRadius: t.radii.lg,
        backgroundColor: t.colors.accent,
        opacity: inactive ? 0.6 : pressed ? 0.9 : 1,
        transform: [{ scale: pressed && !inactive ? 0.985 : 1 }],
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={t.colors.inkInverse} />
      ) : (
        <Text variant="subhead" style={{ color: t.colors.inkInverse }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
