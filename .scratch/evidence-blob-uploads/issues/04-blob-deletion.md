Status: ready-for-agent

# Evidence deletion removes the blob

## Parent

.scratch/evidence-blob-uploads/PRD.md

## What to build

Point the existing deletion flows at R2 so discarded evidence doesn't accumulate as
orphaned blobs. Semantics are unchanged from the disk implementation: document record
deleted first, then a best-effort delete of the underlying file — a failed blob delete
logs and never blocks the record delete.

- Document deletion derives the object key from the stored worker URL (validating the
  known URL prefix, rejecting anything outside it — the same
  prefix-parse-and-validate approach the disk implementation used) and issues a
  DeleteObject against the bucket.
- Deleting a whole transaction keeps its current behavior: document links are removed;
  documents and blobs survive (a receipt can back several ledger rows).
- URL→key derivation edge cases belong to the upload-policy unit seam established in
  issue 03; extend those tests where deletion adds new cases.

## Acceptance criteria

- [ ] Deleting a document removes its row, and the object is gone from the dev bucket
- [ ] The document's worker URL returns 404 after deletion
- [ ] A document whose storage URL is a pasted external link (lease documents) is
      untouched by blob deletion — only worker-prefixed URLs derive a key
- [ ] Blob-delete failure does not block record deletion (best-effort, logged)
- [ ] Deleting a transaction removes its document links and nothing else
- [ ] Tests, typecheck, and lint are green

## Blocked by

- .scratch/evidence-blob-uploads/issues/03-presigned-upload-path.md
