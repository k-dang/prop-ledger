# 02 - Connect triage and labels

**What to build:** Issues that triage classifies as needing a specification, or
that a maintainer labels `ready-to-spec`, automatically reach the draft-creation
path from ticket 01. Every route rechecks eligibility before drafting.

**Blocked by:** 01 - Create draft specifications.

**Status:** implemented - awaiting the post-merge event trial below.

- [x] Triage uses unresolved product choices, meaningful architectural changes,
  migrations, or scope requiring decomposition to choose `ready-to-spec`. Change
  size alone does not require a specification (`.opencode/skills/triage/SKILL.md`).
- [x] When triage assigns `ready-to-spec`, its apply job explicitly dispatches
  `spec-ready-issue.yml` for the same issue, the same way it hands
  `ready-to-implement` to implementation. Labels applied with `GITHUB_TOKEN` do
  not fire label events, so the handoff cannot rely on the label mutation.
- [x] A maintainer applying `ready-to-spec` starts the same draft-creation path
  through an `issues: labeled` trigger. The manual entry point remains available.
- [x] Every entry point rechecks that the issue is open and labeled
  `ready-to-spec` before drafting. Label events on closed issues never start a
  job; anything else stale or re-routed fails the run before drafting, with no
  PR, no status comment, and no implementation run.
- [x] Duplicate label events, repeated dispatches, and an already-active spec PR
  result in one active specification PR without changing existing proposal edits.
  The per-issue concurrency group and ticket 01's existing-branch and existing-PR
  rules cover all routes.
- [x] Existing triage routes remain meaningful: `ready-to-implement` keeps its
  direct implementation path, while `needs-info` and `wait-to-implement` dispatch
  nothing.
- [x] A failed handoff dispatch comments on the issue that the label was applied
  but no run or PR exists, links the Actions run, and fails the job. Recovery is a
  manual dispatch, protected by the draft path's existing-branch and PR rules.
- [ ] Post-merge trial in this repository (label events run the default branch's
  workflow file, so this cannot run from the PR branch): open an issue that
  triage routes to `ready-to-spec`, apply `ready-to-spec` by hand to another
  issue, and confirm each produces one linked draft spec PR. Also confirm that a
  closed issue with the label, and a repeat of the label on an issue with an
  active spec PR, produce no new PR and leave the existing PR untouched.
