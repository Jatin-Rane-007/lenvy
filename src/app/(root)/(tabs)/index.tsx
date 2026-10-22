import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReduceMotion, Enter, Dip } from "@components/animated";
import { AssistantBar } from "@components/ai/AssistantBar";
import { AmountText } from "@components/data/AmountText";
import { BudgetRail } from "@components/data/BudgetRail";
import { DonutChart, type DonutSegment } from "@components/data/DonutChart";
import { getCategoryLabel, getCategoryVisual } from "@components/data/categoryVisuals";
import { Sparkline } from "@components/data/Sparkline";
import { TransactionRow } from "@components/data/TransactionRow";
import { PlatformIcon, type PlatformIconProps } from "@components/icons";
import { Avatar, Badge, Box, Button, Screen, Text } from "@components/primitives";
import { BudgetSheet } from "@components/overlays/BudgetSheet";
import { Skeleton } from "@components/feedback/Skeleton";
import { useAccountsQuery } from "@hooks/queries/useAccountsQuery";
import { useBudgetQuery } from "@hooks/queries/useBudgetQuery";
import { useTransactionsQuery } from "@hooks/queries/useTransactionsQuery";
import { useUserStore } from "@store/userStore";
import { formatPrice, formatPriceShort, isSameMonth, startOfDay } from "@lib/utils";
import { useTheme } from "@/theme";
import type { ColorTokens } from "@/theme/semantic";

/** Day of the greeting only — the copy stays unsentimental (PRODUCT.md). */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const SPARK_DAYS = 90;
const RECENT_COUNT = 5;
const LEGEND_COUNT = 5;

export default function HomeScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reduce = useReduceMotion();

  const { user } = useUser();
  const currency = useUserStore((s) => s.currency);
  const [budgetOpen, setBudgetOpen] = useState(false);

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isRefetching: accountsRefetching,
    refetch: refetchAccounts,
  } = useAccountsQuery();
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    refetch: refetchTransactions,
  } = useTransactionsQuery();
  const {
    data: budget = null,
    isRefetching: budgetRefetching,
    refetch: refetchBudget,
  } = useBudgetQuery();

  const loading = accountsLoading || transactionsLoading;
  const refreshing = accountsRefetching || transactionsRefetching || budgetRefetching;

  const onRefresh = () => {
    void refetchAccounts();
    void refetchTransactions();
    void refetchBudget();
  };

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );

  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => isSameMonth(tx.date, now));
  }, [transactions]);

  const monthIncome = useMemo(
    () =>
      monthTransactions
        .filter((tx) => tx.type === "INCOME")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions],
  );

  const monthExpense = useMemo(
    () =>
      monthTransactions
        .filter((tx) => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions],
  );

  const recent = useMemo(
    () => transactions.slice(0, RECENT_COUNT),
    [transactions],
  );

  /**
   * Category mix for the ring. Swatches come from the theme, so the donut and
   * the row glyphs agree pixel for pixel on both schemes.
   */
  const segments = useMemo<DonutSegment[]>(() => {
    const totals = new Map<string, number>();
    for (const tx of monthTransactions) {
      if (tx.type !== "EXPENSE") continue;
      totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, value]) => ({
        key: category,
        value,
        color: t.categories[getCategoryVisual(category).swatch],
      }));
  }, [monthTransactions, t]);

  /**
   * Balance history, reconstructed from the ledger rather than stored: walk
   * back from today's net balance, undoing each day's income minus expense.
   * Older transactions than the window are the flat tail you see on the left.
   */
  const balanceSeries = useMemo(() => {
    if (transactions.length === 0) return [];
    const dayMs = 86_400_000;
    const today = startOfDay().getTime();

    const deltaByAge = new Map<number, number>();
    for (const tx of transactions) {
      const age = Math.round((today - startOfDay(tx.date).getTime()) / dayMs);
      if (age < 0 || age >= SPARK_DAYS) continue;
      const delta = tx.type === "INCOME" ? tx.amount : -tx.amount;
      deltaByAge.set(age, (deltaByAge.get(age) ?? 0) + delta);
    }

    const series: number[] = [];
    let running = totalBalance;
    for (let age = 0; age < SPARK_DAYS; age += 1) {
      series.unshift(running);
      running -= deltaByAge.get(age) ?? 0;
    }
    return series;
  }, [transactions, totalBalance]);

  const firstName = user?.firstName ?? user?.fullName ?? "there";
  const gutter = t.spacing[5];
  const contentWidth = windowWidth - gutter * 2;

  /* Brand mark, scheme-swapped like the auth screens. */
  const brandMark =
    t.scheme === "dark"
      ? require("@/assets/images/lenvy_app_logo_dark.png")
      : require("@/assets/images/lenvy_app_logo_light.png");

  return (
    <Screen edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: gutter,
          paddingTop: t.spacing[2],
          // Clear the floating tab bar (66 pt) plus the FAB lift and a
          // breath of space, over the bottom inset.
          paddingBottom: 66 + t.spacing[7] + Math.max(insets.bottom, 8),
          gap: t.spacing[7],
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
      >
        {/* ── Header: brand mark, who, and where the profile lives ── */}
        <Enter style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[3] }}>
          <Image
            source={brandMark}
            style={{ width: 40, height: 40, borderRadius: 12 }}
            contentFit="cover"
            accessibilityLabel="Lenvy"
          />
          <Box style={{ flex: 1, gap: 1 }}>
            <Text variant="caption" tone="subtle">
              {getGreeting()}
            </Text>
            <Text variant="subhead" tone="ink" numberOfLines={1}>
              {firstName}
            </Text>
          </Box>
          {/* 44 pt target: the 40 pt avatar gets a 2 pt padding ring. */}
          <Dip onPress={() => router.push("/profile")} style={{ padding: 2 }}>
            <Avatar name={user?.fullName ?? "You"} uri={user?.imageUrl} size="md" />
          </Dip>
        </Enter>

        {/* ── Hero balance: the one display serif on the screen ───── */}
        <Enter delay={reduce ? 40 : 80} style={{ gap: t.spacing[1] }}>
          <Text variant="caption" tone="muted">
            Total balance
          </Text>
          {loading ? (
            <Skeleton height={56} width={contentWidth * 0.6} radius={t.radii.sm} />
          ) : (
            <Text variant="displayXl" tone="ink" numberOfLines={1}>
              {formatPrice(totalBalance, currency)}
            </Text>
          )}

          {balanceSeries.length > 1 ? (
            <Sparkline
              values={balanceSeries}
              width={contentWidth}
              height={36}
              color={t.colors.accent}
            />
          ) : null}

          <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[4], paddingTop: t.spacing[1] }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[1] }}>
              <PlatformIcon
                ios="arrow.up.right"
                lucide="ArrowUpRight"
                size={14}
                color={t.colors.positive}
              />
              {loading ? (
                <Skeleton height={18} width={72} radius={t.radii.xs} />
              ) : (
                <AmountText
                  amount={monthIncome}
                  type="INCOME"
                  currency={currency}
                  variant="numericM"
                  signed={false}
                />
              )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[1] }}>
              <PlatformIcon
                ios="arrow.down.left"
                lucide="ArrowDownLeft"
                size={14}
                color={t.colors.negative}
              />
              {loading ? (
                <Skeleton height={18} width={72} radius={t.radii.xs} />
              ) : (
                <AmountText
                  amount={monthExpense}
                  type="EXPENSE"
                  currency={currency}
                  variant="numericM"
                  signed={false}
                />
              )}
            </View>
          </View>

          <Text variant="caption" tone="subtle" style={{ paddingTop: t.spacing[1] }}>
            {accounts.length === 0
              ? "No accounts yet"
              : `Across ${accounts.length} ${accounts.length === 1 ? "account" : "accounts"} · this month in and out`}
          </Text>
        </Enter>

        {/* ── Assistant entry (AI tier, floats above the data) ────── */}
        <Enter delay={reduce ? 80 : 160}>
          <AssistantBar onPress={() => router.push("/assistant")} />
        </Enter>

        {/* ── Capture options: three ways to get a transaction in ─── */}
        <Enter delay={reduce ? 120 : 240} style={{ gap: t.spacing[3] }}>
          <Text variant="heading" tone="ink">
            Add a transaction
          </Text>
          <View style={{ flexDirection: "row", gap: t.spacing[3] }}>
            <CaptureCard
              iosIcon="viewfinder"
              lucideIcon="ScanLine"
              label="Receipt scan"
              hint="Snap & extract"
              tint="info"
              ai
              onPress={() => router.push("/add?action=scan")}
            />
            <CaptureCard
              iosIcon="mic"
              lucideIcon="Mic"
              label="Voice entry"
              hint="Just say it"
              tint="caution"
              ai
              onPress={() => router.push("/add?action=voice")}
            />
            <CaptureCard
              iosIcon="keyboard"
              lucideIcon="Keyboard"
              label="Add manually"
              hint="Type it in"
              tint="accent"
              onPress={() => router.push("/add")}
            />
          </View>
        </Enter>

        {/* ── Budget rail ─────────────────────────────────────────── */}
        <Enter delay={reduce ? 160 : 320}>
          <Dip onPress={() => setBudgetOpen(true)}>
            <Box surface="surface" level="L1" radius="lg" pad={t.spacing[4]} gap={t.spacing[3]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="subhead" tone="ink">
                  Monthly budget
                </Text>
                <PlatformIcon
                  ios="pencil"
                  lucide="SquarePen"
                  size={15}
                  color={t.colors.inkSubtle}
                />
              </View>

              {budget ? (
                <>
                  <BudgetRail spent={monthExpense} budget={budget.amount} />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: t.spacing[2],
                    }}
                  >
                    <Text variant="caption" tone="muted">
                      {formatPrice(monthExpense, currency)} of{" "}
                      {formatPrice(budget.amount, currency)} spent
                    </Text>
                    <Text
                      variant="caption"
                      tone={
                        monthExpense >= budget.amount
                          ? "negative"
                          : monthExpense >= budget.amount * 0.9
                            ? "caution"
                            : "subtle"
                      }
                    >
                      {monthExpense >= budget.amount
                        ? `${formatPrice(monthExpense - budget.amount, currency)} over`
                        : `${formatPrice(budget.amount - monthExpense, currency)} left`}
                    </Text>
                  </View>
                </>
              ) : (
                <Text variant="body" tone="muted">
                  Not set yet — tap to put one figure against your spending.
                </Text>
              )}
            </Box>
          </Dip>
        </Enter>

        {/* ── Category mix ────────────────────────────────────────── */}
        {segments.length > 0 ? (
          <Enter delay={reduce ? 200 : 400}>
            <Box surface="surface" level="L1" radius="lg" pad={t.spacing[4]} gap={t.spacing[4]}>
              <Box style={{ gap: 2 }}>
                <Text variant="subhead" tone="ink">
                  Where it went
                </Text>
                <Text variant="caption" tone="subtle">
                  Expenses this month, by category
                </Text>
              </Box>

              <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[4] }}>
                <DonutChart
                  segments={segments}
                  size={128}
                  stroke={16}
                  center={
                    <>
                      <Text variant="caption" tone="subtle" align="center">
                        spent
                      </Text>
                      <Text variant="numericM" tone="ink" align="center" numberOfLines={1}>
                        {formatPriceShort(monthExpense, currency)}
                      </Text>
                    </>
                  }
                />

                <Box style={{ flex: 1, gap: t.spacing[2] }}>
                  {segments.slice(0, LEGEND_COUNT).map((s) => (
                    <LegendRow
                      key={s.key}
                      color={s.color}
                      label={getCategoryLabel(s.key)}
                      amount={formatPriceShort(s.value, currency)}
                    />
                  ))}
                  {segments.length > LEGEND_COUNT ? (
                    <Text variant="micro" tone="subtle">
                      +{segments.length - LEGEND_COUNT} MORE
                    </Text>
                  ) : null}
                </Box>
              </View>
            </Box>
          </Enter>
        ) : null}

        {/* ── Recent ledger ───────────────────────────────────────── */}
        <Enter delay={reduce ? 240 : 480} style={{ gap: t.spacing[3] }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text variant="heading" tone="ink">
              Recent
            </Text>
            <Button
              label="See all"
              variant="link"
              onPress={() => router.push("/transactions")}
            />
          </View>

          {loading ? (
            <Box gap={t.spacing[2]}>
              <Skeleton height={66} radius={t.radii.md} />
              <Skeleton height={66} radius={t.radii.md} />
              <Skeleton height={66} radius={t.radii.md} />
            </Box>
          ) : recent.length === 0 ? (
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
                  backgroundColor: t.colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlatformIcon
                  ios="tray"
                  lucide="Inbox"
                  size={24}
                  color={t.colors.accent}
                />
              </View>
              <Text variant="body" tone="muted" align="center">
                Nothing captured yet. Manual entry is always one tap away.
              </Text>
              <Button
                label="Add a transaction"
                onPress={() => router.push("/add")}
              />
            </Box>
          ) : (
            <Box gap={t.spacing[2]}>
              {recent.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} currency={currency} />
              ))}
            </Box>
          )}
        </Enter>
      </ScrollView>

      <BudgetSheet
        visible={budgetOpen}
        budget={budget}
        currency={currency}
        onClose={() => setBudgetOpen(false)}
        onSaved={() => setBudgetOpen(false)}
      />
    </Screen>
  );
}

/**
 * Capture option tile — an editorial, left-aligned card: a tinted rounded-
 * square glyph up top, the label and a whisper hint anchored bottom-left, and
 * an AI pill floating top-right on the AI-backed paths. Each action carries
 * its own hue (info / caution / accent) so the trio reads as three distinct
 * doors rather than one repeated button. The `flex: 1` lives on a plain View
 * because Dip's Pressable function-style drops layout props under React
 * Compiler; the Pressable then stretches to fill its slot, keeping the three
 * tiles pixel-even.
 */
function CaptureCard({
  iosIcon,
  lucideIcon,
  label,
  hint,
  tint,
  ai,
  onPress,
}: {
  iosIcon: string;
  lucideIcon: PlatformIconProps["lucide"];
  label: string;
  hint?: string;
  tint: keyof ColorTokens;
  ai?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  const hue = t.colors[tint];
  return (
    <View style={{ flex: 1 }}>
      <Dip onPress={onPress}>
        <Box
          surface="surface"
          level="L1"
          radius="lg"
          pad={t.spacing[4]}
          style={{
            height: 168,
            justifyContent: "space-between",
            borderTopWidth: 2,
            borderTopColor: `${hue}55`,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            {ai ? <Badge label="AI" tone="accent" /> : null}
          </View>

          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: t.radii.md,
              backgroundColor: `${hue}1F`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlatformIcon
              ios={iosIcon}
              lucide={lucideIcon}
              size={22}
              color={hue}
            />
          </View>

          <Box gap={2}>
            <Text variant="bodyStrong" tone="ink" numberOfLines={2}>
              {label}
            </Text>
            {hint ? (
              <Text variant="micro" tone="subtle" numberOfLines={1}>
                {hint.toUpperCase()}
              </Text>
            ) : null}
          </Box>
        </Box>
      </Dip>
    </View>
  );
}

/** Legend line: swatch dot, category name, short amount. */
function LegendRow({
  color,
  label,
  amount,
}: {
  color: string;
  label: string;
  amount: string;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[2] }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        }}
      />
      <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="numericM" tone="ink" numberOfLines={1}>
        {amount}
      </Text>
    </View>
  );
}
