import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme";
import { useReduceMotion } from "@components/animated";
import { PlatformIcon } from "@components/icons";

export type AiOrbProps = {
  /** Core diameter in px; the halo rings scale from it. */
  size?: number;
  /** Breathing on/off — pass false for the compact header orb. */
  animated?: boolean;
};

/**
 * AiOrb (AI tier) — DESIGN.md signature moment 3: an evergreen→info orb that
 * breathes on a 2.4 s ease-in-out loop (scale 0.98 ↔ 1.02), with two halo rings
 * on offset cycles so the stack never pulses in lockstep. Reduce-motion
 * collapses it to a static ring. This is the one saturated accent moment on any
 * screen that renders it, so keep a single instance in view at a time.
 */
export function AiOrb({ size = 104, animated = true }: AiOrbProps) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const breathe = useSharedValue(1);
  const halo = useSharedValue(1);

  useEffect(() => {
    if (!animated || reduce) {
      breathe.value = 1;
      halo.value = 1;
      return;
    }
    breathe.value = withRepeat(
      withTiming(1.02, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // Halos breathe on an offset cycle so the rings never beat in lockstep.
    halo.value = withRepeat(
      withTiming(1.12, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [animated, reduce, breathe, halo]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: halo.value }],
    opacity: !animated || reduce ? 0.6 : 0.4 + (1.12 - halo.value) * 2.5,
  }));

  const inner = Math.round(size * 1.32);
  const outer = Math.round(size * 1.82);
  const glyph = Math.round(size * 0.38);
  const highlight = Math.round(size * 0.38);

  return (
    <View
      style={{
        width: outer,
        height: outer,
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
            width: outer,
            height: outer,
            borderRadius: outer / 2,
            backgroundColor: t.colors.accentSoft,
          },
          haloStyle,
        ]}
      />
      {/* Inner halo — same cycle, tighter and warmer */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: t.colors.accentSoft,
          },
          coreStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: t.colors.accent,
            alignItems: "center",
            justifyContent: "center",
          },
          coreStyle,
        ]}
        accessibilityRole="image"
        accessibilityLabel="Assistant status"
      >
        {/* info-tinted highlight for the accent → gradient feel */}
        <View
          style={{
            position: "absolute",
            width: highlight,
            height: highlight,
            borderRadius: highlight / 2,
            backgroundColor: t.colors.info,
            opacity: 0.45,
            transform: [
              { translateX: size * 0.17 },
              { translateY: -size * 0.19 },
            ],
          }}
        />
        <PlatformIcon
          ios="sparkles"
          lucide="Sparkles"
          size={glyph}
          color={t.colors.inkInverse}
          strokeWidth={1.75}
        />
      </Animated.View>
    </View>
  );
}
