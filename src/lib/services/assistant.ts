/**
 * Gemini-backed question answering over the user's own ledger (PRODUCT.md:
 * "AI assistant — question-answering over the user's own spending"). We never
 * let the model invent numbers: `buildContext` folds the last 30 days of
 * transactions plus the monthly budget into a plain-text digest and the prompt
 * forbids answering from anything but that digest. Same model, key and base URL
 * as the capture path (`extractTransaction`), minus the JSON schema — here the
 * answer is prose for a chat bubble. Needs EXPO_PUBLIC_GEMINI_API_KEY; without
 * it the call throws and the UI surfaces an honest error.
 */
import { getCategoryLabel } from "@components/data/categoryVisuals";
import type { Budget } from "@/types/budget";
import type { Transaction } from "@/types/transaction";
import { formatDateFull, formatPrice, isSameMonth } from "@lib/utils";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 30;
const TX_LINES = 40;

/** Money as the model should read it: grouped, symbolled, no code suffix. */
const money = (amount: number, currency: string) => formatPrice(amount, currency);

function buildContext(
  transactions: Transaction[],
  budget: Budget | null,
  currency: string,
): string {
  const now = new Date();
  const cutoff = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
  const recent = transactions.filter((tx) => new Date(tx.date) >= cutoff);

  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, number>();

  for (const tx of recent) {
    if (tx.type === "EXPENSE") {
      expense += tx.amount;
      byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + tx.amount);
    } else {
      income += tx.amount;
    }
  }

  const monthExpense = transactions
    .filter((tx) => tx.type === "EXPENSE" && isSameMonth(tx.date, now))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const categoryLines = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `- ${getCategoryLabel(cat)}: ${money(amt, currency)}`)
    .join("\n");

  const budgetLine = budget
    ? `${money(monthExpense, currency)} spent this month against a ${money(
        budget.amount,
        currency,
      )} budget`
    : "No monthly budget set.";

  const txLines = [...recent]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, TX_LINES)
    .map(
      (tx) =>
        `- ${formatDateFull(tx.date)} | ${tx.type} | ${getCategoryLabel(tx.category)} | ${money(
          tx.amount,
          currency,
        )}${tx.description ? ` | ${tx.description}` : ""}`,
    )
    .join("\n");

  return `Last ${WINDOW_DAYS} days summary:
Total income: ${money(income, currency)}
Total expense: ${money(expense, currency)}

Spending by category:
${categoryLines || "No expenses recorded."}

Monthly budget:
${budgetLine}

Recent transactions:
${txLines || "No transactions recorded."}`;
}

/**
 * Ask a natural-language question; returns a concise prose answer grounded in
 * the caller-supplied financial data. Throws on missing key or a bad response
 * so the screen can show a retryable error bubble.
 */
export async function askAssistant(
  question: string,
  transactions: Transaction[],
  budget: Budget | null,
  currency: string,
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY");

  const context = buildContext(transactions, budget, currency);

  const prompt = `You are the personal finance assistant inside Lenvy, a calm wealth tracker. Answer the user's question using ONLY the financial data below. Be concise, specific and unsentimental — quote real figures with their currency. If the data cannot answer the question, say so plainly instead of guessing.

Reply in plain text only: no markdown, no asterisks or bold/italic markers, no bullet symbols. Use short sentences, or plain lines that start with "- " when listing categories.

${context}

User question: ${question}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini request failed: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini");

  return text as string;
}
