import "server-only";

import { and, desc, eq } from "drizzle-orm";
import type { Portfolio, RentalProperty } from "@/lib/property-workspace";
import type { RentLedger } from "@/lib/rent-ledger";

import { db } from "./index";
import { accountantNotes, properties, yearEndPackages } from "./schema";

// The relations to hydrate so a property row comes back as a `RentalProperty`
// aggregate. Each relation reads back as its inferred row type, so no mapping
// layer is needed between the query result and the domain shape.
const withProperty = {
  units: true,
  owners: true,
  ownershipPeriods: true,
  ledgerEntries: { with: { splits: true } },
  mortgagePayments: true,
  documents: { with: { links: true } },
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

/**
 * Load the rent ledger for one property as the `RentLedger` aggregate. Leases
 * hang off units in the schema, so they are hydrated through `units` and then
 * flattened — the ledger reasons about a property's leases as one list. Rent
 * events and documents (with their links) come back as their inferred row types,
 * so no mapping layer is needed.
 */
export async function getPropertyRentLedger(
  propertyId: string,
): Promise<RentLedger | undefined> {
  const row = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
    with: {
      units: { with: { leases: true } },
      rentEvents: true,
      documents: { with: { links: true } },
      ledgerEntries: true,
    },
  });

  if (row === undefined) {
    return undefined;
  }

  const { units, rentEvents, documents, ...property } = row;

  return {
    property,
    units,
    leases: units.flatMap((unit) => unit.leases),
    rentEvents,
    documents,
  };
}

export async function getAccountantNotes(propertyId: string, taxYear: number) {
  return db.query.accountantNotes.findMany({
    where: and(
      eq(accountantNotes.propertyId, propertyId),
      eq(accountantNotes.taxYear, taxYear),
    ),
    orderBy: (note, { asc }) => [asc(note.createdAt)],
  });
}

export async function getYearEndPackages(propertyId: string, taxYear: number) {
  return db.query.yearEndPackages.findMany({
    where: and(
      eq(yearEndPackages.propertyId, propertyId),
      eq(yearEndPackages.taxYear, taxYear),
    ),
    with: { owner: true },
    orderBy: [desc(yearEndPackages.createdAt)],
  });
}

export async function getYearEndPackageSource(propertyId: string) {
  return db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
    with: {
      units: true,
      owners: true,
      ownershipPeriods: true,
      ledgerEntries: { with: { splits: true } },
      mortgagePayments: true,
      documents: { with: { links: true } },
      rentEvents: true,
      accountantNotes: true,
    },
  });
}
