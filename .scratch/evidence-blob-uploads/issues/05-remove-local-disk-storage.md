Status: ready-for-agent

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

- [ ] No filesystem read/write/unlink code remains in evidence storage; the module is
      gone, not stubbed
- [ ] No evidence uploads directory exists under the public directory
- [ ] No document row carries a local-disk storage URL
- [ ] The app builds and runs with no reference to the old path; attach, view, and
      delete evidence flows still work end-to-end against the dev bucket
- [ ] Tests, typecheck, and lint are green

## Blocked by

- .scratch/evidence-blob-uploads/issues/03-presigned-upload-path.md
- .scratch/evidence-blob-uploads/issues/04-blob-deletion.md
