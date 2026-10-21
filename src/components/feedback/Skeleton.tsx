import { useEffect } from "react";
import type { ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useReduceMotion } from "@components/animated";
import { useTheme } from "@/theme";

export type SkeletonProps = {
  height?: number;
  /** Leave unset for a row that stretches with its container. */
  width?: number;
  /** Corner radius token value; defaults to the tight `sm`. */
  radius?: number;
  style?: ViewStyle;
};

/**
 * Skeleton (Feedback tier). A single breathing hue on the sunken surface —
 * no shimmer gradient, no fake numbers. It says "this is not your data yet",
 * which is the honest state while a query is in flight.
 */
export function Skeleton({
  height = 16,
  width,
  radius,
  style,
}: SkeletonProps) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const pulse = useSharedValue(reduce ? 0.7 : 1);

  useEffect(() => {
    if (reduce) {
      pulse.value = 0.7;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [pulse, reduce]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessible
      accessibilityLabel="Loading"
      style={[
        {
          width: width ?? "100%",
          height,
          borderRadius: radius ?? t.radii.sm,
          backgroundColor: t.colors.surfaceSunken,
        },
        animated,
        style,
      ]}
    />
  );
}
