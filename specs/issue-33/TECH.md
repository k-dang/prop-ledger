# Technical specification: compare two Year-End Packages (issue #33)

## Approach

Recommended: a pure client-side diff plus a small section on the year-end
readiness page. A new pure function `compareYearEndPackages(earlier, later)`
in `src/lib/year-end-package-diff.ts` takes two `YearEndPackageSnapshot`
(version 2) objects and returns a typed diff (summary rows, per-T776-line rows,
capital-transaction groups, readiness/document/note deltas, identity flag).
A new client component `PackageCompareSection` (colocated under
`src/components/year-end/`) renders two file inputs, validates with the
existing snapshot shape, calls the diff function, and renders the results
table. No server action, no route change, no database change; uploaded files
never leave the browser.

Main alternative considered: persist every export server-side and offer a
"history picker". Rejected: it changes the export contract (ephemeral download
→ retained records), needs retention/deletion semantics, and is unnecessary to
answer "what changed between these two files I hold".

## Affected areas

- New: `src/lib/year-end-package-diff.ts` (pure diff, scope/year/property
  guards, delta arithmetic with the existing cent-rounding convention).
- New: `src/components/year-end/package-compare-section.tsx` (file inputs,
  parse/validate, results rendering with `tabular-nums` money and
  `src/lib/status-styles.ts` badges; no inline status colors).
- Modified: `src/components/year-end/year-end-workspace.tsx` — render the new
  section below `PackageExportPanel` (props: property id/name, year).
- Tests: `src/lib/year-end-package-diff.test.ts` reusing the golden fixtures
  under `src/lib/__fixtures__/` plus new mismatched-scope/year fixtures.
- Untouched: `src/domain/year-end-package.ts` (shape unchanged),
  `src/lib/year-end-package.ts` (builder unchanged),
  `src/app/year-end/packages/route.ts` (export bytes unchanged),
  `src/app/year-end/page.tsx` (only passes through existing props).

## Data changes

None. No schema change, no migration, no stored snapshots. Uploaded files are
parsed in memory and discarded; nothing is written to R2 or the database.

## Verification plan

- Unit: diff of the two golden fixtures asserts per-line deltas (covers B6,
  B7), capital grouping by `transactionId` (B8), readiness/document/note
  deltas (B10), identity detection (B12), and guard errors for
  property/year/version/scope mismatch (B3, B4, B11).
- Unit: CCA-free input asserts the "no CCA schedule" marker (B9).
- Visible: AC1–AC4 flows with fixture files on `/year-end`; AC5 by
  byte-comparing an export before/after; AC6 by keyboard walkthrough and badge
  label inspection (B14).
- Respect `docs/adr/0001`: no lock/close state introduced; readiness remains a
  live query (P3). No tax computation added: deltas are subtraction on recorded
  snapshot numbers only.

## Assumptions

- Inputs are `YearEndPackageSnapshot` version 2 JSON as currently downloaded;
  older versions are refused, not migrated.
- No audit-log table exists in the code (verified in `src/db/schema.ts`), so
  "why" cannot link to edit history.
- The snapshot's `generatedAt` timestamps are trustworthy for earlier/later
  ordering; user-supplied file order is corrected with a note.
- One bounded implementation pull request; no follow-up issues proposed.
