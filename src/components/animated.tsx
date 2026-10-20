import { useEffect, useState, type PropsWithChildren } from "react";
import { AccessibilityInfo, Pressable, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { durations, standardEasing } from "@/theme";

/** True when the OS asks for reduced motion. Springs collapse to fades. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduce(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return reduce;
}

/**
 * Entrance wrapper: fades up 24 pt on the standard easing. Stagger siblings
 * by bumping `delay` in ~80 ms steps.
 */
export function Enter({
  delay = 0,
  children,
  style,
}: PropsWithChildren<{ delay?: number; style?: ViewStyle }>) {
  const p = useSharedValue(0);
  const reduce = useReduceMotion();

  useEffect(() => {
    p.value = reduce
      ? withDelay(delay, withTiming(1, { duration: durations.base }))
      : withDelay(
          delay,
          withTiming(1, { duration: durations.slow, easing: standardEasing }),
        );
  }, [p, delay, reduce]);

  const animated = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 24 }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/**
 * Pressable with the DESIGN.md press dip — 0.94 while held. Uses Pressable's
 * `pressed` callback (React-Compiler-safe, same contract as Button) instead
 * of mutating a shared value from an event handler.
 */
export function Dip({
  onPress,
  children,
  style,
}: PropsWithChildren<{ onPress?: () => void; style?: ViewStyle }>) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        style,
        pressed && { transform: [{ scale: 0.94 }], opacity: 0.92 },
      ]}
    >
      {children}
    </Pressable>
  );
}

/**
 * Slow vertical float (2.6 s loop) for empty-state glyphs — the "alive"
 * signal without breaking the restrained house style.
 */
export function Float({
  children,
  distance = 6,
}: PropsWithChildren<{ distance?: number }>) {
  const y = useSharedValue(0);
  const reduce = useReduceMotion();

  useEffect(() => {
    if (reduce) {
      y.value = 0;
      return;
    }
    y.value = withRepeat(
      withSequence(
        withTiming(-distance, {
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [y, distance, reduce]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return <Animated.View style={animated}>{children}</Animated.View>;
}
