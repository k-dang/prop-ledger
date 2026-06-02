# No tax-year close state machine

The PRD modeled year-end as a close workflow (open → needs-review → ready-to-close →
closed → reopened-with-reason) and made "Year-End Close" a primary surface. We dropped
the state machine.

Rationale: the app performs no computation that a period-lock would protect (CCA/UCC
values are accountant-entered records, never calculated here); "needs-review" and
"ready-to-close" are *derived* live from open exceptions rather than stored states; and
"reopen-with-reason" is subsumed by the existing audit log of material edits. A
**Property Tax Year** therefore stays permanently editable. Point-in-time defensibility
— "what did I hand my accountant?" — comes from **immutable Year-End Package snapshots**
taken at export, while the underlying live records keep evolving.

## Considered Options

- **Full close state machine (PRD as written).** Rejected: high complexity (boundary-
  spanning records, late arrivals, downstream re-flagging) for a need that snapshots meet
  more cheaply.
- **Single "filed" lock bit per Property Tax Year.** Deferred, not rejected: it is
  additive and can be introduced later if accidental edits to filed years prove painful.

## Consequences

- Readiness is a query over open exceptions, not persisted workflow state.
- The Year-End Package must be persisted immutably at export; later record edits must not
  alter previously exported snapshots.
- CCA carryforward keys off the prior year's *confirmed closing value* (inherited /
  entered / unknown provenance), not off a "year is closed" flag.
