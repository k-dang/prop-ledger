import type { Metadata } from "next";
import { Suspense } from "react";

import { Dashboard } from "@/components/property-workspace/dashboard";
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
  // The portfolio is read fresh from the DB per request, so it streams in
  // behind a Suspense boundary (Cache Components / PPR) rather than blocking
  // the static shell.
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
      <div className="h-140 animate-pulse rounded-md border bg-muted/40" />
      <div className="h-140 animate-pulse rounded-md border bg-muted/40" />
    </div>
  );
}
