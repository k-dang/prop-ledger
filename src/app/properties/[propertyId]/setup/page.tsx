import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PropertySetupWizard } from "@/components/property-setup/property-setup-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { getProperty } from "@/db/queries";
import { setupFormFromProperty } from "@/lib/property-setup";
import { todayIso } from "@/lib/property-workspace";

export const metadata: Metadata = {
  title: "Finish setting up | Rental Property Workspace",
  description: "Finish a rental property's owners, units, and leases.",
};

export default function PropertySetupPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-96 max-w-3xl rounded-xl" />}>
      <PropertySetupContent params={params} />
    </Suspense>
  );
}

async function PropertySetupContent({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getProperty(propertyId);

  if (property === undefined) notFound();

  // No redirect once setup is finished: finishing refreshes this page while
  // lease files are still uploading, and the wizard must stay mounted for that.
  return (
    <PropertySetupWizard
      propertyId={propertyId}
      setupFinished={property.setupDraft === null}
      initialForm={setupFormFromProperty(property)}
      cancelHref={`/properties/${propertyId}`}
      today={todayIso()}
    />
  );
}
