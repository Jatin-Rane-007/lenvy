import type { TextStyle } from "react-native";

import { Text } from "@components/primitives";
import { formatPrice, formatSignedPrice } from "@lib/utils";
import type { TransactionType } from "@/types/transaction";
import type { TypographyKey } from "@/theme";

export type AmountTextProps = {
  amount: number;
  type: TransactionType;
  currency?: string;
  variant?: Extract<TypographyKey, "numericL" | "numericM">;
  /** Hide the +/− sign (used where direction is already stated in words). */
  signed?: boolean;
  align?: TextStyle["textAlign"];
  numberOfLines?: number;
  style?: TextStyle | TextStyle[];
};

/**
 * AmountText (Data tier). Direction is encoded in both the sign and the hue —
 * income green, expense clay — so the ledger reads without colour alone
 * carrying the meaning (PRODUCT.md accessibility).
 */
export function AmountText({
  amount,
  type,
  currency = "INR",
  variant = "numericL",
  signed = true,
  align,
  numberOfLines = 1,
  style,
}: AmountTextProps) {
  const value = signed
    ? formatSignedPrice(amount, type, currency)
    : formatPrice(Math.abs(amount), currency);

  return (
    <Text
      variant={variant}
      tone={type === "INCOME" ? "positive" : "negative"}
      align={align}
      numberOfLines={numberOfLines}
      style={style}
    >
      {value}
    </Text>
  );
}
