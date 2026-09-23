# Product Specification: Expected vs Received Rent

## Summary

For each lease in a property's rent ledger, show what the lease called for during
the selected Tax Year beside Payments Received for that lease. The comparison is a
derived review aid: it makes unpaid or prepaid rent visible without changing lease
records, payment records, or the meaning of Gross Rental Income.

## Behavior

1. The rent ledger is scoped to the selected Tax Year from the existing URL context.
   Every lease is shown with `Expected rent`, `Payments Received`, and `Difference`.
2. Expected rent is derived from the lease's rent amount, frequency, start date, and
   end date, intersected with January 1 through December 31 of the selected Tax Year.
   A lease with no overlap has expected rent of $0.00 for that year.
3. For monthly leases, each calendar month's expected amount is the monthly rent
   multiplied by the number of active lease days in that month divided by the number
   of calendar days in that month. For weekly leases, expected rent is the rent amount
   divided by 7 and multiplied by active lease days. For biweekly leases, it is the
   rent amount divided by 14 and multiplied by active lease days. Lease start and end
   dates are inclusive; an open end date continues through December 31 for this
   comparison.
4. Payments Received is the rounded sum of payment rent events linked to that lease
   whose receipt date falls within the selected Tax Year. Events linked to another
   lease, or not linked to a lease, do not change a lease's comparison.
5. Difference is `Payments Received - Expected rent`, rounded to cents. A negative
   difference is labeled `Shortfall` and shows the absolute amount. A positive
   difference is labeled `Overpayment` and shows the amount. Zero is labeled `On
   track`.
6. A negative difference is visibly flagged with both a text label and the existing
   review/status treatment; color is not the only signal. The flag is informational
   and does not alter Year-End Readiness.
7. A positive difference remains visible as `Overpayment`; it is not silently capped
   at zero and does not create a blocker or warning.
8. The comparison is visible in the existing lease list without requiring the user
   to open a separate workflow. The selected Tax Year is stated near the comparison
   so the figures are not mistaken for all-time totals.
9. When there are no leases, the existing empty state remains and no comparison table
   is shown. When a lease has no payments, Payments Received is $0.00 and the derived
   difference is still shown.
10. While the ledger is loading or refreshing, the existing page loading treatment
    remains. If the ledger cannot load, the existing error treatment remains; no
    partially calculated comparison is presented as complete.
11. Deleting or editing a lease or payment changes the derived comparison on the next
    rendered ledger view. No expected-rent rows or comparison values are persisted.

## Exclusions

- No changes to lease fields, rent event fields, or database tables.
- No payment scheduling, invoice generation, reminders, collection workflow, or tenant notification.
- No attempt to infer missed payments from payment timing or to match unlinked payments.
- No change to the definition of Gross Rental Income or Payments Received elsewhere in the product.
- No Year-End Readiness exception, new readiness state, or tax computation based on a shortfall.

## Preserved behavior

1. Lease dates, amounts, frequencies, tenant details, documents, and deletion rules
   continue to behave as they do today.
2. Payments Received continues to mean rent cash received during the selected Tax
   Year, and payment events remain the source of that figure.
3. Leases remain editable records and a Property Tax Year remains permanently
   editable; this feature does not introduce a close or lock state.
4. The existing property and year-end financial summaries continue to use their
   current tax-year filters and rounding behavior.

## Acceptance criteria

- A lease active for the whole year shows its full expected rent, its linked payment
  total, and the signed difference for the selected Tax Year (Behavior 1-5).
- Monthly leases starting or ending mid-month are prorated by active calendar days;
  weekly and biweekly leases are prorated by their day-rate rules (Behavior 2-3).
- A lease with no linked payments shows $0.00 received and a visible shortfall when
  expected rent is non-zero (Behavior 4-6, 9).
- A lease whose payments exceed expected rent shows a visible overpayment amount,
  not a negative shortfall and not zero (Behavior 5, 7).
- Changing the selected Tax Year changes both the expected overlap and payment total
  without changing stored lease or payment records (Behavior 1-4, 11).
- A shortfall is not included in Year-End Readiness counts or statuses (Behavior 6,
  Exclusions).
- The lease list and comparison remain usable on narrow screens, and status meaning
  remains available without color (Behavior 8, 6).

## Decisions for Kevin

1. **Proposal: use calendar-day proration for all partial periods, with monthly
   months retaining their calendar-month denominator.** Alternative: count complete
   scheduled payment periods only, or prorate every frequency using a fixed annual
   denominator. Calendar-day proration is predictable for mid-period starts and ends,
   handles leap years, and avoids inventing payment dates that are not stored.
2. **Proposal: keep shortfalls informational rather than making them a Year-End
   Readiness warning.** Alternative: add a warning to readiness. The comparison is
   based on a lease schedule while the product's readiness model tracks filing
   evidence and record completeness; keeping it informational avoids implying that a
   calculated expectation is a tax filing rule.
3. **Proposal: show positive differences explicitly as overpayments.** Alternative:
   show only shortfalls or treat positive differences as zero. Showing the surplus
   preserves useful information about prepaid rent without asserting how it should be
   recognized for tax purposes.

## Open questions

- How should expected rent be computed for leases that start or end mid-period, and for biweekly and weekly frequencies?
- Is a shortfall only informational, or should it surface as a year-end readiness exception?
- Should overpayments (prepaid rent) be shown too?
