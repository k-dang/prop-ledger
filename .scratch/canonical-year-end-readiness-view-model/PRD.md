Status: ready-for-agent

## Problem Statement

Year-End Readiness items are mapped into labels, details, links, action labels, counts, and status badges in multiple places. The Property Workspace, Year-End workspace, and Portfolio Dashboard each rebuild similar rows from the same readiness model. This duplicates policy and copy, and it already creates small differences in naming and destinations.

From a user's perspective, readiness should feel like one coherent review system. If a Property Tax Year is Blocked by missing documents or Needs review because of capital assets, every surface should describe the same exception consistently while still linking to the right place for that surface.

## Solution

Create a canonical Year-End Readiness view-model mapper. It should convert derived readiness items into surface-ready rows while allowing explicit variants for Property Workspace, Year-End workspace, and Portfolio Dashboard use cases.

The mapper should centralize shared labels, status wording, count wording, ownership warning formatting, and deduplication rules. Surface-specific decisions, such as which action label or link target to use, should be explicit options rather than duplicated switch statements.

## User Stories

1. As a property owner, I want Year-End Readiness labels to be consistent, so that I do not have to learn different names for the same issue.
2. As a property owner, I want readiness details to explain what needs action, so that I know whether I must categorize transactions, attach receipts, review capital assets, or fix Ownership Periods.
3. As a property owner, I want readiness action links to take me to the right workflow, so that I can resolve the issue quickly.
4. As an accountant-facing user, I want warnings and blockers to use stable language, so that readiness review can be trusted before a Year-End Package is exported.
5. As an accountant-facing user, I want ownership allocation warnings to describe the actual Ownership Period problem, so that owner allocations can be corrected before export.
6. As a developer, I want one mapper from readiness items to display rows, so that adding a new readiness item does not require editing several switch statements.
7. As a developer, I want surface-specific variants to be explicit, so that the Portfolio Dashboard can summarize while the Property Workspace can provide direct actions.
8. As a developer, I want setup gap deduplication to be centralized, so that ownership setup gaps do not appear twice as both setup and allocation exceptions.
9. As a developer, I want status wording and tone mapping to be consistent, so that Ready, Needs review, and Blocked do not drift across UI surfaces.
10. As a developer, I want unreadiness counts to reconcile with visible rows, so that dashboard exception totals match the list users see.
11. As a developer, I want exhaustive handling of readiness item IDs, so that new readiness checks fail loudly during development until all surfaces are handled.
12. As a future implementation agent, I want readiness copy changes to happen in one domain-oriented place, so that copy edits do not require component archaeology.

## Implementation Decisions

- Add a canonical view-model mapper for Year-End Readiness items.
- Support surface variants for Property Workspace, Year-End workspace, and Portfolio Dashboard.
- Keep the source readiness model derived live from records and open exceptions.
- Centralize ownership warning formatting.
- Centralize pluralization and count-sensitive detail copy for readiness rows.
- Centralize the rule that ownership allocation warnings should be suppressed when an ownership setup gap already covers the same root cause.
- Keep links and action labels as explicit surface policy, not hidden string concatenation inside generic UI components.
- Preserve the existing readiness statuses: clear, blocking, and warning.
- Preserve the user-facing aggregate states: Ready, Needs review, and Blocked.
- Do not store readiness rows in the database.

## Testing Decisions

- Highest test seam: unit-test the readiness view-model mapper with derived readiness fixtures.
- Cover every readiness item ID.
- Cover clear, blocking, and warning statuses.
- Cover property setup gaps, including ownership setup gaps that suppress duplicate ownership allocation warnings.
- Cover surface variants so that labels, details, action labels, and destinations are intentionally different only where required.
- Reuse existing year-end readiness tests as source-model coverage and add mapper tests for presentation policy.
- Add an exhaustiveness-oriented test or type-level check so a new readiness item requires mapper handling.
- Avoid testing component internals where a mapper unit test can assert the same policy more directly.

## Out of Scope

- Changing how Year-End Readiness is derived.
- Adding new readiness checks.
- Changing database schema.
- Introducing stored readiness state.
- Changing Year-End Package immutability.
- Redesigning readiness UI components beyond consuming the shared view model.

## Further Notes

This PRD is about making the readiness language and action model canonical. It should not collapse all UI surfaces into one component; it should give each surface the same readiness vocabulary with explicit surface-specific behavior.
