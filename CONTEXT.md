# Tax-Ready Rental Records

The domain language for an Ontario co-owner rental record-keeping workspace.
The app organizes recorded income, expenses, ownership and evidence into
filing-support packages. It does not calculate tax payable or depreciation.

## Language

**Tax Year**:
A calendar filing period used to select independently dated records and scope
portfolio and property views. The selected year lives in the URL (`?year=`).
_Avoid_: reporting period, fiscal year, accounting period

**Ownership Period**:
An effective-dated record of one owner's share of a property. Dates are inclusive;
owner allocations use the share effective on each record's date. Setup checks
coverage on acquisition; year-end checks the active portion of the selected year.
_Avoid_: share, allocation, split (as standalone nouns)

**Year-End Package**:
A JSON snapshot generated from current records when downloaded, for a property or
one owner and a Tax Year. The downloaded artifact stays unchanged when records are
edited; a later download reflects the current records. Packages are not stored in
the app. Supporting documents remain separate files referenced by the package.
_Avoid_: closed year, locked year

**Portfolio Dashboard**:
The overview of recorded financial activity and filing readiness across properties
for one selected Tax Year. Properties acquired after that year remain visible as
not active and contribute no totals or readiness counts.
_Avoid_: property dashboard, setup dashboard

**Gross Rental Income**:
Recorded rent payments plus recorded non-rent rental income selected for a Tax Year.
The current rent ledger records payments received, not accrued rent obligations.
_Avoid_: taxable income, tax payable

**Payments Received**:
Rent cash recorded as received during a Tax Year, shown separately from non-rent
income. Leases supply tenant, unit and rent context; they do not create payment rows.

**Deductible Expenses**:
Recorded current expenses selected and allocated to a Tax Year and classified to
T776 expense categories, including recorded mortgage interest and excluding principal.
_Avoid_: total spending, cash outflow

**Net Recorded Rental Income**:
Gross Rental Income less Deductible Expenses. This is a record summary.
_Avoid_: net operating income, tax outcome

**Filing Readiness**:
The shared setup and year-end checklist: *Ready* has no open blockers or warnings,
*Needs review* has warnings only, and *Blocked* has one or more blockers. Status is
derived from current records, never stored. Checklist counts count groups; exception
counts count the individual records or setup tasks requiring attention.

**Evidence Exception**:
A record-readiness finding for classification, supporting documents or allocation
cleanup. Ownership setup gaps appear once in the filing checklist rather than also
appearing as a year-end ownership warning.
_Avoid_: error, validation failure

**Setup Draft**:
The unfinished answers from guided property setup, saved on the property with
"Save and finish later". Owners, ownership periods, units and leases are written
together only when setup finishes; until then the property shows a "Finish setting
up" checklist that reopens the guided flow.
_Avoid_: partial setup, incomplete property

## Relationships

- Property setup owns units, owners and effective-dated ownership periods. New
  properties are set up through the guided flow; later changes, such as ownership
  history, use the setup panel on the property page.
- A Tax Year selects rent payments, transactions, mortgage payments and ownership
  periods by date. Prepaid amounts are allocated over their recorded service dates.
- Documents are uploaded once and linked to the records they support. Files live
  in R2; document metadata and links live in the database.
- Dashboard, property and year-end screens share the filing checklist. The package
  records year-end transaction and ownership exceptions alongside its source data.
- Live records remain editable. Downloading a package creates no close or lock state.
- DIY landlords are the primary users. Professional review is optional; review notes
  can accompany records and packages without turning the app into a tax calculator.
