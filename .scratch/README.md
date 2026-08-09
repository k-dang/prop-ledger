# Scratch Planning Documents

This directory contains implementation-ready PRDs and their issue-sized delivery plans.
Use each document's first-line `Status` to separate agent-ready, human-owned, and
verification work. Remove completed task documents once their implementation evidence
is available in version control.

## Active product and architecture work

| Plan | Status | Notes |
| --- | --- | --- |
| [Canonical Year-End Readiness View Model](canonical-year-end-readiness-view-model/PRD.md) | `ready-for-agent` | Centralize readiness labels, copy, links, and deduplication. |
| [Decompose Property Workspace Detail](decompose-property-workspace-detail/PRD.md) | `ready-for-agent` | Split the large workspace component without changing behavior. |
| [Property Workspace Mutation Contracts](property-workspace-mutation-contracts/PRD.md) | `ready-for-agent` | Group actions and errors by workflow and remove redundant refreshes. |
| [Shared Tax Year Financial Summary](shared-tax-year-financial-summary/PRD.md) | `ready-for-agent` | Consolidate financial summary and allocation logic. |
| [Split Property Workspace Client Islands](split-property-workspace-client-islands/PRD.md) | `ready-for-agent` | Defer secondary workflows behind smaller hydration boundaries. |
| [Typed Property Page Year Parameter](typed-property-page-year-param/PRD.md) | `ready-for-agent` | Harden the route contract and year parsing. |

The Property Workspace plans overlap. A low-conflict implementation order is:

1. Typed Property Page Year Parameter
2. Shared Tax Year Financial Summary
3. Canonical Year-End Readiness View Model
4. Property Workspace Mutation Contracts
5. Decompose Property Workspace Detail
6. Split Property Workspace Client Islands

## Multi-step plans

| Plan | Status | Next action |
| --- | --- | --- |
| [Evidence Blob Uploads](evidence-blob-uploads/PRD.md) | `in-progress` | Verify the R2 deletion acceptance checklist in [issue 04](evidence-blob-uploads/issues/04-blob-deletion.md). The implementation exists; the empirical checks remain open. |
| [GitHub Issue to Review-Ready PR Loop](github-issue-to-review-ready-pr-loop/PRD.md) | `ready-for-agent` | Complete the human-owned repository and GitHub activation steps listed in its issue drafts. |

## Status conventions

- `ready-for-agent`: implementation can begin without another product decision.
- `ready-for-human`: the next step requires repository, service, or rollout work owned by a person.
- `implemented-needs-verification`: code exists, but one or more acceptance checks are still open.
- `in-progress`: at least one child issue is not complete.
- `done`: implementation and acceptance checks are complete; remove the task document
  during the next cleanup pass.

## Document conventions

- Put `Status: ...` on the first line, followed by one H1 title.
- Link parent plans and blocking issues with relative Markdown links.
- Keep acceptance criteria as checklists; do not mark empirical checks complete from code inspection alone.
- Record implementation or validation evidence under `## Comments`.
