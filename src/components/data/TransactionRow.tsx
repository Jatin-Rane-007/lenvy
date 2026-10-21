import { View } from "react-native";

import { Dip } from "@components/animated";
import { AmountText } from "@components/data/AmountText";
import { CategoryGlyph } from "@components/data/CategoryGlyph";
import { getCategoryLabel } from "@components/data/categoryVisuals";
import { PlatformIcon } from "@components/icons";
import { Badge, Box, Text } from "@components/primitives";
import { formatDayLabel } from "@lib/utils";
import { useTheme } from "@/theme";
import type { Transaction } from "@/types/transaction";

export type TransactionRowProps = {
  tx: Transaction;
  /** Ledger currency — the app is multi-currency, so the caller owns it. */
  currency?: string;
  onPress?: () => void;
  /** Hide the date line (used on screens that already group by day). */
  hideDate?: boolean;
};

/**
 * TransactionRow (Data tier). Merchant or category on the left, date and
 * capture method underneath, amount on the right — the row the whole ledger
 * is read from. Rows stay tight (`md` radius, L1) per DESIGN.md's radius
 * asymmetry: data sits flat, tools float.
 */
export function TransactionRow({
  tx,
  currency = "INR",
  onPress,
  hideDate,
}: TransactionRowProps) {
  const t = useTheme();
  const title = tx.description?.trim() || getCategoryLabel(tx.category);
  const captureIcon =
    tx.input_method === "RECEIPT_SCAN"
      ? { ios: "viewfinder", lucide: "ScanLine" as const }
      : tx.input_method === "VOICE"
        ? { ios: "mic", lucide: "Mic" as const }
        : null;

  const row = (
    <Box
      surface="surface"
      level="L1"
      radius="md"
      padX={t.spacing[4]}
      padY={t.spacing[3]}
      style={{ flexDirection: "row", alignItems: "center", gap: t.spacing[3] }}
    >
      <CategoryGlyph category={tx.category} size={40} />

      <Box style={{ flex: 1, gap: 2 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: t.spacing[2],
          }}
        >
          <Text variant="body" tone="ink" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Text>
          {tx.is_flagged ? <Badge label="Review" tone="caution" /> : null}
        </View>

        {hideDate ? null : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: t.spacing[1],
            }}
          >
            <Text variant="caption" tone="subtle" numberOfLines={1}>
              {formatDayLabel(tx.date)} · {getCategoryLabel(tx.category)}
            </Text>
            {captureIcon ? (
              <PlatformIcon
                ios={captureIcon.ios}
                lucide={captureIcon.lucide}
                size={11}
                color={t.colors.inkSubtle}
                strokeWidth={2}
              />
            ) : null}
          </View>
        )}
      </Box>

      <AmountText
        amount={tx.amount}
        type={tx.type}
        currency={currency}
        align="right"
        style={{ maxWidth: 140 }}
      />
    </Box>
  );

  // Rows with somewhere to go dip on press; plain rows stay inert so screen
  // readers don't announce a button that does nothing.
  return onPress ? <Dip onPress={onPress}>{row}</Dip> : row;
}
