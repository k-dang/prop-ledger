# Rental Property Workspace

A Next.js app for recording rental-property income, expenses, ownership and
supporting documents, with portfolio review and year-end JSON packages.
See [PRODUCT.md](PRODUCT.md) for the product brief and [CONTEXT.md](CONTEXT.md)
for current domain terminology.

## Local development

Use pnpm for project commands. Node.js 24+ and the `portless` CLI are required
for the development URL.

```powershell
pnpm install
portless rental pnpm dev
```

Open `https://rental.localhost`. Portless manages the underlying Next.js port.

Set `DATABASE_URL` in `.env.local` to a development Neon/Postgres connection
string. Do not apply migrations or mutate production without authorization.

## Evidence uploads

Uploads go directly from the browser to R2, followed by server verification and
record linking. Configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_BUCKET` and `EVIDENCE_BASE_URL` in `.env.local`
when using uploads. For the local worker below, use
`EVIDENCE_BASE_URL=https://rental-evidence.localhost`.

Start the evidence read worker in another terminal:

```powershell
portless rental-evidence pnpm worker:dev
```

The bucket must allow presigned PUT requests from the app origin through CORS.
The current Worker configuration uses a remote bucket shared with production;
local upload and deletion operations therefore touch that bucket. See
[ADR 0002](docs/adr/0002-evidence-files-on-cloudflare-r2.md) for the storage design.

## Checks

```powershell
pnpm verify
pnpm build
```

`verify` runs Biome, app and Worker TypeScript checks, and Vitest. Tests exercise
calculation rules, package generation, readiness and upload behavior without
connecting to the database or R2.

## Database changes

The Drizzle schema is in `src/db/schema.ts`; migrations are in `drizzle/`.
`pnpm db:generate` creates migration files locally. `pnpm db:migrate` applies
them to the configured database, so check the target before running it.

## Code layout

- `src/app/`: routes and page composition.
- `src/components/`: feature interfaces and shared UI primitives.
- `src/lib/`: server actions, calculations, readiness and shared helpers.
- `src/db/`: schema, connection and cached queries.
- `worker/`: evidence-file reads from R2.

Setup, rent and transaction modules own their actions and error feedback.
Dashboard, property and year-end use the same filing-readiness checklist.
Year-end downloads capture current records; packages are not archived in the app.
