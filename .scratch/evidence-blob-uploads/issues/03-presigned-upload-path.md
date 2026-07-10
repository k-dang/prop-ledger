Status: done

# Presigned upload replaces disk writes

## Parent

.scratch/evidence-blob-uploads/PRD.md

## What to build

The full upload tracer from ADR 0002: evidence files go browser → R2 via presigned
PUT, with the server minting and verifying, and the document record pointing at the
worker's URL. After this slice, attaching evidence no longer touches local disk.

- A blob-storage module (signing via aws4fetch) exposing the three-step flow:
  1. **Presign**: server action verifies the transaction exists under the property,
     validates declared content type (PDF or `image/*`) and size (max 20MB), generates
     a UUID-prefixed sanitized object key, and returns a short-lived presigned PUT URL
     with content type and length pinned into the signature.
  2. Browser PUTs the file directly to R2.
  3. **Confirm**: server action HEAD-verifies the object exists and matches the
     declaration, then inserts the document record and transaction link atomically,
     denormalizing vendor/date/amount from the transaction as the current action does.
- The stored storage URL is the full worker URL for the object (worker base URL from
  configuration).
- Client orchestration (presign → PUT → confirm) lives inside the existing
  evidence-upload hook so both attach surfaces — the transactions inbox button and the
  evidence sheet form — keep their current interfaces, pending states, and error
  display.
- Missing storage configuration fails loudly at first use, not silently.
- Integrity stance: no document row may point at a missing blob (HEAD-verify); a
  browser that uploads but never confirms leaves a tolerated orphan blob — no pending
  state, no cleanup machinery.

Unit tests cover the pure upload-policy seam only, in the existing lib vitest style
(plain data, no mocks, no network): file acceptance (type, size cap), object-key
generation and sanitization, worker-URL ↔ object-key derivation (including rejecting
URLs outside the known prefix), and validation of a HEAD result against the presigned
declaration. Signed HTTP calls and the browser PUT are verified empirically in the
running app against the dev bucket with the worker running.

## Acceptance criteria

- [x] Attaching a receipt from the transactions inbox uploads to R2 and the document
      appears in the transaction's linked documents
- [x] Attaching from the evidence sheet form works identically
- [x] A photo larger than 4.5MB uploads successfully (proves bytes bypass the server)
- [x] A file over 20MB or of an unsupported type is rejected with a clear message
      before any upload starts
- [x] Attaching evidence clears the transaction's missing-receipt Evidence Exception
- [x] The stored document link opens through the worker and renders the receipt, with
      the original filename preserved on the record
- [x] Confirming against a key that was never uploaded fails; no document row is
      created
- [x] An upload against a deleted transaction fails with a clear message at presign
- [x] Upload-policy unit tests pass alongside the existing suite; typecheck and lint
      are green
- [x] No new upload writes anything under the app's public directory

## Blocked by

- .scratch/evidence-blob-uploads/issues/01-provision-r2-storage.md
- .scratch/evidence-blob-uploads/issues/02-worker-read-path.md

## Comments

2026-07-09: Implemented the three-step presigned flow. New pure policy module
`src/lib/evidence-upload-policy.ts` (file acceptance, 20MB cap, UUID-prefixed
sanitized keys — same regex as the disk era, worker-URL ↔ key derivation, HEAD-result
validation) with 20 vitest cases in the existing lib style. New server-only
`src/lib/evidence-blob-storage.ts` signs with aws4fetch's `AwsV4Signer` directly using
`allHeaders: true` + `signQuery: true` — required because aws4fetch treats
content-type/content-length as unsignable by default, and pinning them is the point;
missing env vars throw a named-variable error at first use. `evidence-actions.ts`
replaces `uploadTransactionEvidence` with `presignTransactionEvidenceUpload` (plain
try/catch — presign mints a URL, mutates nothing, so no runAction/cache invalidation)
and `confirmTransactionEvidenceUpload` (runAction + tag invalidation; re-checks the
transaction, HEAD-verifies, atomic documents+link `db.batch` with denormalized
vendor/date/amount, storageUrl = `EVIDENCE_BASE_URL/<key>`). Client orchestration
(presign → browser PUT → confirm) is `uploadTransactionEvidence` in the hook module
`transaction-evidence-upload.ts`; both surfaces kept their exact call signature —
only their import changed.

**Verification** (real bucket + local worker, via agent-browser): PDF attach from the
inbox and from the evidence sheet both landed in R2 and appeared as linked documents;
a 5.76MB BMP uploaded (bytes bypass the server); a 21MB file and a .zip were rejected
at presign with the right messages before any PUT (server log shows presign only, no
confirm); Receipt exceptions cleared on both rows and property readiness shows
"Missing receipts: Clear"; stored links serve through the worker with inline
disposition, original filename, correct content type, immutable cache headers; a
signed HEAD on a never-uploaded key returns 404 → confirm's policy check rejects
before insert (documents count unchanged); a transaction deleted between page load
and attach fails presign with "That transaction no longer exists."; `public/uploads`
does not exist. Typecheck, lint, and the full suite (83 tests) green. Dev servers
stopped afterward.

**Review notes** (two-axis review): evidence-file-storage.ts now has dead exports
(`saveEvidenceFile`, `cleanupStoredEvidenceFile`, `isSupportedEvidenceFile`) — left
in place because issue 05 owns deleting that module completely;
`evidenceObjectKeyFromStorageUrl` has no production caller yet — issue 04's delete
path is its consumer, and this issue's test seam explicitly required it. A missing
storage config surfaces to the user as the generic failure message (the named-variable
detail lands in the server log) — judged acceptable for a dev-facing config error.
