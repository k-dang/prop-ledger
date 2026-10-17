import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RentalProperty } from "@/lib/property-workspace";
import { cn } from "@/lib/utils";

export function PackageExportPanel({
  property,
  year,
}: {
  property: RentalProperty;
  year: number;
}) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <div>
          <CardTitle as="h2">Year-end packages</CardTitle>
          <CardDescription>
            Download a JSON snapshot for the full property or an individual
            owner. Each download reflects the current records.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <PackageGenerationForms property={property} year={year} />
      </CardContent>
    </Card>
  );
}

function PackageGenerationForms({
  property,
  year,
}: {
  property: RentalProperty;
  year: number;
}) {
  const targets = [
    { id: null, label: "Full-property package" },
    ...property.owners.map((owner) => ({
      id: owner.id,
      label: `${owner.name} package`,
    })),
  ];

  return (
    <div className="grid content-start gap-2 rounded-md border p-4">
      <p className="font-medium text-sm">Download package</p>
      {targets.map((target) => (
        <a
          key={target.id ?? "property"}
          href={packageDownloadHref(property.id, year, target.id)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-start rounded-md",
          )}
        >
          <Download data-icon="inline-start" aria-hidden="true" />
          {target.label}
        </a>
      ))}
    </div>
  );
}

function packageDownloadHref(
  propertyId: string,
  year: number,
  ownerId: string | null,
) {
  const params = new URLSearchParams({ propertyId, year: String(year) });
  if (ownerId !== null) params.set("ownerId", ownerId);
  return `/year-end/packages?${params.toString()}`;
}
