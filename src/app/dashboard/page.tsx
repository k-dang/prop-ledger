import type { Metadata } from "next";
import { Suspense } from "react";
import { Dashboard } from "@/components/property-workspace/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { getPortfolioDashboardSource } from "@/db/queries";
import { buildPortfolioDashboard } from "@/lib/portfolio-dashboard";
import { parseTaxYearSearchParam } from "@/lib/tax-year";

export const metadata: Metadata = {
  title: "Portfolio | Rental Property Workspace",
  description: "Filing readiness and financials across every property.",
};

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const [{ year }, properties] = await Promise.all([
    searchParams,
    getPortfolioDashboardSource(),
  ]);
  const taxYear = parseTaxYearSearchParam(year);

  return <Dashboard summary={buildPortfolioDashboard(properties, taxYear)} />;
}

function DashboardSkeleton() {
  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-56" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-13 rounded-xl" />
    </section>
  );
}
