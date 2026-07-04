Status: ready-for-agent

## Problem Statement

The Property Workspace is built through a single oversized client-side detail component that mixes page composition, setup records, Year-End Readiness presentation, Tax Year financial summaries, workflow disclosure state, forms, tables, and small formatting helpers. From a user's perspective, this makes future improvements to the property workspace slower and riskier: a small copy or layout change can accidentally touch business-facing readiness or financial behavior.

The page should remain behaviorally the same, but the implementation needs a clearer module shape so property-specific detail stays maintainable as the app grows.

## Solution

Decompose the Property Workspace detail surface into focused modules with explicit responsibilities. Keep the route and visible experience unchanged, but move unrelated responsibilities out of the monolithic detail component.

The target user experience is the same Property Workspace: setup status, Year-End Readiness, Tax Year navigation, rent activity, mortgage payments, taxable activity, and evidence support remain available in the same flow. The engineering improvement is that each part has a clear owner and can be modified independently.

## User Stories

1. As a property owner, I want the Property Workspace to keep showing my property setup status, so that I can resolve missing units, owners, and Ownership Periods.
2. As a property owner, I want the Property Workspace to keep showing Year-End Readiness for the selected Tax Year, so that I can understand whether the Property Tax Year is Ready, Needs review, or Blocked.
3. As a property owner, I want the Tax Year selector to keep working, so that I can review the same property across years.
4. As a property owner, I want rent, deductions, income, mortgage payments, and evidence support to stay available from the Property Workspace, so that I can keep my records complete.
5. As an accountant-facing user, I want setup and Year-End Readiness copy to remain consistent, so that I can trust what the workspace is telling me before a Year-End Package is exported.
6. As a developer, I want property setup UI to live in a focused setup module, so that changing unit or owner setup does not require scanning tax readiness code.
7. As a developer, I want Year-End Readiness UI to live in a focused readiness module, so that changing filing readiness presentation does not require touching setup CRUD or taxable activity workflows.
8. As a developer, I want pure derived data helpers to be outside render components, so that readiness and financial behavior can be tested without mounting the full Property Workspace.
9. As a developer, I want the top-level Property Workspace detail component to read like page composition, so that the order and purpose of the page sections are obvious.
10. As a developer, I want small formatting helpers to move to canonical utility or domain modules when reused, so that duplicated formatting does not drift.
11. As a developer, I want behavior-preserving decomposition, so that the refactor can be reviewed without also evaluating product behavior changes.
12. As a future implementation agent, I want focused module boundaries, so that a new property workflow can be added without expanding a large catch-all component.

## Implementation Decisions

- Keep the existing Property Workspace user flow and visual hierarchy intact.
- Decompose the current detail component into focused modules for page composition, property setup, property summary, filing readiness overview, and workflow disclosure.
- Keep single-use route wrappers inline where they are truly route-local, but move reusable or independently meaningful workspace sections into focused component modules.
- Move pure derived models out of client render components when they encode Year-End Readiness, setup summaries, Tax Year financial summaries, or shared display copy.
- Preserve the domain rule that a Property Tax Year is always editable and Year-End Readiness is derived live from open exceptions.
- Do not introduce a close or lock state for Tax Years.
- Avoid creating a generic component framework. The new modules should match concrete Property Workspace concepts.
- Preserve existing server action contracts while decomposition happens.
- Keep section-level component APIs small and domain-shaped. Prefer grouped props for setup, readiness, and activity over long flat prop lists.
- Use existing UI primitives and status tone helpers rather than introducing a parallel style system.

## Testing Decisions

- Highest test seam: render the Property Workspace detail from representative property fixtures and assert visible behavior for setup, readiness, Tax Year navigation, and workflow sections.
- Add or update focused unit tests only for extracted pure derived helpers, especially if setup summaries or readiness messages move out of the component.
- Do not test internal component file boundaries. Test the user-visible output and helper contracts.
- Reuse existing property readiness and year-end readiness fixtures where possible.
- Add regression coverage for a ready property, a property with setup gaps, a property with warnings only, and a property with blockers.
- Verify that decomposition does not change which actions are available for units, owners, rent activity, taxable activity, mortgage payments, or evidence.
- Run typecheck and component tests after decomposition.

## Out of Scope

- Changing the Property Workspace design.
- Changing database schema or cached query shape.
- Changing server action behavior.
- Changing Year-End Package export behavior.
- Introducing a Tax Year close, lock, or filing state machine.
- Optimizing client bundle size beyond the decomposition needed to make later bundle work safe.

## Further Notes

This is a maintainability refactor. The main acceptance bar is that the top-level detail component becomes a readable composition layer and the file no longer carries unrelated setup, filing, financial, and workflow responsibilities.
