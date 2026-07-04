Status: ready-for-agent

## Problem Statement

The Property Workspace wires many server actions through a broad client dispatcher and a long list of local handler wrappers. Errors are tracked by string keys, then passed flat into a large detail component. One delete path also performs an extra client router refresh even though the shared server action helper already refreshes successful mutations.

From a user's perspective, mutations should feel reliable and consistent. From an engineering perspective, action wiring should be grouped by workflow and refresh behavior should have one owner.

## Solution

Define clearer mutation contracts for the Property Workspace by grouping actions and errors by domain workflow: setup, rent ledger, taxable transactions, evidence, and supporting documents. Keep the existing server actions, but present them to UI sections through workflow-shaped props or section containers.

Remove redundant client refresh behavior when the shared server action helper already refreshes after successful mutations. Make success and error behavior consistent across all Property Workspace mutations.

## User Stories

1. As a property owner, I want adding a unit to show success or an actionable error consistently, so that setup records are reliable.
2. As a property owner, I want deleting a unit to follow the same refresh behavior as other mutations, so that the workspace updates predictably.
3. As a property owner, I want owner and Ownership Period mutations to show errors in the ownership section, so that I know what to fix.
4. As a property owner, I want lease and rent event mutations to refresh the rent ledger consistently, so that totals and activity stay current.
5. As a property owner, I want manual transaction and evidence mutations to refresh taxable activity consistently, so that receipts and exceptions update after changes.
6. As an accountant-facing user, I want readiness to update after any relevant mutation, so that the live Property Tax Year state remains accurate.
7. As a developer, I want setup actions grouped together, so that setup UI does not need to know about transaction or evidence error keys.
8. As a developer, I want rent ledger actions grouped together, so that rent-specific UI receives a small contract.
9. As a developer, I want evidence and transaction actions grouped together, so that supporting document behavior is not scattered across the workspace shell.
10. As a developer, I want refresh behavior owned by the shared server action helper, so that client components do not add one-off refresh calls.
11. As a developer, I want typed error channels, so that adding a new workflow error is explicit and discoverable.
12. As a future implementation agent, I want section-level mutation contracts, so that component decomposition does not require threading a long flat action list through every layer.

## Implementation Decisions

- Keep server actions in the library layer.
- Keep the shared server action helper as the canonical owner of cache invalidation and client refresh after successful mutations.
- Remove redundant client refresh calls for mutations already using the shared action helper.
- Replace flat action and error prop lists with workflow-shaped contracts or section-level containers.
- Preserve existing action result semantics: success is explicit, failure can carry a user-facing error message.
- Keep errors local to the workflow that can resolve them.
- Avoid introducing a global mutation store.
- Keep optimistic updates out of scope unless a section already has an established pattern.
- Preserve all existing user-facing validations and error messages unless they are part of a duplicate-refresh cleanup.
- Preserve cache tag invalidation behavior.

## Testing Decisions

- Highest test seam: exercise workflow-level mutation contracts through component tests or action-wrapper unit tests that assert success and error routing.
- Verify each setup mutation reports errors to setup UI only.
- Verify rent ledger mutations report errors to rent UI only.
- Verify transaction and evidence mutations report errors to taxable activity or evidence UI only.
- Verify successful mutations rely on the shared server action helper for refresh behavior.
- Verify no mutation path performs an extra client refresh when the shared helper already refreshes.
- Reuse existing server action tests if present; otherwise add focused tests for the wrapper reducer or workflow contract.
- Run typecheck to ensure all section contracts are fully wired.

## Out of Scope

- Rewriting server actions.
- Changing database transactions or batch behavior.
- Adding optimistic UI.
- Adding toast notifications.
- Changing cache tag names or invalidation semantics beyond removing redundant client refresh.
- Changing visible workspace layout.

## Further Notes

This PRD is a boundary cleanup. The user-visible behavior should stay the same, while action wiring becomes easier to understand and safer to decompose.
