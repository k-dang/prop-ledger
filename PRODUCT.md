# Product

## Register

product

## Users

The primary user is a **DIY landlord** — a self-managing property owner who keeps
their own books and files their own taxes (Canadian T776, Statement of Real Estate
Rentals) without an accountant. They are financially capable but not a finance
professional: comfortable with money, wary of tax jargon, and anxious about getting
the filing right and surviving a possible CRA review.

Their context: they touch this a few times a month to log rent and expenses, and
hard at year-end when a return is due. Across the year they manage a small portfolio
(a handful of properties), each with its own rent ledger, transactions, supporting
documents, capital assets, and an evidence binder that substantiates what was claimed.

The job to be done: **walk into tax season already ready** — every property's records
complete, every claimed number backed by evidence, and a clear, trustworthy answer to
"what do I still need to fix before I file?"

## Product Purpose

A tax-ready rental-property accounting workspace. It exists to turn a year of messy
rent payments, expenses, and receipts into a defensible, filing-ready record per
property and across the portfolio. Success is the user reaching year-end with zero
blocking exceptions, confident that every figure on their T776 is recorded and
substantiated — and never feeling they need an accountant to get there.

Core surfaces: portfolio dashboard (financial totals + readiness across properties),
per-property workspace, rent ledger, transactions, documents, evidence binder /
capital-asset control, and year-end readiness.

## Brand Personality

**Calm, trustworthy, precise.** Quiet confidence over flash. The interface should
lower tax anxiety, not add to it: state the numbers plainly, surface what needs
attention without alarm, and make the path to "ready" obvious. Voice is plain-language
and reassuring — it explains tax concepts (accrual income, deductible vs. capital,
T776 categories) without condescension and without drowning the user in jargon.
It feels like a dependable record-keeper that won't let things slip.

## Anti-references

- **Legacy accounting software** (QuickBooks/Sage-era): dense gray grids, cluttered
  toolbars, intimidating and dated. This is the explicit anti-reference — the product
  must feel modern, calm, and legible, never like enterprise bookkeeping software a
  DIY landlord would be afraid to open.
- **Generic AI-SaaS dashboard**: gradient hero-metric cards, identical icon-card
  grids, purple gradients. Avoid the templated look; hierarchy and restraint carry
  the design, not decoration.

## Design Principles

1. **Readiness over data entry.** Every screen should answer "what's done, what's
   left, what's blocking the filing?" before it shows raw rows. Decisions and
   exceptions surface first; the ledger is the backup, not the headline.
2. **Every number is defensible.** Money figures, statuses, and totals carry their
   provenance — accrual basis, T776 category, evidence backing, "incomplete" when
   provisional. Never show a confident number that can't be stood behind.
3. **Plain language, no jargon tax.** Translate CRA/tax concepts into language a
   capable non-accountant trusts. Terminology is precise where it must be (T776
   category names) and explained everywhere else.
4. **Calm signal, no alarm.** Status color (ready / needs-review / blocked) is a
   guidance system, not a warning siren. Color is never the only signal; severity is
   proportionate and ordered by filing impact.
5. **Precision as craft.** Tabular numerals, aligned money columns, consistent
   date/currency formatting. The trust this product needs is earned in the small
   details of how figures are presented.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**. Concretely: body text ≥4.5:1 contrast (large/bold text ≥3:1),
full keyboard operability for every interaction, visible focus states, and color never
used as the sole carrier of meaning — readiness and severity always pair color with a
label or icon. Honor `prefers-reduced-motion` with crossfade/instant alternatives.
Both light and dark themes must meet the same bar.
