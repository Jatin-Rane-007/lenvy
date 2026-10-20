import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import { Enter, Float, useReduceMotion } from "@components/animated";
import { PlatformIcon } from "@components/icons";
import { Box, Chip, Screen, Text } from "@components/primitives";

/**
 * Assistant — question answering over the user's own numbers. The AI orb is
 * the signature moment from DESIGN.md: a breathing core with two halo rings
 * pulsing on offset cycles (2.4 s ease-in-out, static when reduce-motion is
 * on). Suggestion chips preview what it will ask of the ledger.
 */
const suggestions = [
  "Where did this month’s money go?",
  "Can I afford this?",
  "How did my balance change?",
];

export default function AssistantScreen() {
  const t = useTheme();
  const reduce = useReduceMotion();
  const breathe = useSharedValue(0.98);
  const halo = useSharedValue(0.9);

  useEffect(() => {
    if (reduce) {
      breathe.value = 1;
      halo.value = 1;
      return;
    }
    breathe.value = withRepeat(
      withTiming(1.02, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // Halos breathe on an offset cycle so the stack never pulses in lockstep.
    halo.value = withRepeat(
      withTiming(1.12, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduce, breathe, halo]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: halo.value }],
    opacity: reduce ? 0.6 : 0.4 + (1.12 - halo.value) * 2.5,
  }));

  return (
    <Screen edges={["top"]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: t.colors.canvas }}
        contentContainerStyle={{
          padding: t.spacing[5],
          paddingBottom: t.spacing[11],
        }}
      >
        <Box
          style={{
            paddingTop: t.spacing[2],
            gap: t.spacing[7],
            alignItems: "stretch",
          }}
        >
          {/* Orb stage — the one saturated accent moment on this screen */}
          <Box style={{ alignItems: "center", gap: t.spacing[6] }}>
            <View
              style={{
                width: 200,
                height: 200,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Outer halo */}
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    width: 190,
                    height: 190,
                    borderRadius: 95,
                    backgroundColor: t.colors.accentSoft,
                  },
                  haloStyle,
                ]}
              />
              {/* Inner halo — same animation, tighter and warmer */}
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    width: 138,
                    height: 138,
                    borderRadius: 69,
                    backgroundColor: t.colors.accentSoft,
                  },
                  orbStyle,
                ]}
              />
              <Animated.View
                style={[
                  {
                    width: 104,
                    height: 104,
                    borderRadius: 52,
                    backgroundColor: t.colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  orbStyle,
                ]}
                accessibilityRole="image"
                accessibilityLabel="Assistant status"
              >
                {/* info-tinted highlight for the accent → info gradient feel */}
                <View
                  style={{
                    position: "absolute",
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: t.colors.info,
                    opacity: 0.45,
                    transform: [{ translateX: 18 }, { translateY: -20 }],
                  }}
                />
                <PlatformIcon
                  ios="sparkles"
                  lucide="Sparkles"
                  size={40}
                  color={t.colors.inkInverse}
                  strokeWidth={1.75}
                />
              </Animated.View>
            </View>

            <Enter delay={120}>
              <Text variant="displayL" tone="ink" align="center">
                Ask about your money
              </Text>
            </Enter>
            <Enter delay={200}>
              <Text variant="body" tone="muted" align="center">
                “What did I spend yesterday?” — answers come from your own
                transactions, once there are any to read.
              </Text>
            </Enter>
          </Box>

          {/* Voice teaser — floats gently above the suggestions */}
          <Enter delay={280}>
            <Float>
              <Box
                surface="surface"
                level="L2"
                radius="full"
                padX={t.spacing[4]}
                padY={t.spacing[3]}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: t.spacing[3],
                  alignSelf: "center",
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: `${t.colors.caution}1F`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PlatformIcon
                    ios="mic.fill"
                    lucide="Mic"
                    size={14}
                    color={t.colors.caution}
                  />
                </View>
                <Text variant="caption" tone="muted">
                  Hold to speak — coming soon
                </Text>
              </Box>
            </Float>
          </Enter>

          {/* Suggestion chips — what the assistant will be asked first */}
          <Box gap={t.spacing[2]}>
            {suggestions.map((q, i) => (
              <Enter key={q} delay={360 + i * 80}>
                <Chip
                  label={q}
                  variant="suggestion"
                  style={{ alignSelf: "flex-start" }}
                />
              </Enter>
            ))}
          </Box>

          <Enter delay={640}>
            <Text variant="caption" tone="subtle" align="center">
              Voice stage and answer streaming land with the assistant feature
              pass.
            </Text>
          </Enter>
        </Box>
      </ScrollView>
    </Screen>
  );
}
