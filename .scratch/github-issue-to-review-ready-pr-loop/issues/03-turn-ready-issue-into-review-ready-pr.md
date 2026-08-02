# 03 — Turn a ready issue into a review-ready pull request

**What to build:** Take an open issue currently labeled `ready-to-implement` through one
bounded OpenCode implementation attempt. Finish with either a complete, validated,
review-ready pull request or a concise issue update explaining why no pull request was created.

**Blocked by:** 01 — Establish the repository Verify gate; 02 — Route new issues with
evidence-based triage.

**Status:** ready-for-agent

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
  issue-scoped concurrency so the later implementation deepens the same path instead of replacing
  it with a second entry point.
- [x] Deterministic shell logic refetches the current issue through GitHub and confirms it is open
  and still labeled `ready-to-implement`.
- [x] The tracer writes only a GitHub Actions step summary identifying the repository, issue,
  trigger event, and explicit fact that implementation did not start.
- [x] The tracer has only `issues: read`, performs no checkout or dependency setup, makes no
  OpenCode call or GitHub mutation, and has a two-minute overall timeout.
- [ ] A controlled issue on the default branch proves the manual-label and triage-dispatch paths,
  issue validation, and Actions summary without starting implementation.

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

1. Land the final two entry points and issue-scoped concurrency with a deterministic trigger probe.
   Prove the real events and ready-issue validation without checking out code or invoking OpenCode.
2. Run the tracer against a controlled ready issue on the default branch and record the live result
   before enabling repository publication.
3. Add OpenCode and the repository implementation skill in the following pull request so it
   implements and validates the issue, creates the branch and pull request, retains
   visible-behavior evidence, and explicitly dispatches Verify.
