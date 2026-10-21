import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Enter, Float, useReduceMotion } from "@components/animated";
import { getCategoryLabel } from "@components/data/categoryVisuals";
import { TransactionRow } from "@components/data/TransactionRow";
import { Skeleton } from "@components/feedback/Skeleton";
import { SwipeDeleteRow } from "@components/data/SwipeDeleteRow";
import { PlatformIcon } from "@components/icons";
import { Box, Button, Chip, IconButton, Screen, Text } from "@components/primitives";
import { useDeleteTransaction } from "@hooks/mutations/useTransactionMutaion";
import { useAccountsQuery } from "@hooks/queries/useAccountsQuery";
import { useTransactionsQuery } from "@hooks/queries/useTransactionsQuery";
import { exportTransactionsToCsv } from "@lib/utils/exportTransaction";
import {
  formatPriceShort,
  startOfDay,
} from "@lib/utils";
import { useUserStore } from "@store/userStore";
import { useTheme } from "@/theme";
import type { Transaction, TransactionType } from "@/types/transaction";

const FILTERS = ["All", "Income", "Expense"] as const;

/** Ticks shown on the cashflow axis at most — denser labels stop reading. */
const MAX_AXIS_LABELS = 6;

function dayTime(value: string | Date) {
  return startOfDay(value).getTime();
}

/** Every calendar day from the 1st of this month through today, inclusive. */
function thisMonthDays(): Date[] {
  const today = startOfDay();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const days: Date[] = [];
  for (let d = first; d <= today; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    days.push(d);
  }
  return days;
}

export default function TransactionsScreen() {
  const t = useTheme();
  const router = useRouter();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTERS)[number]>("All");
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const currency = useUserStore((s) => s.currency);

  const typeFilter: TransactionType | null =
    activeFilter === "Income"
      ? "INCOME"
      : activeFilter === "Expense"
        ? "EXPENSE"
        : null;

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionsQuery({ type: typeFilter, accountId: activeAccountId });
  const { data: accounts = [], refetch: refetchAccounts } = useAccountsQuery();
  const removeTransaction = useDeleteTransaction();

  const loading = transactionsLoading;
  const refreshing = transactionsRefetching;
  const error = transactionsError;

  const loadData = () => {
    void refetchTransactions();
    void refetchAccounts();
  };

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(q) ||
        getCategoryLabel(tx.category).toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { count } = await exportTransactionsToCsv(transactions);
      if (count === 0) {
        Alert.alert(
          "Nothing to export",
          "No transactions in the export window.",
        );
      }
    } catch {
      Alert.alert("Error", "Couldn't export transactions.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      "Delete transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeTransaction.mutate(tx, {
              onError: () => {
                Alert.alert("Error", "Couldn't delete this transaction.");
              },
            });
          },
        },
      ],
    );
  };

  const gutter = t.spacing[5];

  return (
    <Screen edges={["top"]}>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          // Swipe-left reveals the trash lane (PRODUCT.md parity: holding
          // the row still triggers the same delete confirmation).
          <SwipeDeleteRow
            onDelete={() => handleDelete(item)}
            onLongPressDelete={() => handleDelete(item)}
            accessibilityLabel={`${item.description || getCategoryLabel(item.category)}`}
          >
            <TransactionRow tx={item} currency={currency} />
          </SwipeDeleteRow>
        )}
        contentContainerStyle={{
          paddingHorizontal: gutter,
          paddingTop: t.spacing[2],
          // Clear the floating tab bar (66 pt) plus a breath of space,
          // over the bottom inset — same contract as the home ledger.
          paddingBottom: 66 + t.spacing[7] + Math.max(insets.bottom, 8),
          gap: t.spacing[2],
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: t.spacing[4] }}>
            {/* ── Title + export ───────────────────────────────────── */}
            <Enter
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text variant="heading" tone="ink">
                Transactions
              </Text>
              <IconButton
                variant="secondary"
                accessibilityLabel="Export transactions to CSV"
                disabled={exporting}
                onPress={() => void handleExport()}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={t.colors.ink} />
                ) : (
                  <PlatformIcon
                    ios="arrow.down.to.line"
                    lucide="Download"
                    size={18}
                    color={t.colors.ink}
                  />
                )}
              </IconButton>
            </Enter>

            {/* ── Search ───────────────────────────────────────────── */}
            <Enter delay={reduce ? 40 : 80}>
              <Box
                surface="surface"
                level="L1"
                radius="md"
                padX={t.spacing[4]}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: t.spacing[2],
                  minHeight: 44,
                }}
              >
                <PlatformIcon
                  ios="magnifyingglass"
                  lucide="Search"
                  size={16}
                  color={t.colors.inkSubtle}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by name or category"
                  placeholderTextColor={t.colors.inkSubtle}
                  style={[
                    t.typography.body as object,
                    { flex: 1, color: t.colors.ink, paddingVertical: t.spacing[2] },
                  ]}
                />
                {search.length > 0 ? (
                  <Pressable
                    onPress={() => setSearch("")}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <PlatformIcon
                      ios="xmark"
                      lucide="X"
                      size={15}
                      color={t.colors.inkSubtle}
                    />
                  </Pressable>
                ) : null}
              </Box>
            </Enter>

            {/* ── Type filter ──────────────────────────────────────── */}
            <Enter delay={reduce ? 80 : 160}>
              <View style={{ flexDirection: "row", gap: t.spacing[2] }}>
                {FILTERS.map((filter) => (
                  <Chip
                    key={filter}
                    label={filter}
                    selected={activeFilter === filter}
                    onPress={() => setActiveFilter(filter)}
                  />
                ))}
              </View>
            </Enter>

            {/* ── Account filter ───────────────────────────────────── */}
            {accounts.length > 1 ? (
              <Enter delay={reduce ? 120 : 240}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: t.spacing[2] }}
                >
                  <Chip
                    label="All accounts"
                    selected={activeAccountId === null}
                    onPress={() => setActiveAccountId(null)}
                  />
                  {accounts.map((account) => (
                    <Chip
                      key={account.id}
                      label={account.name}
                      selected={activeAccountId === account.id}
                      onPress={() => setActiveAccountId(account.id)}
                    />
                  ))}
                </ScrollView>
              </Enter>
            ) : null}

            {/* ── States that replace the list body ────────────────── */}
            {error ? (
              <Box
                surface="surface"
                level="L1"
                radius="lg"
                pad={t.spacing[6]}
                gap={t.spacing[3]}
                style={{ alignItems: "center" }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: `${t.colors.negative}1F`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PlatformIcon
                    ios="arrow.clockwise"
                    lucide="RefreshCw"
                    size={24}
                    color={t.colors.negative}
                  />
                </View>
                <Text variant="body" tone="muted" align="center">
                  Couldn&apos;t load transactions. Check your connection and
                  try again.
                </Text>
                <Button
                  label="Try again"
                  variant="secondary"
                  onPress={loadData}
                />
              </Box>
            ) : loading ? (
              <View style={{ gap: t.spacing[2] }}>
                <CashflowCard transactions={[]} currency={currency} skeleton />
                <Skeleton height={66} radius={t.radii.md} />
                <Skeleton height={66} radius={t.radii.md} />
                <Skeleton height={66} radius={t.radii.md} />
              </View>
            ) : (
              <Enter delay={reduce ? 160 : 320}>
                <CashflowCard transactions={transactions} currency={currency} />
              </Enter>
            )}

            {!error && !loading && filteredTransactions.length > 0 ? (
              <Text variant="caption" tone="subtle">
                Hold a transaction to delete it
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          error || loading ? undefined : (
            <Box
              surface="surface"
              level="L1"
              radius="lg"
              pad={t.spacing[6]}
              gap={t.spacing[3]}
              style={{ alignItems: "center", marginTop: t.spacing[4] }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: t.colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Float>
                  <PlatformIcon
                    ios={search ? "magnifyingglass" : "tray"}
                    lucide={search ? "Search" : "Inbox"}
                    size={24}
                    color={t.colors.accent}
                  />
                </Float>
              </View>
              <Text variant="body" tone="muted" align="center">
                {search
                  ? `Nothing matches “${search.trim()}”.`
                  : "Nothing captured yet. Manual entry is always one tap away."}
              </Text>
              {search ? (
                <Button
                  label="Clear search"
                  variant="secondary"
                  onPress={() => setSearch("")}
                />
              ) : (
                <Button
                  label="Add a transaction"
                  onPress={() => router.push("/add")}
                />
              )}
            </Box>
          )
        }
      />
    </Screen>
  );
}

/**
 * CashflowCard (Data tier). Daily income vs expense for the current month —
 * paired bars on the semantic hues (fresher income green, clay expense),
 * never the brand green, so the chart reads as data rather than brand noise.
 * Drawn from plain views: no chart dependency, exact theme control.
 */
function CashflowCard({
  transactions,
  currency,
  skeleton,
}: {
  transactions: Transaction[];
  currency: string;
  skeleton?: boolean;
}) {
  const t = useTheme();
  const { width } = useWindowDimensions();

  const { days, income, expense, monthIn, monthOut } = useMemo(() => {
    const today = startOfDay();
    const days = thisMonthDays();

    const income = new Map<number, number>();
    const expense = new Map<number, number>();
    let monthIn = 0;
    let monthOut = 0;

    for (const tx of transactions) {
      const key = dayTime(tx.date);
      if (key < days[0].getTime() || key > today.getTime()) continue;
      if (tx.type === "INCOME") {
        income.set(key, (income.get(key) ?? 0) + tx.amount);
        monthIn += tx.amount;
      } else {
        expense.set(key, (expense.get(key) ?? 0) + tx.amount);
        monthOut += tx.amount;
      }
    }
    return { days, income, expense, monthIn, monthOut };
  }, [transactions]);

  if (!skeleton && monthIn + monthOut === 0) return null;

  const chartH = 96;
  const cardPad = t.spacing[4] * 2;
  const colGap = 3;
  const usableW = width - t.spacing[5] * 2 - cardPad;
  // Columns must fit the card: reserve the inter-column gaps before dividing,
  // otherwise the tallest (current-month) bars scroll off-screen.
  const colW = Math.max(
    6,
    Math.floor((usableW - colGap * (days.length - 1)) / days.length),
  );
  const barW = Math.max(2, Math.floor((colW - 3) / 2));
  const peak = Math.max(
    ...days.map(
      (d) =>
        Math.max(
          income.get(d.getTime()) ?? 0,
          expense.get(d.getTime()) ?? 0,
        ),
    ),
    1,
  );
  const labelEvery = Math.max(1, Math.ceil(days.length / MAX_AXIS_LABELS));

  const bar = (v: number) => (v <= 0 ? 2 : Math.max(4, Math.round((v / peak) * chartH)));

  return (
    <Box surface="surface" level="L1" radius="lg" pad={t.spacing[4]} gap={t.spacing[3]}>
      <View style={{ gap: 2 }}>
        <Text variant="subhead" tone="ink">
          Cashflow
        </Text>
        <Text variant="caption" tone="subtle">
          Income and spending by day, this month
        </Text>
      </View>

      {skeleton ? (
        <Skeleton height={chartH + 26} radius={t.radii.md} />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View>
              {/* Paired columns, baseline aligned */}
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: colGap }}>
                {days.map((d) => {
                  const key = d.getTime();
                  return (
                    <View
                      key={key}
                      style={{
                        width: colW,
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "flex-end",
                        gap: 2,
                      }}
                    >
                      <Bar
                        height={bar(income.get(key) ?? 0)}
                        width={barW}
                        color={t.colors.positive}
                      />
                      <Bar
                        height={bar(expense.get(key) ?? 0)}
                        width={barW}
                        color={t.colors.negative}
                      />
                    </View>
                  );
                })}
              </View>
              {/* Axis: sparse day ticks */}
              <View
                style={{
                  flexDirection: "row",
                  gap: colGap,
                  borderTopWidth: 1,
                  borderTopColor: t.colors.hairline,
                  paddingTop: 4,
                  marginTop: 4,
                }}
              >
                {days.map((d, i) => (
                  <View key={d.getTime()} style={{ width: colW }}>
                    {i % labelEvery === 0 || i === days.length - 1 ? (
                      <Text variant="micro" tone="subtle" align="center">
                        {d.getDate()}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Legend + month totals */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: t.spacing[3],
            }}
          >
            <View style={{ flexDirection: "row", gap: t.spacing[3] }}>
              <LegendDot color={t.colors.positive} label="Income" />
              <LegendDot color={t.colors.negative} label="Expense" />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[3] }}>
              <Text variant="numericM" tone="positive">
                +{formatPriceShort(monthIn, currency)}
              </Text>
              <Text variant="numericM" tone="negative">
                −{formatPriceShort(monthOut, currency)}
              </Text>
            </View>
          </View>
        </>
      )}
    </Box>
  );
}

function Bar({
  height,
  width,
  color,
}: {
  height: number;
  width: number;
  color: string;
}) {
  return (
    <View
      style={{
        height,
        width,
        backgroundColor: color,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
      }}
    />
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[1] }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        }}
      />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}
