import { describe, expect, it } from "vitest";

import {
  canAddOwnershipPeriod,
  getOwnershipHistory,
  getOwnershipTotalOnDate,
  getPropertyReadiness,
  type OwnershipPeriod,
  type RentalProperty,
  validateOwnershipPeriods,
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

describe("ownership period validation", () => {
  it("accepts valid active ownership allocations at 100 percent", () => {
    const periods = [
      makePeriod({
        id: "period-1",
        ownerId: "owner-1",
        percentage: 50,
        effectiveFrom: "2026-01-01",
      }),
      makePeriod({
        id: "period-2",
        ownerId: "owner-2",
        percentage: 50,
        effectiveFrom: "2026-01-01",
      }),
    ];

    expect(validateOwnershipPeriods(periods)).toEqual([]);
    expect(canAddOwnershipPeriod([periods[0]], periods[1]).ok).toBeTruthy();
  });

  it("rejects overlapping active allocations above 100 percent", () => {
    const periods = [
      makePeriod({
        id: "period-1",
        ownerId: "owner-1",
        percentage: 60,
        effectiveFrom: "2026-01-01",
      }),
      makePeriod({
        id: "period-2",
        ownerId: "owner-2",
        percentage: 50,
        effectiveFrom: "2026-03-01",
      }),
    ];

    const result = canAddOwnershipPeriod([periods[0]], periods[1]);

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "OVER_ALLOCATED",
        date: "2026-03-01",
        totalPercentage: 110,
      }),
    );
  });

  it("supports ownership changes inside a tax year without over-allocation", () => {
    const property: RentalProperty = {
      ...baseProperty,
      ownershipPeriods: [
        makePeriod({
          id: "period-1",
          ownerId: "owner-1",
          percentage: 100,
          effectiveFrom: "2025-01-01",
          effectiveTo: "2025-06-30",
        }),
        makePeriod({
          id: "period-2",
          ownerId: "owner-2",
          percentage: 100,
          effectiveFrom: "2025-07-01",
        }),
      ],
    };

    const history = getOwnershipHistory(property);

    expect(history).toHaveLength(2);
    expect(history.map((period) => period.ownerName)).toEqual([
      "Avery Chen",
      "Jordan Patel",
    ]);
    expect(
      getOwnershipTotalOnDate(property.ownershipPeriods, "2025-06-30"),
    ).toBe(100);
    expect(
      getOwnershipTotalOnDate(property.ownershipPeriods, "2025-07-01"),
    ).toBe(100);
    expect(validateOwnershipPeriods(property.ownershipPeriods)).toEqual([]);
  });
});

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
