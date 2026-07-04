import { describe, expect, it } from "vitest";

import {
  getPropertyReadiness,
  type OwnershipPeriod,
  type RentalProperty,
} from "./property-workspace";

// Ownership periods are full schema rows now; this fills the columns the
// validation logic doesn't read (`propertyId`) and the open-ended default.
function makePeriod(
  period: Pick<
    OwnershipPeriod,
    "id" | "ownerId" | "percentage" | "effectiveFrom"
  > &
    Partial<OwnershipPeriod>,
): OwnershipPeriod {
  return { propertyId: "property-1", effectiveTo: null, ...period };
}

const baseProperty: RentalProperty = {
  id: "property-1",
  name: "King Street Duplex",
  line1: "100 King Street W",
  line2: null,
  municipality: "Hamilton",
  province: "ON",
  postalCode: "L8P 1A1",
  acquisitionDate: "2021-04-15",
  createdAt: new Date("2021-04-15T00:00:00.000Z"),
  units: [
    {
      id: "unit-1",
      propertyId: "property-1",
      label: "Upper",
      unitType: "Apartment",
    },
  ],
  owners: [
    {
      id: "owner-1",
      propertyId: "property-1",
      name: "Avery Chen",
    },
    {
      id: "owner-2",
      propertyId: "property-1",
      name: "Jordan Patel",
    },
  ],
  ownershipPeriods: [],
  ledgerEntries: [],
  mortgagePayments: [],
  documents: [],
};

describe("property setup readiness", () => {
  it("surfaces setup gaps for units, owners, and ownership", () => {
    const readiness = getPropertyReadiness({
      ...baseProperty,
      units: [],
      owners: [],
      ownershipPeriods: [],
    });

    expect(readiness.readinessPercent).toBe(25);
    expect(readiness.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "units", status: "missing" }),
        expect.objectContaining({ id: "owners", status: "missing" }),
        expect.objectContaining({ id: "ownership", status: "missing" }),
      ]),
    );
  });

  it("uses acquisition date for mid-year ownership readiness", () => {
    const readiness = getPropertyReadiness({
      ...baseProperty,
      acquisitionDate: "2026-07-01",
      ownershipPeriods: [
        makePeriod({
          id: "period-1",
          ownerId: "owner-1",
          percentage: 100,
          effectiveFrom: "2026-07-01",
        }),
      ],
    });

    expect(readiness.readinessPercent).toBe(100);
    expect(readiness.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ownership",
          status: "complete",
          detail: "Shares total 100% on July 1.",
        }),
      ]),
    );
  });
});
