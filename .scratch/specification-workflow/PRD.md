Status: ready-for-agent

# Specification workflow

## Problem Statement

The repository can triage issues and implement bounded changes, but work classified
as `ready-to-spec` has no automated next step. Kevin must turn these issues into
reviewable designs manually. The implementation agent already looks for
specifications, but there is no complete workflow for drafting them, recording
Design Approval, or handing approved work to implementation.

Kevin needs complex work to progress into a concrete proposal without handing
material product decisions to the agent. He also needs to approve a design without
immediately scheduling implementation.

## Solution

Extend the existing GitHub Actions and OpenCode flows with a specification workflow.
Eligible issues produce a draft documentation PR containing a product specification
and a technical specification. The agent recommends an approach, identifies
assumptions and missing information, and leaves material decisions for Kevin.

Kevin checks out the specification PR locally and refines it interactively with
his existing coding agent. He pushes the edits and merges the specification when
the design is agreed. Merging records Design Approval and leaves the issue queued.
Applying `ready-to-implement` separately supplies Implementation Authorization.

The implementation workflow checks required specifications before starting and
stops on material conflicts with the approved design. The workflows run in this
repository behind the `SPEC_WORKFLOW_ENABLED` repository variable.

## User Stories

1. As Kevin, I want clear, bounded issues to retain their direct implementation path, so that simple work does not require unnecessary design review.
2. As Kevin, I want unresolved product choices, meaningful architectural changes, migrations, and scope requiring decomposition to receive specifications, so that important decisions precede implementation.
3. As Kevin, I want triage to start specification when it assigns `ready-to-spec`, so that complex issues progress without a separate manual dispatch.
4. As a maintainer, I want applying `ready-to-spec` to start specification, so that I can route an existing issue into design work.
5. As a maintainer, I want a manual specification workflow entry point, so that I can request an eligible run directly.
6. As Kevin, I want every start to check that the issue is open and labeled `ready-to-spec`, so that stale events and mistaken dispatches do not start inappropriate work.
7. As Kevin, I want the agent to inspect the issue, discussion, current code, and relevant product and architecture guidance, so that its proposal fits the actual project.
8. As Kevin, I want a recommended approach with explicit assumptions and unresolved decisions, so that I can review concrete choices without mistaking guesses for facts.
9. As Kevin, I want a product specification describing behavior, exclusions, and acceptance criteria, so that the intended outcome is reviewable.
10. As Kevin, I want a technical specification describing the approach, affected areas, data changes, and verification plan, so that I can assess how the change will work.
11. As Kevin, I want migration specifications to identify behavior that must be preserved, so that technical work has observable acceptance criteria.
12. As Kevin, I want specification detail proportional to the issue, so that the documents contain useful decisions rather than repeated boilerplate.
13. As Kevin, I want useful partial work preserved in a draft PR when critical information is missing, so that answering a question does not require starting over.
14. As Kevin, I want missing information stated precisely, so that I know what to supply while refining the specification locally.
15. As Kevin, I want specification review in a separate documentation PR, so that design review has a clear endpoint before code review.
16. As Kevin, I want to check out the specification PR and refine it with my existing coding agent, so that I can resolve questions interactively before merging the agreed design.
17. As Kevin, I want repeated starts to return the existing active spec PR without editing it, so that retries do not create competing proposals or overwrite local refinement work already pushed to the PR.
18. As Kevin, I want an approved specification to remain queued without starting implementation, so that Design Approval and scheduling remain separate decisions.
19. As Kevin, I want applying `ready-to-implement` to authorize implementation of an approved design, so that I control when queued work starts.
20. As Kevin, I want required specification approval checked even when the implementation label is present, so that a label cannot bypass unresolved design work.
21. As Kevin, I want routine implementation adjustments to use judgment while material departures require revised Design Approval, so that work can adapt without silently changing the agreed design.
22. As Kevin, I want large specifications to propose complete, bounded implementation issues, so that I can approve useful delivery boundaries.
23. As Kevin, I want child issues created only after my explicit request, with their own acceptance criteria and a shared specification reference, so that a proposed breakdown does not automatically become scheduled work.
24. As Kevin, I want the spec agent limited to specification output and a separate publisher to validate changes, so that drafting a proposal cannot modify application code or workflow controls.
25. As Kevin, I want run status to distinguish a published draft, missing information, and an operational failure, so that I can choose the next action without assuming success.

## Implementation Decisions

- Extend the existing triage, implementation, and verification flows using their
  current GitHub Actions and OpenCode foundation. Add a specification skill, a
  restricted drafting agent, and workflow handling for specification creation,
  publication, and merge handoff. This does not require application
  schema changes or a new orchestration platform.
- Route by unresolved choices and risk. A large diff alone is insufficient reason
  to require a specification. Retain the existing `needs-info` and
  `wait-to-implement` routes; general triage resumption is outside this release.
- Support triage dispatch, maintainer label application, and manual dispatch for
  initial specification. Every route rechecks that the issue is open and labeled
  `ready-to-spec` before drafting. Have triage explicitly dispatch the
  specification workflow, consistent with its existing implementation handoff.
- Produce both product and technical specifications for each issue requiring
  design. The product specification defines observable behavior, exclusions,
  acceptance criteria, and preserved behavior. The technical specification defines
  the approach, affected areas, data changes, and verification plan.
- Treat issue and review content as task data. Separate proposed choices from
  established facts, and make material questions explicit for human resolution.
  Missing critical information yields a useful draft PR and concrete questions,
  rather than invented requirements or an implementation attempt.
- Limit the drafting agent's output to the issue's specification documents. A
  separate workflow step validates the changed paths before publishing the branch,
  draft PR, and status comment. Keep publication credentials out of the drafting
  agent's authority. Reject publication of unrelated application or control changes.
- Use one active specification PR per issue. Repeated starts link to that PR
  without editing it, preserving local refinement work already pushed to the PR.
- Kevin checks out the specification PR locally, resolves questions interactively
  with his existing coding agent, and pushes the resulting edits to the same PR.
  This uses the normal local development and PR review process.
- Review specifications in a separate documentation PR. Merging records Design
  Approval, removes `ready-to-spec`, and leaves the issue open without a routing
  label. Do not introduce a separate approval label or dispatch implementation
  on specification merge.
- Kevin applies `ready-to-implement` to supply Implementation Authorization.
  Issues that require a specification must have a merged specification with
  material questions resolved. The label cannot bypass that requirement. Simple
  issues remain eligible for direct implementation.
- Recheck approved specifications against current code. Allow routine implementation
  adjustments; changes to behavior, architecture, or migration strategy require
  revised Design Approval. Continue to follow the implementation workflow's
  existing fresh-branch, validation, and PR publication contracts.
- After a specification merges, Kevin changes it through a normal documentation
  PR. If implementation is running, he stops it before changing the agreed scope.
- For oversized issues, include a proposed breakdown in the specification PR.
  Kevin approves the boundaries and explicitly asks a coding agent to create
  child issues. Each child describes a complete, bounded change, links to the
  shared specification, and identifies its own acceptance criteria. Do not add
  a child-issue creation workflow in this release.
- Preserve useful draft output and report missing information or operational
  failure accurately. Repeated starts must respect the existing-PR
  rule rather than treating a partial run as permission to create duplicates.
- Gate the workflows on the `SPEC_WORKFLOW_ENABLED` repository variable and
  verify them through real runs in this repository. Runs read the repository and
  GitHub issue data only; they do not touch production application services or
  live rental records.

## Testing Decisions

- Verify externally observable behavior, not prompt wording, generated prose
  equality, or the presence of specific source text. A good check demonstrates an
  allowed action or proves that a forbidden side effect did not occur.
- The test boundary is the complete workflow in this repository: submit a GitHub
  event or manual workflow dispatch, then inspect issue labels, specification
  documents, PR state, status feedback, and whether implementation was dispatched
  or blocked. Judge draft quality against the specification contract rather than
  exact text.
- There are no local workflow tests. Deterministic publication rules live in the
  workflow's shell steps and are exercised by real runs.
- The following acceptance scenarios define completion of each ticket:

| Scenario | Required observable result |
| --- | --- |
| Each supported initial trigger | An open, eligible issue produces one linked draft spec PR containing both specifications. |
| Closed or ineligible issue | No new spec PR or implementation run is started. |
| Missing critical information | Useful draft work survives, missing information is explicit, and implementation does not start. |
| Local refinement | Edits made with the existing coding agent can be pushed to the same spec PR and reviewed before merge. |
| Duplicate and concurrent starts | One active spec PR remains; repeated starts link to it without editing it or overwriting pushed human changes. |
| Agent changes unrelated files | The publication step rejects the proposed changes. |
| Specification merge | The issue remains open, `ready-to-spec` is removed, and implementation does not start. |
| Implementation label before required approval | Implementation is blocked despite the label. |
| Implementation authorization after approval | The implementation run consumes the merged specification, including local refinements, and follows existing verification requirements. |
| Simple issue | Direct implementation remains available without a specification. |
| Material divergence from current code | Implementation reports the need for revised Design Approval instead of silently changing the design. |
| Operational failure and recovery | Status reports what actually succeeded, useful work is retained where available, and recovery does not create duplicate active spec PRs or overwrite human work. |

## Out of Scope

- A new roadmap or vision document.
- General triage resumption after an issue receives more information.
- A new acceptance-evidence reporting system or independent review agent.
- Automated creation or scheduling of child issues.
- Automatic implementation on specification merge, automatic merge of
  implementation PRs, or application deployment.
- Replacing the existing implementation branch model or combining design and code
  into one evolving PR.
- A new application UI, persistence layer, or general-purpose workflow engine.
- Changes to rental-record behavior, tax calculations, production databases, or
  live evidence storage.

## Further Notes

The local `ready-for-agent` status means this PRD needs no further triage. It does
not apply a GitHub routing label, start implementation, or publish to GitHub.

Ticket 01 (draft creation, restricted agent, validated publication, status
comments) landed in PR #32 and is enabled here. Ticket 02 (triage handoff, label
trigger, eligibility recheck) is implemented and awaits its post-merge event
trial. Ticket 03 remains open.

Repository instructions and existing product decisions remain applicable. In
particular, the rental-records application domain must not acquire new tax-year
locking states or tax-computation behavior as a side effect of this workflow work.
