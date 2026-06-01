"use client";

import { Home, Trash2 } from "lucide-react";
import Link from "next/link";

import { usePortfolioStore } from "@/components/property-workspace/portfolio-store";
import { useTaxYear } from "@/components/property-workspace/tax-year-store";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEmptyPortfolio,
  type PropertyReadiness,
} from "@/lib/property-workspace";
import { cn } from "@/lib/utils";

export function PortfolioPanel({
  properties,
  taxYear,
}: {
  properties: PropertyReadiness[];
  taxYear: number;
}) {
  const { setTaxYear } = useTaxYear();
  const { portfolio, replacePortfolio } = usePortfolioStore();

  function handleReset() {
    if (!window.confirm("Clear all property setup data from this browser?")) {
      return;
    }

    replacePortfolio(createEmptyPortfolio());
  }

  return (
    <Card className="flex flex-col rounded-md" size="sm">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tax-year" className="text-muted-foreground">
            Tax year
          </Label>
          <Input
            id="tax-year"
            type="number"
            min="2000"
            max="2100"
            value={taxYear}
            onChange={(event) => setTaxYear(Number(event.target.value))}
            className="w-28"
          />
        </div>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>{taxYear} setup readiness</CardDescription>
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
          disabled={portfolio.properties.length === 0}
          className="mt-2"
        >
          <Trash2 data-icon="inline-start" />
          Reset
        </Button>
      </CardContent>
    </Card>
  );
}
