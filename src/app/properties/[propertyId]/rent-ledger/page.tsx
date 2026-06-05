import type { Metadata } from "next";
import { Suspense } from "react";

import { RentLedgerWorkspace } from "@/components/rent-ledger/rent-ledger-workspace";
import { getPropertyRentLedger } from "@/db/queries";

export const metadata: Metadata = {
  title: "Rent Ledger | Rental Property Workspace",
  description: "Accrual rent charges, payments, and arrears for a property.",
};

const FALLBACK_YEAR = 2026;

export default function RentLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  // `params`, `searchParams`, and the DB read are all request-time work under
  // Cache Components, so they stream in behind a Suspense boundary.
  return (
    <Suspense fallback={<RentLedgerSkeleton />}>
      <RentLedgerContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RentLedgerContent({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const [{ propertyId }, { year }] = await Promise.all([params, searchParams]);
  const ledger = await getPropertyRentLedger(propertyId);

  return (
    <RentLedgerWorkspace
      propertyId={propertyId}
      ledger={ledger}
      year={parseYear(year)}
    />
  );
}

function parseYear(raw: string | undefined): number {
  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100
    ? parsed
    : FALLBACK_YEAR;
}

function RentLedgerSkeleton() {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="h-28 animate-pulse rounded-md border bg-muted/40" />
      <div className="h-40 animate-pulse rounded-md border bg-muted/40" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-md border bg-muted/40" />
        <div className="h-96 animate-pulse rounded-md border bg-muted/40" />
      </div>
    </section>
  );
}
