Status: ready-for-agent

# Worker serves evidence from the private bucket

## Parent

.scratch/evidence-blob-uploads/PRD.md

## What to build

The colocated Cloudflare Worker that is the sole public read surface for evidence
files (ADR 0002), modeled on the epstein-files-browser worker's layout (vendored under
the source-code reference directory) but trimmed to file serving only — none of its
archive endpoints (listing, files-by-keys, OG embeds).

- A worker project living in this repo, following the reference layout: an entry
  module plus wrangler config, sharing the app's package manifest, with scripts for
  running it locally and deploying it.
- The worker handles `GET /<object-key>` via its R2 binding and nothing else:
  - content type from the object's stored metadata
  - inline content disposition carrying the original filename
  - long immutable cache headers (object keys are write-once)
  - a clean 404 for keys that don't exist
- Local dev binds the dev bucket so the full upload-then-read loop is exercisable on
  one machine; the deployed worker binds the production bucket.

Verification is empirical (per the PRD's testing decisions — no unit tests for the
worker): hand-put a PDF and an image into the dev bucket with wrangler, fetch each
through the locally running worker, and confirm inline rendering, headers, and 404
behavior.

## Acceptance criteria

- [ ] Worker project exists in-repo with local-dev and deploy scripts wired into the
      package manifest
- [ ] A hand-uploaded PDF fetched through the local worker renders inline in a browser
      with `application/pdf` content type and the original filename in its disposition
- [ ] A hand-uploaded image renders inline with its image content type
- [ ] Responses carry long immutable cache headers
- [ ] A request for a nonexistent key returns 404
- [ ] The bucket remains private: the object is unreachable except through the worker

## Blocked by

- .scratch/evidence-blob-uploads/issues/01-provision-r2-storage.md
