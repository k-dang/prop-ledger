import { getYearEndPackageSource } from "@/db/queries";
import {
  buildYearEndPackageSnapshot,
  type PackageScope,
} from "@/lib/year-end-package";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const taxYear = Number(searchParams.get("year"));
  const ownerId = searchParams.get("ownerId");

  if (propertyId === null || !isTaxYear(taxYear)) {
    return new Response("A property and valid tax year are required.", {
      status: 400,
    });
  }

  const source = await getYearEndPackageSource(propertyId);
  if (source === undefined) {
    return new Response("Property not found.", { status: 404 });
  }

  const scope: PackageScope =
    ownerId === null ? { type: "property" } : { type: "owner", ownerId };
  if (
    scope.type === "owner" &&
    !source.owners.some((owner) => owner.id === scope.ownerId)
  ) {
    return new Response("Owner not found for this property.", { status: 404 });
  }

  const snapshot = buildYearEndPackageSnapshot({
    source,
    taxYear,
    scope,
    generatedAt: new Date().toISOString(),
  });
  const filename = `${slug(snapshot.property.name)}-${snapshot.taxYear}-${slug(snapshot.scope.label)}.json`;

  return new Response(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function isTaxYear(value: number) {
  return Number.isInteger(value) && value >= 2000 && value <= 2100;
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "package"
  );
}
