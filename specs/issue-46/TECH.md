# Technical specification: Email rent receipts to tenants

## Approach

Extend the lease with tenant contact and consent fields, then make
`recordRentEvent` the transaction boundary for receipt creation. After the rent
event is committed, create an idempotent receipt-delivery record and hand it to
an email adapter/worker. The adapter owns provider-specific credentials,
templating, retry classification, and provider message IDs; the rent action only
records the payment and schedules work.

The main alternative is to call an email provider directly from the server
action. It is simpler initially, but couples payment success to network/provider
availability, makes retries prone to duplicates, and provides no durable pending
or failed state. An outbox-style record is recommended even if the first worker
is a small application job.

## Affected areas

- `src/db/schema.ts`: lease email/preference fields and a receipt-delivery/outbox
  model, including unique identity for `(rent_event, recipient, receipt kind)`.
- A new `src/lib/` email/receipt module: receipt view model, plain text/HTML
  rendering, eligibility checks, idempotency, and provider interface. Keep
  provider credentials and server actions out of route components.
- `src/lib/actions.ts`: validate lease email/preference, insert the payment and
  receipt work atomically where possible, and return the existing action result
  contract without making provider delivery a save prerequisite.
- `src/db/queries.ts` and rent-ledger view models: load delivery status for the
  relevant property/lease/payment without changing financial summary behavior.
- Lease and payment UI under `src/components/rent-ledger/`: edit contact/consent,
  show pending/sent/failed/skipped status, and provide a safe retry for failed
  eligible receipts.
- Tests beside the domain/action/UI modules: eligibility, content, idempotency,
  retry classification, authorization by property/lease, and visible states.
- A provider-specific deployment/configuration module and secret documentation;
  the provider is intentionally not selected until the open architecture
  decision is answered.

## Data changes

Recommended migration:

1. Add nullable `tenant_email` and a consent/enablement column to `leases`, so
   existing leases remain valid and historical records are not retroactively
   emailed. Normalize and validate the address at mutation time; do not infer
   consent from an existing tenant name.
2. Add `rent_receipt_deliveries` keyed to `rent_events`, with recipient address
   snapshot, status (`pending`, `sent`, `failed`, or `skipped`), attempt count,
   last error, provider message ID, and timestamps. Add a unique constraint that
   prevents duplicate receipt work for one payment/recipient/kind.
3. Existing leases migrate to no email and disabled/skipped behavior. Existing
   rent events receive no delivery rows unless a future explicit resend feature
   creates them. No financial values or Tax Year records are rewritten.

If the selected provider supplies a durable queue, its message ID may be stored,
but provider payloads and secrets must not be stored in the database. The receipt
snapshot should retain the exact recipient and payment values used for the
message so later lease edits cannot change delivery history.

## Verification plan

- Unit-test eligibility for missing/invalid email, disabled preference, valid
  consent, and property/lease mismatch (Behavior 1, 2, 5, 8).
- Unit-test receipt rendering for the approved Ontario contract, CAD amount,
  payment date, property/unit context, and no tax-outcome claims (Behavior 3).
- Integration-test payment commit plus outbox creation, including provider
  failure after commit and retry without duplicate work (Behavior 2, 4, 6).
- Test migration behavior for existing leases/events and confirm no historical
  emails are scheduled (Exclusions; Data changes).
- Test UI states for pending, sent, failed, skipped, empty email, and retryable
  failure, including keyboard access, labels independent of color, and calm
  status styling consistent with `DESIGN.md` (Behavior 4, 5).
- Regression-test `summarizeRentLedger`, deletion protections, cache tags, and
  existing lease/document flows (Preserved behavior 1-4).

## Assumptions

- The current lease is the tenant record for this issue; issue #40 may alter that
  model, so the final schema should be reconciled before migration work begins.
- The application has no tenant authentication; delivery is to the landlord-
  entered address and must not imply a tenant portal.
- Email is a transactional notification, not evidence storage. The immutable
  Year-End Package remains the point-in-time artifact, and no email state is a
  Property Tax Year readiness state.
- A background execution mechanism and an email provider will be provisioned as
  part of implementation. Provider choice, consent rule, Ontario content, and
  correction/reversal behavior remain unresolved product decisions.

## Proposed breakdown

This is bounded for one implementation pull request after the open questions are
settled. Do not split it unless provider provisioning or issue #40 makes the
following independently reviewable boundary necessary:

1. **Receipt contract and lease contact preferences** — acceptance: the approved
   receipt fields, consent rule, and correction policy are represented in the
   lease/payment domain and existing leases migrate without sends. Reference:
   this specification, Behavior 1, 3, 7, 8.
2. **Durable delivery and provider adapter** — acceptance: eligible payments are
   queued after commit, delivered/retried idempotently, and expose pending/sent/
   failed/skipped state. Reference: this specification, Behavior 2, 4, 6.
3. **Rent-ledger presentation and regression coverage** — acceptance: landlords
   can manage preferences and understand every delivery state without changes to
   rent totals or existing evidence flows. Reference: this specification,
   Behavior 5 and Preserved behavior 1-4.
