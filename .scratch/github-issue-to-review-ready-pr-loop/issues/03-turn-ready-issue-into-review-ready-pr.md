# 03 — Turn a ready issue into a review-ready pull request

**What to build:** Make applying `ready-to-implement` carry a bounded issue through one OpenCode implementation job to either a complete, validated, review-ready pull request or an honest terminal status explaining why no pull request was produced.

**Blocked by:** 01 — Establish the repository Verify gate; 02 — Route new issues with evidence-based triage.

**Status:** ready-for-agent

- [ ] Only an issue currently carrying the exact `ready-to-implement` label may start implementation; Issue 03 defines the explicit entry point without relying on a workflow-generated label event.
- [ ] Implementation concurrency is scoped to the repository and issue, permits only one active run, and does not cancel an in-progress run when another event arrives.
- [ ] Write-capable status and publication steps run separately from the read-only OpenCode job and exchange only explicit outputs or artifacts.
- [ ] The overall workflow and its OpenCode, validation, and publishing phases enforce the agreed time limits and perform no automatic retries.
- [ ] Missing model configuration or credentials fail naturally without a dedicated configuration preflight and cannot proceed to publication.
- [ ] The workflow creates or reuses one marker-backed implementation status comment and links it to the current Actions run instead of posting a comment stream.
- [ ] The OpenCode job has read-only GitHub permissions and does not share a runner environment with a write-capable token.
- [ ] OpenCode receives `OPENCODE_API_KEY` and read-only issue and repository context but no write-capable GitHub credential.
- [ ] The implementation skill refetches the complete issue, reads current product and repository instructions, inspects the current checkout, and treats the triage comment as evidence rather than a substitute specification.
- [ ] OpenCode makes the smallest cohesive working-tree change that completely satisfies the bounded issue and discovers applicable validation from the repository.
- [ ] OpenCode may not create or alter commits, branches, tags, remotes, pushes, issue state, comments, or pull requests.
- [ ] The implementation worker reports complete success or a semantic blocker, and malformed or ambiguous outcomes stop without publication.
- [ ] A semantic blocker creates no pull request, does not relabel the issue, and updates the rolling comment with evidence and one concrete next step.
- [ ] A partial implementation cannot be reported as success and follows the semantic-blocker path.
- [ ] Deterministic validation confirms the original checked-out commit is unchanged and inspects every changed path before running repository checks.
- [ ] Changes to workflows, repository agent instructions, agent skills, or OpenCode configuration are rejected as protected control-plane changes.
- [ ] Deterministic validation reruns the repository-owned aggregate contract and appropriate targeted checks after OpenCode exits.
- [ ] A change-caused validation failure blocks publication and is never presented as passing.
- [ ] Only after successful validation does a deterministic publication job use GitHub's built-in token with the minimum issue, contents, and pull-request write permissions.
- [ ] Deterministic publishing creates a unique automation branch and one commit containing exactly the validated diff, then pushes and opens a normal review-ready pull request.
- [ ] The pull request accurately summarizes the change and validation evidence and includes a closing reference to the originating issue.
- [ ] The issue remains open until a human merges the pull request.
- [ ] Successful publication edits the rolling status comment to include the pull request link.
- [ ] A crash, timeout, missing runtime dependency, malformed result, unavailable model, or other operational failure fails the Actions run and leaves only the generic stopped status with its Actions link when a status comment exists.
- [ ] The built-in workflow token cannot bypass protected-main review requirements.
- [ ] Static checks, local smoke tests, and controlled GitHub issues cover successful publication, semantic blockage, operational failure, protected-path rejection, changed Git history, empty diffs, validation failure, permission separation, status-comment reuse, and accurate pull-request metadata.
- [ ] The repository aggregate verification contract passes after the implementation is complete.
