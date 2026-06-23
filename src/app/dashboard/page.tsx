import type { Metadata } from "next";
import { Suspense } from "react";

import { Dashboard } from "@/components/property-workspace/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { getPortfolioDashboardSource } from "@/db/queries";
import {
  buildPortfolioDashboard,
  isValidTaxYear,
} from "@/lib/portfolio-dashboard";
import { getDefaultTaxYear } from "@/lib/year-end-readiness";

export const metadata: Metadata = {
  title: "Dashboard | Rental Property Workspace",
  description: "Manage rental property setup readiness and ownership records.",
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
  const taxYear = parseYear(year);

  return <Dashboard summary={buildPortfolioDashboard(properties, taxYear)} />;
}

function DashboardSkeleton() {
  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-56" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["income", "payments", "expenses", "net"].map((metric) => (
          <Skeleton className="h-36 border" key={metric} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Skeleton className="h-96 border" />
        <Skeleton className="h-96 border" />
      </div>
      <Skeleton className="h-80 border" />
    </section>
  );
}

function parseYear(raw: string | undefined) {
  const parsed = Number(raw);

  return isValidTaxYear(parsed) ? parsed : getDefaultTaxYear();
}
