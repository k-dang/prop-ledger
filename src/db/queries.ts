import "server-only";

import { eq } from "drizzle-orm";

import type { Portfolio, RentalProperty } from "@/lib/property-workspace";

import { db } from "./index";
import { properties } from "./schema";

// The relations to hydrate so a property row comes back as a `RentalProperty`
// aggregate. Each relation reads back as its inferred row type, so no mapping
// layer is needed between the query result and the domain shape.
const withProperty = {
  units: true,
  owners: true,
  ownershipPeriods: true,
  capitalAssets: true,
  taxYears: { with: { cca: true } },
} as const;

export async function getPortfolio(): Promise<Portfolio> {
  const rows = await db.query.properties.findMany({
    with: withProperty,
    orderBy: (property, { asc }) => [asc(property.createdAt)],
  });

  return { properties: rows };
}

export async function getProperty(
  id: string,
): Promise<RentalProperty | undefined> {
  return db.query.properties.findFirst({
    where: eq(properties.id, id),
    with: withProperty,
  });
}
