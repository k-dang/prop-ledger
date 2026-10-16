import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PropertyWorkspaceDetail } from "@/components/property-workspace/property-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { getPropertyWorkspace } from "@/db/queries";
import { todayIso } from "@/lib/property-workspace";
import { parseTaxYearSearchParam } from "@/lib/tax-year";

export const metadata: Metadata = {
  title: "Property Workspace",
  description: "Review setup readiness for a rental property.",
};

export default function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  // `params` and the DB read are both request-time work under Cache Components,
  // so they stream in behind a Suspense boundary.
  return (
    <Suspense fallback={<PropertySkeleton />}>
      <PropertyContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PropertyContent({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  const [{ propertyId }, { year }] = await Promise.all([params, searchParams]);
  const workspace = await getPropertyWorkspace(propertyId);

  if (workspace === undefined) notFound();
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PropertyWorkspaceDetail
        property={workspace.property}
        rentLedger={workspace.rentLedger}
        year={parseTaxYearSearchParam(year)}
        today={todayIso()}
      />
    </section>
  );
}

function PropertySkeleton() {
  return (
    <section
      className="flex min-w-0 flex-col gap-4"
      role="status"
      aria-busy="true"
      aria-label="Loading property workspace"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-11 w-20 sm:h-9" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <Skeleton className="h-20 rounded-none" />
        <Skeleton className="h-24 rounded-none border-t" />
      </div>
      <div className="grid gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 border" />
        <Skeleton className="h-64 border" />
      </div>
      <span className="sr-only">Loading property workspace…</span>
    </section>
  );
}
