# GitHub pilot baseline

Recorded on 2026-08-09 for the initial controlled, non-confidential pilot in
`k-dang/prop-ledger`.

## Routing agreement

| Controlled issue | Expected route | Observed route | Agreement |
| --- | --- | --- | --- |
| [#7](https://github.com/k-dang/prop-ledger/issues/7) | `needs-info` | `needs-info` with one evidence comment | Yes |
| [#14](https://github.com/k-dang/prop-ledger/issues/14) | `ready-to-implement` | `ready-to-implement` with one evidence comment | Yes |

Initial maintainer agreement is 2/2 classifications (100%). This small synthetic sample is an
activation check, not a forecast of production classification accuracy.

## Implementation and verification

- The first Issue 17 implementation attempt stopped on an unavailable North Mini endpoint. The
  issue received only the generic operational-failure status and retained its Actions link.
- The explicit rerun using `opencode/deepseek-v4-flash-free` completed in 2 minutes 53 seconds and
  produced [pull request #19](https://github.com/k-dang/prop-ledger/pull/19).
- Pull request #19 contains one commit and changes only `README.md`. The explicitly dispatched
  [Verify run](https://github.com/k-dang/prop-ledger/actions/runs/31294114816) passed on its first
  attempt in 39 seconds.
- Review-ready pull-request yield for Issue 17 is 1/2 implementation attempts (50%) including the
  unavailable-model failure, and 1/1 (100%) after selecting the confirmed working model.
- Reviewer corrections: 0 recorded; human review has not yet completed.
- Reversions: 0 recorded; the pilot pull request has not merged.
- Model charge: $0 because the selected model is free. Exact token usage was not captured by the
  workflow, so token volume is an explicit evidence gap.
- [Issue #20](https://github.com/k-dang/prop-ledger/issues/20) proved semantic blockage in 1 minute
  35 seconds. The workflow retained `ready-to-implement`, posted one evidence-based blocker with a
  concrete next step and terminal marker, and created neither an automation branch nor a pull
  request.

## Earlier development-stage evidence

Pull requests #13 and #15 were produced while the implementation workflow was still being built.
They contained stacked control-plane changes and therefore do not count as review-ready pilot
yield. Their failures led to the final latest-default-branch, one-commit publication postcondition
proven by pull request #19.

## Remaining activation samples

- One fresh default-branch issue must prove the complete triage → explicit dispatch → publication
  chain after the triage model alignment merges.
- After human review of pull request #19, update reviewer corrections and disposition rather than
  treating the current zero as a final quality result.
