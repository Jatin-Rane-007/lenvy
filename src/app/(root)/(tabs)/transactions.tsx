import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

import { useTheme } from "@/theme";
import { Enter, Float } from "@components/animated";
import { PlatformIcon } from "@components/icons";
import { Box, Chip, Screen, Text } from "@components/primitives";

type Filter = "all" | "income" | "expense";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
];

const week = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Transactions — search, filters and the daily income-vs-expense chart
 * frame per PRODUCT.md. The ledger lands with the data layer; the chart
 * shows an honest zero week until then.
 */
export default function TransactionsScreen() {
  const t = useTheme();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

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
            Transactions
          </Text>
        </Enter>

        {/* Search — tight md radius input per DESIGN.md radius asymmetry */}
        <Enter delay={80} style={{ paddingTop: t.spacing[4] }}>
          <Box
            surface="surfaceRaised"
            level="L1"
            radius="md"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: t.spacing[2],
              paddingHorizontal: t.spacing[4],
            }}
          >
            <PlatformIcon
              ios="magnifyingglass"
              lucide="Search"
              size={16}
              color={t.colors.inkSubtle}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search merchant, note, amount…"
              placeholderTextColor={t.colors.inkSubtle}
              style={[
                t.typography.body,
                {
                  color: t.colors.ink,
                  flex: 1,
                  paddingVertical: t.spacing[3],
                  outlineStyle: "none",
                } as object,
              ]}
            />
          </Box>
        </Enter>

        {/* Filter row — tight 8 pt gaps per DESIGN.md "Spacing" */}
        <Enter
          delay={160}
          style={{
            paddingTop: t.spacing[4],
            flexDirection: "row",
            gap: t.spacing[2],
          }}
        >
          {filters.map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              selected={filter === key}
              onPress={() => setFilter(key)}
            />
          ))}
        </Enter>

        {/* Daily income-vs-expense frame — zero week, honest bars */}
        <Enter delay={240} style={{ paddingTop: t.spacing[7] }}>
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
              <Text variant="subhead" tone="ink">
                This week
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: t.spacing[2],
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: t.colors.positive,
                  }}
                />
                <Text variant="caption" tone="muted">
                  in
                </Text>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: t.colors.negative,
                    marginLeft: t.spacing[2],
                  }}
                />
                <Text variant="caption" tone="muted">
                  out
                </Text>
              </View>
            </Box>
            <Box
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: t.spacing[2],
                height: 72,
              }}
            >
              {week.map((day, i) => (
                <Box
                  key={`${day}${i}`}
                  style={{ flex: 1, alignItems: "center", gap: t.spacing[1] }}
                >
                  <View
                    style={{
                      width: "70%",
                      height: 4,
                      borderRadius: t.radii.xs,
                      backgroundColor: t.colors.hairlineStrong,
                    }}
                  />
                  <Text variant="micro" tone="subtle">
                    {day}
                  </Text>
                </Box>
              ))}
            </Box>
            <Text variant="caption" tone="subtle">
              Nothing captured yet — days fill in as transactions land.
            </Text>
          </Box>
        </Enter>

        {/* Empty ledger state */}
        <Enter delay={320} style={{ paddingTop: t.spacing[7] }}>
          <Box
            surface="surface"
            level="L1"
            radius="lg"
            pad={t.spacing[6]}
            gap={t.spacing[3]}
            style={{ alignItems: "center" }}
          >
            <Float>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: t.colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlatformIcon
                  ios="tray"
                  lucide="Inbox"
                  size={28}
                  color={t.colors.accent}
                />
              </View>
            </Float>
            <Text variant="subhead" tone="ink">
              Nothing here yet
            </Text>
            <Text variant="body" tone="muted" align="center">
              Captured transactions — manual, receipt, or voice — list here,
              newest first.
            </Text>
          </Box>
        </Enter>
      </ScrollView>
    </Screen>
  );
}
