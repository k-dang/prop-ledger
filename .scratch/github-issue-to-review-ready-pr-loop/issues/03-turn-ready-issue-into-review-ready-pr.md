# 03 — Turn a ready issue into a review-ready pull request

**What to build:** Make applying `ready-to-implement` carry a bounded issue through one OpenCode implementation job to either a complete, validated, review-ready pull request or an honest terminal status explaining why no pull request was produced.

**Blocked by:** 01 — Establish the repository Verify gate; 02 — Route new issues with evidence-based triage.

**Status:** ready-for-agent

- [ ] Only applying the exact `ready-to-implement` label starts implementation.
- [ ] Implementation concurrency is scoped to the repository and issue, permits only one active run, and does not cancel an in-progress run when another event arrives.
- [ ] One GitHub-hosted job contains the ordered setup, status, OpenCode, validation, credential, and publishing steps on a shared fresh runner.
- [ ] The overall job and its OpenCode, validation, and publishing phases enforce the agreed time limits and perform no automatic retries.
- [ ] Preflight confirms the selected model and all required credentials before posting a started status or invoking OpenCode.
- [ ] The workflow creates or reuses one marker-backed implementation status comment and links it to the current Actions run instead of posting a comment stream.
- [ ] The token used to create the status comment is revoked before OpenCode begins.
- [ ] OpenCode receives the Zen credential and read-only issue and repository context but no valid GitHub App mutation credential.
- [ ] The implementation skill refetches the complete issue, reads current product and repository instructions, inspects the current checkout, and treats the triage comment as evidence rather than a substitute specification.
- [ ] OpenCode makes the smallest cohesive working-tree change that completely satisfies the bounded issue and discovers applicable validation from the repository.
- [ ] OpenCode may not create or alter commits, branches, tags, remotes, pushes, issue state, comments, or pull requests.
- [ ] A checked-in implementation-result schema distinguishes complete success from a semantic blocker and rejects malformed or ambiguous outcomes.
- [ ] A semantic blocker creates no pull request, does not relabel the issue, and updates the rolling comment with evidence and one concrete next step.
- [ ] A partial implementation cannot be reported as success and follows the semantic-blocker path.
- [ ] Deterministic validation confirms the original checked-out commit is unchanged and inspects every changed path before running repository checks.
- [ ] Changes to workflows, repository agent instructions, agent skills, OpenCode configuration, or agent-output schemas are rejected as protected control-plane changes.
- [ ] Deterministic validation reruns the repository-owned aggregate contract and appropriate targeted checks after OpenCode exits.
- [ ] A change-caused validation failure blocks publication and is never presented as passing.
- [ ] Only after successful validation does the workflow mint a new short-lived GitHub App token for publication.
- [ ] Deterministic publishing creates a unique automation branch and one commit containing exactly the validated diff, then pushes and opens a normal review-ready pull request.
- [ ] The pull request accurately summarizes the change and validation evidence and includes a closing reference to the originating issue.
- [ ] The issue remains open until a human merges the pull request.
- [ ] Successful publication edits the rolling status comment to include the pull request link.
- [ ] A crash, timeout, missing runtime dependency, malformed result, unavailable model, or other operational failure fails the Actions run and leaves only the generic stopped status with its Actions link when a status comment exists.
- [ ] The GitHub App cannot bypass protected-main review requirements.
- [ ] Fixture-driven tests cover successful publication, semantic blockage, operational failure, protected-path rejection, changed Git history, empty diffs, validation failure, token sequencing, status-comment reuse, and accurate PR metadata through a fake GitHub adapter.
- [ ] The repository aggregate verification contract passes after the implementation is complete.
