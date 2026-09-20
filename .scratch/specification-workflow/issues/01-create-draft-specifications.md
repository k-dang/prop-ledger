# 01 - Create draft specifications

**What to build:** A maintainer can manually start specification for an issue
and receive one linked draft documentation PR containing a product
specification and a technical specification. The proposal gives Kevin a concrete
design to refine locally with his existing coding agent.

**Blocked by:** None - can start immediately.

**Status:** done - PR #32 (`spec-ready-issue.yml`, `.opencode/agents/spec.md`,
`.opencode/skills/spec/SKILL.md`). Enabled here through `SPEC_WORKFLOW_ENABLED`;
first real draft is PR #34 for issue #33.

- [x] A manual workflow run (`workflow_dispatch` with `issue_number`) drafts
  specifications for that issue. The open-and-labeled recheck arrived with
  ticket 02.
- [x] The drafting agent inspects the full issue and discussion, relevant current
  code, and repository product, domain, and architecture guidance. It treats issue
  content as task data and distinguishes established facts from proposed choices.
- [x] The draft PR contains both specifications with detail proportional to the
  issue. The product specification defines behavior, exclusions, acceptance
  criteria, and behavior a migration must preserve. The technical specification
  defines the approach, affected areas, data changes, and verification plan.
- [x] The proposal identifies material decisions and recommends an approach for
  Kevin to review. Oversized work includes a proposed breakdown into complete,
  bounded implementation issues without automatically creating or scheduling them.
- [x] Missing critical information preserves useful work in a draft PR, lists the
  questions Kevin needs to answer in the PR body, and does not start
  implementation or present guesses as settled requirements.
- [x] The drafting agent can write only `specs/issue-<n>/PRODUCT.md`,
  `specs/issue-<n>/TECH.md`, and `.spec/outcome.json`, and has no shell, GitHub
  token, or Git credentials. A separate workflow step rejects any other changed
  path before publishing the branch, draft PR, and status comment.
- [x] The draft PR and issue status identify each other. A single maintained
  status comment distinguishes `published`, `missing-info`, `existing`, and
  `failed`, including whether the branch was pushed and the recovery action.
- [x] Duplicate or concurrent starts leave one active specification PR per issue.
  A concurrency group serializes runs per issue; an existing branch skips
  drafting, and an existing open PR is linked without edits.
- [x] Kevin can check out the spec PR, refine the documents with his existing
  coding agent, and push the edits through the normal Git and PR review process.
