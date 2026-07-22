Status: ready-for-agent

## Problem Statement

Maintainers currently have to inspect every incoming GitHub issue, decide whether it is clear and
safe enough to implement, route it manually, make the change, run the repository's checks, and
prepare a pull request for review. The repository already has strong product context, agent
instructions, and deterministic validation, but these pieces are not connected into an operating
loop.

The missing loop makes small, well-specified changes consume the same coordination effort as
ambiguous or high-risk work. It also leaves no consistent evidence trail explaining why an issue
was considered implementation-ready or why an attempted implementation stopped.

## Solution

Create a GitHub Actions pilot that owns one outcome: move a suitable GitHub issue from initial
triage through implementation to a normal, review-ready pull request.

When an issue opens, a read-only OpenCode triage worker inspects the full issue, discussion,
repository context, related work, and likely implementation area. It returns a schema-validated
decision. A deterministic step then applies exactly one readiness label and posts the supporting
evidence. Applying `ready-to-implement`, either through automated triage or a later maintainer
decision, starts implementation.

The implementation workflow uses one GitHub-hosted job with ordered steps on the same runner.
OpenCode makes working-tree changes and discovers and runs the appropriate repository validation.
Deterministic steps independently enforce protected-path and validation gates, create the Git
history, push an automation branch, open a review-ready pull request, and maintain one concise
status comment on the issue. Human review, merge, deployment, and production observation remain
outside this first loop.

## User Stories

1. As a maintainer, I want every newly opened issue assessed against the current repository, so that routing reflects what the product and code actually support.
2. As a maintainer, I want triage to choose exactly one readiness state, so that each issue has one unambiguous next action.
3. As an issue reporter, I want the triage decision explained with concrete evidence, so that I understand why the issue advanced or stopped.
4. As an issue reporter, I want missing information expressed as the smallest useful set of questions, so that I can unblock the issue efficiently.
5. As a maintainer, I want clear and bounded issues labeled `ready-to-implement`, so that they can proceed without another coordination step.
6. As a maintainer, I want worthwhile but ambiguous or materially risky work labeled `ready-to-spec`, so that implementation does not begin before important decisions are made.
7. As a maintainer, I want issues missing reproduction details or acceptance criteria labeled `needs-info`, so that an agent does not invent requirements.
8. As a maintainer, I want duplicate, premature, misaligned, or low-value issues labeled `wait-to-implement`, so that the implementation queue stays focused.
9. As a maintainer, I want readiness determined contextually rather than through a static risk denylist, so that a small change in a sensitive area can still advance when the evidence supports it.
10. As a maintainer, I want uncertain classifications to choose the more cautious state, so that autonomy expands only where the chance of a correct one-pass result is high.
11. As a maintainer, I want to override an earlier automated decision by manually replacing its readiness label, so that human judgment remains authoritative.
12. As a maintainer, I want applying `ready-to-implement` manually to trigger the same implementation path as automated triage, so that re-triage needs no separate control mechanism.
13. As a maintainer, I want issue edits and comments to leave parked issues alone, so that ordinary discussion does not repeatedly consume agent runs.
14. As a maintainer, I want the triage worker to have read access only, so that model output cannot directly mutate issue state.
15. As a maintainer, I want malformed or unrecognized triage output rejected before any label or comment is changed, so that tracker state remains trustworthy.
16. As a maintainer, I want the applied triage evidence to preserve the problem summary, acceptance criteria, affected areas, validation plan, risk, assumptions, and open questions, so that later stages can inspect the basis for the decision.
17. As a maintainer, I want acceptance criteria grounded in reporter, maintainer, product, or specification evidence, so that triage never manufactures scope.
18. As a maintainer, I want the implementation worker to refetch the complete issue and inspect the current checkout, so that it does not treat an older triage summary as the whole specification.
19. As a maintainer, I want only one implementation run active per issue, so that concurrent agents do not produce competing worktrees and pull requests.
20. As a maintainer, I want an active implementation run to finish when a duplicate event arrives, so that useful work is not cancelled midway.
21. As an issue reporter, I want a single concise comment showing that implementation started, so that I know the issue is being acted on.
22. As an issue reporter, I want that same comment updated rather than receiving a stream of progress messages, so that the discussion remains readable.
23. As an issue reporter, I want the status comment to link to the GitHub Actions run, so that authorized maintainers can follow operational progress.
24. As a maintainer, I want OpenCode to receive model credentials but no valid GitHub mutation credential, so that the agent cannot directly label, commit, push, comment, or open pull requests.
25. As a maintainer, I want OpenCode to leave working-tree changes without changing Git history, so that publication is mechanically controlled after validation.
26. As a maintainer, I want the implementation worker to make the smallest cohesive change that completely addresses the bounded issue, so that review remains focused.
27. As a maintainer, I want the implementation worker to discover validation from repository instructions, package scripts, workflows, and the affected subsystem, so that its checks evolve with the repository.
28. As a maintainer, I want the implementation worker to investigate and fix failures caused by its own changes, so that it does not hand obvious breakage to reviewers.
29. As a maintainer, I want deterministic validation rerun after OpenCode exits, so that success does not depend only on the agent's claim.
30. As a maintainer, I want autonomous changes to the loop's own control plane rejected, so that an issue cannot weaken the workflow, skills, schemas, or agent instructions that govern it.
31. As a maintainer, I want publication to include exactly the validated diff, so that unrelated or post-validation changes do not enter the pull request.
32. As a maintainer, I want deterministic publishing to create the branch, one commit, and the pull request without model judgment, so that GitHub mutations are reproducible and auditable.
33. As a reviewer, I want every successful automation pull request to be a normal review-ready pull request, so that it enters the existing human review process without a special review mode.
34. As a reviewer, I want the pull request to link and close the originating issue only after merge, so that an opened pull request is not mistaken for completed work.
35. As a reviewer, I want validation evidence summarized accurately in the pull request, so that failed or skipped checks are never presented as passing.
36. As a maintainer, I want an implementation that discovers material ambiguity or larger-than-expected scope to stop without opening a partial pull request, so that mis-triage does not produce misleading success.
37. As an issue reporter, I want a semantic blocker summarized in the rolling status comment with one concrete next step, so that the issue can move forward deliberately.
38. As an issue reporter, I want operational failures described only as a generic stopped run, so that internal error details are not exposed or confused with a product decision.
39. As a maintainer, I want crashes, timeouts, missing credentials, unavailable models, and malformed output to fail closed, so that the workflow never silently changes provider or claims success.
40. As a maintainer, I want explicit time limits and no automatic agent retries, so that cost and runaway execution remain bounded.
41. As a maintainer, I want the free model selected explicitly with paid models and automatic fallback disabled, so that the pilot cannot create an unexpected model bill.
42. As a repository owner, I want confidential records, production data, tenant data, and secrets excluded from free-model prompts, so that the pilot respects the selected model's retention limitations.
43. As a repository owner, I want all event-producing mutations performed by a repository-scoped GitHub App, so that applying the implementation label can start the downstream workflow.
44. As a repository owner, I want the automation identity unable to bypass the protected main branch, so that a human approval remains mandatory.
45. As a maintainer, I want pull requests and pushes to main to run the aggregate repository verification contract, so that human and automated changes use the same gate.
46. As a maintainer, I want first-run success, reviewer corrections, reversions, latency, and agent cost measured, so that later autonomy decisions are evidence-based.
47. As a future loop author, I want the triage and implementation skills separated from GitHub Actions and OpenCode invocation details, so that the operating rules survive a later runner change.
48. As a future loop author, I want the first implementation to remain concrete rather than introducing a reusable multi-provider framework, so that the pilot is easy to understand and change.

## Implementation Decisions

- The loop boundary is Issue → Triage → Implement → review-ready pull request. Human review,
  merge, deployment, and production observation remain outside it.
- GitHub Actions is the initial orchestrator and OpenCode is the initial agent runner. The design
  does not use Oz and does not introduce reusable workflows or a generic provider abstraction.
- The repository defines separate triage and implementation skills. Skills contain worker
  behavior and success/failure contracts; workflows contain triggers, permissions, sequencing,
  concurrency, and deterministic state transitions.
- New issue creation triggers initial triage. Issue edits and comments do not trigger triage.
  Re-triage is a maintainer manually replacing the existing readiness label.
- The readiness labels are mutually exclusive: `ready-to-implement`, `ready-to-spec`,
  `needs-info`, and `wait-to-implement`.
- Applying `ready-to-implement` triggers implementation. The other readiness states do not start
  another automated worker.
- Triage classification is contextual. Sensitive areas increase risk but do not form a static
  denylist. Borderline cases choose the more cautious state.
- The triage agent is read-only and returns one raw structured result. The result includes the
  chosen state, summary, evidence, sourced acceptance criteria, affected areas, validation plan,
  risk, assumptions, and open questions.
- A checked-in schema is the contract between model judgment and issue mutation. Deterministic
  code validates the complete result before applying any state.
- The deterministic triage step removes prior readiness labels, applies exactly one allowed
  readiness label, and posts the reporter-facing evidence comment using a short-lived GitHub App
  token.
- The triage workflow uses issue-scoped concurrency. A newer triage run cancels an older run for
  the same issue.
- The implementation workflow uses issue-scoped concurrency and does not cancel a run already in
  progress. The pilot accepts the operator-controlled risk of a later manual rerun creating a
  duplicate attempt and does not add persistent deduplication.
- Each workflow contains one GitHub-hosted job. Ordered steps share one fresh runner and checkout.
- The triage job has a 20-minute limit, including a 10-minute OpenCode limit and a five-minute
  deterministic application allowance.
- The implementation job has a 90-minute limit, including a 60-minute OpenCode limit, a
  20-minute deterministic validation allowance, and a five-minute publishing allowance.
- There are no automatic agent retries. Maintainers explicitly rerun operational failures.
- All required credentials and the selected model are checked before the workflow publishes a
  started status. A failed preflight changes no issue state.
- The implementation workflow maintains one marker-backed status comment per issue. It creates
  or reuses the comment at start, records the Actions run link, and edits the same comment on
  success, semantic blockage, or operational failure.
- The generic operational-failure status says the run stopped before producing a result and
  retains the Actions link. It contains no internal error details.
- The implementation agent receives repository and issue read access plus the Zen credential. It
  receives no valid GitHub App mutation token.
- A brief pre-agent App token may create the status comment, but it is revoked before OpenCode
  begins. Publication mints a new token only after the agent exits and deterministic validation
  succeeds.
- The pilot accepts that ordered steps in one job share a runner and therefore do not create a
  hard security boundary. If stronger isolation becomes necessary, publication will move to a
  fresh job that consumes only validated output.
- OpenCode may inspect, edit, and validate the working tree. It may not create commits, branches,
  tags, pushes, comments, labels, or pull requests.
- Deterministic validation confirms the original commit remains checked out, inspects every
  changed path, rejects forbidden control-plane changes, and reruns the repository-owned
  aggregate and targeted checks.
- Protected control-plane areas include workflow definitions, repository agent instructions,
  agent skills, OpenCode configuration, and the schemas governing agent output. Issues requiring
  those changes must use a human-authored path during the pilot.
- The repository's aggregate verification command currently covers formatting and lint checks,
  application type-checking, Worker type-checking, and the unit test suite. The agent discovers
  the current command rather than permanently encoding its present subcommands in the skill.
- The production build remains outside the aggregate CI contract until the repository has an
  explicit CI-safe runtime configuration.
- A change-caused validation failure blocks publication. A proven pre-existing or environmental
  failure may accompany a pull request only when the gap is prominent, reproducible, and reported
  accurately in both implementation evidence and reviewer-facing text.
- The implementation result schema distinguishes complete success, semantic blockage, and
  operational failure. Only a schema-valid complete result may proceed to publication.
- A semantic blocker contains evidence and a concrete next step, creates no pull request, and does
  not relabel the issue. A maintainer later changes the readiness label when appropriate.
- A successful result must completely address the bounded issue. Partial implementations are not
  a successful terminal state.
- Deterministic publishing owns all Git history and GitHub mutation. It creates a unique
  automation branch, makes one commit containing the validated diff, pushes it, opens a normal
  pull request, and updates the rolling status comment.
- The pull request body summarizes the change and validation evidence and contains a closing
  reference to the originating issue. The issue closes only after human merge.
- One private GitHub App installed only on this repository performs event-producing mutations.
  Its client identifier is a repository variable and its private key is a repository secret.
- The GitHub App has only the repository permissions required for issue labels and comments,
  branch publication, and pull request creation. It has no protected-branch bypass.
- Ordinary reads use the built-in GitHub Actions token with read-only permissions.
- OpenCode and all third-party actions are pinned to reviewed versions. OpenCode automatic update
  and conversation sharing are disabled.
- The pilot explicitly selects `opencode/north-mini-code-free` for triage and implementation.
  Missing or unavailable model configuration fails closed; there is no automatic model fallback.
- Paid Zen models and automatic balance reload remain disabled. Moving to another model is an
  explicit operator-owned configuration change.
- The free model must not receive secrets, production data, tenant data, confidential issue
  content, or personal financial records. Issue content is treated as untrusted task data and is
  never interpolated directly into executable workflow scripts.
- The protected main branch continues to require a pull request and one human approval and to
  reject deletion and force pushes. The aggregate Verify check becomes required only after GitHub
  has observed it successfully.
- The first rollout establishes the Verify baseline, pilots triage against real issues, enables
  deterministic routing, and only then enables implementation publication.

## Testing Decisions

- Tests assert externally visible behavior rather than model phrasing, workflow internals, or
  private helper calls.
- The highest test seam is a fixture-driven loop control boundary. Tests provide a GitHub event,
  current issue state, structured agent result, and repository state, then observe the requested
  label, comment, Git, and pull-request effects through a fake GitHub adapter.
- Keep workflow YAML thin. Put schema validation, allowed state transitions, comment rendering,
  protected-path checks, and publication planning behind the testable control boundary.
- Reuse the repository's existing Vitest setup for deterministic control-plane tests. The current
  codebase has strong library-level unit-test precedent but no existing GitHub automation test
  harness, so the fake adapter is the single new seam.
- Validate triage success fixtures for each of the four readiness states.
- Validate that a successful triage removes every prior readiness label and applies exactly one
  new state.
- Validate that malformed JSON, schema violations, invented ready-state acceptance criteria,
  unresolved ready-state questions, and unrecognized labels produce no mutations.
- Validate that human label replacement remains authoritative and that only applying
  `ready-to-implement` starts implementation.
- Validate concurrency expressions and workflow trigger filters through static workflow checks
  and representative event fixtures.
- Validate preflight failure for missing model, Zen credential, App configuration, or required
  repository metadata without creating a started comment.
- Validate that the rolling status comment is reused on rerun and transitions among started,
  successful, semantically blocked, and operationally stopped states without producing a comment
  stream.
- Validate that the pre-agent mutation token is revoked before the OpenCode invocation and that a
  separate token is required for publication.
- Validate that OpenCode receives no write-capable GitHub credential in its environment or action
  inputs.
- Validate implementation success only when the original checked-out commit is unchanged, the
  structured result is valid, the diff is non-empty, all changed paths are allowed, and required
  repository validation succeeds.
- Validate rejection of commits, branches, tags, unexpected remotes, empty diffs, malformed
  reports, and modifications to any protected control-plane area.
- Validate that deterministic publishing creates one branch and one commit from exactly the
  validated diff, opens a normal pull request, adds the issue closing reference, and updates the
  status comment with the PR link.
- Validate semantic blockage as a no-PR outcome with an evidence-based next step and no automatic
  relabeling.
- Validate operational failure as a failed workflow with only the generic issue status and Actions
  link when a status comment already exists.
- Validate that no failure path reports skipped or failed checks as passing.
- Run the aggregate repository verification contract as the final local and CI regression gate.
- After repository-side tests pass, use controlled GitHub pilot issues to exercise the real App
  installation, label-triggered workflow chaining, status comment editing, branch publication,
  pull-request creation, and branch protection. Do not use production or tenant data in pilots.

## Out of Scope

- Automatic specification generation for `ready-to-spec` issues.
- Automatic re-triage after issue edits or comments.
- A separate re-triage label, slash command, or scheduled re-triage process.
- Independent review agents, verification agents, security-review agents, or monitoring agents.
- Automatic merge, protected-branch bypass, deployment, rollback, or production observation.
- A generic multi-provider runner abstraction or reusable-workflow framework.
- Support for Oz, Pi, or a second coding-agent runner in the first implementation.
- Paid model configuration, automatic model fallback, or automatic account balance reload.
- Persistent deduplication of completed implementation attempts.
- Automatic retries of failed agent runs.
- Autonomous edits to the loop's workflows, skills, schemas, agent instructions, or model
  configuration.
- Adding the environment-dependent production build to the aggregate verification contract.
- Building a new end-to-end browser suite solely for this loop.
- Replacing existing product-domain tests or changing Tax-Ready Rental Records behavior.
- Auto-closing issues before a human merges the implementation pull request.

## Further Notes

- The repository-side implementation can proceed before credentials are supplied. Live workflows
  must remain fail-closed and should not be enabled on the default branch until the four readiness
  labels, GitHub App configuration, and Zen API key are present.
- North Mini Code Free is available only temporarily and may retain submitted content for model
  improvement. The pilot must use synthetic or public, non-confidential issue content.
- The shared-runner credential exposure is an explicitly accepted pilot risk. Delaying and
  revoking tokens limits ordinary exposure but does not defend against a fully compromised runner.
- The active protected-main ruleset already supplies the required human-review boundary. The
  Verify status should be added to that ruleset only after its first successful GitHub run.
- The loop should be evaluated on maintainer agreement with triage, review-ready PR yield,
  first-run verification success, reviewer correction rate, reversions, elapsed time, and agent
  cost rather than raw agent activity.
