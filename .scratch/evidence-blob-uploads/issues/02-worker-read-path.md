Status: done

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

- [x] Worker project exists in-repo with local-dev and deploy scripts wired into the
      package manifest
- [x] A hand-uploaded PDF fetched through the local worker renders inline in a browser
      with `application/pdf` content type and the original filename in its disposition
- [x] A hand-uploaded image renders inline with its image content type
- [x] Responses carry long immutable cache headers
- [x] A request for a nonexistent key returns 404
- [x] The bucket remains private: the object is unreachable except through the worker

## Blocked by

- .scratch/evidence-blob-uploads/issues/01-provision-r2-storage.md

## Comments

2026-07-08: Built the worker at `worker/index.ts` with config at `wrangler.jsonc`
(repo root), following the epstein-files-browser layout but trimmed to the single
`GET /<object-key>` handler — no listing, files-by-keys, or OG endpoints. Non-GET
methods get a 405. Content type is read from the R2 object's `httpMetadata`
(`application/octet-stream` fallback); the original filename for
`Content-Disposition: inline` is recovered by stripping the UUID prefix from the
object key (keys are `${uuid}-${sanitizedFilename}`, same scheme as the disk-era
`saveEvidenceFile` in `src/lib/evidence-file-storage.ts`). Cache-Control is
`public, max-age=31536000, immutable` on every response, including 404s being plain
(no cache header, so a since-created key isn't stuck 404 in a cache). Added
`worker:dev` (`wrangler dev`) and `worker:deploy` (`wrangler deploy --env production`)
scripts, plus `worker:typecheck`. Added `wrangler` and `@cloudflare/workers-types` as
devDependencies (pnpm, approved the `workerd` postinstall build via
`pnpm approve-builds`). The worker has its own `worker/tsconfig.json` (Cloudflare
Workers types, no DOM lib) and is excluded from the root `tsconfig.json`'s `include`
so `pnpm typecheck` stays app-only; both `pnpm typecheck` and
`pnpm exec tsc -p worker/tsconfig.json` are green. Added `.wrangler/` to
`.gitignore` (worker's local dev state, analogous to `.next/`).

**Verification**: `npx wrangler whoami` showed not logged in and non-interactive, so
I could not do `wrangler login` or `--remote` dev against the real dev bucket.
Verified against wrangler's **local R2 simulation** instead: ran `wrangler dev`
(binds `rental-evidence`, the dev bucket name from `.env.local`'s `R2_BUCKET`), hand-put
a tiny synthetic PDF and a 1x1 PNG into the local bucket with
`wrangler r2 object put --local` under UUID-prefixed keys, then fetched both through
the running worker with curl:
- PDF: `200`, `Content-Type: application/pdf`,
  `Content-Disposition: inline; filename="roof-invoice.pdf"`,
  `Cache-Control: public, max-age=31536000, immutable`; response bytes diffed
  identical to the uploaded file.
- PNG: `200`, `Content-Type: image/png`,
  `Content-Disposition: inline; filename="receipt-photo.png"`, same cache header;
  bytes diffed identical.
- Nonexistent key: `404`.
- `POST` to an existing key: `405`.
- Bucket privacy: R2 buckets have no public domain (per issue 01) and are reachable
  only via a binding (local) or authenticated S3 API — the worker is the only GET
  surface, matching the acceptance criterion structurally even though this run didn't
  touch the real bucket.

Killed the local `wrangler dev` process and removed the `.wrangler/` local state
directory afterward; no dev servers left running. Did not deploy to production
(out of scope for this issue) and did not attempt `wrangler login`.

**Left blocked / needs follow-up**:
- **Wrangler auth**: not logged in and the environment is non-interactive, so I
  couldn't verify against the *real* dev bucket over `--remote`, and can't deploy.
  Whoever has interactive access should run `wrangler login` (or set
  `CLOUDFLARE_API_TOKEN`) and re-verify with `pnpm worker:dev` (add `-- --remote` for
  a real-bucket run) before relying on this for anything beyond local simulation.
- **Production bucket name**: `.env.local` and issue 01 only ever recorded the dev
  bucket name (`rental-evidence`); the prod bucket's name was never captured anywhere
  in the repo. `wrangler.jsonc`'s `env.production.r2_buckets[0].bucket_name` is a
  clearly marked placeholder (`REPLACE_ME_PROD_BUCKET_NAME`) — replace it before ever
  running `pnpm worker:deploy`. *(Resolved 2026-07-08: dev and prod now share the
  single `rental-evidence` bucket — ADR 0002 amended, the `env.production` block and
  placeholder were removed from `wrangler.jsonc`, and `worker:deploy` deploys the
  default environment.)*
- Local dev also picked up `.env.local` automatically (wrangler's default `.env`
  loading) and exposed `DATABASE_URL` and the R2 credentials as plain environment
  variables to the worker process, even though `worker/index.ts` only declares and
  uses `R2_BUCKET` in its `Env` type. Harmless today (nothing reads them, and none of
  this reaches the deployed worker unless configured there), but worth knowing if a
  future change to the worker starts touching `env` more broadly.

2026-07-08 (later): **Real-bucket verification complete** — the wrangler-auth blocker
above is resolved (Kevin ran `wrangler login`). The R2 binding now has `remote: true`
in `wrangler.jsonc`, so plain `pnpm worker:dev` runs the worker locally with the
binding proxied to the real `rental-evidence` bucket (required by the shared-bucket
decision: the app presigns uploads into the real bucket and the local worker must
serve them back). Re-verified everything against the real bucket: uploaded a PDF and
a PNG under UUID-prefixed keys via `wrangler r2 object put --remote`, fetched both
through the local worker — 200, correct content types, `inline` dispositions with
original filenames, immutable cache headers, correct content lengths — plus 404 on a
bogus key and 405 on POST. Test objects deleted and the dev server stopped afterward.
Nothing remains blocked on this issue.
