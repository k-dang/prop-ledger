import type { Metadata } from "next";
import { Suspense } from "react";

import { PropertyWorkspace } from "@/components/property-workspace/property-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { getPropertyWorkspace } from "@/db/queries";
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

  return (
    <PropertyWorkspace
      propertyId={propertyId}
      workspace={workspace}
      year={parseTaxYearSearchParam(year)}
    />
  );
}

function PropertySkeleton() {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <Skeleton className="h-32 border" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 border" />
        <Skeleton className="h-64 border" />
      </div>
    </section>
  );
}
