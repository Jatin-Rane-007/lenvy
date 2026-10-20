import { router } from "expo-router";
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
import { Dip, Enter, useReduceMotion } from "@components/animated";
import { PlatformIcon, type LucideIconName } from "@components/icons";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Screen,
  Text,
} from "@components/primitives";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Wrapping up the day";
}

/** One quick-action tile: tinted icon circle + label, floats above the canvas. */
function ActionTile({
  icon,
  iosIcon,
  label,
  tint,
  onPress,
}: {
  icon: LucideIconName;
  iosIcon: string;
  label: string;
  tint: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Dip onPress={onPress} style={{ flex: 1 }}>
      <Box
        surface="surface"
        level="L1"
        radius="lg"
        pad={t.spacing[4]}
        gap={t.spacing[2]}
        style={{ alignItems: "center" }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: `${tint}1F`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PlatformIcon ios={iosIcon} lucide={icon} size={22} color={tint} />
        </View>
        <Text variant="caption" tone="muted" align="center">
          {label}
        </Text>
      </Box>
    </Dip>
  );
}

/**
 * Dashboard. Hero balance is the signature moment (Fraunces displayXl on
 * canvas). No data layer yet, so numbers are honest em dashes — but the
 * screen moves: staggered entrances, a pulsing budget rail, live navigation.
 */
export default function HomeScreen() {
  const t = useTheme();
  const reduce = useReduceMotion();

  // Budget rail idle pulse — the track breathes until there's a real fill.
  const pulse = useSharedValue(0.55);
  useEffect(() => {
    if (reduce) {
      pulse.value = 0.8;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, reduce]);
  const railStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Screen edges={["top"]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: t.colors.canvas }}
        contentContainerStyle={{
          padding: t.spacing[5],
          paddingBottom: t.spacing[11],
        }}
      >
        {/* Header — greeting + profile shortcut */}
        <Enter
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box gap={2}>
            <Text variant="caption" tone="muted">
              {greeting()}
            </Text>
            <Text variant="heading" tone="ink">
              Your money
            </Text>
          </Box>
          <Dip
            onPress={() => router.push("/profile")}
            style={{ alignSelf: "flex-start" }}
          >
            <Avatar name="Lenvy user" size="md" />
          </Dip>
        </Enter>

        {/* Hero — 56 pt top pad, one display number per dashboard */}
        <Enter
          delay={80}
          style={{ paddingTop: t.spacing[9], gap: t.spacing[2] }}
        >
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: t.spacing[3],
            }}
          >
            <Text variant="caption" tone="muted">
              Net worth
            </Text>
            <Badge label="Awaiting first account" tone="info" dot />
          </Box>
          <Text variant="displayXl" tone="ink">
            —
          </Text>
          <Text variant="body" tone="muted">
            Add an account and your running total lands here, with a 90-day
            sparkline underneath.
          </Text>
        </Enter>

        {/* Quick actions — the thumb-reach shortcuts */}
        <Enter delay={160} style={{ paddingTop: t.spacing[7] }}>
          <Text
            variant="subhead"
            tone="ink"
            style={{ marginBottom: t.spacing[3] }}
          >
            Quick actions
          </Text>
          <Box style={{ flexDirection: "row", gap: t.spacing[2] }}>
            <ActionTile
              icon="Plus"
              iosIcon="plus.circle"
              label="New transaction"
              tint={t.colors.accent}
              onPress={() => router.push("/add")}
            />
            <ActionTile
              icon="ScanLine"
              iosIcon="viewfinder"
              label="Scan receipt"
              tint={t.colors.info}
              onPress={() => router.push("/add")}
            />
            <ActionTile
              icon="Sparkles"
              iosIcon="sparkles"
              label="Ask assistant"
              tint={t.colors.caution}
              onPress={() => router.push("/assistant")}
            />
          </Box>
        </Enter>

        {/* Budget rail — single bar, state-coloured fill, label rides the head */}
        <Enter delay={240} style={{ paddingTop: t.spacing[7] }}>
          <Text
            variant="subhead"
            tone="ink"
            style={{ marginBottom: t.spacing[3] }}
          >
            Monthly budget
          </Text>
          <Box
            surface="surface"
            level="L1"
            radius="md"
            pad={t.spacing[4]}
            gap={t.spacing[3]}
          >
            <Box
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text variant="numericM" tone="ink">
                — / —
              </Text>
              <Button
                label="Set"
                variant="link"
                size="sm"
                onPress={() => router.push("/profile")}
              />
            </Box>
            <Animated.View
              style={[
                {
                  height: 8,
                  width: "100%",
                  borderRadius: t.radii.full,
                  backgroundColor: t.colors.surfaceSunken,
                  borderWidth: 1,
                  borderColor: t.colors.hairline,
                },
                railStyle,
              ]}
              accessibilityRole="progressbar"
              accessibilityLabel="Monthly budget usage"
            />
            <Text variant="caption" tone="subtle">
              No budget set yet — pick one number and the rail tracks it.
            </Text>
          </Box>
        </Enter>

        {/* This month */}
        <Enter delay={320} style={{ paddingTop: t.spacing[7] }}>
          <Text
            variant="subhead"
            tone="ink"
            style={{ marginBottom: t.spacing[3] }}
          >
            This month
          </Text>
          <Box
            surface="surface"
            level="L1"
            radius="md"
            pad={t.spacing[4]}
            gap={t.spacing[3]}
          >
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: t.spacing[3],
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: `${t.colors.positive}1F`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlatformIcon
                  ios="arrow.down.left"
                  lucide="ArrowDownLeft"
                  size={18}
                  color={t.colors.positive}
                />
              </View>
              <Text variant="body" tone="muted" style={{ flex: 1 }}>
                Income
              </Text>
              <Text variant="numericL" tone="positive">
                —
              </Text>
            </Box>
            <Divider />
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: t.spacing[3],
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: `${t.colors.negative}1F`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlatformIcon
                  ios="arrow.up.right"
                  lucide="ArrowUpRight"
                  size={18}
                  color={t.colors.negative}
                />
              </View>
              <Text variant="body" tone="muted" style={{ flex: 1 }}>
                Expenses
              </Text>
              <Text variant="numericL" tone="negative">
                —
              </Text>
            </Box>
            <Divider />
            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: t.spacing[3],
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: `${t.colors.info}1F`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlatformIcon
                  ios="list.bullet"
                  lucide="Receipt"
                  size={18}
                  color={t.colors.info}
                />
              </View>
              <Text variant="bodyStrong" tone="ink" style={{ flex: 1 }}>
                Transactions
              </Text>
              <Text variant="numericL" tone="ink">
                0
              </Text>
            </Box>
          </Box>
        </Enter>
      </ScrollView>
    </Screen>
  );
}
