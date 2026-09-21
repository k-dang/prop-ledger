# Technical specification: multiple rental units within one property

## Approach

Complete the existing property → unit → lease relationship rather than introducing
a second property model. The schema already has `units` and unit-owned `leases`;
the main boundary that must be made explicit is that `rentEvents` are currently
stored with both a property and lease reference, while the workspace and package
must consistently derive unit detail from the lease. Keep `ledgerEntries` and
`mortgagePayments` keyed by `propertyId`.

The recommended implementation loads leases with their units, validates the
property/lease/unit chain in server actions, and exposes a normalized rent view
that can be grouped by unit while retaining the existing property aggregate.
The main alternative is to add `unitId` to every property-level financial table;
that is rejected for this issue because it would force an allocation policy for
shared records and make existing totals ambiguous.

## Affected areas

- `src/db/schema.ts`: strengthen the documented relationship and, if supported by
  the database version, add constraints/indexes that make lease ownership and
  rent-event lookup efficient. Do not move property-level tables to units.
- `src/db/queries.ts`: hydrate unit leases and rent events together; expose enough
  unit/lease context for the workspace, dashboard, and package builders.
- `src/lib/rent-ledger.ts`: add unit-aware ledger rows/summaries and property
  reconciliation helpers. Keep `summarizeRentLedger` compatible or update all
  callers in one change.
- `src/lib/actions.ts`: validate unit and lease ownership for create/delete unit,
  lease, and rent-payment mutations; preserve existing safeguards and cache
  invalidation.
- `src/lib/property-workspace.ts`: represent unit/lease context in the aggregate
  and keep setup readiness at property scope.
- `src/components/rent-ledger/*` and
  `src/components/property-workspace/property-detail.tsx`: present unit context,
  unit grouping/filtering, and distinct empty/pending/error states.
- `src/lib/portfolio-dashboard.ts` and tax-year financial helpers: include every
  unit payment exactly once while leaving expenses and mortgage interest at
  property scope.
- `src/lib/year-end-package.ts` and `src/domain/year-end-package.ts`: add the
  proposed unit rental appendix without changing property-level expense,
  ownership, or evidence semantics.
- `src/lib/year-end-readiness.ts`: verify that missing rent evidence or other
  existing readiness rules do not become one exception per unit accidentally.
- `drizzle/*.sql`: add a forward migration only if the selected migration design
  requires indexes, constraints, or legacy-data backfill.

## Data changes

The current schema already contains `properties`, `units`, `leases`, and
`rent_events`. Keep these keys:

- `units.property_id` remains the parent boundary.
- `leases.unit_id` remains the authoritative unit relationship.
- `rent_events.lease_id` remains the authoritative unit relationship; retain
  `property_id` as a denormalized ownership/query key and validate that it matches
  the lease's parent property.
- `ledger_entries`, `mortgage_payments`, `documents`, `owners`, and ownership
  periods remain property-owned.

Add a migration/backfill for existing rows only after Kevin selects the migration
option. Under the recommended option, insert one unit per property that lacks an
appropriate unit, then attach legacy single-unit leases to it. Use a deterministic
neutral label such as `Unit 1`; do not infer a physical address or allocate money.
The migration must be idempotent and preserve IDs where rows already have them.

If legacy data has no lease/unit relationship, do not fabricate a tenant or payment
association silently: surface those rows for review, or ask Kevin to approve a
separate data-repair rule. **Open question:** How should existing single-unit
properties migrate: become a property with one unit, or stay as they are?

For the package model, add a versioned field such as `unitRentLedgers` (name to be
confirmed) containing unit identity and unit-scoped payment totals/details. Bump
the snapshot version and keep readers able to distinguish old property-only
snapshots. Do not persist a new Tax Year state or compute tax outcomes.

## Verification plan

- Unit/lease/rent domain tests prove two units remain isolated, property totals
  reconcile, payments from other Tax Years are excluded, and a missing/foreign
  lease is rejected (Behavior 1–4).
- Action tests prove cross-property IDs cannot be combined and failed mutations
  have no partial insert; deletion safeguards remain intact (Behavior 4, 10).
- Dashboard and financial-summary tests prove unit count does not multiply
  property-level expenses or mortgage interest and all unit Payments Received are
  included once (Behavior 5, 7).
- Component tests cover no-unit, no-lease, and no-payment states, unit labels in
  payment rows, keyboard-operable filtering, pending submission, and readable
  error feedback (Behavior 1, 2, 10).
- Migration tests use representative single-unit and multi-unit fixtures to prove
  IDs and totals are preserved and the migration is idempotent (Behavior 9).
- Year-end package tests prove property-level expenses/ownership/evidence remain
  unchanged, unit rental details are present if approved, and unit totals equal
  the property rental total (Behavior 8).
- Existing property-workspace, rent-ledger, mortgage, allocation, portfolio, and
  year-end tests remain green to prove preserved behavior.

## Assumptions

- The existing `units` and unit-owned `leases` tables are the intended foundation,
  not an unused legacy model.
- A property can have multiple concurrent units and a unit can have historical
  leases, but a payment has one lease at a time.
- Payments Received remain cash-basis rent events; this issue does not introduce
  expected-rent generation or tax computation.
- There is no authentication/authorization boundary to add here; existing server
  action validation and the current application posture remain in force.
- Shared property records have no unit allocation until Kevin approves a separate
  product decision.

## Proposed breakdown

This is bounded as one implementation pull request if the recommended migration,
property-level shared-cost treatment, and both-level package output are accepted.
If Kevin chooses a unit allocation policy or requests a large historical data
repair, split that work into a follow-up issue referencing this specification;
those choices change accounting semantics and should not be hidden in this issue.
