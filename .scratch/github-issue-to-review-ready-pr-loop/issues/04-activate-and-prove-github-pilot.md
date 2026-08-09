# 04 — Activate and prove the GitHub pilot

**What to build:** Configure the repository-side prerequisites and run controlled,
non-confidential GitHub issues through the complete loop so that maintainers can verify real
workflow chaining, publication, branch protection, and initial operating evidence before relying
on it.

**Blocked by:** 01 — Establish the repository Verify gate; 02 — Route new issues with
evidence-based triage; 03 — Turn a ready issue into a review-ready pull request.

**Status:** ready-for-human

## Repository and account prerequisites

- [x] The repository has exactly the four agreed readiness labels with consistent names and
  descriptions.
- [x] Workflow mutations use GitHub's repository-scoped built-in token with explicit per-job
  permissions. No additional automation identity, client-identifier variable, or private-key
  secret is required.
- [x] The protected-main ruleset has no bypass actors, so the built-in automation token cannot
  bypass it.
- [ ] The `OPENCODE_API_KEY` Actions secret is present, and a maintainer has confirmed in the
  OpenCode Zen account that paid-model access and automatic balance reload are disabled.
- [ ] `opencode/deepseek-v4-flash-free` is confirmed available for both triage and implementation
  immediately before activation. An unavailable model fails closed rather than selecting another
  model. Implementation is proven by Issue 17; triage awaits the merged model-alignment change and
  a fresh controlled issue.
- [x] Pilot issues contain only synthetic or public non-confidential information and no secrets,
  tenant data, production data, or personal financial records.

## Controlled GitHub proof

- [x] Issue 7 exercises a non-implementation triage state and produces the expected single
  `needs-info` label and evidence comment.
- [ ] A fresh controlled issue exercises `ready-to-implement`, is classified by triage, is
  explicitly dispatched downstream by the triage apply job, and produces a review-ready pull
  request. This must run from the default branch after the triage model-alignment change merges.
- [x] Issue 20 exercises the semantic-blocker path, retains `ready-to-implement`, records evidence
  and one concrete next step in a single terminal comment, and produces no branch or pull request.
- [x] Issue 17 keeps one marker-backed implementation comment through operational failure,
  restarted work, and successful publication.
- [x] Pull request 19 contains one commit changing only `README.md`, accurate validation evidence,
  and a closing reference that takes effect only after human merge.
- [x] The successful pilot pull request cannot merge without one human approval.
- [x] Verify was observed successfully on GitHub before `Lint, type-check, and test` was added as a
  required protected-main status check.
- [x] The failed Issue 17 implementation exposes its technical detail only in Actions and leaves
  the generic issue status described by the contract.
- [x] Initial maintainer agreement, review-ready pull-request yield, first-run verification result,
  reviewer corrections, reversions, elapsed time, and agent cost are recorded in
  `../pilot-baseline.md`.
- [ ] Pilot failures are corrected and rerun explicitly. The Issue 17 implementation failure was
  corrected and rerun; the failed triage path still needs its post-merge controlled rerun. No
  automatic retry, auto-merge, or deployment is enabled.

## Comments

- Earlier drafts required a private GitHub App so its label event could start another workflow.
  The accepted implementation instead uses `GITHUB_TOKEN` and has triage explicitly dispatch the
  implementation workflow; GitHub suppresses workflow chaining from token-generated events.
- Pull request 19 proves the final implementation/publication leg. It does not replace the pending
  fresh default-branch proof of the complete triage-to-implementation chain.
