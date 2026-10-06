import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PropertySetupWizard } from "@/components/property-setup/property-setup-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { emptySetupForm } from "@/lib/property-setup";
import { todayIso } from "@/lib/property-workspace";

export const metadata: Metadata = {
  title: "Add a property | Rental Property Workspace",
  description: "Set up a rental property's owners, units, and leases.",
};

export default function NewPropertyPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 max-w-3xl rounded-xl" />}>
      <NewPropertyContent />
    </Suspense>
  );
}

async function NewPropertyContent() {
  // Validation compares against today, so render per request.
  await connection();

  return (
    <PropertySetupWizard
      propertyId={null}
      initialForm={emptySetupForm()}
      cancelHref="/dashboard"
      today={todayIso()}
    />
  );
}
