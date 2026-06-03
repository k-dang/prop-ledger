import type { Metadata } from "next";
import { Suspense } from "react";

import { PropertyWorkspace } from "@/components/property-workspace/property-workspace";
import { getProperty } from "@/db/queries";

export const metadata: Metadata = {
  title: "Property Workspace",
  description: "Review setup readiness for a rental property.",
};

export default function PropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  // `params` and the DB read are both request-time work under Cache Components,
  // so they stream in behind a Suspense boundary.
  return (
    <Suspense fallback={<PropertySkeleton />}>
      <PropertyContent params={params} />
    </Suspense>
  );
}

async function PropertyContent({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getProperty(propertyId);

  return <PropertyWorkspace propertyId={propertyId} property={property} />;
}

function PropertySkeleton() {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="h-32 animate-pulse rounded-md border bg-muted/40" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-md border bg-muted/40" />
        <div className="h-64 animate-pulse rounded-md border bg-muted/40" />
      </div>
    </section>
  );
}
