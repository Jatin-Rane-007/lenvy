import { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { durations, springs, standardEasing, useTheme } from "@/theme";
import { useReduceMotion } from "@components/animated";
import { PlatformIcon, type LucideIconName } from "@components/icons";

/**
 * The Lenvy tab bar (Overlays tier in DESIGN.md): five slots, an active
 * indicator pill that morphs between tabs on spring.gentle, and the Add tab
 * as a floating accent button — "tools float above" the data surface.
 *
 * Layout note: every slot is absolutely positioned with an explicit pixel
 * `left`/`width` derived from the window width. The bar itself is an absolute,
 * full-width child of the navigator's column, and in that configuration Yoga
 * resolves the bar's width *after* its in-flow children measure — so `flex: 1`
 * and percentage widths on the slots collapse to content size and bunch at the
 * leading edge on Android. Absolute slots with concrete pixel geometry sidestep
 * that ordering entirely and are the reason the bar now spans edge to edge.
 */
type TabRoute = { key: string; name: string };

export type LenvyTabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigateToTab: (routeKey: string) => void;
  descriptors: Record<string, { options: { title?: unknown } }>;
};

const icons: Record<
  string,
  { ios: (focused: boolean) => string; lucide: LucideIconName }
> = {
  index: { ios: (f) => (f ? "house.fill" : "house"), lucide: "House" },
  transactions: {
    ios: (f) => (f ? "list.bullet.rectangle.fill" : "list.bullet.rectangle"),
    lucide: "ReceiptText",
  },
  add: { ios: () => "plus", lucide: "Plus" },
  assistant: { ios: () => "sparkles", lucide: "Sparkles" },
  profile: {
    ios: (f) => (f ? "person.crop.circle.fill" : "person.crop.circle"),
    lucide: "User",
  },
};

const PILL_W = 68;
const PILL_H = 34;
const PILL_TOP = 10;
const FAB_SIZE = 52;
const FAB_LIFT = 22;

export function LenvyTabBar({
  state,
  navigateToTab,
  descriptors,
}: LenvyTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const { width: windowWidth } = useWindowDimensions();

  const routes = state.routes;
  const activeIndex = state.index;
  const activeName = routes[activeIndex]?.name;

  // One slot per route, equal pixel width across the whole window.
  const slotW = windowWidth / routes.length;
  const barHeight =
    66 + Math.max(insets.bottom, Platform.OS === "web" ? 12 : 8);

  const pillX = useSharedValue(0);
  const pillVisible = useSharedValue(0);
  const fabScale = useSharedValue(reduce ? 1 : 0.4);

  // Morph the pill to the active slot's centre (spring.gentle per DESIGN.md).
  // The Add tab hides it — its floating FAB is the indicator when focused.
  useEffect(() => {
    if (windowWidth === 0) return;
    if (activeName === "add") {
      pillVisible.value = withTiming(0, {
        duration: durations.fast,
        easing: standardEasing,
      });
      return;
    }
    const target = activeIndex * slotW + slotW / 2 - PILL_W / 2;
    if (pillVisible.value === 0) {
      // Re-anchor without sliding across the whole bar.
      pillX.value = target;
    } else {
      pillX.value = reduce
        ? withTiming(target, { duration: durations.fast })
        : withSpring(target, springs.gentle);
    }
    pillVisible.value = withTiming(1, {
      duration: durations.base,
      easing: standardEasing,
    });
  }, [activeIndex, activeName, slotW, windowWidth, reduce, pillX, pillVisible]);

  // FAB pop-in on spring.bouncy — the one playful moment on the bar.
  useEffect(() => {
    if (!reduce) fabScale.value = withSpring(1, springs.bouncy);
  }, [fabScale, reduce]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    opacity: pillVisible.value,
  }));

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <View
      style={[
        styles.bar,
        {
          height: barHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.hairline,
        },
        t.elevation("L2").style as object,
      ]}
    >
      {/* Morphing active indicator — sits behind the icon slots */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pill,
          {
            width: PILL_W,
            height: PILL_H,
            borderRadius: PILL_W / 2,
            backgroundColor: t.colors.accentSoft,
          },
          pillStyle,
        ]}
      />

      {routes.map((route, i) => {
        const focused = i === activeIndex;
        const rawTitle = descriptors[route.key]?.options?.title;
        const title = typeof rawTitle === "string" ? rawTitle : route.name;
        const icon = icons[route.name] ?? icons.index;
        const slotBox = { left: i * slotW, width: slotW, height: barHeight };

        if (route.name === "add") {
          // Floating accent FAB for the capture hub. The lift is done with
          // layout (`top`), not transform, so Android's elevation shadow
          // follows the circle instead of smearing at its old position.
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={title}
              onPress={() => navigateToTab(route.key)}
              style={[styles.slot, slotBox]}
            >
              {({ pressed }) => (
                <Animated.View
                  style={[styles.slotContent, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <Animated.View
                    style={[
                      styles.fab,
                      {
                        width: FAB_SIZE,
                        height: FAB_SIZE,
                        borderRadius: FAB_SIZE / 2,
                        backgroundColor: t.colors.accent,
                        top: -FAB_LIFT,
                      },
                      t.elevation("L3").style as object,
                      fabStyle,
                    ]}
                  >
                    <PlatformIcon
                      ios={icon.ios(focused)}
                      lucide={icon.lucide}
                      size={24}
                      color={t.colors.inkInverse}
                      strokeWidth={2.25}
                    />
                  </Animated.View>
                  <View style={styles.fabLabelSpacer} />
                </Animated.View>
              )}
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => navigateToTab(route.key)}
            style={[styles.slot, slotBox]}
          >
            {({ pressed }) => (
              <View
                style={[styles.slotContent, { opacity: pressed ? 0.6 : 1 }]}
              >
                <View style={styles.iconWrap}>
                  <PlatformIcon
                    ios={icon.ios(focused)}
                    lucide={icon.lucide}
                    size={22}
                    color={focused ? t.colors.accent : t.colors.inkSubtle}
                    strokeWidth={focused ? 2.25 : 1.75}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { color: focused ? t.colors.accent : t.colors.inkSubtle },
                  ]}
                >
                  {title}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    // The FAB lifts above the bar's top edge — don't clip it on Android.
    overflow: "visible",
  },
  pill: {
    position: "absolute",
    top: PILL_TOP,
    left: 0,
  },
  slot: {
    position: "absolute",
    top: 0,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  slotContent: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  iconWrap: {
    height: PILL_H,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  fab: {
    alignItems: "center",
    justifyContent: "center",
  },
  fabLabelSpacer: {
    height: 16,
  },
});
