---
target: Portfolio dashboard (redesign baseline)
total_score: 31
p0_count: 0
p1_count: 3
timestamp: 2026-06-24T00-52-23Z
slug: src-app-dashboard-page-tsx
---
# Critique — Portfolio dashboard (`src/app/dashboard/page.tsx`)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Status, readiness counts, "Incomplete" badges, skeletons all present |
| 2 | Match System / Real World | 4 | Plain language + T776 naming + provenance hints; speaks the landlord's language |
| 3 | User Control and Freedom | 3 | Year filter needs an explicit Apply click rather than instant filtering |
| 4 | Consistency and Standards | 3 | Token system enforces consistency, but KPI icon-chip colors are decorative — violates the project's own One Accent Rule |
| 5 | Error Prevention | 3 | Read-only surface; little to prevent |
| 6 | Recognition Rather Than Recall | 4 | Labeled nav, inline hints under every figure |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts, no saved views, no quick-add; thin for a recurring monthly user |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and uncluttered, but flat internal hierarchy and decorative chips |
| 9 | Error Recovery | 3 | Strong empty-portfolio state; other error/edge states not surfaced |
| 10 | Help and Documentation | 3 | Good inline contextual hints; no deeper/contextual help on anomalies |
| **Total** | | **31/40** | **Good — solid foundation, weak areas in identity, hierarchy, and efficiency** |

## Anti-Patterns Verdict

**Cheap-AI-slop test: passes.** No gradient hero-metric cards, no purple, no identical icon+heading+lorem grids, no glassmorphism. Tabular numerals, real semantic status tokens, an honest empty state. The deterministic detector returned **zero findings**.

**Product-slop test (the one that matters here): the design is competent but anonymous.** Strip the copy and this reads as a default shadcn/ui project. The chroma-0 canvas plus a single indigo that barely appears means the interface has no memorable identity. For a "refresh the identity" brief, *anonymous* is precisely the problem to solve — restraint has tipped into facelessness.

## Overall Impression

Genuinely well-built, disciplined product UI that executes "The Quiet Ledger" faithfully. The single biggest opportunity: the page is all evenly-weighted grayscale cards with no focal point and almost no brand color, so nothing tells the eye what matters most — and the product's headline number (net recorded income) is currently the easiest thing to miss.

## What's Working

1. **The attention panel is the best thing on the page.** Ordered by filing impact, blocking vs. review counts, icon + label + property + detail + a "Review" CTA per row. This is the product thesis made visible.
2. **Provenance hints under each figure** ("Income earned on an accrual basis", "Categorized T776 current expenses") are real contextual help that lowers tax anxiety.
3. **Status is never color-alone** — every badge pairs tone with a label, and the muted foreground was deliberately tuned to clear WCAG AA.

## Priority Issues

- **[P1] No visual hierarchy in the KPI row.** Four identical cards, equal weight. "Net recorded rental income" — the number the entire product exists to produce — looks exactly like "Payments received." Nothing is the hero.
  - **Why it matters:** The user's first question is "where do I stand?" The layout doesn't answer it; it makes them read four boxes equally.
  - **Fix:** Promote net recorded income to a primary figure (larger, anchored, given its own treatment); demote the other three to supporting stats. Break the 4-equal-card reflex.
  - **Suggested command:** `/impeccable layout`

- **[P1] The headline number is negative and rendered like any other figure.** `-$605.00` in plain foreground. A recorded loss is the most important signal on the page and it has no semantic or visual distinction, and no provenance for *why* it's negative while setup is flagged "Blocked."
  - **Why it matters:** For an anxious DIY landlord, a confident unexplained negative is an emotional valley and undercuts "every number is defensible."
  - **Fix:** Give negative net a calm distinct treatment and a provenance line ("provisional — property setup incomplete"). Tie it to the blocking item.
  - **Suggested command:** `/impeccable colorize`

- **[P1] The brand has no presence — color is nearly absent.** The only color on screen lives in tiny status badges and 9px icon chips; remove one chip and the page is pure grayscale. The "Add property" primary action is near-black, not the brand indigo. There is no recognizable palette.
  - **Why it matters:** This is the core of the refresh. Calm and trustworthy does not require colorless. Identity is currently carried by nothing.
  - **Fix:** Develop a committed-but-calm palette strategy where the brand actually appears (primary action, key figure, selection), and define a deliberate role for color beyond status.
  - **Suggested command:** `/impeccable colorize`

- **[P2] KPI icon chips use color decoratively — violates the project's own rules.** Green on "Gross income", amber on "Deductible expenses", blue on "Payments" assign status hues to metrics that aren't ready/review/info states. DESIGN.md's One Accent Rule says a saturated color must mean a state, never decoration.
  - **Why it matters:** Internal inconsistency, and on close inspection it's an icon-per-metric decorative tell.
  - **Fix:** Drop the per-metric colored chips or make the color mean something (e.g. directional in/out), and reserve status hues for status.
  - **Suggested command:** `/impeccable quieter`

- **[P2] Flat typographic texture and uniform card rhythm.** One family across a narrow size range; section titles read at similar weights; three stacked card bands share identical radius/padding/background. The money — which should be the brand's voice — isn't typographically distinct.
  - **Why it matters:** Nothing anchors the eye; the page has no scan path, which reads as "default" rather than "designed."
  - **Fix:** Sharpen the type scale, give monetary figures a distinct numeric treatment, and vary section rhythm so the page has a hierarchy of bands, not a stack of equals.
  - **Suggested command:** `/impeccable typeset`

## Persona Red Flags

**Dana (DIY landlord, anxious, monthly user — project persona):** Lands on a `-$605.00` headline in plain black with no answer to "is this bad, normal, or just because my setup isn't finished?" The attention panel says "Complete property setup" but the KPIs present definitive totals — she can't tell if the loss is real. The product promises to lower anxiety; this moment raises it.

**Alex (power user):** Year filter requires an Apply click instead of filtering instantly. No keyboard shortcuts, no saved views, no quick-add from the dashboard. For someone touching this monthly, every interaction is mouse-driven and slower than it needs to be.

**Sam (accessibility):** Mostly strong — status pairs label + icon, focus rings are tokenized, muted foreground clears AA. Remaining gap: a negative/loss figure is distinguished only by a minus glyph in the same color, so the single most important state isn't reinforced for low-vision scanning.

## Minor Observations

- Redundant chrome: sidebar "Rental Workspace · Property accounting", top bar "Property accounting workspace", and H1 "Portfolio dashboard" are three overlapping labels.
- Everything on the page is a card in a single column — "cards are the lazy answer" applies; some bands could be plain sectioned regions.
- "Net recorded rental income" is an accurate but heavy label for the page's most important figure.

## Questions to Consider

- What would the dashboard look like if net recorded income were unmistakably the hero and the other three figures clearly supported it?
- Where should the brand color actually live so the product is recognizable without becoming loud?
- Can a recorded loss feel *calm and explained* instead of alarming or ambiguous?
