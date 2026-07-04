Status: ready-for-agent

## Problem Statement

The dynamic Property Workspace page accepts a Tax Year through URL search parameters, but its local type only models the year parameter as a single string. The framework page contract allows repeated search parameters, which means the actual value can be absent, a single string, or an array of strings.

From a user's perspective, malformed or repeated `year` query values should not create surprising behavior. From an engineering perspective, the route should use the framework's current typed page contract so future Next.js changes are less likely to cause drift.

## Solution

Tighten the Property Workspace page props and Tax Year parsing. Use the framework-provided page prop typing or an equivalent explicit type that models repeated search parameters. Make the year parser intentionally handle missing values, arrays, invalid numbers, and out-of-range years.

The visible behavior should remain conservative: valid Tax Years are honored; invalid or ambiguous input falls back to the default Tax Year.

## User Stories

1. As a property owner, I want a valid `year` in the URL to select that Tax Year, so that I can link directly to a Property Tax Year view.
2. As a property owner, I want an invalid `year` in the URL to fall back safely, so that the workspace still loads.
3. As a property owner, I want repeated `year` parameters to be handled deterministically, so that malformed links do not produce unstable behavior.
4. As a property owner, I want previous and next Tax Year navigation to keep producing clean URLs, so that browser history remains understandable.
5. As an accountant-facing user, I want the selected Tax Year to be explicit, so that review and Year-End Readiness are scoped to the intended calendar filing period.
6. As a developer, I want the page prop type to match the framework contract, so that route code is not narrower than runtime behavior.
7. As a developer, I want the parser to be pure and tested, so that URL edge cases are handled without mounting the page.
8. As a developer, I want array handling to be explicit, so that repeated query params do not rely on JavaScript coercion.
9. As a developer, I want valid year bounds to be centralized, so that Tax Year validation can be reused or adjusted safely.
10. As a developer, I want the route to keep the Cache Components Suspense pattern, so that dynamic route data stays compatible with the framework.
11. As a future implementation agent, I want the page props to use current framework conventions, so that future route changes start from a correct contract.
12. As a QA reviewer, I want clear test cases for missing, valid, invalid, repeated, and out-of-range years, so that URL handling is easy to verify.

## Implementation Decisions

- Use the framework's typed page props helper when available, or model search parameters with the same shape.
- Keep route parameters as promises and resolve them inside the existing Suspense-compatible flow.
- Update Tax Year parsing to accept absent values, single strings, and arrays.
- Treat ambiguous repeated year values conservatively. Prefer falling back to the default Tax Year unless a single clear value is selected by policy.
- Keep valid Tax Year bounds explicit.
- Keep the default Tax Year helper as the fallback source.
- Do not introduce a synced global Tax Year store.
- Preserve URL-based Tax Year selection.
- Preserve the current route layout and fallback skeleton.

## Testing Decisions

- Highest test seam: unit-test the Tax Year parser as a pure function.
- Cover missing year input.
- Cover a valid four-digit year inside bounds.
- Cover a non-numeric year.
- Cover a decimal year.
- Cover a year below the lower bound.
- Cover a year above the upper bound.
- Cover repeated year parameters.
- Add a route-level typecheck expectation by using the framework page prop helper or equivalent type.
- Run typecheck after the change.

## Out of Scope

- Changing the default Tax Year policy.
- Changing the Tax Year bounds unless separately decided.
- Adding a global Tax Year selector.
- Changing the route's data-fetching behavior.
- Changing Property Workspace layout.
- Changing Year-End Readiness behavior.

## Further Notes

The local Next.js documentation confirms that page `params` and `searchParams` are promises and that search parameters can include repeated values. This PRD keeps the route aligned with that contract while preserving the current user experience.
