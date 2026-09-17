# Product specification: compare two Year-End Packages (issue #33)

## Summary

The DIY landlord exports a **Year-End Package** more than once per **Tax Year**
and then cannot tell what moved between downloads. This proposal adds a
read-only comparison on the year-end readiness page: the user supplies two
previously exported package files for the same property and **Tax Year** and
sees which recorded figures changed — rent, **Deductible Expenses** by T776
line, capital-asset transactions, and evidence/readiness status — as
before/after values with deltas. It changes nothing about how packages are
exported and never makes a package editable.

Established fact: packages today are ephemeral JSON downloads (built live by
`GET /year-end/packages`, never persisted); there is no stored export history
and no audit-log table in the code to link against. Proposal: everything below
except where marked otherwise.

## Behavior

- B1. The comparison lives in a new section on the year-end readiness page
  (`/year-end?propertyId=…&year=…`), below the existing package-export panel,
  scoped to the currently selected property and **Tax Year**.
- B2. The user provides two package files ("Earlier package" and "Later
  package") via file inputs; comparison runs locally in the browser with no
  upload persistence. Either input accepts a re-pick; a clear action resets
  both.
- B3. Both files must parse as `YearEndPackageSnapshot` version 2 with the same
  property id and the same `taxYear` as each other and as the page's selected
  **Tax Year**; otherwise the comparison is refused with a plain-language
  reason naming the mismatch (not JSON, wrong version, different property,
  different tax year). **Open question:** Confirm the comparison lives on the
  year-end readiness page for the selected property and Tax Year, not on the
  property workspace or Portfolio Dashboard.
- B4. Both files must have the same scope (both full-property, or both the same
  owner id). A full-property package compared against an owner-scoped package
  (or two different owners) is refused with a message explaining that
  owner-share factors make the figures incomparable.
  **Open question:** Confirm mixed-scope comparisons are refused rather than
  normalized.
- B5. When inputs are valid, the view shows a summary header: property name,
  **Tax Year**, scope label, and each file's `generatedAt` (earlier/later
  assigned by timestamp, with a note when the user-supplied order was swapped).
- B6. The comparison shows before/after/delta rows for: Gross Rental Income
  components (`grossRent`, `otherRentalIncome`, `totalIncome`), **Payments
  Received** (`rentReceived`) with payment count, each T776 expense line
  present in either file, `totalExpenses`, and **Net Recorded Rental Income**
  (total income less total expenses) labelled as a record summary, not taxable
  income.
- B7. Expense lines present in only one file appear as added/removed rows (empty
  side shown as "—", delta equals the one-sided amount), never silently
  omitted.
- B8. Capital-asset transactions are compared by `transactionId`: unchanged,
  changed (allocated amount or supporting-document linkage moved), added, and
  removed groupings, each row showing date, vendor, before/after allocated
  amounts, and document-count change.
- B9. The current snapshot (version 2) contains no CCA schedule — only marked
  capital-asset transactions (established fact from
  `src/domain/year-end-package.ts`; the `cca_class_records` table was dropped).
  So there are no CCA values to compare; the comparison states "No CCA schedule
  in either package" when applicable rather than showing an empty table.
  **Open question:** Confirm CCA comparison stays out of scope until a CCA
  schedule returns to the package.
- B10. Evidence and readiness status is compared as: per-check
  `unresolvedExceptions` (blocking/warning counts before/after), supporting
  document count and per-transaction document-link changes, and accountant
  notes added/removed (matched by exact text). "Why" means these before/after
  values plus the transaction-level detail above — not links to audit-log
  entries, because no audit log exists in the code today (established fact).
  **Open question:** Confirm "why" means before/after values only, without
  audit-log linkage.
- B11. Cross-year comparisons (same property, two different **Tax Years**) are
  refused with the same mismatch message as B3; year-over-year reporting is out
  of scope. **Open question:** Confirm comparisons are limited to two snapshots
  of the same property and Tax Year.
- B12. Identical packages produce an explicit "No differences" state naming the
  two timestamps, not an empty table.
- B13. Empty state (fewer than two files chosen) teaches the flow: "Choose two
  exported packages for this property and year to see what changed." Pending
  state parses synchronously; invalid files keep the last good result cleared
  and show only the error.
- B14. Figures use tabular numerals and `$X,XXX.XX` formatting; deltas carry an
  explicit `+`/`−` sign plus a text label (higher/lower/no change) so color is
  never the only signal; readiness deltas reuse the ready/review/blocked badge
  tokens with labels.

## Exclusions

- No change to package export contents, filename, or generation; no package
  becomes editable after export.
- No persisted export history and no server-side storage of uploaded files.
- No audit-log linkage or per-change authorship.
- No cross-year or cross-property comparison; no mixed-scope normalization.
- No CCA computation or new CCA schedule (per `docs/adr/`, no new
  tax-computation behavior).

## Preserved behavior

- P1. Export downloads keep working exactly as today (full-property and per-owner
  JSON via `/year-end/packages`), unaffected by the comparison section.
- P2. Packages remain immutable snapshots; later record edits never alter a
  previously downloaded file.
- P3. **Year-End Readiness** stays live-derived from open exceptions; the
  comparison never introduces a close/lock state (per `docs/adr/0001`).
- P4. The **Portfolio Dashboard** remains a one-**Tax Year** cross-property
  summary; property-specific comparison detail does not leak into it.

## Acceptance criteria

- AC1. With two same-property same-year fixtures differing in rent, one T776
  line, one capital transaction, and one readiness check, the view shows each
  before/after/delta row (proves B5, B6, B8, B10).
- AC2. Uploading fixtures from different properties (or years) shows the
  mismatch refusal and no rows (proves B3, B11).
- AC3. Uploading a full-property and an owner-scoped fixture shows the
  scope-mismatch refusal (proves B4).
- AC4. Uploading two identical fixtures shows the "No differences" state
  (proves B12).
- AC5. Exporting a package after this change yields byte-identical content to
  before for the same records (proves P1, P2).
- AC6. Keyboard-only flow (tab to both inputs, pick files, read results) and
  labelled status badges meet the WCAG AA bar (proves B14).

## Decisions for Kevin

- Location: recommend the year-end readiness page (already scoped to one
  property and year, sits next to the export panel). Alternatives: property
  workspace (setup-focused, wrong context) and Portfolio Dashboard (explicitly
  cross-property per CONTEXT.md; property detail is delegated away). Proposal.
- Meaning of "why": recommend before/after values plus transaction-level
  detail. Alternative (link each delta to audit-log entries between exports)
  is not buildable now — no audit-log table exists despite the ADR allusion —
  and would be its own project. Proposal.
- Year scope: recommend same-**Tax Year** only. Alternative (cross-year diff)
  answers a different question (year-over-year performance) and conflates
  record drift with real economic change. Proposal.
- Mixed scope: recommend refuse with explanation. Alternative (normalize by
  re-applying **Ownership Period** factors) risks inventing tax-computation
  behavior the app deliberately avoids. Proposal.
- Input mechanism: recommend two-file picker with in-browser diff, because
  exports are never persisted server-side. Alternative (stored export history)
  changes the export contract and storage model; defer until retention demand
  is proven. Proposal.

## Open questions

- Confirm the comparison lives on the year-end readiness page for the selected
  property and Tax Year, not on the property workspace or Portfolio Dashboard.
- Confirm "why" means before/after values only, without audit-log linkage.
- Confirm comparisons are limited to two snapshots of the same property and
  Tax Year.
- Confirm mixed-scope comparisons are refused rather than normalized.
- Confirm CCA comparison stays out of scope until a CCA schedule returns to
  the package.
