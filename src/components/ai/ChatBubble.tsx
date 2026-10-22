import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import { useReduceMotion } from "@components/animated";
import { Box, Text } from "@components/primitives";

export type ChatRole = "user" | "assistant";

/**
 * A single chat turn. The user's line rides the accent (light ink on the
 * evergreen/mint core — the same pairing as the AiOrb glyph, so it holds
 * contrast on both schemes); the assistant's answer sits on a quiet L1 surface
 * card. A tightened tail corner gives each bubble direction without a pointer
 * triangle.
 */
export function ChatBubble({
  role,
  content,
  failed,
}: {
  role: ChatRole;
  content: string;
  failed?: boolean;
}) {
  const t = useTheme();
  const isUser = role === "user";

  if (isUser) {
    return (
      <Box
        radius="lg"
        style={{
          alignSelf: "flex-end",
          maxWidth: "82%",
          backgroundColor: t.colors.accent,
          paddingHorizontal: t.spacing[4],
          paddingVertical: t.spacing[3],
          borderBottomRightRadius: t.radii.xs,
        }}
      >
        <Text variant="body" style={{ color: t.colors.inkInverse }}>
          {content}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      surface="surface"
      level="L1"
      radius="lg"
      style={{
        alignSelf: "flex-start",
        maxWidth: "88%",
        gap: t.spacing[2],
        paddingHorizontal: t.spacing[4],
        paddingVertical: t.spacing[3],
        borderBottomLeftRadius: t.radii.xs,
        borderColor: failed ? t.colors.negative : t.colors.hairline,
      }}
    >
      {failed ? (
        <Text variant="micro" tone="negative">
          {"COULDN'T ANSWER"}
        </Text>
      ) : null}
      <Text variant="body" tone={failed ? "muted" : "ink"}>
        {content}
      </Text>
    </Box>
  );
}

/**
 * "Thinking…" stand-in while the ledger read + Gemini round-trip is in flight:
 * three dots rise in a staggered wave. Collapses to a static row under
 * reduce-motion.
 */
export function TypingBubble() {
  const t = useTheme();
  const reduce = useReduceMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const c = useSharedValue(0);

  useEffect(() => {
    const dots = [a, b, c];
    if (reduce) {
      dots.forEach((d) => {
        d.value = 0.5;
      });
      return;
    }
    dots.forEach((d, i) => {
      d.value = withDelay(
        i * 160,
        withRepeat(
          withTiming(1, { duration: 480, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        ),
      );
    });
  }, [reduce, a, b, c]);

  return (
    <Box
      surface="surface"
      level="L1"
      radius="lg"
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: t.spacing[2],
        paddingHorizontal: t.spacing[4],
        paddingVertical: t.spacing[3],
        borderBottomLeftRadius: t.radii.xs,
        minHeight: 42,
      }}
    >
      <Dot progress={a} />
      <Dot progress={b} />
      <Dot progress={c} />
    </Box>
  );
}

function Dot({ progress }: { progress: SharedValue<number> }) {
  const t = useTheme();
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [
      { translateY: -progress.value * 3 },
      { scale: 0.85 + progress.value * 0.3 },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: t.colors.accent,
        },
        style,
      ]}
    />
  );
}
