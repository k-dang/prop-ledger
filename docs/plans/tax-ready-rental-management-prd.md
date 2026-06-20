# Tax-Ready Rental Management Platform PRD

## Problem Statement

Small Ontario residential rental co-owners need a reliable way to run rental books throughout the year and produce a tax-support package at year end. The current market gives them either generic accounting software that is not landlord-native, landlord operations tools that are mostly US-tax-first, or tax filing software that only helps after the source records have already been cleaned up.

The target user does not primarily need a polished tenant portal in the first release. They need a calm, defensible property accounting workspace that helps them capture rent, expenses, documents, owner allocations, capital assets, and year-end tax support without falling back to spreadsheets, ad hoc folders, and accountant cleanup.

The core problem is that rental tax submission depends on source records that are easy to lose during day-to-day property management:

- Rent must be tracked on an accrual basis, not only as cash deposits.
- Expenses must map cleanly to CRA T776 rental categories.
- Co-owner shares must be effective-dated tax facts.
- Receipts and source documents must remain linked to the numbers they support.
- Repairs and capital improvements must be identified deliberately, even though detailed CCA support can wait until after the MVP.
- Prepaid expenses and owner prorations must be visible before year-end.
- The final package must be useful to each owner and to an accountant, not just visually attractive in a dashboard.

The product should therefore help users answer a practical question at any point in the year: "What records are still missing or unresolved before I hand this property to my accountant or tax software?"

## Solution

Build a tax-record management platform for Ontario co-owners, centered on a review-first bookkeeping and document workflow rather than a tenant-first operations workflow.

The first release should provide five primary product surfaces:

1. Dashboard
2. Transactions
3. Rent Ledger
4. Documents
5. Year-End

The platform should feel like a property accounting workspace with an audit-ready document binder. The main interaction pattern is an exception and review queue. The user enters rental-relevant records, attaches supporting documents from the records they support, resolves recordkeeping questions, and then generates owner-specific year-end packages.

The MVP includes everything required to track and organize the records needed for each owner's year-end tax submission. It does not calculate final tax outcomes, estimate deductions, choose CCA claims, provide tax advice, or include everything required to run a polished resident experience.

The product should support these first-release capabilities:

- Property, unit, owner, and ownership setup
- Effective-dated owner share records
- Basic lease and rent schedule setup
- Accrual rent charges, payments, credits, arrears, write-offs, and other rental income
- Manual transaction entry
- Manual transaction review queue
- T776-shaped expense categorization and separate rental-income categorization
- Receipt and document upload
- Attaching documents to transactions, rent events, leases, and loans
- Marking expense transactions as capital assets
- A simple year-end capital transaction list with source transaction and document support counts
- Prepaid expense allocation
- Owner-share allocation
- Basic loan and financing-cost tracking
- Year-end readiness checklist
- Owner-specific year-end package export, captured as immutable snapshots
- Accountant notes and exception summaries
- Role-based access for owners and invited accountants
- Audit trail for material edits

The first release should avoid building a full resident experience. Tenant portals, online rent collection, e-signatures, maintenance ticketing, OCR, automated categorization, mobile-native capture, and advanced dashboards can follow once the tax ledger is stable.

## User Stories

1. As a co-owner, I want to create a property record, so that all rental activity is tied to the correct property.
2. As a co-owner, I want to add units under a property, so that rent and expenses can be tracked at the right level of detail.
3. As a co-owner, I want to enter the municipal address of a property, so that year-end exports identify the property clearly.
4. As a co-owner, I want to record the acquisition date of a property, so that tax and capital schedules have the right timeline.
6. _(Removed — short-term rental is out of scope. The product covers long-term residential rentals only. See Out of Scope.)_
7. As a co-owner, I want to add another owner together with their initial ownership share, so that owner records are never missing allocation facts.
8. As a co-owner, I want ownership percentages to be effective-dated, so that ownership changes are handled accurately by tax year.
9. As a co-owner, I want to see an ownership history, so that I can understand how each year-end package was allocated.
10. As a co-owner, I want the app to prevent owner shares from exceeding 100 percent for an active period, so that tax allocations are internally consistent.
11. As a co-owner, I want to invite an accountant with limited access, so that they can review year-end records without taking over my account.
12. As an accountant, I want to see all properties and owner allocations for a tax year, so that I can review the reporting basis quickly.
13. As a co-owner, I want to create a lease record, so that rent charges can be generated from lease terms.
14. As a co-owner, I want to enter lease start and end dates, so that the rent ledger reflects the correct active periods.
15. As a co-owner, I want to define rent amount and frequency, so that expected rent can be recorded on an accrual basis.
16. As a co-owner, I want rent charges to be created separately from payments, so that earned rent is not confused with cash received.
17. As a co-owner, I want to record rent payments, so that tenant balances stay current.
19. As a co-owner, I want to record rent credits, so that concessions and corrections are visible.
20. As a co-owner, I want to record write-offs for uncollectible rent, so that year-end income can be reviewed properly.
21. As a co-owner, I want to see arrears by tenant and unit, so that I know which rent is unpaid.
22. As a co-owner, I want to record other rental income, so that laundry, parking, fees, or recoveries are not lost.
25. As a co-owner, I want to manually enter transactions, so that cash and corrections can be tracked.
26. As a co-owner, I want to edit transaction date, vendor, memo, amount, and property, so that manual records can be corrected.
27. As a co-owner, I want expense and income records to use separate category lists, so that year-end summaries map cleanly to tax reporting.
28. As a co-owner, I want to split one transaction across multiple categories, so that mixed expenses can be represented accurately.
29. As a co-owner, I want to split a mortgage payment into principal, interest, and fees, so that only deductible portions flow to expenses.
32. As a co-owner, I want to mark an expense as prepaid, so that the deduction can be allocated across the benefit period.
33. As a co-owner, I want to enter the service period for a prepaid expense, so that annual insurance or similar costs are spread correctly.
34. As a co-owner, I want the app to show transactions missing categories, so that I can finish review before year end.
35. As a co-owner, I want the app to show transactions missing receipts, so that I can gather support before tax season.
38. As a co-owner, I want to upload PDF and image documents, so that receipts and statements are stored with the books.
39. As a co-owner, I want to tag documents with vendor, date, amount, document type, and property, so that they can be found later.
40. As a co-owner, I want to link a receipt to an expense transaction, so that the source document supports the deduction.
41. As a co-owner, I want to link a mortgage statement to loan and interest records, so that interest deductions can be supported.
42. As a co-owner, I want to link a property tax bill to a property tax expense, so that the yearly expense is easy to verify.
43. As a co-owner, I want to link lease documents to units and tenants, so that the rent ledger has contractual support.
44. As a co-owner, I want documents to remain readable and exportable, so that I can provide them during accountant review or audit.
45. As a co-owner, I want mistaken document uploads to be deletable from the source document index, so that cleanup is explicit and evidence does not sit in a detached holding area.
46. As a co-owner, I want to mark an expense transaction as a capital asset, so that likely improvements are separated from ordinary expenses before year end.
47. _(Deferred — guided capital review questions are out of MVP scope.)_
48. _(Deferred — creating separate capital asset records from transactions is out of MVP scope.)_
49. _(Deferred — detailed capital asset descriptions and placed-in-service dates are out of MVP scope.)_
50. _(Deferred — land/building split capture is out of MVP scope.)_
51. _(Deferred — CRA CCA class assignment is out of MVP scope.)_
52. _(Deferred — opening UCC capture is out of MVP scope.)_
53. _(Deferred — CCA class additions are out of MVP scope.)_
54. _(Deferred — dispositions and proceeds are out of MVP scope.)_
55. _(Deferred — current-year CCA review warnings are out of MVP scope.)_
56. _(Deferred — accountant-provided CCA claims and closing UCC values are out of MVP scope.)_
57. _(Deferred — CCA unknown/accountant-needed detail flags are out of MVP scope.)_
58. _(Deferred — capital and CCA history continuity is out of MVP scope.)_
59. As an accountant, I want to review transactions marked as capital assets separately from ordinary expenses, so that likely improvements are easy to inspect.
60. As a co-owner, I want to track mortgage financing costs separately, so that five-year amortization can be handled.
62. As a co-owner, I want to mark transaction review decisions with notes, so that future reviewers understand why an item was treated a certain way.
63. As a co-owner, I want an activity log for material edits, so that changes to tax-relevant data can be traced.
64. As a co-owner, I want each exported year-end package to be an immutable snapshot, so that I can prove what I handed to my accountant even after the underlying records change.
65. As a co-owner, I want prior-year records to remain editable with every change captured in the audit log, so that corrections are possible without a separate close/reopen ceremony.
66. As a co-owner, I want a year-end readiness checklist, so that I know exactly what remains before exporting.
67. As a co-owner, I want the checklist to include uncategorized transactions, so that no transaction is omitted.
68. As a co-owner, I want the checklist to include missing documents, so that evidence gaps are visible.
70. As a co-owner, I want the checklist to include transactions marked as capital assets, so that likely improvements are visible before export.
71. As a co-owner, I want the checklist to include ownership allocation warnings, so that each owner package is calculated correctly.
73. _(Deferred — capital and CCA-support warnings are out of MVP scope.)_
74. As a co-owner, I want to generate a T776-ready income and expense summary, so that my accountant can prepare the return efficiently.
75. As a co-owner, I want to generate an owner-share worksheet, so that each owner sees their allocable share.
76. As a co-owner, I want to generate a rent ledger summary, so that gross rent and arrears can be supported.
77. As a co-owner, I want to generate an expense detail export, so that category totals can be traced to transactions.
78. As a co-owner, I want to generate a list of transactions marked as capital assets, so that my accountant can review likely improvements from source records.
79. As a co-owner, I want to generate a source document index, so that supporting documents are easy to inspect.
81. As an accountant, I want accountant notes included in the package, so that open questions are carried into tax preparation.
82. As a co-owner, I want to export the year-end package as files I can share, so that I can hand it off outside the app.
83. As a co-owner, I want each owner package to be separate, so that each person can use their own tax records.
84. As a co-owner, I want a full-property package to remain available, so that the property-level audit trail is preserved.
85. As a co-owner, I want a dashboard showing year-end readiness by property, so that I know where to focus.
86. As a co-owner, I want dashboard counts for missing receipts, uncategorized transactions, and capital asset transactions, so that I can work from exceptions.
87. As a co-owner, I want to filter transaction review work by property, tax year, issue type, and category, so that review work is manageable.
88. As a co-owner, I want a keyboard-friendly table workflow, so that categorization is efficient.
89. As a co-owner, I want clear empty states for first setup, so that I know what to add next.
90. As a co-owner, I want the UI to avoid tax jargon where possible, so that I can make decisions without being an accountant.
91. As a co-owner, I want the UI to expose tax terminology where it affects output, so that the accountant-facing package is precise.
92. As an accountant, I want to see source records behind year-end totals, so that I can review the exported numbers.
93. As a co-owner, I want role-based permissions, so that owners, accountants, and future users only see what they need.
94. As a co-owner, I want multi-factor authentication support, so that sensitive financial and tenant records are protected.
95. As a co-owner, I want tenant personal information minimized in accounting exports, so that privacy risk is reduced.
96. As a co-owner, I want tenant documents protected by access controls, so that only authorized users can see them.
97. As a platform operator, I want an audit log of access and export events, so that sensitive data use can be reviewed.
98. As a platform operator, I want breach and security-event records to be retained, so that privacy obligations can be met.
99. As a co-owner, I want configurable retention guidance for tax records, so that I know what records must be kept.
100. As a co-owner, I want a Canada-hosted deployment option, so that privacy and procurement concerns are easier to satisfy.
101. As a future product user, I want optional OCR receipt extraction, so that manual document tagging takes less time.
102. As a future product user, I want guided capital review, capital asset records, land/building splits, CCA class support, opening UCC, additions, dispositions, proceeds, prior claims, accountant-entered closing values, and missing-history flags, so that CCA support can become more complete after the MVP.
103. As a future product user, I want online rent collection, so that rent payment data can flow into the ledger automatically.
104. As a future product user, I want e-signature support, so that lease and owner approvals can be completed inside the platform.
105. As a future product user, I want maintenance ticketing, so that repair work can later connect to documents, expenses, and capital marking.

## Implementation Decisions

- Treat the product as a greenfield system because the current workspace contains research documentation but no existing application code.
- Make the first release a web application optimized for desktop review workflows. Mobile responsiveness is required, but mobile-native capture and polish are not MVP-critical.
- Use a review-first interaction model for manual ledger activity. Manual ledger entries are rental-relevant records added intentionally and are reviewed for category and evidence. Imported bank activity and reconciliation are deferred.
- Use five primary navigation surfaces: Dashboard, Transactions, Rent Ledger, Documents, and Year-End.
- Keep property setup, ownership setup, and tax-year setup as first-class onboarding steps because later reports and exports depend on them.
- Model ownership shares as effective-dated records rather than fixed percentages on the property.
- Model lease/rent charges separately from payment receipts so that accrual reporting is possible.
- Model ledger entries as rental-relevant operating income and expense records. Personal or otherwise non-rental activity is left out of the MVP ledger.
- For the MVP, model likely capital items as expense transactions marked with a capital asset status. Do not require a separate capital asset record, land/building split, CCA class, or UCC history before year-end review.
- Model documents as reusable evidence records that can attach to transactions, leases, loans, rent events, and year-end packages. Mistaken source documents are deleted rather than detached into a separate holding workflow.
- Use a CRA/T776-shaped category set as the default chart of rental expense categories and a separate rental-income category set for income records.
- Support category splits, owner-share allocation, and prepaid expense allocation as explicit allocation records rather than free-form notes.
- Defer the detailed capital and CCA-support module. The MVP only needs to mark transactions as capital assets and surface those marked transactions with their support document counts.
- Implement an ownership allocation module as a deep domain module with a stable interface for storing effective-dated owner shares and producing owner-share worksheets for review.
- Implement a year-end package generator as a deep domain module that consumes reviewed ledger, rent, document, capital, and ownership data and produces traceable package sections.
- Implement a document vault module that preserves file metadata, link state, read access, exportability, and immutable identifiers.
- Implement an audit log module for material changes to tax-relevant facts, including ownership shares, transactions, allocations, capital asset markings, document links, prior-year record edits, and exports.
- Treat a Tax Year as a record-keeping boundary, not a computation context, and as a thin overlay that selects dated records (rent, ledger, ownership) by date rather than owning them.
- Do not implement a year-end close or lock state machine. Property Tax Years stay permanently editable; year-end readiness is derived live from open exceptions rather than stored as workflow states, and prior-year edits are captured by the audit log. Point-in-time defensibility comes from immutable year-end package snapshots taken at export, not from freezing live records. A soft per-year "filed" lock may be added later if accidental edits prove painful. See `docs/adr/0001-no-tax-year-close-state-machine.md`.
- Defer accountant-entered CCA values, opening UCC carryforward, and CCA continuity until after the MVP.
- Use accountant access as a first-release collaboration feature, but defer full workflow approvals unless needed after user validation.
- CSV import and bank feeds are out of scope. Manual transaction entry is the only ledger input path.
- Defer online rent collection. The ledger should be able to accept payments manually before direct payment rails exist.
- Defer tenant portal and tenant chat. Tenant records should exist only to support lease and rent ledger workflows in the first release.
- Defer e-signatures. The document model should preserve enough metadata to support signature evidence trails in a later release.
- Defer OCR and automated categorization. The MVP should support manual document tagging and categorization first, with automation layered on top later.
- Include privacy and security requirements from the start: role-based access, multi-factor authentication support, audit logs, export logs, and retention guidance.
- Provide Canada-hosted deployment as a product requirement if commercially feasible, but do not treat data residency alone as a complete privacy strategy.
- Do not present tax calculations as authoritative. Every year-end package total should be traceable to source records, allocations, and user decisions, and any tax-specific judgment should be left to the user, accountant, or tax software.
- Do not position the app as tax-filing software in the MVP. It produces accountant-ready and T776-ready support packages rather than calculating final deductions or filing personal tax returns directly.

## Testing Decisions

- Tests should verify external behavior and domain outcomes, not implementation details.
- The most important tests are domain tests for record capture, report totals, export contents, and workflow state transitions.
- The ownership allocation module should be tested with equal ownership, unequal ownership, mid-year ownership changes, gaps, overlaps, and invalid totals.
- The rent ledger should be tested with rent schedules, partial periods, payments, arrears, credits, write-offs, and other rental income.
- The transaction review module should be tested with manual entries, category assignment, splits, prepaid allocations, and unresolved-review states.
- The document module should be tested for upload metadata, attachment creation, document deletion, and export index generation.
- Capital marking should be tested for expense transaction creation with the capital asset flag, marking an existing expense transaction as capital, excluding income transactions, and year-end listing with support document counts.
- The prepaid expense allocator should be tested with single-year and multi-year service periods.
- Year-end readiness should be tested for live derivation of blocking and warning conditions, recomputation after edits, and the guarantee that no record becomes uneditable as a result of readiness state. Year-end package snapshots should be tested for immutability after subsequent record edits.
- The year-end package generator should be tested with golden-output fixtures for representative properties and tax years.
- The audit log should be tested for material edit events and export events.
- Access-control tests should cover owner, co-owner, accountant, and unauthorized access paths.
- UI integration tests should cover the primary happy path: set up property, create lease, enter transactions, categorize expenses, upload documents, mark a transaction as a capital asset, resolve readiness checklist, and generate package.
- UI integration tests should cover the primary exception path: transaction without category, expense without receipt, and marked capital asset without support documents.
- Because no application code exists yet, there is no current prior-art test suite in the workspace. The first implementation plan should establish test conventions before domain modules grow.

## Out of Scope

- Direct personal tax return filing or NETFILE submission.
- Final tax calculations, deduction estimates, CCA optimization, or tax payable estimates.
- Detailed capital asset register, guided capital review questions, land/building split capture, CCA class support, opening UCC, additions, dispositions, proceeds, prior claims, accountant-entered CCA/closing UCC values, and capital missing-history flags.
- Full replacement for accountant judgment.
- Legal advice, tax advice, or automatic classification guarantees.
- Tenant portal.
- Tenant chat or resident communication center.
- Online rent collection.
- Payment-card handling.
- Maintenance ticketing.
- Contractor marketplace.
- Native mobile apps.
- OCR receipt extraction.
- AI categorization.
- E-signature workflow.
- Short-term rental entirely. The product covers long-term residential rentals only; there is no STR flag or behavior in the model.
- CSV bank import and bank-feed integration. Manual transaction entry is the only ledger input path.
- Tax-year close/lock state machine. Property Tax Years stay editable; point-in-time defensibility comes from immutable year-end package snapshots (see ADR-0001).
- Full GST/HST filing workflow.
- Multi-province tax support.
- Corporate landlord workflows.
- Partnership return workflows.
- Enterprise property management features for large portfolios.

## Further Notes

The strongest product stance is that the MVP succeeds when a two-owner Ontario rental property can produce a defensible year-end support package without spreadsheet reconstruction. That package should include property-level totals, owner-specific worksheets, T776-ready income and expense summaries, rent ledger support, transactions marked as capital assets, document index, missing-record warnings, and accountant notes.

The UI should stay dense, calm, and exception-driven. It should not imitate a marketing landing page or a lightweight landlord dashboard. The app's main screens should help users complete review work quickly: categorize, attach, reconcile, decide, and export.

The first implementation plan should likely break this PRD into tracer-bullet phases:

1. Property, owner, lease, manual ledger, and documents.
2. Transactions review with categorization, document linking, and exception counts.
3. Capital transaction marking, owner-share worksheets, and year-end support lists.
4. Year-End readiness and immutable package export.
5. Accountant access, audit logging, and security hardening.

The research report contains strong domain grounding but its citations are research-session references rather than durable source URLs. Before this PRD is used for external review, legal review, or investor materials, those citations should be replaced with durable CRA, OPC, PCI, Ontario, and vendor URLs.
