"use client";

import { Home, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resetPortfolio } from "@/lib/actions";
import type { PropertyReadiness } from "@/lib/property-workspace";
import { cn } from "@/lib/utils";
import type { YearEndDashboardCounts } from "@/lib/year-end-readiness";

export type DashboardPropertyReadiness = PropertyReadiness & {
  yearEndCounts: YearEndDashboardCounts;
};

export function PortfolioPanel({
  properties,
  hasProperties,
}: {
  properties: DashboardPropertyReadiness[];
  hasProperties: boolean;
}) {
  const [isResetting, startReset] = useTransition();

  function handleReset() {
    if (!window.confirm("Clear all property setup data?")) {
      return;
    }

    startReset(async () => {
      await resetPortfolio();
    });
  }

  return (
    <Card className="flex flex-col rounded-md" size="sm">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Setup readiness</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {properties.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/40 p-4">
            <p className="font-medium text-sm">No properties yet</p>
            <p className="mt-1 text-muted-foreground text-sm">
              Create the first rental property workspace.
            </p>
          </div>
        ) : (
          properties.map((property) => (
            <Link
              href={`/properties/${property.propertyId}`}
              key={property.propertyId}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-auto w-full justify-start rounded-md border px-3 py-3 text-left",
                "bg-background",
              )}
            >
              <span className="flex w-full min-w-0 items-center gap-3">
                <Home className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {property.propertyName}
                  </span>
                  <span className="block text-muted-foreground text-xs">
                    {property.completedCount}/{property.totalCount} checks
                  </span>
                  <span className="mt-2 grid gap-1 text-xs">
                    <span className="flex flex-wrap gap-1">
                      <ExceptionBadge
                        label="uncat"
                        value={property.yearEndCounts.uncategorizedTransactions}
                      />
                      <ExceptionBadge
                        label="receipts"
                        value={property.yearEndCounts.missingReceipts}
                      />
                      <ExceptionBadge
                        label="capital"
                        value={property.yearEndCounts.capitalAssetTransactions}
                      />
                    </span>
                    <span className="text-muted-foreground">
                      {property.yearEndCounts.taxYear} year-end counts
                    </span>
                  </span>
                </span>
                <Badge
                  variant={property.setupGapCount === 0 ? "default" : "outline"}
                  className={cn(
                    "shrink-0 rounded-md",
                    property.setupGapCount === 0
                      ? "bg-emerald-700"
                      : "border-amber-300 bg-amber-50 text-amber-800",
                  )}
                >
                  {property.readinessPercent}%
                </Badge>
              </span>
            </Link>
          ))
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={!hasProperties || isResetting}
          className="mt-2"
        >
          <Trash2 data-icon="inline-start" />
          Reset
        </Button>
      </CardContent>
    </Card>
  );
}

function ExceptionBadge({ label, value }: { label: string; value: number }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md",
        value === 0
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-300 bg-amber-50 text-amber-900",
      )}
    >
      {value} {label}
    </Badge>
  );
}
