# Product specification: Email rent receipts to tenants

## Summary

When a landlord records a rent payment, the tenant should receive a clear email
receipt without the landlord having to prepare one manually. The recommended
experience is an explicit tenant email/consent setting on the lease, followed by
an automatically generated receipt for each eligible payment; delivery problems
must be visible without losing the rent-ledger record.

## Behavior

1. A lease records the tenant's email address and whether receipt emails are
   enabled. A landlord can review and change both values from the lease workflow.
   **Open question:** Must a tenant explicitly opt in before any receipt is sent,
   or may the landlord enable receipts on the tenant's behalf?
2. When a valid payment is recorded through the existing rent-ledger flow, the
   payment is saved first and exactly one receipt-delivery attempt is created for
   that payment when the lease has a valid email and receipt sending is enabled.
   The receipt is not sent for an invalid payment or for a payment rejected by
   `recordRentEvent`.
3. The email identifies the landlord/property, tenant, payment date, amount in
   CAD, and the lease or unit context. It states that it is a receipt for a rent
   payment and does not present a tax outcome. **Open question:** What fields and
   wording are required for the receipt to be acceptable as a rent receipt in
   Ontario?
4. The landlord sees a non-blocking pending state while delivery is being
   prepared, a sent state after the provider accepts the message, and a failed
   state with a plain-language reason when delivery cannot be completed. A
   failed email never rolls back or hides the saved payment.
5. If the lease has no email address or sending is disabled, the payment remains
   recorded and the receipt state is skipped/not requested rather than treated as
   a rent-ledger error. The UI explains what the landlord must change to make
   future receipts eligible.
6. Repeated delivery processing is idempotent: retries do not send duplicate
   receipts for the same payment and recipient. A provider timeout is therefore
   safe to retry and remains distinguishable from a permanent rejection.
7. A deleted payment cannot continue to produce a new receipt. Existing delivery
   history remains auditable. **Open question:** Should a corrected or reversed
   payment send a follow-up email, and if so should it be a replacement,
   correction, or reversal notice?
8. Receipt email content uses the tenant email stored for the lease at the time
   the receipt is created, and the system does not expose another tenant's
   address or payment details. A missing, malformed, or changed address requires
   explicit landlord action before another attempt.

## Exclusions

- No rent schedule, arrears calculation, tax computation, or automatic expected
  payment rows.
- No tenant portal, inbound replies, attachment generation, or CRA/Ontario legal
  certification beyond the receipt contract approved for this issue.
- No new Property Tax Year state, close/lock workflow, or change to Year-End
  Package immutability.
- No automatic email for existing historical payments unless the landlord
  explicitly requests a separately designed resend flow.

## Preserved behavior

1. `recordRentEvent` continues to validate lease ownership, date, and positive
   amount and saves a payment as the rent ledger's source of truth.
2. Rent summaries continue to count Payments Received by payment date and Tax
   Year; email status never changes financial totals.
3. Lease deletion remains prevented when payments exist, and deleting a payment
   remains a separate landlord action.
4. Existing lease documents, evidence links, cache invalidation, and accessible
   rent-ledger empty/error states continue to work.

## Acceptance criteria

- A landlord can enter an email and receipt preference on a lease and see the
  saved value after reload (Behavior 1, 5).
- Recording an eligible payment produces one receipt with the approved fields;
  recording an ineligible payment produces no send attempt (Behavior 2, 3, 5).
- Provider acceptance, retryable failure, and permanent failure are represented
  with distinct, understandable states, while the payment remains in the ledger
  (Behavior 4, 6).
- Reprocessing the same payment does not create a duplicate message (Behavior 6).
- Existing payment totals and Tax Year summaries are unchanged by email delivery
  success or failure (Preserved behavior 1-2; Behavior 4).
- No corrected/reversed-payment behavior is implemented until the corresponding
  product decision is answered (Behavior 7).

## Decisions for Kevin

- **Proposal — consent gate:** require an explicit receipt-email enablement and
  a tenant email before sending. Alternatives are landlord-only enablement or
  always-on sending; the gate is safer for consent, privacy, and accidental
  disclosure.
- **Proposal — delivery semantics:** enqueue after the payment commit and make
  delivery retryable/idempotent rather than blocking payment entry. A synchronous
  send would make provider availability part of rent-ledger correctness.
- **Proposal — receipt scope:** send one concise HTML/plain-text transactional
  receipt per payment, with no attachment. Alternatives are PDF receipts or a
  tenant portal; both add complexity and are not needed to confirm a payment.

## Open questions

- Must a tenant explicitly opt in before any receipt is sent, or may the landlord
  enable receipts on the tenant's behalf?
- What fields and wording are required for the receipt to be acceptable as a rent
  receipt in Ontario?
- Should a corrected or reversed payment send a follow-up email, and if so should
  it be a replacement, correction, or reversal notice?
