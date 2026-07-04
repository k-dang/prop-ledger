Status: ready-for-agent

## Problem Statement

The Property Workspace currently hydrates a broad client-side module graph up front. Secondary workflows such as mortgage payments, taxable activity, evidence support, rent activity tools, and transaction evidence are statically pulled into the same client surface even when they start collapsed or are not immediately needed.

From a user's perspective, the workspace should remain responsive and progressively useful. From an engineering perspective, secondary workflows should not force the initial Property Workspace to carry every interactive feature at once.

## Solution

Split the Property Workspace into smaller client islands and load secondary workflows behind explicit section boundaries. Keep the initial property summary, setup status, and Year-End Readiness fast and clear. Defer heavier interactive workflows until the user opens or needs them.

The route should keep using the current server-side data load and Suspense pattern for dynamic route data. The improvement is inside the streamed content: make the hydrated client work more granular.

## User Stories

1. As a property owner, I want the Property Workspace summary to appear quickly, so that I can immediately see the property's setup and readiness state.
2. As a property owner, I want collapsed secondary workflows not to slow down the initial view, so that I can review readiness before interacting with detailed tools.
3. As a property owner, I want mortgage payments to remain available when I open that workflow, so that I can record deductible interest support.
4. As a property owner, I want taxable activity tools to remain available when needed, so that I can record rent, deductions, and non-rent income for the Tax Year.
5. As a property owner, I want evidence support to remain available, so that I can attach receipts and source documents.
6. As an accountant-facing user, I want readiness information to stay visible even if heavier workflows are still loading, so that review is not blocked by optional interactions.
7. As a developer, I want secondary workflow modules to have their own client boundaries, so that bundle size and hydration cost are easier to reason about.
8. As a developer, I want disclosure sections to own their loading states, so that opening one workflow does not force every workflow to hydrate.
9. As a developer, I want initial Property Workspace modules to avoid importing heavy secondary components directly, so that client graph growth is visible and controllable.
10. As a developer, I want Suspense fallbacks to match final section dimensions, so that loading secondary workflows does not cause disruptive layout shift.
11. As a developer, I want the split to preserve server action behavior, so that deferring UI code does not change mutations.
12. As a future implementation agent, I want client-island boundaries that match domain workflows, so that new workflows can be added without expanding the initial bundle.

## Implementation Decisions

- Keep the route-level Cache Components and Suspense behavior intact.
- Identify the initial island as the property summary, property setup overview, and Year-End Readiness overview.
- Treat mortgage payments, taxable activity, rent activity tools, and evidence support as secondary workflow islands.
- Use framework-supported dynamic loading or Suspense boundaries for secondary workflows where appropriate.
- Keep fallbacks dimensionally similar to the final panels to avoid layout shift.
- Do not move server actions into route files. Server actions and shared helpers stay in the library layer.
- Preserve the visible order and section anchors of the Property Workspace.
- Preserve the rule that setup gaps can de-emphasize later activity but do not remove it.
- Avoid introducing a global client store for open panels.
- Use existing UI primitives for disclosure, skeletons, and status surfaces.

## Testing Decisions

- Highest test seam: browser or component-level regression covering the Property Workspace initial view and opening secondary workflow sections.
- Verify the initial view shows property identity, setup status, Year-End Readiness, and Tax Year controls before secondary workflows are interacted with.
- Verify opening each deferred workflow renders the expected controls and existing data.
- Verify server actions still refresh live records after mutations.
- Verify section anchors still work for readiness action links.
- Verify fallbacks do not collapse to zero height for major workflow sections.
- Add a bundle or import-graph check if the project already has a lightweight way to assert that secondary workflow modules are no longer in the initial client island.
- Avoid brittle tests that assert exact chunk names.

## Out of Scope

- Changing the Property Workspace's product flow.
- Changing data fetching strategy for the property aggregate.
- Changing server action contracts.
- Changing the Year-End Readiness model.
- Redesigning secondary workflows.
- Adding virtualization or large-list performance work unless required by the split.

## Further Notes

The purpose is not to make every component dynamic. The purpose is to align client boundaries with user workflows so the initial Property Workspace carries the work users need first.
