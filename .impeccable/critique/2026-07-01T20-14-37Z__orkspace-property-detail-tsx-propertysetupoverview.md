---
target: "src/components/property-workspace/property-detail.tsx#PropertySetupOverview"
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-07-01T20-14-37Z
slug: orkspace-property-detail-tsx-propertysetupoverview
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Status is visible, but readiness is repeated as percent, gap badge, progress, counts, and task badges. |
| 2 | Match System / Real World | 3 | Plain labels work, but setup readiness and overall readiness blur together. |
| 3 | User Control and Freedom | 3 | Year controls are clear, but visually compete with the setup card's purpose. |
| 4 | Consistency and Standards | 3 | Uses established cards, badges, progress, and status styles; density is inconsistent with nearby folded setup sections. |
| 5 | Error Prevention | 2 | Missing ownership share is visible but not promoted as the obvious next action. |
| 6 | Recognition Rather Than Recall | 3 | Tasks are explicit, but the user has to scan repeated rows and metrics to find what matters. |
| 7 | Flexibility and Efficiency | 2 | Returning users pay a large vertical cost before routine rent/evidence work. |
| 8 | Aesthetic and Minimalist Design | 2 | The component is spatially expensive and duplicates information across several treatments. |
| 9 | Error Recovery | 2 | Missing state is labelled but not actionable from the overview. |
| 10 | Help and Documentation | 3 | Detail copy is useful, but completed task explanations should be secondary. |
| **Total** | | **26/40** | **Acceptable: solid foundation, significant compression needed** |

## Anti-Patterns Verdict

This does not look like generic AI-SaaS: no gradient hero metrics, decorative shadows, glass, or arbitrary color. The slop risk is product-UI over-explanation. The card turns a setup checkpoint into a mini dashboard: title, metadata, year selector, two status badges, progress, fact list, and four equal-weight task rows.

Deterministic scan found 0 issues in `src/components/property-workspace/property-detail.tsx`.

Browser inspection confirmed the issue in the live layout: the overview card occupies most of the first viewport before the folded setup and lease controls appear.

## Overall Impression

The component is calm, trustworthy, and clear, but it is too ceremonious for what it is. It should tell the landlord: this property has 1 setup gap, ownership shares are missing, continue. Instead it asks them to process five versions of the same readiness state.

## What's Working

- The visual system is on-brand: flat surfaces, restrained colors, semantic status, tabular numbers.
- The missing ownership shares row is understandable and non-alarming.
- Status meaning is not color-only; labels and icons carry the state.

## Priority Issues

**[P1] The overview consumes too much vertical space**
Why it matters: It pushes operational work below the fold even for returning users.
Fix: Collapse readiness, counts, and task state into a compact header strip. Keep the property identity, year control, one status badge, and one next-action line visible.
Suggested command: `$impeccable distill`

**[P1] Readiness is duplicated across too many surfaces**
Why it matters: `75% ready`, `1 setup gap`, `3 of 4`, progress bar, counts, and task badges make a simple state feel complicated.
Fix: Use one primary readiness statement: `1 setup gap: ownership shares missing`. Treat percent/progress as secondary or remove it for four-item setup.
Suggested command: `$impeccable clarify`

**[P2] Completed tasks are louder than the unresolved task deserves**
Why it matters: The user has to scan through three successful rows to find the blocker.
Fix: Show incomplete/review-needed tasks by default. Collapse completed checks into a single quiet confirmation line.
Suggested command: `$impeccable layout`

**[P2] The setup overview and folded setup accordion overlap conceptually**
Why it matters: One section summarizes setup while the next section manages setup, but both are large enough to feel like primary surfaces.
Fix: Merge the overview and management affordance: compact setup health header with an expandable details/manage area.
Suggested command: `$impeccable shape`

**[P3] Date and summary copy can feel more human**
Why it matters: `Acquired 2021-04-15` is precise but mechanical.
Fix: Format dates more naturally if space allows, e.g. `Acquired Apr 15, 2021`.
Suggested command: `$impeccable polish`

## Persona Red Flags

**Alex (Power User)**: Wants to log rent or fix the one blocker quickly. The current card forces Alex through a dashboard-scale overview before the actionable work.

**Jordan (First-Timer)**: Understands each row, but may not know whether `75% ready`, `1 setup gap`, and `Missing` are separate problems or the same problem.

**Sam (Accessibility-Dependent User)**: The semantic content is mostly readable, but repeated status information increases linear navigation length before primary workflows.

**DIY landlord**: Needs reassurance and a clear filing risk. The card says many true things, but the most useful sentence is buried: ownership shares total 75% and need fixing.

## Minor Observations

- The `h1` inside this card makes the card double as a page header and readiness module.
- The fact list duplicates the task list for units, owners, and ownership periods.
- The progress bar is less useful when there are only four setup tasks.
- The task rows use equal weight; the missing row should be the only loud row.

## Questions to Consider

- If there is exactly one setup gap, why not make that the headline?
- Does a four-item checklist need a percentage at all?
- Should completed setup details disappear into the existing folded setup accordion?
