# 04 — Activate and prove the GitHub pilot

**What to build:** Configure the repository-side prerequisites and run controlled, non-confidential GitHub issues through the complete loop so that maintainers can verify real workflow chaining, publication, branch protection, and initial operating evidence before relying on it.

**Blocked by:** 01 — Establish the repository Verify gate; 02 — Route new issues with evidence-based triage; 03 — Turn a ready issue into a review-ready pull request.

**Status:** ready-for-human

- [ ] The repository has exactly the four agreed readiness labels with consistent names and descriptions.
- [ ] The private automation GitHub App is installed only on this repository with the minimum issue, contents, and pull-request permissions needed by the loop.
- [ ] The App installation has no protected-branch bypass.
- [ ] The expected App client identifier variable and private-key secret are available to GitHub Actions.
- [ ] The OpenCode Zen credential is available to GitHub Actions, paid models are disabled, and automatic balance reload is disabled.
- [ ] The selected free model is confirmed available immediately before activation; an unavailable model leaves the loop disabled rather than silently selecting another model.
- [ ] Pilot issues contain only synthetic or public non-confidential information and no secrets, tenant data, production data, or personal financial records.
- [ ] A controlled issue exercises a non-implementation triage state and produces the expected single label and evidence comment.
- [ ] A controlled issue exercises `ready-to-implement`, starts the downstream workflow through the App-generated label event, and produces a review-ready pull request.
- [ ] A controlled issue exercises the semantic-blocker path and produces no pull request.
- [ ] The implementation status remains one rolling comment through started and terminal states.
- [ ] The successful pilot pull request contains exactly the validated change, accurate validation evidence, and the issue closing reference.
- [ ] The successful pilot pull request cannot merge without one human approval.
- [ ] The Verify workflow is observed successfully on GitHub before it is added as a required protected-main status check.
- [ ] A failed operational pilot exposes its technical detail only in Actions and leaves the generic issue status described by the contract.
- [ ] Initial maintainer agreement, review-ready PR yield, first-run verification result, reviewer corrections, elapsed time, and agent cost are recorded as the pilot baseline.
- [ ] Any pilot failure is corrected and rerun explicitly; no automatic retry, auto-merge, or deployment is enabled.
