/**
 * Formatting helpers for every numeric and date surface.
 * PRODUCT.md: multi-currency and localized from day one — no screen builds
 * its own money string, and nothing hard-codes a symbol.
 */
import { currencySymbol } from "@constants/currencies";

type PriceOptions = {
  /** Force decimals on round numbers (e.g. an input echo showing ₹400.00). */
  alwaysTwoDecimals?: boolean;
  /** Drop the currency glyph — used where the symbol already labels the field. */
  omitSymbol?: boolean;
};

const formatterCache = new Map<string, Intl.NumberFormat>();

function currencyFormatter(
  code: string,
  decimals: number,
  display: "narrowSymbol" | "symbol",
): Intl.NumberFormat | null {
  const key = `${code}:${decimals}:${display}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  try {
    const fmt = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      currencyDisplay: display,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatterCache.set(key, fmt);
    return fmt;
  } catch {
    // Unknown / unsupported code (or a runtime without full ICU currency
    // data). Callers fall back to the hand-built string below.
    return null;
  }
}

/** Group digits with commas — the fallback path, Indian-style grouping kept
 *  for the last three digits so ₹ lakhs read the way users expect. */
function groupDigits(integers: string): string {
  return integers.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Money for display: "₹4,200" / "₹4,250.75". Round or large amounts drop the
 * decimals so the hero number stays readable; sub-1000 amounts keep paise.
 */
export function formatPrice(
  amount: number,
  code = "INR",
  options: PriceOptions = {},
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const negative = safe < 0;
  const value = Math.abs(safe);
  const cents = Math.round(value * 100) % 100;
  const decimals = options.alwaysTwoDecimals ? 2 : cents === 0 ? 0 : 2;

  const upper = code.toUpperCase();
  const fmt =
    currencyFormatter(upper, decimals, "narrowSymbol") ??
    currencyFormatter(upper, decimals, "symbol");

  if (fmt) {
    const text = fmt.format(value);
    return negative ? `-${text}` : text;
  }

  const [whole, frac = ""] = value.toFixed(decimals).split(".");
  const symbol = options.omitSymbol ? "" : `${currencySymbol(upper)} `;
  const body = `${symbol}${groupDigits(whole)}${frac ? `.${frac}` : ""}`;
  return negative ? `-${body}` : body;
}

/** Amount without the glyph, for inputs and dense table cells. */
export function formatAmount(amount: number, decimals = 2): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const [whole, frac = ""] = Math.abs(safe).toFixed(decimals).split(".");
  const body = `${groupDigits(whole)}${frac ? `.${frac}` : ""}`;
  return safe < 0 ? `-${body}` : body;
}

/**
 * Short money for chart labels and stat chips: "₹4.6K", "₹1.2L".
 * Compaction follows the runtime locale's grouping, so an Indian locale
 * produces lakh/crore and a US one produces K/M.
 */
export function formatPriceShort(amount: number, code = "INR"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const symbol = currencySymbol(code.toUpperCase());
  const sign = safe < 0 ? "-" : "";
  const value = Math.abs(safe);

  if (value < 1000) return `${sign}${symbol}${groupDigits(String(Math.round(value)))}`;

  try {
    const fmt = new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return `${sign}${symbol}${fmt.format(value)}`;
  } catch {
    if (value >= 1e7) return `${sign}${symbol}${(value / 1e7).toFixed(1)}Cr`;
    if (value >= 1e5) return `${sign}${symbol}${(value / 1e5).toFixed(1)}L`;
    return `${sign}${symbol}${(value / 1e3).toFixed(1)}K`;
  }
}

/** Signed money for ledger rows: expenses lead with "−", income with "+". */
export function formatSignedPrice(
  amount: number,
  type: "INCOME" | "EXPENSE",
  code = "INR",
): string {
  const prefix = type === "INCOME" ? "+" : "−";
  return `${prefix}${formatPrice(amount, code)}`;
}

// ── Dates ────────────────────────────────────────────────────────

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function isSameMonth(a: string | Date, b: string | Date): boolean {
  const d1 = toDate(a);
  const d2 = toDate(b);
  return (
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
  );
}

export function startOfDay(value: string | Date = new Date()): Date {
  const d = new Date(toDate(value));
  d.setHours(0, 0, 0, 0);
  return d;
}

function calendarDaysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Ledger row label: "Today", "Yesterday", weekday inside the current week,
 * then "12 Oct", then "12 Oct 23" once it leaves this year.
 */
export function formatDayLabel(value: string | Date): string {
  const d = toDate(value);
  const today = new Date();
  const diff = calendarDaysBetween(d, today);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return WEEKDAY_ABBR[d.getDay()];

  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTH_ABBR[d.getMonth()];
  if (d.getFullYear() === today.getFullYear()) return `${day} ${month}`;
  return `${day} ${month} ${String(d.getFullYear()).slice(2)}`;
}

/** Full, unambiguous date for detail rows and sheet meta: "12 Oct 2026". */
export function formatDateFull(value: string | Date): string {
  const d = toDate(value);
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Oct" — month tick for chart axes and period labels. */
export function formatMonthShort(value: string | Date): string {
  return MONTH_ABBR[toDate(value).getMonth()];
}

/**
 * Parse a typed money string ("1,250.50", "₹400") into a number.
 * Returns null when nothing usable was entered so forms can surface an error
 * instead of silently saving 0.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}
