import type { Metadata } from "next";
import { Suspense } from "react";
import { CapitalRegister } from "@/components/capital-assets/capital-register";
import { Skeleton } from "@/components/ui/skeleton";
import { getPortfolio } from "@/db/queries";

export const metadata: Metadata = {
  title: "Year-End | Rental Property Workspace",
  description: "Marked capital asset transactions for year-end packages.",
};

const FALLBACK_YEAR = 2026;

export default function YearEndPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; year?: string }>;
}) {
  return (
    <Suspense fallback={<YearEndSkeleton />}>
      <YearEndContent searchParams={searchParams} />
    </Suspense>
  );
}

function YearEndSkeleton() {
  return (
    <section className="grid gap-4">
      <div className="rounded-md border p-6">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>

      <div className="rounded-md border p-6">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="mt-6 grid gap-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
    </section>
  );
}

async function YearEndContent({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; year?: string }>;
}) {
  const [{ propertyId, year }, portfolio] = await Promise.all([
    searchParams,
    getPortfolio(),
  ]);
  const property =
    portfolio.properties.find((candidate) => candidate.id === propertyId) ??
    portfolio.properties[0];

  if (property === undefined) {
    return (
      <section className="rounded-md border border-dashed bg-muted/40 p-4 text-muted-foreground text-sm">
        Add a property before reviewing year-end capital asset transactions.
      </section>
    );
  }

  return <CapitalRegister property={property} year={parseYear(year)} />;
}

function parseYear(raw: string | undefined): number {
  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100
    ? parsed
    : FALLBACK_YEAR;
}
