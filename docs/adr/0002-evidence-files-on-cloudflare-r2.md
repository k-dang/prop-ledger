# Evidence files on Cloudflare R2 with presigned direct uploads

Evidence files (transaction receipts) move from local disk under `public/uploads/` to a
Cloudflare R2 bucket. Local-disk storage cannot survive a Vercel deployment (no writable
persistent filesystem), and Vercel's ~4.5MB request-body cap rules out relaying phone
photos of receipts through server actions. Uploads therefore go **directly from the
browser to R2** via presigned PUT URLs: a server action validates the transaction and
mints a signature that pins content type and size; the browser PUTs the bytes; a confirm
action HEAD-verifies the object exists before inserting the `documents` row.

Reads are served by a **Cloudflare Worker colocated in this repo** (modeled on
epstein-files-browser): the bucket stays fully private, and the worker — reading R2
through a binding — is the sole public read surface, serving objects by key with the
stored content type and long immutable cache headers. `storageUrl` is the worker URL.

Two deliberate choices a future reader will question:

- **The worker serves evidence to anyone with the link.** Tax receipts are readable
  behind UUID-prefixed unguessable keys with no listing endpoint. This is not an
  oversight: the app has no authentication at all, so gating the worker would protect
  nothing today. It matches the exact posture the local-disk implementation had
  (`public/uploads/` + UUID names). When the app gains auth, the worker is the single
  place a read-side check lands.
- **Orphan blobs are tolerated.** A browser that uploads but never confirms leaves an
  unreferenced blob. There is no pending-upload state machine and no cleanup sweep;
  orphans are rare, unguessable, and near-free. The integrity guarantee runs the other
  direction only: no `documents` row may point at a blob that doesn't exist (the
  HEAD-verify in confirm).

## Considered Options

- **Vercel Blob.** Rejected: couples storage to the deploy platform; R2 has zero egress
  fees and matches the reference architecture (epstein-files-browser) this was modeled on.
- **Server-action relay upload.** Rejected: permanently caps receipts at ~4MB on Vercel.
- **Public bucket domain for reads (no worker).** Initially chosen, then replaced by the
  worker read path: same zero-auth posture, but the bucket stays private and a future
  auth check has exactly one home.
- **Presigned GET / app proxy for reads.** Rejected: expiring links would break
  Year-End Package snapshots that reference evidence URLs, and proxying through the app
  pays Vercel function time per read.
- **Worker handles uploads too (PUT via binding, no presigned URLs).** Rejected: until
  the app has auth, that worker would accept writes from anyone on the internet;
  presigned PUTs at least require the server to mint each one.
- **Local-disk driver kept for dev behind a storage interface.** Rejected: two code paths
  that drift, and dev would never exercise the presigned/CORS flow. Dev uses the real
  R2 bucket instead.

## Consequences

- `storageUrl` remains a full URL (now the worker's URL); deletion derives the object
  key from the known URL prefix. Year-End Packages can embed these URLs durably.
- The repo now contains two deployables: the Next.js app (Vercel) and the worker
  (wrangler). Local dev runs both.
- Dev and production share one bucket for now — a deliberate simplification while the
  app is pre-launch (one bucket to provision, one worker config). Dev junk therefore
  lands next to real evidence; split into per-environment buckets when that starts to
  matter, which touches only bucket names in config and env vars.
- Local dev requires R2 credentials in `.env.local`; the app no longer runs
  storage-free.
- The bucket needs CORS rules allowing presigned PUTs from every app origin
  (localhost and the production domain); reads need no CORS since the worker serves
  plain GETs.
- Existing local files and their rows were discarded, not migrated (dev-only data).
