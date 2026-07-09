Status: done

# Provision R2 storage and credentials

## Parent

.scratch/evidence-blob-uploads/PRD.md

## What to build

One-time manual Cloudflare setup that everything downstream depends on. No code in
this repo changes.

- Two **private** R2 buckets: one for dev, one for production. No public access, no
  r2.dev domain — reads will go through the worker (ADR 0002).
- An API token scoped to those buckets with object read/write, yielding the access key
  ID and secret for the S3-compatible API (used for presigned PUTs, HEAD, DELETE).
- A CORS rule on each bucket allowing presigned PUTs from its origin: `PUT` from
  `http://localhost:3000` on the dev bucket, `PUT` from the production app domain on
  the prod bucket. Reads need no CORS.
- Environment variables recorded in `.env.local` alongside `DATABASE_URL`: R2 account
  ID, access key ID, secret access key, dev bucket name, and (once issue 02 exists)
  the worker's public base URL. The same variables must later be set in Vercel for
  production values.

## Acceptance criteria

- [x] Dev and prod buckets exist, both private, with no public bucket domain enabled
- [x] API token works: an S3-API `PUT` and `HEAD` against the dev bucket succeed with
      the recorded credentials
- [x] A browser-context `PUT` from `http://localhost:3000` to a presigned dev-bucket
      URL is not blocked by CORS
- [x] `.env.local` carries the account ID, key pair, and dev bucket name

## Blocked by

None - can start immediately

## Comments

2026-07-08: Setup completed by Kevin and verified end-to-end with a throwaway script
against the dev bucket: signed PUT/HEAD/DELETE succeeded, a presigned PUT via plain
fetch succeeded, a CORS preflight with `Origin: http://localhost:3000` returned
`allow-origin=http://localhost:3000, allow-methods=GET, PUT`, and an unsigned GET was
rejected (bucket private). Test objects were cleaned up. `.env.local` carries
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and
EVIDENCE_BASE_URL. Note: the prod bucket's CORS rule still needs its origin set once
the Vercel domain exists (tracked in Further Notes of the PRD); dev is fully unblocked.

2026-07-08 (later): Decision change — dev and production now share the single
`rental-evidence` bucket (ADR 0002 amended). The separately provisioned prod bucket is
unused and can be deleted from Cloudflare. The remaining CORS follow-up moves to the
shared bucket instead: add the Vercel production origin as an AllowedOrigin alongside
`http://localhost:3000` once the domain exists.
