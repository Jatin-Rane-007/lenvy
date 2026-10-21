import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";
import type { TransactionType } from "@/types/transaction";
import { Enter, Float, useReduceMotion } from "@components/animated";
import { getCategoryVisual } from "@components/data/categoryVisuals";
import { DatePickerField } from "@components/form/DatePickerField";
import { SegmentedControl } from "@components/form/SegmentedControl";
import { PlatformIcon } from "@components/icons";
import { Box, Chip, Screen, Text } from "@components/primitives";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type CategoryKey,
} from "@constants/categories";
import { currencySymbol } from "@constants/currencies";
import { useCreateTransaction } from "@hooks/mutations/useTransactionMutaion";
import { useAccountsQuery } from "@hooks/queries/useAccountsQuery";
import { parseAmount, startOfDay } from "@lib/utils";
import { useUserStore } from "@store/userStore";

const TYPE_OPTIONS = [
  { key: "EXPENSE" as const, label: "Expense" },
  { key: "INCOME" as const, label: "Income" },
];

function yesterday(): Date {
  const d = startOfDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
}

export default function AddTransactionScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const { user } = useUser();
  const currency = useUserStore((s) => s.currency);

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useAccountsQuery();
  const { mutateAsync: createTransaction, isPending: saving } =
    useCreateTransaction();

  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryKey>("food");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [description, setDescription] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const symbol = currencySymbol(currency.toUpperCase());
  const gutter = t.spacing[5];
  // Derived default — falls back to the first (default) account until the
  // user picks one, so no state synchronization effect is needed.
  const activeAccountId = accountId ?? accounts[0]?.id ?? null;

  const handleType = (next: TransactionType) => {
    setType(next);
    setCategory(
      (next === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].key,
    );
  };

  const save = async () => {
    if (!user || saving) return;

    setFormError(null);
    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) {
      setAmountError("Enter an amount greater than zero.");
      return;
    }
    if (!activeAccountId) {
      setFormError("Pick an account first.");
      return;
    }

    const { error } = await createTransaction({
      user_id: user.id,
      account_id: activeAccountId,
      type,
      amount: parsedAmount,
      category,
      description: description.trim() || null,
      date: date.toISOString(),
      input_method: "MANUAL",
    });

    if (error) {
      setFormError("Something went wrong. Please try again.");
      return;
    }

    // Reset for the next entry before leaving the tab.
    setAmount("");
    setDescription("");
    setDate(startOfDay(new Date()));
    handleType("EXPENSE");

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/transactions");
    }
  };

  const todaySelected = startOfDay(date).getTime() === startOfDay().getTime();
  const yesterdaySelected =
    startOfDay(date).getTime() === yesterday().getTime();

  let body: ReactNode;
  if (loadingAccounts) {
    body = (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color={t.colors.accent} />
      </View>
    );
  } else if (accountsError) {
    body = (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: t.spacing[3],
        }}
      >
        <PlatformIcon
          ios="arrow.triangle.2.circlepath"
          lucide="RefreshCw"
          size={30}
          color={t.colors.inkSubtle}
        />
        <Text variant="body" tone="muted" align="center">
          Couldn&apos;t load your accounts.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refetchAccounts()}
          style={{
            borderRadius: t.radii.md,
            borderWidth: 1,
            borderColor: t.colors.hairlineStrong,
            paddingHorizontal: t.spacing[4],
            paddingVertical: t.spacing[2],
          }}
        >
          <Text variant="bodyStrong" tone="accent">
            Try again
          </Text>
        </Pressable>
      </View>
    );
  } else if (accounts.length === 0) {
    body = (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: gutter,
          gap: t.spacing[2],
        }}
      >
        <Float>
          <PlatformIcon
            ios="tray"
            lucide="Inbox"
            size={44}
            color={t.colors.inkSubtle}
          />
        </Float>
        <Text variant="subhead" tone="ink" align="center">
          No accounts yet
        </Text>
        <Text variant="caption" tone="muted" align="center">
          Create an account before adding a transaction.
        </Text>
      </View>
    );
  } else {
    body = (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: gutter,
          paddingTop: t.spacing[2],
          // Clear the floating tab bar plus a breath of space.
          paddingBottom: 66 + t.spacing[7] + Math.max(insets.bottom, 8),
          gap: t.spacing[6],
        }}
      >
        {/* ── Title ── */}
        <Enter>
          <Text variant="heading" tone="ink">
            New transaction
          </Text>
        </Enter>

        {/* ── Amount: the loudest field on the screen ── */}
        <Enter delay={reduce ? 0 : 80} style={{ gap: t.spacing[2] }}>
          <Text variant="bodyStrong" tone="ink">
            Amount
          </Text>
          <Box surface="surface" level="L1" radius="md" padX={4}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: t.spacing[2],
                paddingVertical: t.spacing[2],
              }}
            >
              <Text variant="numericL" tone="subtle">
                {symbol}
              </Text>
              <TextInput
                value={amount}
                onChangeText={(v) => {
                  setAmount(v.replace(/[^0-9.,]/g, ""));
                  setAmountError(null);
                  setFormError(null);
                }}
                placeholder="0.00"
                placeholderTextColor={t.colors.inkSubtle}
                keyboardType="numeric"
                returnKeyType="done"
                style={[
                  t.typography.numericL,
                  {
                    flex: 1,
                    color: t.colors.ink,
                    paddingVertical: t.spacing[2],
                  },
                ]}
              />
            </View>
          </Box>
          {amountError ? (
            <Text variant="caption" tone="negative">
              {amountError}
            </Text>
          ) : null}
        </Enter>

        {/* ── Type ── */}
        <Enter delay={reduce ? 0 : 160}>
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={handleType}
          />
        </Enter>

        {/* ── Category: chips with the swatch glow from DESIGN.md ── */}
        <Enter delay={reduce ? 0 : 240} style={{ gap: t.spacing[2] }}>
          <Text variant="bodyStrong" tone="ink">
            Category
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: t.spacing[2],
            }}
          >
            {categories.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                variant="category"
                swatch={t.categories[getCategoryVisual(c.key).swatch]}
                selected={category === c.key}
                onPress={() => setCategory(c.key)}
                style={{ minHeight: 40 }}
              />
            ))}
          </View>
        </Enter>

        {/* ── Account ── */}
        <Enter delay={reduce ? 0 : 320} style={{ gap: t.spacing[2] }}>
          <Text variant="bodyStrong" tone="ink">
            Account
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: t.spacing[2],
            }}
          >
            {accounts.map((a) => (
              <Chip
                key={a.id}
                label={a.name}
                selected={activeAccountId === a.id}
                onPress={() => {
                  setAccountId(a.id);
                  setFormError(null);
                }}
                style={{ minHeight: 40 }}
              />
            ))}
          </View>
        </Enter>

        {/* ── Date: quick picks first, full calendar behind them ── */}
        <Enter delay={reduce ? 0 : 400} style={{ gap: t.spacing[2] }}>
          <Text variant="bodyStrong" tone="ink">
            Date
          </Text>
          <View style={{ flexDirection: "row", gap: t.spacing[2] }}>
            <Chip
              label="Today"
              selected={todaySelected}
              onPress={() => setDate(startOfDay(new Date()))}
              style={{ minHeight: 40 }}
            />
            <Chip
              label="Yesterday"
              selected={yesterdaySelected}
              onPress={() => setDate(yesterday())}
              style={{ minHeight: 40 }}
            />
          </View>
          <DatePickerField value={date} onChange={setDate} />
        </Enter>

        {/* ── Description ── */}
        <Enter delay={reduce ? 0 : 480} style={{ gap: t.spacing[2] }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: t.spacing[2],
            }}
          >
            <Text variant="bodyStrong" tone="ink">
              Description
            </Text>
            <Text variant="caption" tone="subtle">
              Optional
            </Text>
          </View>
          <Box surface="surface" level="L1" radius="md" padX={4}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note"
              placeholderTextColor={t.colors.inkSubtle}
              returnKeyType="done"
              style={[
                t.typography.body,
                {
                  color: t.colors.ink,
                  paddingVertical: t.spacing[3],
                  minHeight: 48,
                },
              ]}
            />
          </Box>
        </Enter>

        {/* ── Save: thumb-zone CTA, static style (React-Compiler-safe) ── */}
        <Enter delay={reduce ? 0 : 560} style={{ gap: t.spacing[3] }}>
          {formError ? (
            <Text variant="caption" tone="negative">
              {formError}
            </Text>
          ) : null}
          <SaveButton onPress={() => void save()} loading={saving} />
        </Enter>
      </ScrollView>
    );
  }

  return (
    <Screen edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {body}
      </KeyboardAvoidingView>
    </Screen>
  );
}

/**
 * Filled accent CTA in the static-Pressable idiom established by
 * auth-submit.tsx: the Button primitive's render-prop style is dropped by
 * the experimental React Compiler on native, and a filled accent surface
 * takes inkInverse for contrast (accentInk is darker than accent).
 */
function SaveButton({
  onPress,
  loading,
}: {
  onPress: () => void;
  loading: boolean;
}) {
  const t = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
      onPress={loading ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: t.spacing[2],
        minHeight: 56,
        paddingHorizontal: t.spacing[6],
        borderRadius: t.radii.lg,
        backgroundColor: t.colors.accent,
        opacity: loading ? 0.6 : pressed ? 0.9 : 1,
        transform: [{ scale: pressed && !loading ? 0.985 : 1 }],
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={t.colors.inkInverse} />
      ) : (
        <Text variant="subhead" style={{ color: t.colors.inkInverse }}>
          Save transaction
        </Text>
      )}
    </Pressable>
  );
}
