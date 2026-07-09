Status: ready-for-agent

# Evidence Blob Uploads (Cloudflare R2)

## Problem Statement

As a co-owner keeping tax-ready rental records, I attach source documents (receipts,
statements) to ledger transactions so each record can survive accountant and CRA
scrutiny. Today those evidence files are written to the app server's local disk. That
storage disappears on a serverless deploy — the app is headed to Vercel, which has no
writable persistent filesystem — and even before deploy, relaying a file through the
server caps uploads below the size of an ordinary phone photo of a receipt (~4.5MB on
Vercel). If evidence uploads break or silently reject real receipts, transactions keep
their open Evidence Exceptions and the Year-End Package loses the very defensibility it
exists to provide.

## Solution

Store evidence files in a Cloudflare R2 bucket instead of local disk, uploaded directly
from the browser using short-lived presigned URLs minted by the server. The user
experience is unchanged: pick a file on a transaction, see it attach, see the Evidence
Exception clear. Under the hood the server validates the request and issues a presigned
PUT pinned to the declared content type and size; the browser uploads straight to R2;
the server then verifies the object actually exists before recording the document.

Reads are served by a Cloudflare Worker colocated in this repo, modeled on the
epstein-files-browser worker: the bucket stays fully private, and the worker — reading
R2 through a binding — is the sole public read surface, serving each object by its
unguessable key with the right content type and immutable cache headers. This keeps the
same accessible-with-the-link posture the local-disk implementation had, while giving a
future auth check exactly one place to land. Full rationale and rejected alternatives
are recorded in ADR 0002.

## User Stories

1. As a co-owner, I want to attach a receipt to a transaction from the transactions inbox, so that its Evidence Exception clears without leaving my triage flow.
2. As a co-owner, I want to attach a receipt from the transaction's evidence sheet, so that I can manage all of a transaction's source documents in one place.
3. As a co-owner, I want to upload a multi-megabyte phone photo of a receipt, so that snapping receipts with my phone remains a valid capture workflow after the app moves to Vercel.
4. As a co-owner, I want to upload PDF receipts, so that emailed invoices and bank statements can back my transactions.
5. As a co-owner, I want files that are neither PDF nor image rejected with a clear message, so that I don't pollute my evidence binder with unusable files.
6. As a co-owner, I want absurdly large files rejected with a clear message before the upload starts, so that I don't wait on a transfer that was never going to be accepted.
7. As a co-owner, I want the attach button to show an in-progress state while the file uploads, so that I know the app is working and don't double-submit.
8. As a co-owner, I want a clear error when an upload fails mid-transfer (network drop, signature expired), so that I know the evidence was NOT attached and can retry.
9. As a co-owner, I want an upload against a transaction that was deleted in the meantime to fail with a clear message, so that evidence never attaches to a record that no longer exists.
10. As a co-owner, I want a successfully attached document to appear in the transaction's linked-documents list immediately, so that I can confirm the evidence landed.
11. As a co-owner, I want attaching evidence to clear the transaction's missing-receipt Evidence Exception, so that record readiness reflects reality.
12. As a co-owner, I want to open an attached document from the app and have the link render the receipt, so that I can eyeball the evidence behind any transaction.
13. As a co-owner, I want document links that do not expire, so that a link I open next April still shows the receipt.
14. As a co-owner, I want to delete an attached document, so that a wrong or duplicate receipt doesn't undermine the record it was meant to support.
15. As a co-owner, I want deleting a document to remove the underlying file from storage, so that discarded evidence doesn't accumulate as orphaned blobs I pay for.
16. As a co-owner, I want deleting a transaction to remove its document links, so that no dangling evidence references survive.
17. As a co-owner, I want the app to guarantee that every recorded document points at a file that really exists in storage, so that my evidence binder never contains links that 404 in front of my accountant.
18. As a co-owner, I want my evidence files in a private bucket served only through the worker under unguessable names, so that nothing is exposed to someone without a link and there is no listing surface at all.
19. As a co-owner, I want the Year-End Package to reference evidence by durable URLs, so that an exported snapshot remains defensible years later.
20. As a co-owner, I want the original filename preserved on the document record, so that I can recognize "roof-invoice.pdf" in the binder regardless of its storage name.
21. As a co-owner, I want an opened receipt to render inline in the browser (not force a download), so that eyeballing evidence stays a one-click act.
22. As a co-owner, I want a clean not-found response for a link whose file no longer exists, so that a stale link fails obviously rather than hanging or erroring opaquely.
23. As a developer, I want local dev to use a separate R2 bucket through the identical code path, so that development exercises the real presigned/CORS flow without dev junk landing next to real tax evidence.
24. As a developer, I want the worker project colocated in this repo with its own dev and deploy scripts, so that the read path is versioned, reviewed, and shipped alongside the app that depends on it.
25. As a developer, I want to run the worker locally against the dev bucket while the app runs in dev, so that the full upload-then-read loop is exercisable on my machine.
26. As a developer, I want evidence responses to carry long immutable cache headers, so that repeat views of the same receipt don't re-fetch bytes (keys are unique per upload, so staleness is impossible).
27. As a developer, I want all storage configuration read from environment variables, so that dev and production differ only in credentials.
28. As a developer, I want the app to fail with an obvious configuration error when storage credentials are missing, so that a misconfigured deploy is caught at first upload, not by silent data loss.
29. As a developer, I want the local-disk storage code and its upload directory deleted completely, so that no dead code path suggests disk storage still works.

## Implementation Decisions

All decisions below were settled in a design review and recorded in ADR 0002
("Evidence files on Cloudflare R2 with presigned direct uploads"); consult it for
rationale and rejected alternatives.

- **Storage backend**: Cloudflare R2, accessed via its S3-compatible API. The signing
  client is `aws4fetch` (small, edge-safe) — not the AWS SDK.
- **Upload flow is three steps**:
  1. *Presign* server action: verifies the transaction exists under the property,
     validates the declared content type (PDF or `image/*`) and size (max 20MB), and
     returns a short-lived presigned PUT URL for a freshly generated object key. The
     signature pins content type and content length, so R2 itself rejects a PUT whose
     bytes don't match the declaration.
  2. Browser PUTs the file directly to R2 with the presigned URL.
  3. *Confirm* server action: HEAD-verifies the object exists in the bucket (and
     matches the declared type/size), then inserts the document record and its
     transaction link atomically, denormalizing vendor/date/amount from the
     transaction as the current upload action does.
- **Integrity stance**: no document record may ever point at a missing blob (the
  HEAD-verify guarantees this). The reverse is tolerated: a browser that uploads but
  never confirms leaves an orphan blob; there is deliberately no pending-upload state
  machine and no cleanup sweep.
- **Object keys** are UUID-prefixed sanitized filenames (same scheme as the current
  disk names). The bucket is fully private; unguessable keys are the only access
  control, matching the app's current no-auth posture.
- **Reads go through a colocated Cloudflare Worker**, the bucket's sole public surface.
  It handles GET of an object key via its R2 binding and nothing else: content type
  from the object's stored metadata, inline content disposition with the original
  filename, long immutable cache headers (keys are write-once), 404 for missing
  objects. None of the reference project's archive endpoints (listing, files-by-keys,
  OG embeds) are carried over — the document catalog lives in Postgres.
- The worker follows the reference project's layout: an entry module plus wrangler
  config living directly in this repo, sharing the app's package manifest, with
  scripts for local dev and deploy. Locally it runs alongside the Next dev server,
  bound to the dev bucket; the deployed worker binds the production bucket.
- **Storage URLs**: the document's storage URL is the full worker URL for the object,
  stored as-is on the document record. No signed GETs, no expiry. The existing
  readable-URL passthrough and lease-document pasted links keep one uniform URL shape.
- **Deletes**: unchanged semantics — document record deleted first, then a best-effort
  DeleteObject, deriving the object key from the storage URL's known prefix (the same
  prefix-parse-and-validate approach the disk implementation used).
- **Client orchestration** lives inside the existing evidence-upload hook so both
  consuming surfaces (inbox attach button, evidence sheet form) keep their current
  interfaces and pending/error handling.
- **Configuration**: R2 account ID, access key ID, secret access key, bucket name, and
  the worker's public base URL come from environment variables alongside the existing
  database URL. Dev uses a separate bucket (and locally running worker) with the same
  code path. Buckets need a CORS rule allowing presigned PUTs from their respective
  origins; reads need no CORS since the worker serves plain GETs.
- **Removal**: the filesystem storage module and the public uploads directory are
  deleted completely. Existing local files and rows pointing at them are discarded, not
  migrated (dev-only data).
- **Scope of uploads**: transaction evidence only. Lease documents remain metadata plus
  an optionally pasted external link.

## Testing Decisions

- Good tests here exercise external behavior of pure functions with plain data — the
  established pattern of the existing lib test suites (evidence binder, year-end
  package, rent ledger). No mocking, no network, no DB in unit tests.
- **Single seam**: the upload-policy surface of the new blob-storage module —
  file acceptance (content type, size cap), object-key generation and sanitization,
  storage-URL ↔ object-key derivation (including rejection of URLs outside the known
  prefix), and validation of a HEAD result against the presigned declaration (the
  confirm step's integrity rule).
- The signed HTTP calls (presign/HEAD/DELETE construction, actual R2 round trips), the
  browser PUT flow, and the worker are NOT unit tested. They are verified empirically
  in the running app against the real dev bucket with the worker running locally:
  attach a receipt from both surfaces, watch the Evidence Exception clear, open the
  stored URL and confirm the worker renders it inline with the right content type,
  delete the document, confirm the blob is gone and the URL 404s.
- Existing tests that seed documents with local-disk storage URLs keep passing — they
  treat the URL as opaque data, which remains true.

## Out of Scope

- Authentication, signed GETs, or any read-side access control on the worker. The
  worker gains a check when the app gains auth (deferred in ADR 0002).
- The reference project's archive endpoints on the worker: file listing, files-by-keys
  metadata, OG-embed HTML. The document catalog is Postgres's job.
- File uploads for lease documents or any document type other than transaction
  evidence.
- Migration of existing local-disk files (discarded as dev-only data).
- Orphan-blob cleanup machinery (scheduled sweeps, pending-upload tracking).
- Upload progress bars, multi-file selection, drag-and-drop, or other capture UX
  changes — the existing single-file attach interactions are preserved as-is.
- Image processing (thumbnails, HEIC conversion, compression).
- Provisioning automation for R2 (bucket creation, CORS, tokens are one-time manual
  setup).

## Further Notes

- The reference architecture (epstein-files-browser, vendored under the source-code
  reference directory) stores blobs in R2 and serves them publicly through a Cloudflare
  Worker. We adopt its worker-fronting-R2 read layer (trimmed to file serving only) and
  its repo layout for the worker; its uploads, however, are offline wrangler batch
  scripts, so the runtime presigned upload path here is our own design.
- Vercel's ~4.5MB request-body cap is the forcing constraint that rules out relaying
  bytes through server actions; it is a platform limit, not a Next.js setting.
- One-time manual setup before the feature works: two private R2 buckets (dev, prod),
  an API token scoped to them, a CORS PUT rule per origin, and the deployed worker
  (plus its custom domain, if any) whose base URL feeds the app's configuration.
