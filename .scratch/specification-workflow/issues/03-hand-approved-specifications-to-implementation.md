# 03 - Hand approved specifications to implementation

**What to build:** Kevin can refine a generated specification locally, merge the
agreed design, and leave the issue queued until he explicitly authorizes
implementation. The implementation agent consumes that merged design and stops
on material conflicts. Complete the issue-to-implementation trial using the
automatic routing from ticket 02, then enable the new workflow after all checks
pass.

**Blocked by:** 02 - Connect triage and labels.

**Status:** in progress - implementation skill and spec PR guidance done. Kevin
decided on 2026-09-22 to follow the upstream cloud-factory flow and keep approval
human rather than recorded: no merge-handler workflow and no Design Approval gate.
Merging a specification is an ordinary PR merge; Kevin swaps `ready-to-spec` for
`ready-to-implement` himself. The unchecked items below record what that decision
gives up, and the real-run trials need this PR merged first.

- [x] Kevin can check out a generated spec PR, resolve its questions interactively
  with his existing coding agent, push the edits, and merge the agreed documents
  through normal PR review.
- [ ] Merging the specification records Design Approval, removes `ready-to-spec`,
  and leaves the original issue open without a routing label. Merge does not
  authorize or dispatch implementation, and no separate approval label is added.
  Dropped by the 2026-09-22 decision: nothing fires on merge, so no approval is
  recorded and Kevin removes `ready-to-spec` himself. Merge still dispatches
  nothing, which is the part that mattered.
- [x] Applying `ready-to-implement` supplies Implementation Authorization. Before
  starting code changes, the implementation flow confirms the issue is open and
  eligible and, when a specification is required, that the relevant specification
  is merged and material questions are resolved. The agent performs these checks,
  as upstream does. The workflow enforces only that label events on closed issues
  start no job.
- [ ] Applying the implementation label before required Design Approval does not
  bypass review. The attempt reports why it is blocked and does not publish a
  partial implementation. Partly dropped by the 2026-09-22 decision: the agent
  stops and reports when a specification is missing or still has open questions,
  but nothing outside the agent prevents the run, and the label is not withdrawn.
- [x] Implementation follows the merged specification, including Kevin's local
  refinements, rather than treating the original generated draft or triage comment
  as the complete design. A manually created child issue can reference the shared
  specification while identifying its own bounded scope and acceptance criteria.
- [x] The agent checks the approved design against current code. It may adjust
  routine implementation details, but stops and reports material conflicts in
  behavior, architecture, or migration strategy for Kevin to resolve.
- [x] Simple issues retain direct implementation without a specification. Existing
  branch, validation, visible-behavior evidence, and implementation PR publication
  contracts remain in effect.
- [x] After a specification merges, Kevin can change it through a normal
  documentation PR. If implementation is running, he stops it before changing the
  agreed scope. The operating instructions explain this ordinary review process.
- [x] Focused local tests cover approval, queued work, authorization, merged-spec
  consumption, and blocked outcomes through observable workflow behavior. Run the
  relevant repository verification checks and fix failures in this ticket.
  Per the PRD there are no checked-in workflow tests, and the 2026-09-22 decision
  left no new deterministic shell steps to exercise. The workflows pass
  `actionlint`; the remaining behavior is agent judgment, proven by the real runs
  below.
- [ ] In the disposable repository, prove both a blocked implementation attempt
  before required approval and a successful attempt after approval and explicit
  authorization. Also exercise material conflicts, a simple direct-implementation
  issue, and recovery from a handoff failure.
- [ ] Run one complete real lifecycle from issue creation through automatic
  triage, draft specification, local refinement, specification merge, explicit
  implementation authorization, and the resulting implementation PR. Confirm
  that the final implementation reflects the refined specification.
- [ ] Review the evidence accumulated in tickets 01 and 02 and this ticket against
  the feature PRD's acceptance scenarios. Resolve outstanding failures and record
  actual results before enabling the new workflow in the application repository.
  Enablement does not deploy the application or authorize access to live data.
