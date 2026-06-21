import type { Metadata } from "next";
import { Suspense } from "react";

import { Dashboard } from "@/components/property-workspace/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { getPortfolio } from "@/db/queries";
import { getPropertyReadiness } from "@/lib/property-workspace";
import {
  getDefaultTaxYear,
  getYearEndDashboardCounts,
} from "@/lib/year-end-readiness";

export const metadata: Metadata = {
  title: "Dashboard | Rental Property Workspace",
  description: "Manage rental property setup readiness and ownership records.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const portfolio = await getPortfolio();
  const taxYear = getDefaultTaxYear();
  const readiness = portfolio.properties.map((property) => ({
    ...getPropertyReadiness(property),
    yearEndCounts: getYearEndDashboardCounts(property, taxYear),
  }));

  return (
    <Dashboard
      readiness={readiness}
      hasProperties={portfolio.properties.length > 0}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Skeleton className="h-140 border" />
      <Skeleton className="h-140 border" />
    </div>
  );
}
