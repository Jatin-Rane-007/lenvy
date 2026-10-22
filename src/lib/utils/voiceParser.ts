/**
 * Voice-transcript → draft-transaction parser (PRODUCT.md: "I spent 400 on
 * groceries yesterday" becomes a reviewable draft). Deliberately local and
 * rule-based: it works offline, ships no audio anywhere, and every field it
 * fills stays editable before the user commits — AI is a capture mechanism,
 * not a decision maker. Anything it can't find is returned as null so the
 * form keeps the user's own value instead of a guess.
 */
import type { CategoryKey } from "@constants/categories";
import type { ExtractedTransaction, TransactionType } from "@/types/transaction";
import { startOfDay } from "@lib/utils";

/** Money words that flip the draft to INCOME; anything else reads as spend. */
const INCOME_SIGNALS = [
  "received",
  "receive",
  "got paid",
  "earned",
  "earn",
  "salary",
  "paycheck",
  "stipend",
  "credited",
  "credit",
  "income",
  "refund",
  "reimburse",
  "won",
  "dividend",
  "interest",
  "sold",
  "deposit",
  "came in",
  "paid me",
];

/** Multipliers spoken after a number: "2.5k", "3 lakh". */
const SUFFIX_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  lakh: 100_000,
  lakhs: 100_000,
  lac: 100_000,
  crore: 10_000_000,
  crores: 10_000_000,
};

/**
 * Category keyword → key. Matched against the whole (lower-cased) transcript;
 * the earliest hit in CATEGORY_ORDER wins so "grocery run to the mall" still
 * reads groceries rather than shopping.
 */
const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  // expense
  food: ["food", "lunch", "dinner", "breakfast", "coffee", "cafe", "restaurant", "dining", "snack", "pizza", "swiggy", "zomato", "eat"],
  groceries: ["grocery", "groceries", "supermarket", "bigbasket", "kirana", "vegetable", "dm mart"],
  transport: ["uber", "ola", "taxi", "cab", "auto", "bus", "metro", "train", "fuel", "petrol", "diesel", "parking", "transport"],
  shopping: ["amazon", "flipkart", "clothe", "clothes", "dress", "shoe", "mall", "shopping"],
  entertainment: ["movie", "cinema", "concert", "game", "gaming", "entertainment", "party", "club"],
  health: ["hospital", "doctor", "medicine", "medical", "pharmacy", "gym", "health", "dental"],
  utilities: ["electricity", "water bill", "gas bill", "internet", "wifi", "recharge", "postpaid", "broadband", "bill", "utility", "utilities"],
  rent: ["rent", "lease", "landlord"],
  education: ["school", "college", "tuition", "course", "udemy", "coursera", "education", "exam", "fees"],
  travel: ["trip", "vacation", "flight", "hotel", "travel", "holiday", "airbnb"],
  insurance: ["insurance", "premium", "policy"],
  subscriptions: ["netflix", "spotify", "prime", "subscription", "membership", "youtube", "icloud"],
  emi: ["emi", "loan", "installment"],
  personal_care: ["haircut", "salon", "spa", "grooming", "barber", "personal care"],
  other: [],
  // income
  salary: ["salary", "paycheck", "stipend", "wage"],
  freelance: ["freelance", "gig", "client"],
  business: ["business", "shop revenue", "sales"],
  investment: ["dividend", "interest", "stock", "mutual fund", "sip", "return", "profit"],
  gift: ["gift", "present", "birthday money", "won"],
  other_income: ["refund", "reimburse", "sold", "deposit"],
};

/** Expense keys first — the app's default mode is logging a spend. */
const CATEGORY_ORDER: CategoryKey[] = [
  "food",
  "groceries",
  "transport",
  "shopping",
  "entertainment",
  "health",
  "utilities",
  "rent",
  "education",
  "travel",
  "insurance",
  "subscriptions",
  "emi",
  "personal_care",
  "salary",
  "freelance",
  "business",
  "investment",
  "gift",
  "other_income",
  "other",
];

/** "400", "₹1,250.50", "rs 500", "2.5k", "500 rupees" → number | null. */
function extractAmount(text: string): number | null {
  const re =
    /(?:rs\.?|inr|₹|\$|usd|dollars?|€|euros?|£|pounds?)?\s*(\d+(?:[.,]\d{1,2})?)\s*(k\b|thousand\b|lakhs?\b|lacs?\b|crores?\b)?/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const raw = Number.parseFloat(match[1].replace(/,/g, ""));
    if (!Number.isFinite(raw) || raw <= 0) continue;
    const suffix = (match[2] ?? "").toLowerCase().replace(/\bs\b$/, "");
    const multiplier = SUFFIX_MULTIPLIERS[suffix] ?? 1;
    return Math.round(raw * multiplier * 100) / 100;
  }
  return null;
}

function extractType(text: string): TransactionType {
  return INCOME_SIGNALS.some((signal) => text.includes(signal))
    ? "INCOME"
    : "EXPENSE";
}

/**
 * Earliest keyword hit in CATEGORY_ORDER. `position` is where the keyword
 * matched, used only to break ties between same-position candidates.
 */
function extractCategory(text: string): CategoryKey | null {
  let best: CategoryKey | null = null;
  let bestIndex = Number.POSITIVE_INFINITY;
  for (const key of CATEGORY_ORDER) {
    for (const word of CATEGORY_KEYWORDS[key]) {
      const index = text.indexOf(word);
      if (index !== -1 && index < bestIndex) {
        bestIndex = index;
        best = key;
      }
    }
  }
  return best;
}

/** today / yesterday / "3 days ago" / "last week" / "last month" → Date. */
function extractDate(text: string, now = new Date()): Date | null {
  const today = startOfDay(now);
  const shift = (days: number) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);

  if (/\bday before yesterday\b/.test(text)) return shift(2);
  if (/\byesterday\b|\btill yesterday\b/.test(text)) return shift(1);
  if (/\btoday\b|\bright now\b|\bjust now\b/.test(text)) return shift(0);

  const daysAgo = text.match(/\b(\d+)\s*days?\s+ago\b/);
  if (daysAgo) return shift(Number.parseInt(daysAgo[1], 10));
  if (/\bweek ago\b|\blast week\b/.test(text)) return shift(7);
  if (/\bmonth ago\b|\blast month\b/.test(text)) return shift(30);

  return null;
}

/**
 * Merchant / note: the phrase after "at X" ("coffee at Blue Bottle"),
 * falling back to "for X" minus the category word ("bought milk for 20" →
 * nothing usable → null, so the user's own note survives).
 */
function extractDescription(text: string): string | null {
  const at = text.match(/\bat\s+([a-z0-9][a-z0-9&'’ .-]{1,28}?)(?=\s+(?:for|yesterday|today|last|ago|\d)|[.,!?]|$)/i);
  if (at) return at[1].trim();

  const forPhrase = text.match(/\bfor\s+([a-z][a-z0-9&'’ .-]{1,28}?)(?=\s+(?:yesterday|today|last|ago|\d|at)|[.,!?]|$)/i);
  if (forPhrase) {
    const phrase = forPhrase[1].trim();
    // "for groceries" is a category, not a note — don't echo it as one.
    const isCategoryWord = CATEGORY_ORDER.some((key) =>
      CATEGORY_KEYWORDS[key].some((word) => phrase.includes(word)),
    );
    if (!isCategoryWord) return phrase;
  }
  return null;
}

/** Pure parse — the voice stage owns when to call it. */
export function parseVoiceDraft(transcript: string): ExtractedTransaction {
  const text = ` ${transcript.toLowerCase().trim()} `;
  const parsedDate = text.trim() ? extractDate(text) : null;
  return {
    type: text.trim() ? extractType(text) : null,
    amount: extractAmount(text),
    category: text.trim() ? extractCategory(text) : null,
    description: extractDescription(text),
    date: parsedDate ? parsedDate.toISOString() : null,
    transcript: transcript.trim() || null,
  };
}

/** True when the parser found at least one usable field. */
export function hasDraftSignal(draft: ExtractedTransaction): boolean {
  return (
    draft.amount !== null ||
    draft.category !== null ||
    draft.date !== null ||
    draft.description !== null
  );
}
