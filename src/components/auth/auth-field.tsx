import { useState, type ComponentProps } from "react";
import { Pressable, TextInput, View } from "react-native";

import { Text } from "@components/primitives";
import { useTheme } from "@/theme";

export type AuthFieldProps = {
  label: string;
  /** Bound to react-hook-form via <Controller>. */
  value: string;
  onChange: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  /** Renders a secure field with an inline Show/Hide affordance. */
  secure?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: ComponentProps<typeof TextInput>["autoComplete"];
  autoCapitalize?: ComponentProps<typeof TextInput>["autoCapitalize"];
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  returnKeyType?: ComponentProps<typeof TextInput>["returnKeyType"];
  onSubmitEditing?: () => void;
};

/**
 * A label + themed text input + inline error message, shared by the sign-in
 * and sign-up screens. Colors come from the Lenvy semantic theme (JS tokens,
 * reliable on native); layout uses NativeWind utility classes.
 */
export function AuthField({
  label,
  value,
  onChange,
  onBlur,
  error,
  secure,
  placeholder,
  autoFocus,
  autoComplete,
  autoCapitalize,
  keyboardType,
  returnKeyType,
  onSubmitEditing,
}: AuthFieldProps) {
  const t = useTheme();
  const [revealed, setRevealed] = useState(false);

  const isSecure = Boolean(secure) && !revealed;
  const borderColor = error ? t.colors.negative : t.colors.hairline;

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text
          variant="micro"
          tone="muted"
          style={{ textTransform: "uppercase" }}
        >
          {label}
        </Text>
        {secure ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
          >
            <Text variant="micro" tone={revealed ? "accent" : "subtle"}>
              {revealed ? "HIDE" : "SHOW"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <TextInput
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        secureTextEntry={isSecure}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        autoFocus={autoFocus}
        placeholderTextColor={t.colors.inkSubtle}
        cursorColor={t.colors.accent}
        style={{
          backgroundColor: t.colors.surfaceSunken,
          color: t.colors.ink,
          borderWidth: 1,
          borderColor,
          borderRadius: t.radii.lg,
          paddingHorizontal: t.spacing[4] + 2,
          paddingVertical: t.spacing[3] + 2,
          fontSize: 16,
          lineHeight: 22,
        }}
      />

      {error ? (
        <Text variant="caption" tone="negative">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
