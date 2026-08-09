# 03 — Turn a ready issue into a review-ready pull request

**What to build:** Take an open issue currently labeled `ready-to-implement` through one bounded
OpenCode implementation attempt. Finish with either a complete, validated, review-ready pull
request or a concise issue update explaining why no pull request was created.

**Blocked by:** 01 — Establish the repository Verify gate; 02 — Route new issues with
evidence-based triage.

**Status:** ready-for-human

## Entry points

- [x] A maintainer applying `ready-to-implement` starts implementation through the
  `issues.labeled` event. Other labels do nothing.
- [x] Automated triage explicitly dispatches the implementation workflow after applying
  `ready-to-implement`; it does not rely on an event created with `GITHUB_TOKEN` to start another
  workflow.
- [x] Both entry points pass an issue number to the same implementation path, which confirms the
  issue is open and still has `ready-to-implement` before doing work.
- [x] Concurrency is scoped to the repository and issue. A second event does not cancel an active
  implementation run, and the pilot adds no persistent deduplication.

## Tracer-bullet proof

- [x] The first rollout uses the final workflow filename, triggers, issue-number interface, and
  issue-scoped concurrency so the complete implementation deepens the same path instead of
  replacing it with a second entry point.
- [x] Deterministic shell logic refetches the current issue through GitHub and confirms it is open
  and still labeled `ready-to-implement`.
- [x] The tracer writes only a GitHub Actions step summary identifying the repository, issue,
  trigger event, and explicit fact that implementation did not start.
- [x] The tracer has only `issues: read`, performs no checkout or dependency setup, makes no
  OpenCode call or GitHub mutation, and has a two-minute overall timeout.
- [x] A controlled issue on the default branch proves the manual-label and triage-dispatch paths,
  issue validation, and Actions summary without starting implementation.

## Implementation and validation

- [x] One understandable implementation job gives OpenCode the Actions, contents, issues, and
  pull-request permissions needed to own the complete attempt.
- [x] The workflow checks out the latest default branch, records its commit, creates the unique
  per-attempt publication branch from that commit, and supplies the exact run URL instead of
  requiring the model to reconstruct operational identifiers or branch ancestry.
- [x] The implementation skill fetches the full current issue, confirms its state and readiness
  label, and treats the earlier triage comment as evidence rather than the full specification.
- [x] Issue content is treated as untrusted task data and is never interpolated into executable
  workflow commands.
- [x] The skill creates or reuses one marker-backed issue comment, links the current Actions run,
  and updates that comment instead of posting progress messages.
- [x] The skill reads current repository and product instructions, inspects the implementation
  area, and makes the smallest cohesive change that completely addresses the issue.
- [x] The skill finds linked and checked-in product, technical, and architecture specifications
  before implementation. Material conflicts stop the run with a concrete resolution step.
- [x] The skill runs relevant targeted checks while iterating and requires `pnpm verify` before
  publishing.
- [x] UI and other visible-behavior changes use the repository's `agent-browser` skill when the
  application is runnable. Change-caused failures block publication; environmental gaps are
  reported accurately and never described as passing.
- [x] Optional screenshots, video, and browser evidence stay outside the commit under
  `.implementation/evidence/` and are retained as a short-lived Actions artifact when present.
- [x] A semantic blocker creates no pull request, leaves the readiness label unchanged, and updates
  the rolling comment with concise evidence and one concrete next step.
- [x] Autonomous changes to workflows, repository agent instructions, skills, and OpenCode
  configuration remain prohibited by the implementation skill.
- [x] The workflow has an explicit timeout and no automatic retry. A runtime failure or timeout
  updates the rolling comment with a generic stopped status and retains the Actions link.
- [x] A terminal marker in the rolling status and a deterministic postcondition prevent a partial
  agent run from reporting success without the expected status, pull request, or Verify dispatch.

## Publication

- [x] The workflow prepares a unique automation branch from the recorded latest default-branch
  commit. After validation, the skill adds one focused commit, pushes it, and opens a normal
  review-ready pull request.
- [x] The publication postcondition requires the implementation commit's sole parent to be the
  recorded default-branch commit, rejecting stacked or stale-base pull requests.
- [x] The pull request links the issue and specifications used, accurately summarizes validation
  and visible-behavior evidence or gaps, records limitations, and includes `Closes #<issue>` only
  when the implementation fully resolves it.
- [x] The skill explicitly dispatches the repository's Verify workflow for the pull-request head,
  and a controlled pilot proves the dispatched check satisfies branch protection.
- [x] The repository allows GitHub Actions to create pull requests. The workflow adds no preflight
  for this setting and fails naturally if publication is disabled.
- [x] The issue remains open until human merge. Successful publication updates the rolling status
  comment with the pull-request link; failure leaves a generic stopped status and the Actions link.
- [x] The built-in token cannot bypass protected-main review requirements.

## Validation approach

- [x] Check workflow syntax and expressions with YAML parsing and `actionlint`.
- [x] Smoke-test both entry points, OpenCode skill discovery, required permissions, issue-number
  validation, marker-backed failure reporting, evidence artifact isolation, and the skill's spec
  conflict and visible-behavior contracts without introducing a fixture framework.
- [x] Use controlled synthetic issues to prove the tracer, one blocked implementation, and one
  successful pull request, including the explicitly dispatched Verify check and human-review
  boundary.
- [x] The repository type-check and test contracts pass after implementation. The aggregate lint
  command remains sensitive to CRLF in the current Windows checkout.

## Rollout

1. Merge the tracer-bullet pull request and run it against a controlled ready issue. It proves the
   real triggers, current issue validation, and Actions summary without checking out code or
   invoking OpenCode.
2. Merge the stacked implementation pull request only after the tracer result is understood. It
   introduces OpenCode and the repository skill, then deepens the same workflow interface into code
   changes, validation, visible-behavior evidence, branch and pull-request creation, and Verify
   dispatch.
3. Complete the remaining live repository proof in Issue 04: Actions pull-request enablement,
   dispatched Verify/branch-protection behavior, protected-main review enforcement, and controlled
   blocked and successful issues.

## Comments

- The original patch-handoff design used five jobs and kept all write permissions away from the
  model. Maintainer review deliberately changed that trust decision in favor of a smaller,
  skill-driven lifecycle like the Warp reference implementation.
- The tracer and full implementation deliberately share one workflow filename, input contract, and
  concurrency key. The second pull request introduces the OpenCode skill and status marker behind
  that stable workflow interface instead of adding a parallel production path.
