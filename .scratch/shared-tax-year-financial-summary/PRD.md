Status: ready-for-agent

## Problem Statement

Tax Year financial summary logic is duplicated across property-level, portfolio-level, and Year-End Package surfaces. The same concepts are calculated in multiple places: Gross Rental Income, Payments Received, Deductible Expenses, Net Recorded Rental Income, prepaid allocation, mortgage interest inclusion, and incomplete transaction counts.

From a user's perspective, duplicated tax-support math is risky. The Property Workspace, Portfolio Dashboard, and Year-End Package should tell the same story for the same records and Tax Year. When the logic is scattered, a future bug fix can make one surface more correct while another silently drifts.

## Solution

Create a shared Tax Year financial summary domain helper that all relevant surfaces use. The helper should calculate the financial record summary for a property and Tax Year without claiming to compute tax outcomes.

The Property Workspace should use the shared helper for its filing readiness financial metrics. The Portfolio Dashboard should use the same helper for property summaries and category totals. Year-End Package construction should continue to use immutable snapshot data, but should share the same allocation behavior where the same record concepts apply.

## User Stories

1. As a property owner, I want Gross Rental Income to mean the same thing in the Property Workspace and Portfolio Dashboard, so that I do not see conflicting totals.
2. As a property owner, I want Payments Received to stay separate from Gross Rental Income, so that unpaid rent remains visible.
3. As a property owner, I want Deductible Expenses to include the correct Tax Year portion of current expenses and mortgage interest, so that the workspace matches the year-end support package.
4. As a property owner, I want Net Recorded Rental Income to be calculated consistently, so that I can review my records without reconciling different surfaces manually.
5. As an accountant-facing user, I want Year-End Package snapshots to reflect the same allocation rules as the live review screens, so that exported support remains defensible.
6. As an accountant-facing user, I want prepaid expenses allocated consistently to the selected Tax Year, so that timing differences do not depend on the UI surface.
7. As a developer, I want one tested helper for Tax Year financial summaries, so that fixes to prepaid, mortgage, income, or expense handling land once.
8. As a developer, I want the helper to use domain terms, so that it is clear the app summarizes records and does not calculate tax payable.
9. As a developer, I want category totals and headline financial metrics to come from the same source, so that dashboard breakdowns reconcile with summary cards.
10. As a developer, I want incomplete transaction counts passed or derived explicitly, so that readiness exceptions do not become hidden UI-only behavior.
11. As a developer, I want shared rounding behavior, so that totals do not drift by cents across surfaces.
12. As a future implementation agent, I want the financial helper to be independent of React, so that it can be tested with plain fixtures.

## Implementation Decisions

- Introduce a shared domain helper for Tax Year financial summaries.
- The helper should return domain-shaped values for Gross Rental Income, Payments Received, Deductible Expenses, Net Recorded Rental Income, incomplete transaction count, and optional expense category totals.
- The helper should allocate prepaid entries to the selected Tax Year using the existing allocation policy.
- The helper should include mortgage interest in Deductible Expenses and exclude mortgage principal.
- The helper should include taxable manual rental income in Gross Rental Income.
- The helper must not calculate taxable income, tax payable, or CCA/UCC values.
- Update property-level and portfolio-level consumers to call the shared helper instead of duplicating allocation loops.
- Keep Year-End Package immutability intact. Shared calculation code may be reused during snapshot construction, but exported snapshots must not become live references.
- Keep the helper in the domain layer, not in UI components.
- Do not introduce schema changes.

## Testing Decisions

- Highest test seam: unit-test the shared financial summary helper with complete property fixtures.
- Cover a Tax Year with rent earned, rent received, manual income, current expenses, prepaid expenses, mortgage interest, and incomplete transactions.
- Cover a Tax Year with no matching activity.
- Cover prepaid allocation across year boundaries.
- Cover mortgage payments where principal and fees should not inflate Deductible Expenses unless existing policy says otherwise.
- Add regression tests proving Property Workspace and Portfolio Dashboard summaries can be derived from the same helper output.
- Preserve existing Year-End Package tests and add focused expectations only where helper adoption changes the implementation path.
- Avoid snapshot-only tests for financial behavior. Assert named domain fields and category totals.

## Out of Scope

- Computing tax payable.
- Computing or carrying CCA/UCC values.
- Changing Year-End Package snapshot storage.
- Changing transaction categorization rules.
- Changing the Portfolio Dashboard layout.
- Changing the Property Workspace layout.

## Further Notes

This PRD protects domain correctness. The app is a tax-ready record system, not a tax calculator, so names and assertions should stay anchored to recorded support values rather than tax outcomes.
