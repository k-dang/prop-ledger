# Product specification: multiple rental units within one property

## Summary

A property workspace currently owns the property-level financial records, but the
rent experience does not make each unit's tenant and payments independently
visible. This makes a duplex or basement suite awkward to model and duplicates
shared expenses and mortgage records when users create one property per unit.

The recommended outcome is one property workspace containing one or more units.
Each unit has its own leases and rent payments; transactions, mortgage payments,
documents, ownership, and year-end readiness remain property-level unless this
spec explicitly says otherwise.

## Behavior

1. A property can contain one or more named units. A unit has a label and unit
   type, and is displayed inside its parent property workspace. A property with
   no units remains in the existing setup-gap state.

2. A lease belongs to exactly one unit. The lease form requires the unit, tenant
   name, dates, rent amount, and rent frequency. The unit view shows its active
   and historical leases without mixing them with another unit's leases.

3. A rent payment belongs to exactly one lease and therefore one unit. The rent
   ledger shows the unit and tenant for every payment, supports filtering or
   grouping by unit, and preserves the selected Tax Year scope. A property-level
   total is the sum of its unit ledgers; a unit total contains only that unit's
   payments.

4. Recording, deleting, and displaying a payment must reject a lease from a
   different property or a lease that does not exist. Deleting a lease with
   recorded payments remains blocked; deleting a unit with a lease remains
   blocked. These responses are Evidence Exceptions only when they affect
   year-end support; ordinary mutation errors remain actionable form errors.

5. The property workspace continues to show property-level ledger entries,
   mortgage payments, ownership periods, and ownership allocation. No shared
   expense or mortgage amount is silently copied to, divided among, or reported
   as a unit expense. Shared financial activity is reported once at the property
   level.

6. **Proposal:** unit-specific expenses are out of scope for this change. If a
   user needs to explain a shared expense, the existing property-level vendor,
   memo, category, and evidence fields remain the place to do so.
   **Open question:** Should shared expenses be allocated to units (by square
   footage, evenly, manually), or only reported at the property level?

7. The Portfolio Dashboard continues to aggregate financial activity and
   Year-End Readiness by property. It does not count a property's units as
   separate properties, and it does not double-count shared expenses or mortgage
   interest. Rental income totals include payments from every unit in the
   selected Tax Year.

8. A Year-End Package remains a property snapshot and includes the property
   total. **Proposal:** it also includes a unit-by-unit rental-income appendix
   containing each unit, tenant/lease context, payment count, and Payments
   Received, while property-level expenses, mortgage interest, ownership, and
   unresolved Evidence Exceptions remain in the property sections.
   **Open question:** Does the year-end package report per unit, per property, or
   both?

9. Existing properties must retain their current property identity, owners,
   ownership periods, transactions, mortgage payments, documents, and recorded
   rent amounts. **Proposal:** each existing single-unit property is given one
   migrated unit with a neutral label, and its existing lease/payment records are
   attached to that unit. The migration must not create a second property or
   duplicate any amount.
   **Open question:** How should existing single-unit properties migrate: become
   a property with one unit, or stay as they are?

10. Empty states distinguish “no units” from “no leases” and “no payments,” and
    guide the user to add the next record. Pending saves disable the submitted
    action without losing entered values. A failed save leaves existing records
    unchanged and identifies the field or relationship that needs correction.

## Exclusions

- No automatic shared-expense allocation, unit square-footage model, or manual
  allocation workflow.
- No unit-level mortgage, ownership, capital-asset, or T776 expense records.
- No new Tax Year locking or closing state; Property Tax Years remain editable and
  Year-End Readiness remains derived from live exceptions.
- No change to rent being recorded as Payments Received or to the existing
  accrual/tax-language boundaries.

## Preserved behavior

1. Property-level transactions and mortgage payments remain available in the same
   property workspace and continue to support property-level Year-End Packages.
2. Ownership Periods remain effective-dated property records and continue to drive
   owner allocations; unit count does not change ownership percentages.
3. Existing lease document links and evidence records remain attached to their
   lease, transaction, rent event, or mortgage payment targets.
4. Property deletion continues to cascade its child records according to the
   existing data model; destructive actions retain their current safeguards.
5. The Portfolio Dashboard's selected Tax Year remains explicit in the URL and
   inactive properties contribute no totals or readiness counts.

## Acceptance criteria

1. A property with two units can show two different tenants and record payments
   against each lease; each unit's ledger and the property total reconcile (2, 3).
2. A payment cannot be saved with a missing, foreign, or cross-property lease,
   and a failed request does not create a rent event (4, 10).
3. A shared property expense and mortgage payment appear once at property level;
   portfolio and year-end totals do not multiply them by unit count (5, 7, 8).
4. A property with no units, a unit with no lease, and a unit with no payment each
   have a distinct, usable empty state (1, 2, 10).
5. Migration of representative existing data preserves all property, lease,
   payment, expense, mortgage, ownership, and evidence records and produces no
   duplicate financial totals (9, preserved behavior 1–3).
6. A Year-End Package can be reviewed at property level and, under the recommended
   design, reconciles its unit rental appendix to the property rental total (8).

## Decisions for Kevin

1. **Proposal — keep shared expenses property-level for this issue.** Alternatives
   are square-footage, equal, or manual allocation. Property-level reporting is
   recommended because it avoids inventing tax allocations, matches the current
   data model, and preserves defensibility until an allocation policy is designed.
2. **Proposal — migrate every existing property to one unit.** Leaving legacy
   properties unitless would require two rent models and make future UI behavior
   inconsistent. A neutral unit preserves data while giving every property one
   canonical path.
3. **Proposal — report both property totals and a unit rental appendix.** A
   property is the filing and evidence boundary, while unit detail answers the
   landlord's operational reconciliation need without allocating shared costs.

## Open questions

- Should shared expenses be allocated to units (by square footage, evenly,
  manually), or only reported at the property level?
- How should existing single-unit properties migrate: become a property with one
  unit, or stay as they are?
- Does the year-end package report per unit, per property, or both?
