---
target: src/app/properties/[propertyId]/page.tsx
total_score: 25
p0_count: 0
p1_count: 3
timestamp: 2026-07-01T21-37-55Z
slug: src-app-properties-propertyid-page-tsx
---
# Property Workspace Critique

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Readiness state is visible, but mutations have little pending/success feedback and the loading skeleton is shallow. |
| 2 | Match System / Real World | 3 | Plain tax/property language is mostly strong; the ownership blocker still needs a clearer path to "fix shares to 100%". |
| 3 | User Control and Freedom | 2 | Sheets give exits, but destructive actions rely on native confirms and there is no undo or recovery path. |
| 4 | Consistency and Standards | 3 | Components are mostly consistent; accordion heading semantics and nested card patterns drift. |
| 5 | Error Prevention | 2 | Required fields and disabled rent submit help, but mortgage submit is available before required fields and ownership math lacks direct correction. |
| 6 | Recognition Rather Than Recall | 3 | Labels and sections are visible; the primary readiness fix is buried behind an accordion. |
| 7 | Flexibility and Efficiency | 2 | "Use last payment" helps, but common workflows are still one-record-at-a-time with few accelerators. |
| 8 | Aesthetic and Minimalist Design | 2 | The surface is calm, but too many framed panels compete and expose data-entry complexity early. |
| 9 | Error Recovery | 2 | Form errors exist, but recovery is not consistently contextual or paired with success confirmation. |
| 10 | Help and Documentation | 2 | Some explanatory copy is good, but high-stakes tax decisions have limited inline guidance. |
| **Total** | | **25/40** | **Acceptable - solid system, overloaded page** |

## Anti-Patterns Verdict

**LLM assessment:** This does not scream AI-generated. The restraint, tokenized status colors, tabular financial values, and plain copy fit the product's "quiet ledger" direction. The risk is different: the page reads like a competent component stack more than a confident workflow. The first viewport tells the user there is one setup gap, but the fix is not the primary action. Lower down, cards contain more cards, metric boxes, forms, and empty states until every unit of information has the same weight.

**Deterministic scan:** CLI scan of `page.tsx`, `property-workspace.tsx`, and `property-detail.tsx` returned `[]`.

**Browser overlay:** Live DOM overlay injection succeeded and reported 23 findings: 13 `nested-cards`, 5 `layout-transition`, 1 `cramped-padding`, 1 `skipped-heading`, and 3 typography findings (`overused-font`, `single-font`, `flat-type-hierarchy`). The single-font findings are mostly false positives because the design system intentionally uses Inter only. The nested-card, skipped-heading, cramped-padding, and layout-transition findings are useful.

## Overall Impression

The page has a strong foundation but weak prioritization. It should feel like: "Here is the one thing preventing this property from being tax-ready." Instead, it feels like: "Here is every property bookkeeping module on one route." The biggest opportunity is to turn the property page into a readiness-led workspace with a clear next action, then progressively reveal entry tools.

## What's Working

1. The top property context is useful: property name, address, acquisition date, tax year, and setup gap are immediately visible.
2. The color system is disciplined. Status tones are meaningful and the UI avoids decorative gradients or alarm-red fills.
3. The copy is often product-appropriate: "Interest is deductible; principal is kept for support" is plain, useful, and confidence-building.

## Priority Issues

### [P1] The readiness blocker is not actionable enough

**Why it matters:** The page says "1 setup gap: Ownership shares" and "Shares total 75% on April 15," but the user's next step is hidden in a collapsed setup accordion. For a tax-readiness product, a blocker should point straight to correction.

**Fix:** Add a primary readiness action in the overview: "Fix ownership shares". It should open the relevant ownership editor or scroll/open `Property setup` with ownership focused. Keep the full setup accordion as backup detail.

**Suggested command:** `$impeccable layout`

### [P1] The page exposes too many workflows at once

**Why it matters:** Setup, leases, mortgage payments, rent payments, deductions, rent history, and evidence review all appear in one long workspace. That makes the user process multiple unrelated decisions before completing the one tax-critical gap.

**Fix:** Reframe the route into a hierarchy: readiness summary and next action first; then collapsible workflow groups for setup, rent, mortgage, expenses, and evidence. Default-open only the group needed for the current readiness state.

**Suggested command:** `$impeccable distill`

### [P1] Accordion heading semantics are noisy and partially invalid

**Why it matters:** The accessibility snapshot reports an H1 followed by H3 accordion headings, and the lease trigger places a `CardTitle as="h2"` inside the accordion trigger button. Screen reader users get headings such as "Property setup 1 unit - 1 owner Complete - edit anytime" rather than clean section structure.

**Fix:** Put real section headings outside accordion triggers, or make triggers simple buttons with `aria-describedby` for summary text. Keep heading order H1 -> H2 -> H3 and avoid heading elements inside trigger buttons.

**Suggested command:** `$impeccable audit`

### [P2] Mortgage submit action appears before the form fields on mobile

**Why it matters:** On mobile, "Add payment" appears before payment date, lender, total, and breakdown fields. It invites premature submission and then relies on browser validation instead of product guidance.

**Fix:** Move the submit action to the end of the form on mobile, or make it a sticky form footer. Disable it until required fields are valid. Keep "Use last payment" as the header action when available.

**Suggested command:** `$impeccable adapt`

### [P2] Nested cards flatten the visual hierarchy

**Why it matters:** The live overlay flagged nested cards across summary strips, metric boxes, empty states, and contained forms. The result is calm but boxy: everything is framed, so nothing feels primary.

**Fix:** Use fewer card boundaries. Turn inner metrics into definition-list rows or tonal bands, turn empty states into inline rows, and reserve full cards for top-level workflows.

**Suggested command:** `$impeccable polish`

## Persona Red Flags

**Jordan (First-Timer):** Sees the ownership gap but does not get a direct "fix this" path. The wording is clear, but the action is discoverability-dependent: Jordan must infer that opening Property setup leads to ownership correction.

**Sam (Keyboard / Screen Reader):** The heading outline is noisy after the H1, accordion trigger names include counts and status copy, and rich heading content sits inside triggers. This raises navigation cost for a screen reader user.

**Casey (Distracted Mobile User):** The mobile layout is readable, but the mortgage form places the submit button before the required fields. Casey can tap the action before understanding what the form needs.

## Minor Observations

- The route skeleton is generic and does not reserve the same structure as the loaded page's readiness overview.
- The not-found state exposes the raw property id and gives text guidance, but no dashboard button.
- The default page title "Property Workspace" is generic; including the property name would help browser history and tabs.
- Native `window.confirm` delete flows are functional but visually outside the product system.
- The one-font detector finding should be ignored for this project; it matches DESIGN.md.

## Questions to Consider

- What if the first viewport had exactly one primary action: "Fix ownership shares"?
- Which workflows need to be always visible, and which should stay collapsed until the user asks for them?
- Should mortgage entry live this high on the property page, or does it belong behind a dedicated "Monthly records" workflow?
