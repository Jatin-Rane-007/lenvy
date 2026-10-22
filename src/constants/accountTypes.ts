import type { LucideIconName } from "@components/icons";
import type { AccountType } from "@/types/account";
import type { ColorRole } from "@/theme";

/**
 * Account-type visuals. DESIGN.md icon rule: SF Symbols on iOS, Lucide on
 * Android/Web, and never an emoji. The tint is a semantic colour role so a
 * glyph circle reads the same in both schemes — no raw hex here.
 */
export type AccountTypeMeta = {
  label: string;
  /** Short label for the type selector chips in the account sheet. */
  short: string;
  ios: string;
  lucide: LucideIconName;
  tint: ColorRole;
};

export const ACCOUNT_TYPE_META: Record<AccountType, AccountTypeMeta> = {
  CASH: {
    label: "Cash",
    short: "Cash",
    ios: "banknote",
    lucide: "Banknote",
    tint: "positive",
  },
  BANK: {
    label: "Bank account",
    short: "Bank",
    ios: "building.columns",
    lucide: "Landmark",
    tint: "info",
  },
  CREDIT_CARD: {
    label: "Credit card",
    short: "Credit",
    ios: "creditcard",
    lucide: "Wallet",
    tint: "accent",
  },
  SAVINGS: {
    label: "Savings",
    short: "Savings",
    ios: "shield.lefthalf.filled",
    lucide: "Shield",
    tint: "caution",
  },
};

/** Ordered list the type selector walks through. */
export const ACCOUNT_TYPES = Object.keys(
  ACCOUNT_TYPE_META,
) as unknown as AccountType[];
