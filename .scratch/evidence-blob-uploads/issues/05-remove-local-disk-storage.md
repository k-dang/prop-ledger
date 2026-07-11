Status: done

# Delete the local-disk storage path completely

## Parent

.scratch/evidence-blob-uploads/PRD.md

## What to build

With uploads (issue 03) and deletion (issue 04) fully on R2, remove the filesystem
storage path entirely — code, files, and data. Per the repo's working style, removal
means deletion, not deprecation: no bridging shims, no "legacy" branches, no dead
module kept as a reintroduction point.

- Delete the filesystem evidence-storage module and every remaining reference to it.
- Delete the evidence uploads directory under the app's public directory.
- Discard (not migrate) existing dev data pointing at local-disk URLs: remove the
  affected document rows and their links, per the PRD's migration decision.
- Update any tests that seeded local-disk-style storage URLs to use the new worker-URL
  shape where the URL's shape matters; where it's opaque data, leave them.

## Acceptance criteria

- [x] No filesystem read/write/unlink code remains in evidence storage; the module is
      gone, not stubbed
- [x] No evidence uploads directory exists under the public directory
- [x] No document row carries a local-disk storage URL
- [x] The app builds and runs with no reference to the old path; attach, view, and
      delete evidence flows still work end-to-end against the dev bucket
- [x] Tests, typecheck, and lint are green

## Blocked by

- .scratch/evidence-blob-uploads/issues/03-presigned-upload-path.md
- .scratch/evidence-blob-uploads/issues/04-blob-deletion.md

## Comments

2026-07-11: Found the filesystem module already gone — issue 04's commit
(`527f813`) deleted `src/lib/evidence-file-storage.ts` as a side effect of pointing
deletion at R2, and no code anywhere still imports it. `public/uploads` never existed
in the current tree. So this issue's actual remaining work was verification, not
deletion:

- Grepped the full `src/` tree: zero references to `evidence-file-storage`, no
  filesystem read/write/unlink calls, no `public/uploads`.
- Queried the dev database directly for `documents.storageUrl LIKE '/uploads/%'`:
  zero rows. Nothing to discard.
- Confirmed the test files seeding `"/uploads/..."` storage URLs
  (`evidence-binder.test.ts`, `portfolio-dashboard.test.ts`,
  `year-end-package.test.ts`, `year-end-readiness.test.ts`) treat the URL as opaque
  factory data per the PRD's testing decision — left unchanged.
  `evidence-upload-policy.test.ts`'s `"rejects a legacy local-disk URL"` case is
  intentionally shape-aware (asserts `/uploads/evidence/...` is rejected by
  `evidenceObjectKeyFromStorageUrl`) — also correctly left as-is.
- `pnpm typecheck`, `pnpm lint`, `pnpm worker:typecheck`, and `pnpm test` (84 tests)
  all green.
- End-to-end verification: browser-based file upload was blocked by a version
  mismatch in the `file_upload` MCP tool (it now expects file bytes via a `files`
  parameter absent from its exposed schema — a tool-side issue, not app code).
  Instead verified the full upload/view/delete round trip by driving the actual
  `evidence-blob-storage.ts` functions against the real dev R2 bucket with the
  worker running locally: presigned PUT → R2 (200), HEAD-verify (type/size match),
  GET through the worker (200, correct content-type, `inline` disposition with the
  original filename, immutable long-lived cache headers), `deleteEvidenceObjectBestEffort`,
  then GET returns 404. This exercises the same library code the app's server
  actions call. Dev servers (`pnpm dev:all`) stopped afterward.
