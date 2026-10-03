import { describe, expect, it } from "vitest";
import type { RentalProperty } from "./property-workspace";
import { getFilingReadiness } from "./year-end-readiness-view-model";

function property(overrides: Partial<RentalProperty> = {}): RentalProperty {
  return {
    id: "property-1",
    name: "King Street Duplex",
    line1: "100 King Street W",
    line2: null,
    municipality: "Hamilton",
    province: "ON",
    postalCode: "L8P 1A1",
    acquisitionDate: "2020-01-01",
    createdAt: new Date("2020-01-01T00:00:00Z"),
    units: [
      {
        id: "unit-1",
        propertyId: "property-1",
        label: "Main",
        unitType: "Apartment",
      },
    ],
    owners: [{ id: "owner-1", propertyId: "property-1", name: "Kevin" }],
    ownershipPeriods: [
      {
        id: "period-1",
        propertyId: "property-1",
        ownerId: "owner-1",
        percentage: 100,
        effectiveFrom: "2020-01-01",
        effectiveTo: null,
      },
    ],
    ledgerEntries: [],
    mortgagePayments: [],
    documents: [],
    ...overrides,
  };
}

describe("shared filing readiness", () => {
  it("gives every surface the same findings, status and counts", () => {
    const incomplete = property({ units: [], ownershipPeriods: [] });
    for (const surface of ["property", "portfolio", "year-end"] as const) {
      const result = getFilingReadiness(incomplete, 2026, surface);
      expect(result.status).toBe("blocked");
      expect(result.counts).toEqual({ blocking: 1, warning: 0, clear: 3 });
      expect(result.openExceptionCount).toBe(2);
      expect(result.rows.map((row) => row.id)).toEqual([
        "property_setup",
        "uncategorized_transactions",
        "missing_documents",
        "capital_assets",
      ]);
    }
  });

  it("keeps year-specific ownership warnings separate from completed setup", () => {
    const incompleteYear = property({
      ownershipPeriods: [
        {
          id: "period-1",
          propertyId: "property-1",
          ownerId: "owner-1",
          percentage: 100,
          effectiveFrom: "2020-01-01",
          effectiveTo: "2026-06-30",
        },
      ],
    });
    const result = getFilingReadiness(incompleteYear, 2026, "year-end");
    expect(result.status).toBe("needs_review");
    expect(result.counts).toEqual({ blocking: 0, warning: 1, clear: 4 });
    expect(
      result.rows.find((row) => row.id === "ownership_allocations"),
    ).toMatchObject({
      count: 1,
      href: "/properties/property-1?year=2026#ownership-history",
      detail: "Ownership shares total 0% on July 1.",
    });
  });

  it("marks complete records ready on every surface", () => {
    for (const surface of ["property", "portfolio", "year-end"] as const) {
      expect(getFilingReadiness(property(), 2026, surface)).toMatchObject({
        status: "ready",
        openExceptionCount: 0,
        counts: { blocking: 0, warning: 0, clear: 5 },
      });
    }
  });
});
