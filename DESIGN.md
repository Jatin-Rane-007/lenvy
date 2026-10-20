# Design — Lenvy

<!-- impeccable:design-schema 1 -->

Visual world for **Lenvy** ("Every number has a purpose."). This file is the
authority for colour, type, spacing, radius, elevation, motion, and component
behaviour. Anything a future screen needs that isn't here is decided by
matching the closest rule below, not by inventing a new one.

## Mode

**Operate.** The visitor (the user) completes a task on their own money. Scan-
ability, consistency, and native expectations outrank expression. Brand lives
in the details — a Fraunces-set balance number, an evergreen chip, the spring
on a press — not in loud ornament.

## Aesthetic: Spatial with maximalist accents

Depth is the primary organising principle. The screen is a stack of five
elevation layers (L0 canvas → L4 overlay); data lives on flat surfaces, tools
float above them. Colour is restrained and mostly neutral so the numbers and
the accent carry meaning. Maximalism is allowed in exactly one place per
screen: the display serif on the hero balance, or a single saturated accent
moment. Anywhere else it is a defect.

## Two schemes, one system

Both `light` and `dark` ship on every surface, driven by `useColorScheme` via
`ThemeProvider`. Semantics (`canvas`, `ink`, `accent`) never change names
between schemes; only values do. Never reference a raw hex in a component —
go through `useTheme().colors`.

## Palette (semantic, not literal)

Light base is a very slightly warm parchment (`#F4F2EE`) against a deep
blue-charcoal ink (`#0A0D12`). Dark base is deep slate (`#0A0D12`) with the
same parchment as ink. Brand accent is **Evergreen** — `#1E4D3B` in light,
`#7CD3A0` in dark; the shift is deliberate because a saturated dark green
reads as a hole against near-black, whereas luminous mint reads as
intentional. Income uses a fresher green (`#3F8F5A` / `#6BD08C`) that is
visibly *different* from the brand green so a chart full of income bars
doesn't turn into brand noise. Expense is burnt clay (`#B8452F` / `#E67A5C`)
— never pure red, which reads as an error. Caution is ochre. Info is slate
blue. Ten muted category swatches cover chart and chip use; they are all
low-saturation and coexist in the same donut without fighting.

Full token tables live in `src/theme/tokens.ts` and `src/theme/semantic.ts`.

## Typography

Two loaded faces, one mono:

- **Fraunces** (variable, optical-size 144, SOFT 40, WONK 1) — the *soul* of
  the app. Display only. Hero balance, onboarding titles, section headings on
  the dashboard. Nothing else earns Fraunces.
- **Inter** — every UI string, every numeric style (with `tabular-nums`
  forced on). Weights: 400 body, 500 caption/numeric, 600 subhead/strong/
  micro/numeric-L.
- **JetBrains Mono** — CSV preview, account mask digits, developer-y surfaces.

Scale (mobile-first):

| Token        | Size / LH | Face            | Use |
|--------------|-----------|-----------------|-----|
| `displayXl`  | 56 / 60   | Fraunces 400    | Hero balance number (one per dashboard) |
| `displayL`   | 40 / 44   | Fraunces 400    | Onboarding step titles, sheet titles |
| `heading`    | 24 / 30   | Fraunces 400    | Section headings |
| `subhead`    | 17 / 22   | Inter 600       | Card titles, modal titles |
| `body`       | 15 / 22   | Inter 400       | Default copy |
| `bodyStrong` | 15 / 22   | Inter 600       | Inline emphasis |
| `caption`    | 13 / 18   | Inter 500       | Meta, timestamps, chart axis |
| `micro`      | 11 / 14   | Inter 600 · 0.08em · uppercase | Kicker labels ("SPENDING") — see rule below |
| `numericL`   | 22 / 26   | Inter 600 tnum  | Transaction amounts |
| `numericM`   | 15 / 20   | Inter 500 tnum  | Inline stats |
| `mono`       | 13 / 18   | JetBrains Mono 500 | CSV cells, masked digits |

Rule against the craft-floor: **no kickers above headings** as decoration.
`micro` exists only as inline status labels inside chips and table headers,
never as an eyebrow riding a display title.

## Spacing

4-pt base. Scale: `0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 80 · 112`.

- Screen gutter: `20` (not 16 — reads more premium).
- Card internal pad: `16`.
- Between sections: `32`.
- Hero top pad on dashboard: `56`.
- Tight groups (chips in a row, label above value): `4` or `8`.

## Radius

`xs 6 · sm 10 · md 14 · lg 20 · xl 28 · 2xl 40 · full 9999`.

Asymmetry is the identity: data rows and inputs stay tight (`md`), hero and
floating surfaces open up (`xl` / `2xl`). Sheets use `xl` top corners only.
Never a fully-rounded button inside a tightly-rounded card — the mismatch
reads as an accident.

## Elevation

Five layers. The recipe changes subtly between schemes because shadows barely
show on a dark canvas; on `dark`, elevation is carried by surface colour
step-up + hairline border first, shadow second.

| Level | Where | Recipe (light) | Recipe (dark) |
|-------|-------|----------------|----------------|
| L0 canvas | Screen bg | none | none |
| L1 surface | List rows, quiet cards | 1px `hairline` border, shadow `0/1/2/6%` | 1px `hairline` border only |
| L2 raised | Sticky header, filter bar, active card | shadow `0/4/12/8%` | surface step-up + shadow `0/4/12/14%` |
| L3 floating | Bottom sheet (half detent), FAB, Assistant bar | shadow `0/12/32/12%`, `expo-glass-effect` blur 20, tint `surface/92%` | shadow `0/16/40/24%`, glass blur 20 |
| L4 overlay | Dialog, receipt scan frame, voice stage | shadow `0/24/64/20%`, blur 40, `overlay` scrim behind | shadow `0/24/64/32%`, blur 40, heavier scrim |

Every shadow carries an offset + a blur. Zero-offset coloured halos are
forbidden as decoration.

## Motion

Reanimated 4. Three spring presets, three durations, one easing. Every
numeric change rolls on `spring.gentle`; every press dips to 0.94 on
`spring.snap`; the AI orb breathes on a 2.4 s ease-in-out.

- `spring.snap` — damping 22, stiffness 320, mass 0.8 (buttons, row highlight)
- `spring.gentle` — damping 20, stiffness 140 (sheets, tab crossfade, number roll)
- `spring.bouncy` — damping 12, stiffness 180 (AI orb pop-in, budget milestone)
- Durations: fast 120 ms · base 220 ms · slow 420 ms
- Positional easing: `cubic-bezier(0.32, 0.72, 0, 1)`

Reduce-motion (AccessibilityInfo) collapses spring to a fade and drops the
orb's breathing to a static ring.

## Signature moments

1. **Hero balance** — Fraunces 56 pt, no card chrome, sits on `canvas`.
   Under it a whisper-thin sparkline (4 pt, 40 % opacity, last 90 days). One
   per dashboard, never per card.
2. **Budget rail** — single horizontal bar, coloured by state at three
   thresholds (`accent` ≤ 60 %, `caution` 60–90 %, `negative` > 90 %). The
   percentage label rides the fill head as a chip.
3. **AI orb** — 24 pt circle, radial-gradient `accent → info`, breathing
   scale 0.98 ↔ 1.02. Grows into a full-width voice stage on hold.
4. **Receipt scan frame** — L4 overlay with four thin corner ticks that snap
   inward when Gemini locks the merchant. Delight, not decoration.
5. **Category chip glow** — 1 px inner ring of the swatch at 40 % on the
   selected state; unselected is flat hairline text.

## Component inventory

Six tiers under `src/components/`. Tier 1 primitives exist this pass; Tiers
2–6 land feature-by-feature.

- **Primitives** — Text, Box, Screen, Button, IconButton, Chip, Divider,
  Badge, Avatar.
- **Form** — TextField, SelectField, SegmentedControl, Toggle, Slider,
  DatePicker.
- **Data** — StatCard, AmountText, ProgressBar, Sparkline, BarChart,
  DonutChart, TransactionRow, AccountRow, CategoryGlyph.
- **Overlays** — BottomSheet, Dialog, Toast, Fab, GlassPanel, TabBar.
- **AI** — AssistantBar, AiOrb, VoiceStage, ReceiptFrame, AiSuggestionRow,
  AskAnswer.
- **Feedback** — Skeleton, EmptyState, ErrorState, LoadingBlock.

## Navigation shape

Five-tab bottom bar (locked): Home / Accounts / Activity / Assistant /
Profile. Active indicator morphs on `spring.gentle`. SF Symbols on iOS,
Lucide on Android/Web. Not implemented this pass — the tab bar reshapes when
the first Accounts/Activity/Assistant screens land.

## Rules the system enforces (from the craft floor)

- Body and placeholder text ≥ 4.5:1; large numerals ≥ 3:1.
- Secondary text on a coloured surface is tinted from that hue, never gray.
- Every shadow has offset + blur.
- No eyebrow above a heading.
- No gradient text. Emphasis is weight or size only.
- No glass/blur as decoration; glass appears only where a floating surface
  genuinely needs to reveal content below it (Assistant bar, sheets).
- No colored `border-left` above 1 px on cards.
- No hard-offset zero-blur shadows (neobrutalism is not this world).
- No Unicode glyphs or emoji as icons — icons come from a real library.
- Tabular figures mandatory on every numeric style.

## Where tokens live in code

```
src/theme/
  tokens.ts        raw palette, spacing, radii, typography, fonts
  semantic.ts      light + dark role maps (canvas, ink, accent, …)
  elevation.ts     L0-L4 recipes per scheme
  motion.ts        springs, durations, easings
  fonts.ts         useLenvyFonts() hook
  ThemeProvider.tsx  useTheme() context + provider
  index.ts         barrel
```

`src/global.css` mirrors the palette as CSS variables so NativeWind classes
can consume them on web without a re-flow through JS.
