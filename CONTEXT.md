# Tax-Ready Rental Records

The domain language for an Ontario co-owner rental record-keeping platform whose
purpose is to produce defensible year-end tax-support packages — not to calculate
tax outcomes.

## Language

**Tax Year**:
A calendar filing period (e.g. 2026) used to scope records and as a cross-property
view; it is not a tax-computation context.
_Avoid_: reporting period, fiscal year, accounting period

**Property Tax Year**:
The per-`(Property, Tax Year)` home for the accountant-entered CCA values for one
property; always editable, carrying no close or lock state, with readiness derived
live from open exceptions rather than stored.
_Avoid_: closed year, locked year, annual record

**Ownership Period**:
An effective-dated record of one owner's share of a property over a date range; the
authoritative source of owner allocation, selected by date — never restated per year.
_Avoid_: share, allocation, split (as standalone nouns)

**Personal-Use Allocation**:
A per-transaction split marking the non-deductible personal portion of an expense;
year-to-year variation emerges from each year's transactions, not a per-year field.
_Avoid_: personal-use percentage (as a property- or year-level setting)

**Year-End Package**:
An immutable snapshot of a property's records for a Tax Year, captured at export; the
point-in-time artifact that makes filed records defensible.
_Avoid_: report, export (as names for the defensible artifact)

## Relationships

- A **Tax Year** scopes records to a filing period and does not compute balances;
  cross-year continuity is preservation of confirmed values and flagging of gaps,
  never a calculated chain.
- A **Tax Year** is a thin overlay over independently-dated records: it *selects*
  rent, ledger, and ownership records by date rather than *owning* them.
- A **Property Tax Year** is always editable; there is no close or lock state.
  Readiness is derived live from open exceptions. The portfolio-wide **Tax Year** view
  aggregates across **Property Tax Years**.
- Defensibility comes from the **Year-End Package** snapshot, not from freezing live
  records: the package is frozen at export while the underlying records keep evolving.
- An **Ownership Period** belongs to a property and is selected by a **Tax Year**
  through date overlap; a mid-year change is two periods, both visible within the year.
- A **Property Tax Year**'s opening CCA/UCC value has one of three provenances:
  *inherited* (copied from the prior year's confirmed closing), *entered* (manual
  onboarding value), or *unknown* (an accountant-needed flag). It is never computed,
  and tracks the prior year's current confirmed closing live; if that changes, the
  downstream opening is re-flagged.

## Flagged ambiguities

- An earlier design treated the **Tax Year** as a computation context that derives
  CCA/UCC balances. Resolved: the app stores accountant-confirmed values and flags
  missing history; it never computes the chain.
- A close/freeze state machine (open → ready → closed → reopened) was considered and
  dropped. Resolved: years stay editable; readiness is derived, reopen-with-reason
  folds into the audit log, and point-in-time defensibility is provided by the
  **Year-End Package** snapshot.
- The tax year was removed from the current code entirely (YAGNI), not just the
  selector: setup readiness and ownership history no longer take a year. Ownership
  readiness uses the property's acquisition date as its coverage reference. Reintroduce
  a year — sourced from the URL (e.g. `?year=`), not a synced global store — when a
  year-scoped surface (rent ledger, year-end package, CCA) actually needs one.
