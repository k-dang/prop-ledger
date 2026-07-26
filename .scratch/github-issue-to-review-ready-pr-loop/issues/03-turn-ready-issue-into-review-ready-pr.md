# 03 — Turn a ready issue into a review-ready pull request

**What to build:** Take an open issue currently labeled `ready-to-implement` through one
bounded OpenCode implementation attempt. Finish with either a complete, validated,
review-ready pull request or a concise issue update explaining why no pull request was created.

**Blocked by:** 01 — Establish the repository Verify gate; 02 — Route new issues with
evidence-based triage.

**Status:** ready-for-agent

## Entry points

- [ ] A maintainer applying `ready-to-implement` starts implementation through the
  `issues.labeled` event. Other labels do nothing.
- [ ] Automated triage explicitly dispatches the implementation workflow after applying
  `ready-to-implement`; it does not rely on an event created with `GITHUB_TOKEN` to start another
  workflow.
- [ ] Both entry points pass an issue number to the same implementation path, which confirms the
  issue is open and still has `ready-to-implement` before doing work.
- [ ] Concurrency is scoped to the repository and issue. A second event does not cancel an active
  implementation run, and the pilot adds no persistent deduplication.

## Implementation and validation

- [ ] Write-capable status and publication work runs in separate jobs from OpenCode. Jobs exchange
  only explicit metadata and an implementation patch artifact.
- [ ] The workflow creates or reuses one marker-backed issue comment, links the current Actions
  run, and updates that comment instead of posting progress messages.
- [ ] The OpenCode job checks out the triggering commit and has only repository and issue read
  permissions. It receives no token capable of changing GitHub state.
- [ ] The implementation skill refetches the complete issue, reads the current repository and
  product instructions, inspects the likely implementation area, and treats the triage comment as
  evidence rather than as the complete specification.
- [ ] Issue content is treated as untrusted data and is never interpolated into executable workflow
  commands.
- [ ] OpenCode makes the smallest cohesive working-tree change that completely addresses the issue
  and discovers the applicable repository checks. It does not create commits, branches, tags,
  pushes, comments, labels, or pull requests.
- [ ] OpenCode reports only `complete` or `blocked` with a concise explanation. Small inline checks
  reject missing or unrecognized results; there is no checked-in schema or automation library.
- [ ] `complete` requires a non-empty product diff, unchanged Git history, no protected control-plane
  paths, and successful aggregate plus targeted validation. The workflow—not the model's claim—
  decides whether publication is allowed.
- [ ] `blocked` requires no publishable partial implementation. It creates no pull request, leaves
  the readiness label unchanged, and updates the rolling comment with evidence and one concrete
  next step.
- [ ] Changes to workflows, repository agent instructions, agent skills, or OpenCode configuration
  are rejected. Work requiring those paths must use a human-authored change.
- [ ] The workflow has explicit phase time limits and no automatic agent retries. An unavailable
  model, malformed result, runtime failure, timeout, or failed validation stops publication.

## Publication

- [ ] A fresh publication job checks out the same base commit, applies exactly the validated patch,
  and uses GitHub's built-in token with only the issue, contents, pull-request, and Actions write
  permissions it needs.
- [ ] Publication creates a unique automation branch and one commit, pushes it, and opens a normal
  review-ready pull request whose body accurately summarizes the change and validation and includes
  `Closes #<issue>`.
- [ ] Publication explicitly dispatches the repository's Verify workflow for the pull-request head.
  This avoids depending on the approval-required `pull_request` run created when `GITHUB_TOKEN`
  opens a pull request, and the controlled pilot proves the dispatched check satisfies branch
  protection.
- [ ] The repository allows GitHub Actions to create pull requests. The workflow adds no preflight
  for this setting and fails naturally if publication is disabled.
- [ ] The issue remains open until human merge. Successful publication updates the rolling status
  comment with the pull-request link; failure leaves a generic stopped status and the Actions link.
- [ ] The built-in token cannot bypass protected-main review requirements.

## Validation approach

- [ ] Check workflow syntax and expressions with YAML parsing and `actionlint`.
- [ ] Smoke-test the two entry points, minimal result parsing, protected-path rejection, patch
  handoff, and status-comment reuse without introducing a fixture framework.
- [ ] Use controlled synthetic issues to prove a blocked outcome and one successful pull request,
  including the explicitly dispatched Verify check and required human-review boundary.
- [ ] The repository aggregate verification contract passes after implementation.

## Tracer-bullet rollout

1. Land the two entry points and issue-scoped concurrency with logging only.
2. Run OpenCode read-only against a synthetic ready issue and retain the patch as an artifact,
   without publishing it.
3. Add deterministic validation, publication, rolling status updates, and the explicit Verify
   dispatch.
