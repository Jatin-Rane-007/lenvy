import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import { useTheme } from "@/theme";
import type { ColorTokens } from "@/theme/semantic";
import { Dip, Enter } from "@components/animated";
import { PlatformIcon, type LucideIconName } from "@components/icons";
import { Badge, Box, Screen, Text } from "@components/primitives";

/**
 * Add — the capture hub. Manual entry is the always-available path; receipt
 * scan and voice entry are the AI mechanisms PRODUCT.md commits to ("AI is a
 * capture mechanism, not a mascot"). Rows dip on press per the house motion
 * rule; unshipped flows carry a Soon badge instead of faking behaviour.
 */
export default function AddScreen() {
  const t = useTheme();

  const options: {
    key: string;
    label: string;
    hint: string;
    badge?: string;
    ios: string;
    lucide: LucideIconName;
    tint: keyof ColorTokens;
    onPress: () => void;
  }[] = [
    {
      key: "manual",
      label: "Manual entry",
      hint: "Type amount, account, category — one tap away, always available.",
      ios: "keyboard",
      lucide: "Keyboard",
      tint: "accent",
      onPress: () => router.push("/transactions"),
    },
    {
      key: "receipt",
      label: "Receipt scan",
      hint: "Snap or pick a photo; review every extracted field before it commits.",
      badge: "Soon",
      ios: "viewfinder",
      lucide: "ScanLine",
      tint: "info",
      onPress: () => {},
    },
    {
      key: "voice",
      label: "Voice entry",
      hint: "“I spent 400 on groceries yesterday” — transcribed into a draft.",
      badge: "Soon",
      ios: "mic",
      lucide: "Mic",
      tint: "caution",
      onPress: () => {},
    },
  ];

  return (
    <Screen edges={["top"]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: t.colors.canvas }}
        contentContainerStyle={{
          padding: t.spacing[5],
          paddingBottom: t.spacing[11],
        }}
      >
        <Enter style={{ paddingTop: t.spacing[2] }}>
          <Text variant="heading" tone="ink">
            Add a transaction
          </Text>
        </Enter>

        <Box gap={t.spacing[3]} style={{ paddingTop: t.spacing[4] }}>
          {options.map((opt, i) => (
            <Enter key={opt.key} delay={80 + i * 80}>
              <Dip onPress={opt.onPress}>
                <Box
                  surface="surface"
                  level="L1"
                  radius="md"
                  pad={t.spacing[4]}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: t.spacing[4],
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: `${t.colors[opt.tint]}1F`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PlatformIcon
                      ios={opt.ios}
                      lucide={opt.lucide}
                      size={24}
                      color={t.colors[opt.tint]}
                    />
                  </View>
                  <Box style={{ flex: 1, gap: 2 }}>
                    <Box
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: t.spacing[2],
                      }}
                    >
                      <Text variant="subhead" tone="ink">
                        {opt.label}
                      </Text>
                      {opt.badge ? (
                        <Badge label={opt.badge} tone="muted" />
                      ) : null}
                    </Box>
                    <Text variant="caption" tone="muted">
                      {opt.hint}
                    </Text>
                  </Box>
                  <PlatformIcon
                    ios="chevron.right"
                    lucide="ChevronRight"
                    size={18}
                    color={t.colors.inkSubtle}
                  />
                </Box>
              </Dip>
            </Enter>
          ))}
        </Box>

        <Enter delay={360} style={{ paddingTop: t.spacing[6] }}>
          <Text variant="caption" tone="subtle" align="center">
            Every draft is reviewable before it commits to your ledger.
          </Text>
        </Enter>
      </ScrollView>
    </Screen>
  );
}
