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

## Implementation and validation

- [x] One understandable implementation job gives OpenCode the Actions, contents, issues, and
  pull-request permissions needed to own the complete attempt.
- [x] The implementation skill fetches the full current issue, confirms its state and readiness
  label, and treats the earlier triage comment as evidence rather than the full specification.
- [x] Issue content is treated as untrusted task data and is never interpolated into executable
  workflow commands.
- [x] The skill creates or reuses one marker-backed issue comment, links the current Actions run,
  and updates that comment instead of posting progress messages.
- [x] The skill reads current repository and product instructions, inspects the implementation
  area, and makes the smallest cohesive change that completely addresses the issue.
- [x] The skill finds linked and checked-in product, technical, and architecture specifications
  before implementation. Material conflicts with the issue or maintainer decisions stop the run
  with a concrete resolution step instead of being guessed through.
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
  updates the rolling comment with a generic stopped status, asks maintainers to check for any
  linked branch or pull request before rerunning, and retains the Actions link.

## Publication

- [x] After validation, the skill creates a unique automation branch and one focused commit,
  pushes it, and opens a normal review-ready pull request.
- [x] The pull request links the issue and specifications used, accurately summarizes validation
  and visible-behavior evidence or gaps, records limitations, and includes `Closes #<issue>` only
  when the implementation fully resolves it.
- [ ] The skill explicitly dispatches the repository's Verify workflow for the pull-request head,
  and a controlled pilot proves the dispatched check satisfies branch protection.
- [ ] The repository allows GitHub Actions to create pull requests. The workflow adds no preflight
  for this setting and fails naturally if publication is disabled.
- [x] The issue remains open until human merge. Successful publication updates the rolling status
  comment with the pull-request link; failure leaves a generic stopped status and the Actions link.
- [ ] The built-in token cannot bypass protected-main review requirements.

## Validation approach

- [x] Check workflow syntax and expressions with YAML parsing and `actionlint`.
- [x] Smoke-test both entry points, OpenCode skill discovery, required permissions, issue-number
  validation, marker-backed failure reporting, evidence artifact isolation, and the skill's spec
  conflict and visible-behavior contracts without introducing a fixture framework.
- [ ] Use controlled synthetic issues to prove a blocked outcome and one successful pull request,
  including the explicitly dispatched Verify check and required human-review boundary.
- [x] The repository type-check and test contracts pass after implementation. The aggregate lint
  command remains sensitive to CRLF in the current Windows checkout.

## Comments

- The original patch-handoff design used five jobs and kept all write permissions away from the
  model. Maintainer review deliberately changed that trust decision in favor of a smaller,
  skill-driven lifecycle like the Warp reference implementation.
- The implementation workflow now owns only triggers, concurrency, permissions, environment setup,
  OpenCode invocation, optional evidence retention, and a generic crash fallback. The implementation
  skill owns issue status, specification alignment, code changes, automated and visible-behavior
  validation, Git history, pull-request creation, and Verify dispatch.
- Live repository proof remains in Issue 04: Actions pull-request enablement, dispatched
  Verify/branch-protection behavior, protected-main review enforcement, and controlled synthetic
  blocked and successful issues.
