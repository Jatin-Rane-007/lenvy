import { useUser } from "@clerk/expo";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { Dip } from "@components/animated";
import { PlatformIcon } from "@components/icons";
import { Box, Button, Text } from "@components/primitives";
import { currencySymbol } from "@constants/currencies";
import { useSupabase } from "@/hooks/useSupabase";
import { queryKeys } from "@lib/query/keys";
import { upsertBudget } from "@lib/services/budgets";
import { formatPrice, parseAmount } from "@lib/utils";
import { useTheme } from "@/theme";
import type { Budget } from "@/types/budget";

export type BudgetSheetProps = {
  visible: boolean;
  /** The stored budget, or null when the user has never set one. */
  budget: Budget | null;
  currency?: string;
  onClose: () => void;
  onSaved?: (budget: Budget) => void;
};

/**
 * BudgetSheet (Overlays tier). One figure, one field — PRODUCT.md's monthly
 * budget is deliberately a single number, so the sheet has no category grid
 * or date range to hide behind.
 *
 * The form body is keyed on `visible`, so closing the sheet throws its state
 * away and the next open re-seeds from the stored budget — no effect needed
 * to reset it.
 */
export function BudgetSheet({
  visible,
  budget,
  currency = "INR",
  onClose,
  onSaved,
}: BudgetSheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

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
        accessibilityLabel="Close budget sheet"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: t.colors.overlay }}
      >
        {/* adjustResize never fires inside a Modal window, so the avoiding view
            has to do the lifting itself: `padding` on iOS, `height` on Android,
            with the sheet pinned to the bottom via flex-end (an absolutely
            positioned child ignores the added padding in Yoga). */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <Box
            surface="surfaceRaised"
            level="L3"
            pad={t.spacing[5]}
            gap={t.spacing[4]}
            onStartShouldSetResponder={() => true}
            style={{
              paddingBottom: t.spacing[5] + Math.max(insets.bottom, 12),
              borderTopLeftRadius: t.radii.xl,
              borderTopRightRadius: t.radii.xl,
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

            <Box gap={t.spacing[1]}>
              <Text variant="heading" tone="ink">
                Monthly budget
              </Text>
              <Text variant="caption" tone="muted">
                One figure, tracked against what you spend this month.
              </Text>
            </Box>

            {user ? (
              <BudgetForm
                key={visible ? "open" : "closed"}
                userId={user.id}
                budget={budget}
                currency={currency}
                onClose={onClose}
                onSaved={onSaved}
              />
            ) : null}
          </Box>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

type BudgetFormProps = {
  userId: string;
  budget: Budget | null;
  currency: string;
  onClose: () => void;
  onSaved?: (budget: Budget) => void;
};

function BudgetForm({
  userId,
  budget,
  currency,
  onClose,
  onSaved,
}: BudgetFormProps) {
  const t = useTheme();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseAmount(amount);

  const save = async () => {
    if (parsed === null) {
      setError("Enter an amount above zero.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await upsertBudget(supabase, userId, parsed);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.budget(userId),
      });
      onSaved?.(saved);
      onClose();
    } catch {
      setError("Could not save. Check your connection and try again.");
      setSaving(false);
    }
  };

  return (
    <>
      {/* Amount field — tight `md` input, glyph leading, tabular digits */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: t.spacing[3],
          backgroundColor: t.colors.surfaceSunken,
          borderWidth: 1,
          borderColor: error ? t.colors.negative : t.colors.hairline,
          borderRadius: t.radii.md,
          paddingHorizontal: t.spacing[4],
        }}
      >
        <Text variant="numericL" tone="subtle">
          {currencySymbol(currency)}
        </Text>
        <TextInput
          value={amount}
          onChangeText={(v) => {
            setAmount(v);
            if (error) setError(null);
          }}
          onSubmitEditing={() => void save()}
          placeholder="0"
          placeholderTextColor={t.colors.inkSubtle}
          keyboardType="decimal-pad"
          returnKeyType="done"
          editable={!saving}
          style={{
            flex: 1,
            paddingVertical: t.spacing[3],
            color: t.colors.ink,
            fontFamily: t.fonts.interSemiBold,
            fontSize: t.typography.numericL.fontSize,
            lineHeight: t.typography.numericL.lineHeight,
          }}
        />
      </View>

      {parsed !== null ? (
        <Text variant="caption" tone="subtle">
          {budget
            ? `Currently ${formatPrice(budget.amount, currency)} — saving replaces it.`
            : `Sets the rail at ${formatPrice(parsed, currency)}.`}
        </Text>
      ) : null}

      {error ? (
        <Text variant="caption" tone="negative">
          {error}
        </Text>
      ) : null}

      <Box gap={t.spacing[2]}>
        <Button
          label={budget ? "Update budget" : "Set budget"}
          loading={saving}
          disabled={parsed === null}
          fullWidth
          onPress={() => void save()}
        />
        <Dip onPress={saving ? undefined : onClose}>
          <Box
            surface="surface"
            level="L1"
            radius="md"
            padY={t.spacing[3]}
            style={{ alignItems: "center" }}
          >
            <Text variant="bodyStrong" tone="muted">
              Cancel
            </Text>
          </Box>
        </Dip>
      </Box>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: t.spacing[1],
        }}
      >
        <PlatformIcon
          ios="gauge.medium"
          lucide="Gauge"
          size={12}
          color={t.colors.inkSubtle}
        />
        <Text variant="caption" tone="subtle">
          The rail turns to clay past 90 %.
        </Text>
      </View>
    </>
  );
}
