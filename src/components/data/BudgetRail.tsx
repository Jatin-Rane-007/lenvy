import { useEffect, useState } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useReduceMotion } from "@components/animated";
import { Badge } from "@components/primitives";
import { durations, springs, useTheme } from "@/theme";

export type BudgetRailProps = {
  /** Month-to-date spend. */
  spent: number;
  /** The user's monthly figure; must be > 0 for the rail to mean anything. */
  budget: number;
  style?: ViewStyle;
};

/**
 * BudgetRail — signature moment 2 from DESIGN.md. A single horizontal bar
 * coloured by state at three thresholds (accent ≤ 60 %, caution 60–90 %,
 * negative > 90 %) with the percentage chip riding the fill head.
 *
 * The fill animates on `spring.gentle` so a new transaction visibly moves the
 * rail; reduced-motion collapses that to a plain fade-in of the final width.
 */
export function BudgetRail({ spent, budget, style }: BudgetRailProps) {
  const t = useTheme();
  const reduce = useReduceMotion();

  const [trackWidth, setTrackWidth] = useState(0);
  const [chipWidth, setChipWidth] = useState(46);

  const ratio = budget > 0 ? Math.max(spent / budget, 0) : 0;
  const percent = Math.round(ratio * 100);
  const hue =
    ratio > 0.9 ? t.colors.negative : ratio > 0.6 ? t.colors.caution : t.colors.accent;

  const target = Math.min(ratio, 1) * trackWidth;
  const fill = useSharedValue(0);

  useEffect(() => {
    if (trackWidth === 0) return;
    fill.value = reduce
      ? withTiming(target, { duration: durations.base })
      : withSpring(target, springs.gentle);
  }, [fill, target, trackWidth, reduce]);

  const fillStyle = useAnimatedStyle(() => ({ width: fill.value }));

  const chipStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: clamp(
          fill.value - chipWidth / 2,
          0,
          Math.max(trackWidth - chipWidth, 0),
        ),
      },
    ],
  }));

  const over = ratio > 1;

  // The chip rides the fill head as an opaque knob, vertically centred on the
  // 8pt bar. A solid surface (not the translucent badge tint) keeps the colour
  // fill from bleeding through the text, and the shadow lifts it clear of the
  // rail so it reads as sitting *on* the bar, not clipped by the card.
  const trackHeight = 8;
  const chipHeight = 22;
  const chipTop = -(chipHeight - trackHeight) / 2;

  return (
    <View style={[{ paddingVertical: chipTop < -8 ? -chipTop : 8 }, style]}>
      <View
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        style={{
          height: trackHeight,
          borderRadius: t.radii.full,
          backgroundColor: t.colors.surfaceSunken,
          borderWidth: 1,
          borderColor: t.colors.hairline,
        }}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              borderRadius: t.radii.full,
              backgroundColor: hue,
            },
            fillStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              position: "absolute",
              top: chipTop,
              left: 0,
              zIndex: 2,
            },
            chipStyle,
          ]}
          onLayout={(e) => setChipWidth(e.nativeEvent.layout.width)}
        >
          <Badge
            label={over ? `${percent} % OVER` : `${percent} %`}
            tone={over ? "negative" : ratio > 0.6 ? "caution" : "accent"}
            dot
            style={{
              height: chipHeight,
              backgroundColor: t.colors.surfaceRaised,
              borderColor: `${hue}88`,
              ...(t.scheme === "light"
                ? {
                    shadowColor: t.colors.shadow,
                    shadowOpacity: 0.18,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 3,
                  }
                : null),
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
}
