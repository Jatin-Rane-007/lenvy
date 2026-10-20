# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Individuals who want a calm, private read on their money across every account
they hold — cash, bank, credit, savings — without turning budgeting into a
second job. They open the app in short bursts: after a purchase, at the till,
at the end of the month, when deciding whether they can afford something. They
are not accountants. They are not traders. They want to know *where they
stand* and *why the number moved*.

Secondary audience: people who already use a spreadsheet or a legacy budgeting
app and are tired of manual entry. The AI receipt scan and voice entry exist
for them.

## Product Purpose

Lenvy is a personal wealth tracker that keeps a running, honest picture of a
person's money — balances, spending, category mix, budget pressure — and
removes the friction of maintaining it. Success is measured by whether a user
can answer "how am I doing?" and "what did I spend yesterday?" in under ten
seconds, from any screen, without opening a spreadsheet.

## Positioning

Most budgeting apps are either *entry-heavy* (you categorise every rupee) or
*insight-light* (a donut chart and a shrug). Lenvy's mechanism is AI-assisted
capture paired with a real balance sheet: multi-account running totals, photo
and voice receipt capture that actually works, and an assistant that answers
questions about *your* numbers. The claim a neighbouring product could not
truthfully copy is "every number has a purpose" — no vanity metrics, no
gamified streaks, no decoration; every digit on screen is one you can audit
back to a transaction.

## Operating Context

- Short, high-frequency sessions: post-purchase, end-of-month, "can I afford
  this?" moments.
- One-handed use on a phone; a thumb reaches the Assistant bar and the FAB.
- Camera and microphone available (receipt scan, voice entry) but optional —
  manual entry path is always one tap away.
- Data must be exportable (CSV) and portable; users distrust a lock-in ledger.
- Works offline for viewing; AI features require connectivity and are honest
  about it.

## Capabilities and Constraints

Confirmed feature surface (all shipping on the same design system):

- **Accounts** — multiple accounts (cash, bank, credit card, savings), a
  default account, running balances per account and net across all.
- **Transactions** — income/expense with categories, search, filters, and
  daily income-vs-expense charts.
- **AI receipt scan** — snap or pick a photo, Gemini extracts amount,
  category, description; user reviews every field before it commits.
- **AI voice entry** — natural language ("I spent 400 on groceries yesterday")
  transcribed and parsed into a draft transaction.
- **Monthly budget** — one figure, tracked against spend on the dashboard.
- **CSV export** — recent transactions exported and shared from the
  Transactions screen.
- **AI assistant** — question-answering over the user's own spending.
- **Onboarding** — first-run currency and starting-balance setup.

Constraints:

- Expo SDK 58, React Native 0.88, NativeWind v4, Clerk v4 auth, Reanimated 4.
- Ships on iOS, Android, and web from one codebase; the visual language must
  feel native on each, not a website in a phone.
- Multi-currency from day one — every numeric surface needs a currency
  formatter and per-account currency, and the UI cannot hard-code a symbol.
- Data is personal-finance-grade: no analytics beacons on transaction detail,
  no third-party screenshots of numbers, secure-keyboard patterns on amount
  inputs where possible.

Undecided (recorded, not invented):

- Pricing model — free vs freemium vs paid. Not decided; does not block design.
- Backup/sync story beyond Clerk identity — not decided.

## Brand Commitments

- Name: **Lenvy**.
- Tagline: **"Every number has a purpose."**
- Voice: unsentimental, precise, quietly premium. Never chatty, never
  gamified. No exclamation points in product copy. Numbers are the hero;
  the interface recedes.
- The name and tagline are binding for store listing, splash, and onboarding.

## Evidence on Hand

- Feature list confirmed by the founder (see Capabilities above).
- No real user data, testimonials, or pricing on hand. Future design work must
  not fabricate either.
- No brand assets beyond the working app icon set from the Expo template; the
  final Lenvy glyph, wordmark, and store screenshots still need to be authored.

## Product Principles

1. **Numbers are the product.** Every surface should make the number easier
   to read, not add decoration around it. Type, colour, and layout serve the
   digit.
2. **AI is a capture mechanism, not a mascot.** Receipt scan, voice entry,
   and assistant exist to remove typing. They never replace the user's
   judgment; every AI draft is reviewable before it commits.
3. **Restraint signals trust.** A finance app earns seriousness by what it
   refuses to show. No streaks, no confetti, no badges for checking your
   balance.
4. **The whole balance sheet, not a slice.** Multi-account is the default
   shape of a real life; features that only work with one account are
   incomplete.
5. **Your data leaves with you.** CSV export, and any future sync, is a
   first-class feature, not a premium unlock.

## Accessibility & Inclusion

- Body and placeholder text ≥ 4.5:1 contrast in both schemes; large numerals
  ≥ 3:1.
- Tabular figures on every numeric style so amounts align in columns for
  low-vision and screen-magnifier users.
- All interactive targets ≥ 44×44 pt; swipe actions have an equivalent long-press
  menu.
- Reduce-motion honored: replace spring entrances with fades when
  `AccessibilityInfo.isReduceMotionEnabled` is true.
- Currency and date formatting localized; the app supports at least INR, USD,
  EUR, GBP at design time so layouts don't break on ₹ or € glyph width.
