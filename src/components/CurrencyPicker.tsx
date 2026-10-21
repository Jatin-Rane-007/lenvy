import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { Dip } from "@components/animated";
import { PlatformIcon } from "@components/icons";
import { Box, Text } from "@components/primitives";
import { ALL_CURRENCIES, type Currency } from "@constants/currencies";
import { useTheme } from "@/theme";

export type CurrencyPickerProps = {
  visible: boolean;
  selectedCode: string;
  onSelect: (currency: Currency) => void;
  onClose: () => void;
};

/**
 * Currency selection bottom sheet. L3 floating surface with an L4 scrim,
 * an `xl` top-only radius, and a search field for the longer tail of codes.
 * All colour flows through the semantic theme — no raw hex, per DESIGN.md.
 */
export function CurrencyPicker({
  visible,
  selectedCode,
  onSelect,
  onClose,
}: CurrencyPickerProps) {
  const t = useTheme();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.includes(q),
    );
  }, [query]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close currency picker"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: t.colors.overlay }}
      >
        {/* Eat taps inside the sheet so they don't dismiss it. */}
        <Box
          surface="surfaceRaised"
          level="L3"
          pad={t.spacing[5]}
          onStartShouldSetResponder={() => true}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            gap: t.spacing[4],
            borderTopLeftRadius: t.radii.xl,
            borderTopRightRadius: t.radii.xl,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            maxHeight: "82%",
          }}
        >
          {/* Grabber */}
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: t.radii.full,
              backgroundColor: t.colors.hairlineStrong,
            }}
          />

          <View className="flex-row items-center justify-between">
            <Text variant="heading" tone="ink">
              Currency
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text variant="bodyStrong" tone="accent">
                Done
              </Text>
            </Pressable>
          </View>

          {/* Search */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: t.spacing[2],
              backgroundColor: t.colors.surfaceSunken,
              borderWidth: 1,
              borderColor: t.colors.hairline,
              borderRadius: t.radii.md,
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
              placeholder="Search currencies"
              placeholderTextColor={t.colors.inkSubtle}
              autoCapitalize="none"
              returnKeyType="search"
              style={{
                flex: 1,
                paddingVertical: t.spacing[3],
                color: t.colors.ink,
                fontSize: 15,
                lineHeight: 22,
              }}
            />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: t.spacing[1], paddingBottom: t.spacing[4] }}
          >
            {results.map((c) => {
              const selected = c.code === selectedCode;
              return (
                <Dip key={c.code} onPress={() => onSelect(c)}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: t.spacing[4],
                      paddingHorizontal: t.spacing[3],
                      paddingVertical: t.spacing[3],
                      borderRadius: t.radii.md,
                      backgroundColor: selected ? t.colors.accentSoft : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: selected ? t.colors.accent : t.colors.hairline,
                        backgroundColor: selected
                          ? t.colors.accent
                          : t.colors.surfaceSunken,
                      }}
                    >
                      <Text
                        variant="subhead"
                        style={{ color: selected ? t.colors.inkInverse : t.colors.ink }}
                      >
                        {c.symbol}
                      </Text>
                    </View>

                    <View style={{ flex: 1, gap: 1 }}>
                      <Text variant="bodyStrong" tone="ink">
                        {c.code}
                      </Text>
                      <Text variant="caption" tone="muted">
                        {c.name}
                      </Text>
                    </View>

                    {selected ? (
                      <PlatformIcon
                        ios="checkmark"
                        lucide="Check"
                        size={18}
                        color={t.colors.accent}
                      />
                    ) : null}
                  </View>
                </Dip>
              );
            })}

            {results.length === 0 ? (
              <Text variant="body" tone="subtle" align="center" style={{ padding: t.spacing[6] }}>
                No currencies match “{query}”.
              </Text>
            ) : null}
          </ScrollView>
        </Box>
      </Pressable>
    </Modal>
  );
}
