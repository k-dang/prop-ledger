Status: ready-for-agent

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

- [ ] Attaching a receipt from the transactions inbox uploads to R2 and the document
      appears in the transaction's linked documents
- [ ] Attaching from the evidence sheet form works identically
- [ ] A photo larger than 4.5MB uploads successfully (proves bytes bypass the server)
- [ ] A file over 20MB or of an unsupported type is rejected with a clear message
      before any upload starts
- [ ] Attaching evidence clears the transaction's missing-receipt Evidence Exception
- [ ] The stored document link opens through the worker and renders the receipt, with
      the original filename preserved on the record
- [ ] Confirming against a key that was never uploaded fails; no document row is
      created
- [ ] An upload against a deleted transaction fails with a clear message at presign
- [ ] Upload-policy unit tests pass alongside the existing suite; typecheck and lint
      are green
- [ ] No new upload writes anything under the app's public directory

## Blocked by

- .scratch/evidence-blob-uploads/issues/01-provision-r2-storage.md
- .scratch/evidence-blob-uploads/issues/02-worker-read-path.md
