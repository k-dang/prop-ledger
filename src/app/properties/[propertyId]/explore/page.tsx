import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import { Suspense } from "react";

import { WorkspaceExplorer } from "@/components/property-workspace/explore/explorer";
import type { ExploreModel } from "@/components/property-workspace/explore/model";
import { Skeleton } from "@/components/ui/skeleton";
import { getProperty } from "@/db/queries";
import {
  getOwnershipHistory,
  getPropertyReadiness,
} from "@/lib/property-workspace";
import { cn } from "@/lib/utils";

// Source Serif 4 backs Direction A ("Working Papers") only — a serif/sans contrast
// pairing against Inter. Exposed as a CSS variable so the variant can opt in
// without changing the app-wide --font-sans.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Explore designs | Property Workspace",
  description: "Prototype design directions for the per-property workspace.",
};

export default function ExplorePage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  return (
    <div className={cn(sourceSerif.variable)}>
      <Suspense fallback={<ExploreSkeleton />}>
        <ExploreContent params={params} />
      </Suspense>
    </div>
  );
}

async function ExploreContent({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getProperty(propertyId);

  if (property === undefined) {
    return (
      <p className="text-muted-foreground text-sm">
        No property matches {propertyId}.
      </p>
    );
  }

  const model: ExploreModel = {
    property: {
      id: property.id,
      name: property.name,
      line1: property.line1,
      municipality: property.municipality,
      province: property.province,
      postalCode: property.postalCode,
      acquisitionDate: property.acquisitionDate,
    },
    readiness: getPropertyReadiness(property),
    counts: {
      units: property.units.length,
      owners: property.owners.length,
      ownershipPeriods: property.ownershipPeriods.length,
      documents: property.documents.length,
      ledgerEntries: property.ledgerEntries.length,
      mortgagePayments: property.mortgagePayments.length,
    },
    units: property.units.map((unit) => ({
      id: unit.id,
      label: unit.label,
      unitType: unit.unitType,
    })),
    ownership: getOwnershipHistory(property).map((period) => ({
      id: period.id,
      ownerName: period.ownerName,
      ownerEmail: period.ownerEmail,
      percentageLabel: period.percentageLabel,
      dateRange: period.dateRange,
    })),
  };

  return <WorkspaceExplorer model={model} />;
}

function ExploreSkeleton() {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-40 border" />
      <Skeleton className="h-72 border" />
    </section>
  );
}
