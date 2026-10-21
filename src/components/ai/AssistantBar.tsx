import { Pressable, View } from "react-native";

import { PlatformIcon } from "@components/icons";
import { Box, Text } from "@components/primitives";
import { useTheme } from "@/theme";

export type AssistantBarProps = {
  onPress: () => void;
  /** Nudge shown in the bar — keep it a question, never a cheer. */
  prompt?: string;
};

/**
 * AssistantBar (AI tier) — the one thumb-reachable entry to question
 * answering. It floats at L3 because it sits above the data it is asking
 * about, and its orb is the small, static cousin of the Assistant screen's
 * breathing orb: same accent, no competition for attention.
 */
export function AssistantBar({
  onPress,
  prompt = "Ask about your money",
}: AssistantBarProps) {
  const t = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={prompt}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
      <Box
        surface="surfaceRaised"
        level="L3"
        radius="md"
        padX={t.spacing[4]}
        padY={t.spacing[3]}
        style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[3] }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: t.colors.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PlatformIcon
            ios="sparkles"
            lucide="Sparkles"
            size={13}
            color={t.colors.inkInverse}
            strokeWidth={2}
          />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
          {prompt}
        </Text>
        <PlatformIcon
          ios="chevron.right"
          lucide="ChevronRight"
          size={16}
          color={t.colors.accent}
        />
      </Box>
    </Pressable>
  );
}
