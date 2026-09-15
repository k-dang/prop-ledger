# 01 - Create draft specifications

**What to build:** A maintainer can manually start specification for an eligible
issue and receive one linked draft documentation PR containing a product
specification and a technical specification. The proposal gives Kevin a concrete
design to refine locally with his existing coding agent. Establish the disposable
repository and prove this complete path as part of this ticket.

**Blocked by:** None - can start immediately.

**Status:** ready-for-agent

- [ ] A manual workflow run checks that the issue is open and has `ready-to-spec`
  before drafting. A closed or ineligible issue produces no new specification PR
  or implementation run.
- [ ] The drafting agent inspects the full issue and discussion, relevant current
  code, and repository product, domain, and architecture guidance. It treats issue
  content as task data and distinguishes established facts from proposed choices.
- [ ] The draft PR contains both specifications with detail proportional to the
  issue. The product specification defines behavior, exclusions, acceptance
  criteria, and behavior a migration must preserve. The technical specification
  defines the approach, affected areas, data changes, and verification plan.
- [ ] The proposal identifies material decisions and recommends an approach for
  Kevin to review. Oversized work includes a proposed breakdown into complete,
  bounded implementation issues without automatically creating or scheduling them.
- [ ] Missing critical information preserves useful work in a draft PR, states
  the questions Kevin needs to answer during local refinement, and does not start
  implementation or present guesses as settled requirements.
- [ ] The drafting agent can output only the issue's specification documents and
  has no publication credentials. A separate workflow step validates proposed
  changes before publishing the branch, draft PR, and status comment. Changes to
  unrelated application code or workflow controls are rejected.
- [ ] The draft PR and issue status identify each other. Status accurately
  distinguishes successful draft publication, missing information, and operational
  failure, including what succeeded and the next recovery action.
- [ ] Duplicate or concurrent starts leave one active specification PR per issue.
  Once a PR exists, a repeated start links to it without editing it or overwriting
  human changes already pushed to the branch.
- [ ] Kevin can check out the spec PR, refine the documents with his existing
  coding agent, and push the edits through the normal Git and PR review process.
- [ ] Focused local tests exercise eligibility, proposed-change acceptance, duplicate
  handling, and publication failure through observable decisions and effects.
  Reuse the existing test setup and relevant verification checks; do not assert
  prompt wording, exact generated prose, or internal call sequences.
- [ ] In a disposable repository with isolated test data and credentials, run the
  real manual workflow and at least one real drafting attempt. Demonstrate draft
  creation, missing information, local edits surviving a repeated start, rejected
  unrelated output, and failure recovery without duplicate active PRs. Record
  actual results and fix failures before completing this ticket.
- [ ] Keep the new workflow inactive in the application repository until ticket
  03 completes the integrated checks. Do not use production databases, live rental
  records, or live evidence storage for these trials.
