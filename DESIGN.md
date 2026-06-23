---
name: Rental Property Workspace
description: A calm, tax-ready accounting workspace for the DIY landlord.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  surface-muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.505 0 0)"
  border: "oklch(0.922 0 0)"
  primary-ink: "oklch(0.205 0 0)"
  primary-ink-foreground: "oklch(0.985 0 0)"
  sidebar: "oklch(0.985 0 0)"
  ledger-indigo: "#4f46e5"
  status-ready: "#065f46"
  status-review: "#92400e"
  status-blocked: "#991b1b"
  status-inactive: "#334155"
  accent-info: "#0369a1"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  heading:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
  numeric:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  pill: "1.625rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-ink}"
    textColor: "{colors.primary-ink-foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 0.625rem"
    typography: "{typography.body}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 0.625rem"
    typography: "{typography.body}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 0.625rem"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0.25rem 0.625rem"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1rem"
  badge-status-ready:
    backgroundColor: "#ecfdf5"
    textColor: "{colors.status-ready}"
    rounded: "{rounded.pill}"
    height: "1.25rem"
    padding: "0 0.5rem"
  badge-status-blocked:
    backgroundColor: "#fef2f2"
    textColor: "{colors.status-blocked}"
    rounded: "{rounded.pill}"
    height: "1.25rem"
    padding: "0 0.5rem"
---

# Design System: Rental Property Workspace

## 1. Overview

**Creative North Star: "The Quiet Ledger"**

This is a record-keeper, not a marketing surface. The interface stays calm and almost
self-effacing so that the figures — gross rental income, deductible expenses, net
recorded income, readiness status — carry the trust on their own. The visual system is
built on a true-neutral grayscale canvas (chroma 0 throughout) with a single restrained
indigo accent and a tight, purpose-built semantic status palette. Nothing decorates; every
color, weight, and rule earns its place by clarifying a number or a state. The user is a
DIY landlord who is anxious about getting their T776 filing right — the design's job is to
lower that anxiety, not to perform.

Density is moderate and tabular. Money is set in tabular numerals so columns align to the
digit; status reads through a calm, low-saturation badge system ordered by filing impact,
never an alarm. Surfaces are flat, separated by hairline rings and tonal layering rather
than shadow. The result should feel like a dependable financial desk: organized, legible,
quietly precise.

This system explicitly rejects two things. It is **not legacy accounting software**
(QuickBooks/Sage-era): no dense gray toolbars, no cluttered chrome, nothing a non-accountant
would be afraid to open. And it is **not a generic AI-SaaS dashboard**: no gradient
hero-metric cards, no identical icon-card grids, no purple gradients. Restraint and
hierarchy carry the design — decoration is the failure mode.

**Key Characteristics:**
- True-neutral grayscale canvas; color appears only to mean something.
- One indigo accent (Ledger Indigo) for action and brand; semantic palette for status only.
- Flat surfaces, hairline rings, tonal layering — no decorative shadow.
- Tabular numerals everywhere money appears; precision is the brand.
- Calm signal over alarm: status guides, it never shouts.

## 2. Colors

A true-neutral grayscale foundation (every neutral is OKLCH chroma 0) carrying one indigo
accent and a small, strictly semantic status set.

### Primary
- **Ledger Indigo** (`#4f46e5`, indigo-600): The single brand accent. Primary actions,
  links, current selection, progress-bar fills, and brand marks/icon chips. It is the only
  saturated color used for *action*; everything else saturated is *status*.

### Secondary
- **Primary Ink** (`oklch(0.205 0 0)`, ≈`#262626`): The near-black used for the default
  (solid) button and the strongest text. Not a hue — it reads as authoritative neutral, not
  as a second brand color.

### Tertiary — Semantic Status
These four carry readiness and severity. Each is a tokenized tone (`--ready`, `--review`,
`--blocked`, `--inactive`, plus `--info`) with `-surface` / `-border` / `-text` sub-tokens
and a strong solid/icon value — light- and dark-aware, applied via `src/lib/status-styles.ts`
(`toneSurface` / `toneIcon` / `toneChip`), never inline Tailwind color classes. Each appears
as a tinted badge (soft fill, hairline border, readable ink). Color is never the only signal
— every status pairs with a label and usually an icon.
- **Ready Emerald** (ink `#065f46` on `#ecfdf5`): A property/record is filing-ready.
- **Review Amber** (ink `#92400e` on `#fffbeb`): Needs review; provisional or incomplete.
- **Blocked Red** (ink `#991b1b` on `#fef2f2`): A blocking exception stands between the user
  and filing.
- **Inactive Slate** (ink `#334155` on `#f8fafc`): Not active in the selected tax year; a
  resting, non-judgmental neutral state.
- **Info Sky** (`#0369a1`): Sparingly, on a single informational KPI accent chip.

### Neutral
- **Background** (`oklch(1 0 0)`, `#ffffff`): The content canvas and card surface.
- **Sidebar** (`oklch(0.985 0 0)`, ≈`#fafafa`): The second neutral layer — sidebar and
  toolbars sit one step off pure white to separate navigation from content.
- **Surface Muted** (`oklch(0.97 0 0)`, ≈`#f7f7f7`): Track fills, hover states, muted panels,
  progress-bar tracks.
- **Foreground** (`oklch(0.145 0 0)`, ≈`#252525`): Primary text and headings.
- **Muted Foreground** (`oklch(0.505 0 0)`, ≈`#6e6e6e`): Secondary hints and descriptions.
  Darkened from the old `0.556` so it clears WCAG AA 4.5:1 (~5:1) on white — see the Contrast
  Floor Rule.
- **Border** (`oklch(0.922 0 0)`, ≈`#ededed`): Hairline borders, dividers, input strokes.
- **Destructive** (`oklch(0.577 0.245 27.325)`): The semantic destructive token — used as a
  *soft 10% tint* on destructive buttons/badges and for `aria-invalid` rings, not as a solid
  fill.

### Named Rules
**The One Accent Rule.** Ledger Indigo is the *only* color used for action and brand.
Emerald / amber / red / slate are reserved exclusively for status. If a saturated color is
on screen and it isn't indigo, it must be communicating a readiness or severity state — never
decoration, never a second brand color.

**The Contrast Floor Rule.** Muted Foreground is set to ≈`#6e6e6e` (~5:1 on white) so it
clears WCAG AA 4.5:1 for body text. Even so, reserve it for genuinely secondary hints; primary
reading text and essential labels use Foreground. Never lighten it back toward the old
`#8a8a8a` (~3.5:1) "for elegance" — that fails AA.

**The Soft-Destructive Rule.** Destructive intent is shown as a 10% tint with colored ink
(`bg-destructive/10 text-destructive`), never a solid red fill. Even danger stays calm.

## 3. Typography

**Display / Body Font:** Inter (with `ui-sans-serif, system-ui, sans-serif`)
**Numeric/Mono Font:** Geist Mono (backs the `--font-mono` token)

**Character:** One humanist sans (Inter) carries the entire interface — headings, titles,
body, labels, and data. There is no display/body pairing; in a product this dense, a second
family would add noise, not voice. Precision comes from *numerics*, not from a second
typeface: every monetary figure uses tabular numerals so digits align in columns.

### Hierarchy
- **Heading** (600, `1.5rem`/text-2xl, line-height 1.2, tracking `-0.02em`): Page titles
  ("Portfolio dashboard"). Use `text-wrap: balance`.
- **Title** (500, `1rem`/text-base, line-height 1.375): Card and section titles.
- **Body** (400, `0.875rem`/text-sm, line-height 1.5): The dominant text size across the
  app. Prose caps at 65–75ch; dense tables may run wider.
- **Label** (500, `0.75rem`/text-xs, tracking `0.05em`, uppercase): KPI and field labels —
  small, medium-weight, lightly tracked uppercase.
- **Numeric** (600, `1.5rem`, `tabular-nums`): KPI values and money. Always tabular.

### Named Rules
**The Tabular Money Rule.** Every monetary value, count, and percentage uses
`font-variant-numeric: tabular-nums` (Tailwind `tabular-nums`). Money never reflows column
alignment as digits change. This is the single most important typographic signal of
precision in the system.

**The One Family Rule.** Inter carries everything. Geist Mono is available for raw
code/identifiers only; do not introduce a display or serif face for "personality" — the
personality is restraint.

## 4. Elevation

The system is **flat by default**. Depth is conveyed through hairline rings and tonal
layering, not drop shadows. Cards do not cast shadows; they are separated from the canvas by
a 1px ring at `foreground/10` and, where needed, by the one-step tonal shift between the pure
-white content surface and the off-white sidebar/muted panels. Transient surfaces that the
platform owns — popovers, selects, dialogs — may use their default menu shadow, but content
surfaces stay flat.

### Named Rules
**The Hairline Ring Rule.** Cards and contained surfaces use `ring-1 ring-foreground/10`
(a 1px hairline), not a heavy border and not a shadow. The ring is the only thing lifting a
card off the canvas. Never add a drop shadow to a content card to "make it pop."

**The Tonal Layer Rule.** When two surfaces must read as distinct (sidebar vs. content,
footer vs. body, track vs. fill), separate them by one tonal step on the grayscale ramp, not
by elevation.

## 5. Components

### Buttons
- **Shape:** Gently rounded (`0.625rem` / 10px, `rounded-lg`); compact `h-8` (32px) default,
  with `xs`/`sm`/`lg`/`icon` sizes.
- **Primary:** Primary Ink fill (`oklch(0.205 0 0)`) with near-white text; `hover` lightens
  to ~80% ink. The solid, confident action.
- **Outline:** White fill, hairline border (`border`), text in Foreground; `hover` fills with
  Surface Muted. The default secondary action.
- **Ghost:** No fill at rest; `hover` fills with Surface Muted. For low-emphasis/toolbar use.
- **Destructive:** Soft — `bg-destructive/10` with destructive-colored text, never a solid
  red fill (see Soft-Destructive Rule).
- **Hover / Focus / Active:** `transition-all`; `focus-visible` shows a 3px ring at
  `ring/50` plus a ring-colored border; `active` nudges down 1px (`translate-y-px`).

### Chips / Badges
- **Shape:** Full pill (`rounded-4xl` / `1.625rem` at `h-5`), `text-xs`, `font-medium`.
- **Status variants:** The semantic workhorse. Built as `outline` badges with explicit
  status classes: emerald / amber / red / slate, each as 50-fill + 300-border + 700/800-ink.
  Always paired with a text label (and usually a leading icon).
- **Count badges:** Neutral `outline` badges carrying a number next to an item label.

### Cards / Containers
- **Corner Style:** `0.875rem` / 14px (`rounded-xl`).
- **Background:** Background white (`bg-card`); footers shift to `bg-muted/50`.
- **Elevation:** Flat — `ring-1 ring-foreground/10` hairline, no shadow (see Elevation).
- **Internal Padding:** `1rem` (16px); `sm` size drops to `0.75rem` (12px).
- **Empty states:** Dashed-border card, centered icon chip, a teaching headline and one line
  of guidance ("Add your first property") — never a bare "nothing here."

### Inputs / Fields
- **Style:** `h-8` (32px), hairline `border-input`, transparent fill, `rounded-lg` (10px),
  `text-sm`.
- **Focus:** Border shifts to `ring` and a 3px `ring/50` halo appears — a quiet, non-glowing
  focus.
- **Placeholder:** Muted Foreground — acceptable as placeholder, never as the only label.
- **Error / Disabled:** `aria-invalid` shows a destructive border + ring; disabled drops to
  50% opacity with a muted fill.

### Navigation
- **Style:** A collapsible left sidebar on the second neutral layer (off-white), with a
  sticky top header (`h-14`) carrying the sidebar trigger and a `ModeToggle`. Active item
  reads through the `sidebar-accent` tonal fill, not a colored stripe. Responsive behavior is
  structural: the sidebar collapses to icon mode / hides on mobile, content reflows — type
  sizes do not fluidly scale.

### Signature — KPI Stat Card
The dashboard's financial header. A flat ring card with: a small uppercase **Label**, a large
**tabular Numeric** value, and a colored icon chip (`size-9`, `rounded-lg`, status-50 fill +
status-700 icon) top-right. A bordered footer row carries a one-line hint and either the tax
year or a calm amber **"Incomplete"** badge when totals are provisional. This is the system's
answer to — and deliberate rejection of — the gradient hero-metric SaaS template: same job,
flat and honest instead of decorated.

### Signature — Category Progress Bar
The T776 expense breakdown. A row of label + tabular amount above a 2px-tall track
(`rounded-full`, Surface Muted) with a Ledger Indigo fill; the whole row links to the filtered
transactions and underlines its label on hover. Proportion is shown by bar width plus an
explicit "% of recorded deductible expenses" caption — never width alone.

## 6. Do's and Don'ts

### Do:
- **Do** keep Ledger Indigo (`#4f46e5`) as the *only* action/brand color; reserve emerald /
  amber / red / slate strictly for readiness and severity (The One Accent Rule).
- **Do** set every monetary value, count, and percentage in `tabular-nums` (The Tabular Money
  Rule).
- **Do** lift cards with a `ring-1 ring-foreground/10` hairline and tonal layering — flat,
  no drop shadow (The Hairline Ring Rule).
- **Do** show destructive intent as a soft `destructive/10` tint with colored ink, never a
  solid red (The Soft-Destructive Rule).
- **Do** pair every status color with a text label and (usually) an icon, so meaning survives
  for color-blind users and grayscale print.
- **Do** verify body text hits WCAG AA 4.5:1; step toward Foreground rather than relying on
  Muted Foreground for anything a user must read (The Contrast Floor Rule).
- **Do** make empty states teach the interface (icon + headline + one guiding line).

### Don't:
- **Don't** make this look like **legacy accounting software** — no dense gray toolbars, no
  cluttered chrome, nothing intimidating to a non-accountant. (PRODUCT.md anti-reference.)
- **Don't** make this look like a **generic AI-SaaS dashboard** — no gradient hero-metric
  cards, no identical icon-card grids, no purple gradients. (PRODUCT.md anti-reference.)
- **Don't** use a second brand hue. If a saturated color isn't indigo, it must be status.
- **Don't** add drop shadows to content cards to make them "pop."
- **Don't** use `muted-foreground` (≈`#6e6e6e`) for primary reading text or essential labels,
  and never lighten it back toward `#8a8a8a` (~3.5:1) — that fails AA.
- **Don't** reintroduce raw Tailwind status colors (`bg-emerald-50`, `text-red-700`, …); route
  every status through the `--ready/--review/--blocked/--info/--inactive` tokens and
  `src/lib/status-styles.ts`.
- **Don't** use `border-left`/`border-right` colored stripes on cards, rows, or alerts; use
  full hairline rings, tinted fills, or leading icons.
- **Don't** use `background-clip: text` gradient text, decorative glassmorphism, or alarm-red
  full fills for ordinary states.
- **Don't** introduce a display or serif typeface for personality — restraint is the voice.
