# 02 - Connect triage and labels

**What to build:** Issues that triage classifies as needing a specification, or
that a maintainer labels `ready-to-spec`, automatically reach the draft-creation
path proven in ticket 01. Validate these real GitHub event paths in the disposable
repository during this ticket.

**Blocked by:** 01 - Create draft specifications.

**Status:** ready-for-agent

- [ ] Triage uses unresolved product choices, meaningful architectural changes,
  migrations, or scope requiring decomposition to choose `ready-to-spec`. Change
  size alone does not require a specification.
- [ ] When triage assigns `ready-to-spec`, its publication step explicitly
  dispatches specification creation for the same issue. It does not rely on its
  own label mutation to start another workflow automatically.
- [ ] A maintainer applying `ready-to-spec` starts the same draft-creation path.
  The manual entry point remains available and follows the same eligibility and
  duplicate-handling rules.
- [ ] Each entry point rechecks the current issue state and eligibility. Stale
  events for closed issues or issues no longer eligible do not produce a new PR
  or start implementation.
- [ ] Duplicate label events, repeated dispatches, and an already-active spec PR
  result in one active specification PR without changing existing proposal edits.
- [ ] Existing triage routes remain meaningful: simple, bounded issues keep their
  direct implementation path, while `needs-info` and `wait-to-implement` do not
  start specification creation.
- [ ] Dispatch failures report the actual issue state and failure accurately,
  without claiming a specification run or PR exists when it does not. Recovery
  uses the draft-creation path's duplicate protection.
- [ ] Focused local tests cover routing outcomes and dispatch effects at the
  workflow boundary. Use the existing test setup and relevant verification checks,
  and resolve failures within this ticket.
- [ ] In the disposable repository from ticket 01, exercise a real issue-opening
  triage event and a maintainer label event through to a linked draft spec PR.
  Also demonstrate ineligible issues, repeated events, other triage outcomes, and
  dispatch failure recovery. Record actual results before completing this ticket.
- [ ] Keep the new automatic routes inactive in the application repository until
  ticket 03 completes integrated validation. Trials use isolated repository data
  and do not access production application services.
