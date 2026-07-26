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
repository context, related work, and likely implementation area. It returns a JSON decision. A
deterministic step confirms the label is allowed and the comment is non-empty, then applies exactly
one readiness label and posts the supporting evidence. This triage stage stops after routing the
issue; the later implementation workflow owns how ready issues enter implementation.

The implementation workflow gives OpenCode the repository-scoped permissions needed to own one
complete issue-to-pull-request attempt. The implementation skill fetches the current issue, keeps
one concise status comment updated, changes and validates the code, creates the Git history, pushes
an automation branch, opens a review-ready pull request, and explicitly starts Verify. Human
review, merge, deployment, and production observation remain outside this first loop.

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
12. As a maintainer, I want `ready-to-implement` to remain the shared readiness signal for automated and manual decisions, while the implementation workflow owns its eventual trigger.
13. As a maintainer, I want issue edits and comments to leave parked issues alone, so that ordinary discussion does not repeatedly consume agent runs.
14. As a maintainer, I want the triage worker to have read access only, so that model output cannot directly mutate issue state.
15. As a maintainer, I want malformed or unrecognized triage output rejected before any label or comment is changed, so that tracker state remains trustworthy.
16. As a maintainer, I want the applied triage comment to summarize the decision, supporting evidence, likely implementation area, and one concrete next step, so that later stages can inspect the basis for the decision.
17. As a maintainer, I want acceptance criteria grounded in reporter, maintainer, product, or specification evidence, so that triage never manufactures scope.
18. As a maintainer, I want the implementation worker to refetch the complete issue and inspect the current checkout, so that it does not treat an older triage summary as the whole specification.
19. As a maintainer, I want only one implementation run active per issue, so that concurrent agents do not produce competing worktrees and pull requests.
20. As a maintainer, I want an active implementation run to finish when a duplicate event arrives, so that useful work is not cancelled midway.
21. As an issue reporter, I want a single concise comment showing that implementation started, so that I know the issue is being acted on.
22. As an issue reporter, I want that same comment updated rather than receiving a stream of progress messages, so that the discussion remains readable.
23. As an issue reporter, I want the status comment to link to the GitHub Actions run, so that authorized maintainers can follow operational progress.
24. As a maintainer, I want the implementation skill to own status, Git, and pull-request operations, so that the issue-to-review loop is easy to understand and operate.
25. As a maintainer, I want OpenCode to create one focused branch and commit only after validation succeeds, so that successful attempts are immediately reviewable.
26. As a maintainer, I want the implementation worker to make the smallest cohesive change that completely addresses the bounded issue, so that review remains focused.
27. As a maintainer, I want the implementation worker to discover validation from repository instructions, package scripts, workflows, and the affected subsystem, so that its checks evolve with the repository.
28. As a maintainer, I want the implementation worker to investigate and fix failures caused by its own changes, so that it does not hand obvious breakage to reviewers.
29. As a maintainer, I want the implementation skill to run the repository verification contract before publishing, so that failed changes do not become review-ready pull requests.
30. As a maintainer, I want autonomous changes to the loop's own control plane rejected, so that an issue cannot weaken the workflow, skills, OpenCode configuration, or agent instructions that govern it.
31. As a maintainer, I want the skill to inspect and commit only the intended validated diff, so that unrelated changes do not enter the pull request.
32. As a maintainer, I want the implementation skill to create the branch, commit, push, pull request, and status update as one coherent workflow.
33. As a reviewer, I want every successful automation pull request to be a normal review-ready pull request, so that it enters the existing human review process without a special review mode.
34. As a reviewer, I want the pull request to link and close the originating issue only after merge, so that an opened pull request is not mistaken for completed work.
35. As a reviewer, I want the pull request to identify the specifications used, exact validation results, and visible-behavior evidence or gaps, so that I can evaluate the change without reconstructing the implementation run.
36. As a maintainer, I want an implementation that discovers material ambiguity or larger-than-expected scope to stop without opening a partial pull request, so that mis-triage does not produce misleading success.
37. As an issue reporter, I want a semantic blocker summarized in the rolling status comment with one concrete next step, so that the issue can move forward deliberately.
38. As an issue reporter, I want operational failures described only as a generic stopped run, so that internal error details are not exposed or confused with a product decision.
39. As a maintainer, I want crashes, timeouts, and unavailable models to fail closed, so that the workflow never silently changes provider or claims success.
40. As a maintainer, I want explicit time limits and no automatic agent retries, so that cost and runaway execution remain bounded.
41. As a maintainer, I want the free model selected explicitly with paid models and automatic fallback disabled, so that the pilot cannot create an unexpected model bill.
42. As a repository owner, I want confidential records, production data, tenant data, and secrets excluded from free-model prompts, so that the pilot respects the selected model's retention limitations.
43. As a repository owner, I want implementation mutations to use GitHub's repository-scoped built-in token, so that the pilot needs no additional automation identity.
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
  behavior and success/failure contracts; workflows contain triggers, permissions, concurrency,
  environment setup, and a generic operational-failure fallback.
- New issue creation triggers initial triage. Issue edits and comments do not trigger triage.
  Re-triage is a maintainer manually replacing the existing readiness label.
- The readiness labels are mutually exclusive: `ready-to-implement`, `ready-to-spec`,
  `needs-info`, and `wait-to-implement`.
- Issue 02 stops after recording the readiness label and evidence comment. Issue 03 owns the
  implementation entry point; the other readiness states do not start implementation.
- Triage classification is contextual. Sensitive areas increase risk but do not form a static
  denylist. Borderline cases choose the more cautious state.
- The triage agent is read-only and returns one raw JSON object containing the chosen label and a
  concise reporter-facing comment. The comment summarizes the evidence, likely implementation
  area, and one concrete next step.
- Deterministic code confirms that the result contains one allowed readiness label and a non-empty
  reporter-facing comment before applying any state.
- The deterministic triage step removes prior readiness labels, applies exactly one allowed
  readiness label, and posts the reporter-facing evidence comment using GitHub's built-in token
  with `issues: write` scoped to the apply job.
- The triage workflow uses issue-scoped concurrency. A newer triage run cancels an older run for
  the same issue.
- The implementation workflow uses issue-scoped concurrency and does not cancel a run already in
  progress. The pilot accepts the operator-controlled risk of a later manual rerun creating a
  duplicate attempt and does not add persistent deduplication.
- The triage workflow uses a 15-minute read-only analysis job followed by a five-minute apply job.
  The OpenCode step has its own 10-minute limit.
- The implementation workflow has a 90-minute overall limit, including a 70-minute OpenCode limit.
- There are no automatic agent retries. Maintainers explicitly rerun operational failures.
- Triage has no dedicated configuration preflight. An unavailable model, malformed result, or
  failed analysis stops the read-only job, so the apply job never changes the issue.
- The implementation skill maintains one marker-backed status comment per issue. It creates or
  reuses the comment at start, records the Actions run link, and edits the same comment on success
  or semantic blockage. A final workflow step records a generic operational failure when the agent
  run fails.
- The generic operational-failure status says the run stopped unexpectedly, directs maintainers to
  check for a linked branch or pull request before rerunning, and retains the Actions link. It
  contains no internal error details or unsupported claim about how far the run progressed.
- The implementation job gives OpenCode GitHub's built-in token with Actions, contents, issues,
  and pull-request write permissions. This deliberately trusts the implementation skill to own
  status updates, validation, Git history, branch publication, and pull-request creation.
- OpenCode inspects every changed path, avoids protected control-plane areas, runs targeted checks
  while iterating, and runs the repository-owned aggregate verification command before publishing.
- Before implementation, OpenCode finds linked and checked-in product, technical, and architecture
  specifications. Material conflicts among the issue, maintainer decisions, and authoritative
  specifications are semantic blockers rather than invitations to guess.
- Changes to UI or other user-visible interactions use the repository's `agent-browser` skill to
  exercise affected acceptance criteria when the application is runnable. Change-caused behavior
  failures block publication; environmental verification gaps must be explicit in the pull request
  and rolling status and must never be described as passing.
- Useful browser screenshots, video, or concise evidence records are kept outside the commit under
  `.implementation/evidence/` and retained as a short-lived Actions artifact when present.
- Protected control-plane areas include workflow definitions, repository agent instructions,
  agent skills, and OpenCode configuration. Issues requiring those changes must use a
  human-authored path during the pilot.
- The repository's aggregate verification command currently covers formatting and lint checks,
  application type-checking, Worker type-checking, and the unit test suite. The agent discovers
  the current command rather than permanently encoding its present subcommands in the skill.
- The production build remains outside the aggregate CI contract until the repository has an
  explicit CI-safe runtime configuration.
- A change-caused validation failure blocks publication. A proven pre-existing or environmental
  failure may accompany a pull request only when the gap is prominent, reproducible, and reported
  accurately in both implementation evidence and reviewer-facing text.
- The implementation worker reports complete success or semantic blockage through the rolling
  issue comment. An operational failure fails the workflow and triggers its generic fallback.
- A semantic blocker contains evidence and a concrete next step, creates no pull request, and does
  not relabel the issue. A maintainer later changes the readiness label when appropriate.
- A successful result must completely address the bounded issue. Partial implementations are not
  a successful terminal state.
- The implementation skill owns Git history and GitHub mutation. After validation, it creates a
  unique automation branch, makes one commit containing the intended diff, pushes it, opens a
  normal pull request, dispatches Verify, and updates the rolling status comment.
- The pull request body links the originating issue and specifications used, summarizes the change,
  records exact validation and visible-behavior evidence or gaps, identifies known limitations, and
  contains a closing reference only for a complete implementation. The issue closes only after
  human merge.
- The implementation job uses GitHub's built-in repository token with the Actions, contents,
  issues, and pull-request permissions needed by the skill. No additional automation identity or
  personal access token is required.
- OpenCode and all third-party actions are pinned to reviewed versions. OpenCode automatic update
  and conversation sharing are disabled.
- The pilot explicitly selects `opencode/north-mini-code-free` for triage and implementation.
  Missing or unavailable model configuration fails closed; there is no automatic model fallback.
- Paid models and automatic balance reload remain disabled. Moving to another model is an
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
- Keep the triage workflow self-contained while its deterministic logic remains small. Do not add
  a separate automation library or fixture harness solely for this workflow.
- Check workflow syntax and expressions with YAML parsing and `actionlint`.
- Smoke-test OpenCode skill discovery, triage JSONL result extraction, and representative valid and
  invalid triage results locally.
- Use a controlled issue on the default branch to prove the real `issues.opened` trigger,
  repository permissions, label replacement, and reporter-facing comment. Confirm that later issue
  edits and comments do not retrigger triage.
- Issue 03 defines and tests the downstream implementation trigger separately; Issue 02 does not
  rely on a workflow-generated label event.
- Validate that the rolling status comment is reused on rerun and transitions among started,
  successful, semantically blocked, and operationally stopped states without producing a comment
  stream.
- Validate that the implementation job has the GitHub permissions needed for status, branch,
  pull-request, and Verify operations without an additional automation identity.
- Validate that the implementation skill requires a non-empty intended diff, avoids protected
  control-plane paths, and runs required repository validation before publication.
- Validate that material specification conflicts stop implementation and that visible-behavior
  changes require browser verification or a prominent, accurate environmental gap.
- Validate that optional browser evidence stays outside the commit and is retained by the workflow
  when `.implementation/evidence/` is present.
- Validate that the skill creates one branch and commit, opens a normal pull request, adds the
  issue closing reference, dispatches Verify, and updates the status comment with the PR link.
- Validate semantic blockage as a no-PR outcome with an evidence-based next step and no automatic
  relabeling.
- Validate operational failure as a failed workflow with only the generic issue status and Actions
  link when a status comment already exists.
- Validate that no failure path reports skipped or failed checks as passing.
- Run the aggregate repository verification contract as the final local and CI regression gate.
- After repository-side checks pass, use controlled GitHub pilot issues to exercise real triage,
  the Issue 03 implementation trigger, status comment editing, branch publication, pull-request
  creation, and branch protection. Do not use production or tenant data in pilots.

## Out of Scope

- Automatic specification generation for `ready-to-spec` issues.
- Automatic re-triage after issue edits or comments.
- A separate re-triage label, slash command, or scheduled re-triage process.
- Always-on independent review, security-review, or monitoring agents.
- Automatic merge, protected-branch bypass, deployment, rollback, or production observation.
- A generic multi-provider runner abstraction or reusable-workflow framework.
- Support for Oz, Pi, or a second coding-agent runner in the first implementation.
- Paid model configuration, automatic model fallback, or automatic account balance reload.
- Persistent deduplication of completed implementation attempts.
- Automatic retries of failed agent runs.
- Autonomous edits to the loop's workflows, skills, agent instructions, or model configuration.
- Adding the environment-dependent production build to the aggregate verification contract.
- Building a new end-to-end browser suite solely for this loop.
- Replacing existing product-domain tests or changing Tax-Ready Rental Records behavior.
- Auto-closing issues before a human merges the implementation pull request.

## Further Notes

- The live mutation step requires the four readiness labels to exist in the repository. Missing
  labels are allowed to fail the workflow rather than adding configuration preflight logic.
- North Mini Code Free is available only temporarily and may retain submitted content for model
  improvement. The pilot must use synthetic or public, non-confidential issue content.
- The implementation model runs with write-capable repository permissions. This is a deliberate
  simplicity tradeoff: the skill owns the complete lifecycle, while protected-main review and the
  required Verify check remain the final human and deterministic boundaries.
- The active protected-main ruleset already supplies the required human-review boundary. The
  Verify status should be added to that ruleset only after its first successful GitHub run.
- The loop should be evaluated on maintainer agreement with triage, review-ready PR yield,
  first-run verification success, reviewer correction rate, reversions, elapsed time, and agent
  cost rather than raw agent activity.
