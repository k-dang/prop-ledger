# Plan: Tax-Ready Rental Management Platform

> Source PRD: `docs/plans/tax-ready-rental-management-prd.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Application shape**: Build on the existing Next App Router application. Use Server Components by default, with Client Components reserved for dense tables, forms, filters, upload controls, and other interactive workflows.
- **Primary routes**: Use five first-release product surfaces: `/dashboard`, `/transactions`, `/rent-ledger`, `/documents`, and `/year-end`. Property-specific detail should live under `/properties/[propertyId]`.
- **Review-first workflow**: Manual ledger entries are rental-relevant records the user is deliberately adding. The MVP reviews their category, attached evidence, allocation, and capital questions; imported bank activity and reconciliation are deferred.
- **Schema shape**: Model property setup, rent accruals, ledger entries, documents, capital assets, ownership allocations, and year-end close as separate durable concepts rather than one flat transaction table.
- **Key models**: Property, Unit, Owner, OwnershipPeriod, Lease, RentEvent, BankTransaction, LedgerEntry, TransactionSplit, Document, DocumentLink, CapitalAsset, MortgagePayment, ReconciliationStatus, PropertyTaxYear, YearEndPackage, AccountantNote.
- **Ownership allocation**: Store owner shares as effective-dated records and validate that active periods do not exceed 100 percent ownership.
- **Rent accounting**: Store rent charges separately from payments so income can be reviewed on an accrual basis and arrears are visible.
- **Transaction accounting**: MVP transaction records are manual, rental-relevant ledger entries. CSV bank imports, bank feeds, duplicate detection, and reconciliation are out of scope.
- **Non-rental activity**: Keep the rental ledger for rental-relevant records only. Personal or otherwise non-rental activity is out of scope for manual entry and should not be represented as ledger rows.
- **Documents**: Treat documents as reusable evidence records with stable identifiers and many-to-many links to transactions, rent events, leases, mortgage payments, capital assets, and year-end packages. In Phase 3, evidence is attached directly from the transaction row; unsupported or mistaken uploads are deleted rather than detached into a separate holding workflow.
- **Transaction categories**: Use a CRA T776-shaped category set for rental expenses and a separate rental-income category set for income records. Do not force income through expense categories.
- **Allocations**: Represent category splits, mortgage splits, prepaid expense periods, personal-use portions, and owner-share allocations as structured allocation records.
- **Capital support**: Model capital assets separately from expense transactions, including land/building split, CCA class, opening UCC if known, additions, dispositions, proceeds, prior claims if known, accountant-entered closing values, and missing-history flags.
- **Tax year model**: Treat a Tax Year as a record-keeping boundary, not a computation context, and as a thin overlay that *selects* dated records (rent, ledger, ownership) rather than owning them. The per-`(Property, Tax Year)` unit (`PropertyTaxYear`) holds only the accountant-entered CCA values and is the unit for readiness aggregation; the portfolio-wide tax year is a cross-property view.
- **No close state machine**: Property Tax Years stay permanently editable. Readiness is derived live from open exceptions rather than stored as a workflow state, and prior-year edits are captured by the audit log. Point-in-time defensibility comes from immutable `YearEndPackage` snapshots taken at export, not from locking live records. A soft per-year "filed" lock can be added later if accidental edits to filed years prove painful. See `docs/adr/0001-no-tax-year-close-state-machine.md`.
- **CCA carryforward**: A Property Tax Year's opening CCA/UCC value is never computed. It has one of three provenances — *inherited* (the prior year's confirmed closing), *entered* (manual onboarding), or *unknown* (accountant-needed flag) — tracks the prior confirmed closing live, and re-flags downstream openings if it changes.
- **Scope**: Long-term residential rentals only. Short-term rental is out of scope (no STR flag or behavior in the model).
- **Export stance**: Generate accountant-ready and T776-ready support packages. Do not calculate final tax outcomes, optimize CCA, estimate deductions, or file tax returns.
- **Out of scope**: CSV bank import, bank feeds, duplicate import detection, and reconciliation workflows.
- **Deferred from this plan**: Accountant invitation/access, role-based permissions, MFA, audit logging, access/export event logs, configurable retention guidance, Canada-hosting procurement work, OCR, online rent collection, e-signatures, and maintenance ticketing.

---

## Phase 1: First Property Workspace

**User stories**: 1-10, 85, 89-91

### What to build

Create the first usable property accounting workspace. A co-owner can set up a property, add units, enter address and acquisition details, mark personal-use facts, add owners together with their initial effective-dated ownership shares, and see a dashboard that makes setup gaps obvious.

### Acceptance criteria

- [x] A user can create a property with municipal address, acquisition date, and personal-use indicator.
- [x] A user can add one or more units under a property.
- [x] A user can add an owner only together with their initial effective-dated ownership share.
- [x] Ownership periods reject active allocations above 100 percent.
- [x] Ownership history is visible by property as an effective-dated record. (A dedicated tax-year ownership view was dropped: the effective-dated history already makes ownership for any year readable, and the portfolio-wide tax-year surface lands in later phases.)
- [x] Dashboard empty states guide the user toward property, unit, owner, and lease setup without using unnecessary tax jargon.
- [x] Dashboard shows year-end readiness at a property level, even if most counts are initially setup-oriented.
- [x] Tests cover valid ownership, invalid over-allocation, ownership changes by tax year, and property setup empty states.

---

## Phase 2: Lease-Based Rent Ledger

**User stories**: 13-22, 43, 76

### What to build

Add a complete rent-ledger path for one property. A co-owner can create leases for units, define lease dates, rent amount, and rent frequency, generate accrual rent charges, record payments separately from charges, record credits and write-offs, track arrears, record other rental income, and link lease documents for support.

### Acceptance criteria

- [x] A user can create a lease with unit, tenant reference, start date, optional end date, rent amount, and frequency.
- [x] Rent charges are generated or entered separately from payments. (`generateLeaseCharges` materializes the accrual schedule as `charge` events; manual `charge` entry is also available, both independent of `payment` events.)
- [x] Payments can be recorded against rent charges without erasing the original accrual record. (Payments are separate `rent_events` rows; charges are never mutated.)
- [x] Credits, write-offs, and other rental income are visible in the rent ledger.
- [x] Arrears are shown by tenant and unit. (Cumulative balance per lease, surfaced in the Arrears panel and per-lease badges.)
- [x] Lease documents can be linked to the lease and surfaced from the rent ledger. (Document + polymorphic DocumentLink; real file upload is deferred to Phase 3, so Phase 2 records document metadata + an optional link.)
- [x] A rent ledger summary can be generated for a property and tax year. (Year-scoped gross rent, other income, payments, credits, write-offs, and arrears at year end.)
- [x] Tests cover rent schedules, partial periods, payments, arrears, credits, write-offs, other rental income, and lease document links.

---

## Phase 3: Manual Expenses and Evidence Binder

**User stories**: 25-27, 30, 34-36, 38-45, 62

### What to build

Create the manual transaction and document workflow. A co-owner can enter rental-relevant expenses or income manually, assign type-appropriate categories, add review notes, attach PDF or image evidence directly to transactions, and see exception counts for missing categories and missing receipts. Manual entries are treated as source-supported by the user who entered them; bank import and reconciliation workflows are deferred from the MVP.

### Acceptance criteria

- [x] A user can manually enter a transaction with date, vendor, memo, amount, and property.
- [x] A user can categorize expenses using T776-aligned categories and categorize income using rental-income categories.
- [x] Manual transaction entry is limited to rental-relevant records; personal/non-rental activity is left out of the ledger.
- [x] A user can add review notes explaining treatment decisions.
- [x] A user can upload PDF and image evidence directly from a transaction row; vendor, date, amount, document type, and property metadata are captured from the transaction context.
- [x] A user can see source documents from a document index and delete mistaken uploads; Phase 3 does not support a separate manual document record or detach workflow.
- [x] Uncategorized transactions and missing receipts are visible as manual-entry exceptions.
- [x] Documents remain readable and included in a source document index.
- [x] Tests cover manual transaction entry, category assignment, rental expense summaries, document upload metadata, transaction evidence attachment, document deletion, and source document reporting.

---

## Phase 4: Allocation Review for Manual Transactions

**User stories**: 26, 28-33, 60-61, 87-88

### What to build

Extend manual transactions with allocation review. A co-owner can split rental-relevant transactions across categories, split mortgage payments, apply personal-use percentages to mixed-use rental records, mark prepaid expenses with service periods, and filter existing transaction review work by property, tax year, issue type, and category.

### Acceptance criteria

- [x] A user can split one manual transaction across multiple categories.
- [x] A user can split a mortgage payment into principal, interest, and fees.
- [x] A user can record individual mortgage payments with lender/payee, principal, interest, fees, and notes.
- [~] A user can apply personal-use percentages to transactions. Dropped from MVP scope while the product targets fully rental properties.
- [x] A user can mark an expense as prepaid and enter the service period.
- [x] The inbox supports filtering by property, tax year, issue type, and category.
- [x] The inbox supports efficient keyboard-friendly review of common categorization actions.
- [x] Tests cover category splits, mortgage splits, prepaid allocation, filtering, and exception counts.

---

## Phase 5: Capital and CCA Support Register

**User stories**: 46-59, 73, 78

### What to build

Add a capital review and CCA-support workflow. A co-owner can classify an item as current expense or capital, answer guided capital-review prompts, create capital assets from transactions, capture asset description and placed-in-service date, split land and building cost, assign CCA class, record opening UCC if known, additions, dispositions, proceeds, prior claims if known, accountant-entered closing values, and mark unknown or accountant-needed details.

### Acceptance criteria

- [ ] A user can mark a transaction as needing current-versus-capital review.
- [ ] A guided question set helps classify likely capital items without presenting the result as tax advice.
- [ ] A user can create a capital asset from a reviewed transaction.
- [ ] A capital asset stores description, placed-in-service date, source transaction, linked support documents, and review notes.
- [ ] A user can split acquisition cost between land and building.
- [ ] A user can assign a CRA CCA class and record opening UCC when known.
- [ ] A user can record additions, dispositions, proceeds, prior claims if known, and accountant-entered closing values.
- [ ] Current-year additions and incomplete CCA details are flagged for accountant review.
- [ ] The capital register can be reviewed independently from the transaction ledger.
- [ ] A capital and CCA-support schedule can be generated for a property and tax year.
- [ ] Tests cover asset creation from transactions, capital review flags, land/building split, class assignment, additions, dispositions, support documents, missing-history flags, and export warnings without validating tax formulas.

---

## Phase 6: Year-End Readiness

**User stories**: 66-73, 85-86

### What to build

Turn the records collected in prior phases into a year-end readiness view. A co-owner can select a property and tax year and see a derived checklist of blocking and warning conditions, then resolve those exceptions from the relevant product surface. There is no close step: Property Tax Years remain permanently editable, and readiness is a live, derived view of what still stands between the records and a clean export. Defensibility is handled by the immutable export snapshot in Phase 7, not by locking the year.

### Acceptance criteria

- [ ] A readiness checklist is derived live for each property and tax year (not stored as a workflow state).
- [ ] The checklist includes uncategorized transactions, missing documents, unresolved capital/current items, ownership allocation warnings, personal-use warnings, and capital/CCA-support warnings.
- [ ] Dashboard counts show missing receipts, uncategorized transactions, and capital review items by property.
- [ ] Readiness updates immediately as exceptions are resolved or new records are added; no record becomes uneditable as a result of readiness state.
- [ ] Edits to records in any tax year — including prior years — are captured by the audit log.
- [ ] Tests cover readiness derivation, blocking-versus-warning classification, live recomputation after edits, and dashboard exception counts.

---

## Phase 7: Year-End Package Export

**User stories**: 74-84, 92, 95

### What to build

Generate the year-end handoff package. A co-owner can create property-level and owner-specific packages containing T776-ready income and expense summaries, owner-share worksheets, rent ledger summaries, expense detail exports, capital and CCA-support schedules, source document indexes, accountant notes, and unresolved exception summaries. Each generated package is captured as an immutable snapshot at export time — this snapshot is the point-in-time, defensible record of what was filed, while the underlying live records remain editable.

### Acceptance criteria

- [ ] A user can generate a T776-ready income and expense summary for a property and tax year.
- [ ] A user can generate owner-share worksheets based on effective-dated ownership periods.
- [ ] A user can generate rent ledger, expense detail, capital/CCA-support, and source document index sections.
- [ ] Accountant notes and unresolved exception summaries are included in the package.
- [ ] Each owner package is separate and limited to that owner-specific allocation view.
- [ ] A full-property package remains available for the property-level audit trail.
- [ ] Package totals trace back to source records, allocations, and linked documents.
- [ ] Each generated package is persisted as an immutable snapshot; later edits to live records do not alter previously exported snapshots.
- [ ] Tenant personal information is minimized in accounting exports unless needed to support the record.
- [ ] The package can be exported as shareable files.
- [ ] Tests include golden-output fixtures for representative property-level and owner-specific packages, and verify snapshot immutability after subsequent record edits.
