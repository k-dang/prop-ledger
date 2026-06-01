import { describe, expect, it } from "vitest";

import { parseStoredPortfolio } from "./property-workspace-storage";

describe("stored portfolio parsing", () => {
  it("normalizes nested portfolio records before trusting stored JSON", () => {
    const storedPortfolio = parseStoredPortfolio(
      JSON.stringify({
        properties: [
          {
            id: "property-1",
            name: "King Street Duplex",
            address: {
              line1: "100 King Street W",
              municipality: "Hamilton",
              province: "ON",
              postalCode: "L8P 1A1",
            },
            acquisitionDate: "2026-01-01",
            hasPersonalUse: true,
            hasShortTermRental: false,
            units: [{ id: "unit-1", label: "Upper", unitType: "Apartment" }],
            owners: [
              { id: "owner-1", name: "Avery Chen" },
              { id: "invalid-owner" },
            ],
            ownershipPeriods: [
              {
                id: "period-1",
                ownerId: "owner-1",
                percentage: 100,
                effectiveFrom: "2026-01-01",
              },
              {
                id: "invalid-period",
                ownerId: "owner-1",
                percentage: "100",
                effectiveFrom: "2026-01-01",
              },
            ],
          },
        ],
      }),
    );

    expect(storedPortfolio.properties).toHaveLength(1);
    expect(storedPortfolio.properties[0]).toEqual(
      expect.objectContaining({
        id: "property-1",
        hasPersonalUse: true,
        owners: [{ id: "owner-1", name: "Avery Chen", email: undefined }],
        ownershipPeriods: [
          {
            id: "period-1",
            ownerId: "owner-1",
            percentage: 100,
            effectiveFrom: "2026-01-01",
            effectiveTo: undefined,
          },
        ],
      }),
    );
  });
});
