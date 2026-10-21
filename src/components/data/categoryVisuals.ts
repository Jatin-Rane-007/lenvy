import type { LucideIconName } from "@components/icons";
import { CATEGORIES, type CategoryKey } from "@constants/categories";
import type { CategorySwatch } from "@/theme";

/**
 * Category → theme swatch + glyph. DESIGN.md: the ten muted swatches cover
 * chart and chip use, and icons come from a real library — never an emoji,
 * which is why `@constants/categories` keeps its emoji field for the AI
 * prompt path only and this file owns the visual side.
 *
 * Swatches are reused across the 21 categories: income keys stay on the
 * green/olive family so a ledger reads "money in" at a glance.
 */
export type CategoryVisual = {
  swatch: CategorySwatch;
  ios: string;
  lucide: LucideIconName;
};

export const CATEGORY_VISUALS: Record<CategoryKey, CategoryVisual> = {
  // ── EXPENSE ───────────────────────────────────────────────
  food: { swatch: "terracotta", ios: "utensils", lucide: "Utensils" },
  groceries: { swatch: "ochre", ios: "cart", lucide: "ShoppingCart" },
  transport: { swatch: "steel", ios: "car", lucide: "Car" },
  shopping: { swatch: "periwinkle", ios: "bag", lucide: "ShoppingBag" },
  entertainment: { swatch: "rust", ios: "film", lucide: "Film" },
  health: { swatch: "sage", ios: "heart", lucide: "HeartPulse" },
  utilities: { swatch: "tan", ios: "bolt", lucide: "Zap" },
  rent: { swatch: "moss", ios: "house", lucide: "House" },
  education: { swatch: "harbor", ios: "graduationcap", lucide: "GraduationCap" },
  travel: { swatch: "steel", ios: "airplane", lucide: "Plane" },
  insurance: { swatch: "moss", ios: "shield", lucide: "Shield" },
  subscriptions: {
    swatch: "rust",
    ios: "arrow.triangle.2.circlepath",
    lucide: "RefreshCw",
  },
  emi: { swatch: "harbor", ios: "building.columns", lucide: "Landmark" },
  personal_care: { swatch: "tan", ios: "scissors", lucide: "Scissors" },
  other: { swatch: "olive", ios: "shippingbox", lucide: "Package" },

  // ── INCOME ────────────────────────────────────────────────
  salary: { swatch: "moss", ios: "briefcase", lucide: "Briefcase" },
  freelance: { swatch: "sage", ios: "laptopmac", lucide: "Laptop" },
  business: { swatch: "olive", ios: "building.2", lucide: "Building" },
  investment: {
    swatch: "moss",
    ios: "chart.line.uptrend.xyaxis",
    lucide: "TrendingUp",
  },
  gift: { swatch: "periwinkle", ios: "giftcard", lucide: "Gift" },
  other_income: { swatch: "tan", ios: "coins", lucide: "Coins" },
};

/** Lookup that never throws on a stale category key coming from the ledger. */
export function getCategoryVisual(key: string): CategoryVisual {
  return CATEGORY_VISUALS[key as CategoryKey] ?? CATEGORY_VISUALS.other;
}

/** Human label, straight from the category table; key text is the fallback. */
export function getCategoryLabel(key: string): string {
  return CATEGORIES[key as CategoryKey]?.label ?? key.replace(/_/g, " ");
}
