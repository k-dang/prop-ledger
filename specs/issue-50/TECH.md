# Technical Specification: Expected vs Received Rent

## Approach

Add pure domain calculations to `src/lib/rent-ledger.ts` that accept leases,
payment events, and a Tax Year and return one derived comparison per lease. The
calculation should use ISO date strings and integer day arithmetic, include both
lease boundary dates, prorate monthly rent by calendar month, and use 7/14-day
rates for weekly/biweekly leases. Round only the resulting money values to cents.

Extend the existing lease list in
`src/components/rent-ledger/rent-ledger-detail.tsx` to render the comparison beside
each `LeaseCard`, passing the already available `year` and ledger events down. Keep
the existing rent summary and event activity unchanged. Use the existing status
style helpers for a shortfall label and pair every status with text.

The main alternative is to add persisted expected-rent rows or a database query that
generates payment schedule rows. That is rejected: expected rent is derived from
existing fields, scheduled rows would create lifecycle and migration concerns, and
the issue explicitly requires leases to remain unchanged.

## Affected areas

- `src/lib/rent-ledger.ts`: add comparison types and date/frequency calculation.
- `src/lib/rent-ledger.test.ts`: test whole-year, partial-month, weekly,
  biweekly, leap-year, no-payment, overpayment, cross-year, and open-ended cases.
- `src/components/rent-ledger/rent-ledger-detail.tsx`: pass derived values to lease
  cards and render expected, received, difference, and status.
- `src/components/rent-ledger/rent-ledger-detail.test.tsx`: verify visible labels,
  shortfall, `Prepaid`, and `Paid in full` states, selected-year context, and the no-lease state.
- `src/components/property-workspace/property-detail.tsx`: only if composition
  changes are needed; the existing `year` and `rentLedger` props should otherwise
  require no change.

## Data changes

None. No schema migration, persisted schedule, audit entry, or Year-End Package
shape change is proposed. Existing leases and rent events remain the source data.

## Verification plan

- Unit tests prove the expected-rent formula for monthly leases active all year,
  starting/ending mid-month, an open-ended lease, leap February, weekly leases, and
  biweekly leases (Behavior 2-3).
- Unit tests prove only payment events linked to the lease and dated in the selected
  Tax Year contribute to Payments Received, and that sums and differences round to
  cents (Behavior 4-5).
- Unit tests prove `Paid in full`, `Shortfall`, and `Prepaid` classifications (Behavior 5-7).
- Component tests prove each lease displays the three money figures and the status
  label, and that shortfall is not communicated through color alone (Behavior 1,
  6, 8).
- Component tests prove no lease displays the existing empty state, and a lease
  without payments still displays $0.00 received and its derived shortfall (Behavior
  9).
- Existing rent-ledger, property-workspace, financial-summary, and readiness tests
  must continue to pass, demonstrating preserved behavior and no readiness change
  (Preserved behavior 1-4; Behavior 6).
- Manual check in light and dark themes at desktop and narrow mobile widths verifies
  aligned money values, readable status labels, and no horizontal overflow (Behavior
  8; Acceptance criteria).

## Assumptions

- `rentAmount` is the amount for one monthly, weekly, or biweekly frequency period,
  and weekly/biweekly amounts can be converted to a daily rate by dividing by 7 or
  14.
- A lease's start and end dates are inclusive, matching the domain convention for
  effective-dated records.
- The existing date strings are valid ISO calendar dates and the selected Tax Year
  is a valid calendar year.
- A rent event's `date` is the receipt date for Payments Received; `periodStart` and
  `periodEnd` do not change this comparison because the current payment summary uses
  receipt date.
- A shortfall and overpayment are review labels only, not tax conclusions. Gross
  Rental Income remains governed by the existing product definition.
