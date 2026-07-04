import { describe, expect, it } from "vitest";
import type { Owner, OwnershipPeriod } from "@/db/schema";
import { createOwnershipPeriodTimeline } from "./ownership-period-timeline";

function makePeriod(
  period: Pick<
    OwnershipPeriod,
    "id" | "ownerId" | "percentage" | "effectiveFrom"
  > &
    Partial<OwnershipPeriod>,
): OwnershipPeriod {
  return { propertyId: "property-1", effectiveTo: null, ...period };
}

const owners: Owner[] = [
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
];

describe("ownership period timeline validation", () => {
  it("accepts valid active ownership allocations at 100 percent", () => {
    const timeline = createOwnershipPeriodTimeline({
      periods: [
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
      ],
    });

    expect(timeline.validate()).toEqual([]);
    expect(
      timeline.coverageForRange({
        activeFrom: "2026-01-01",
        activeTo: "2026-12-31",
      }),
    ).toEqual([]);
  });

  it("rejects overlapping active allocations above 100 percent", () => {
    const timeline = createOwnershipPeriodTimeline({
      periods: [
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
      ],
    });

    expect(timeline.validate()).toContainEqual(
      expect.objectContaining({
        code: "OVER_ALLOCATED",
        date: "2026-03-01",
        totalPercentage: 110,
        periodIds: ["period-1", "period-2"],
      }),
    );
  });

  it("returns coverage gaps with the active period IDs that caused the total", () => {
    const timeline = createOwnershipPeriodTimeline({
      periods: [
        makePeriod({
          id: "period-1",
          ownerId: "owner-1",
          percentage: 100,
          effectiveFrom: "2026-01-01",
          effectiveTo: "2026-06-30",
        }),
        makePeriod({
          id: "period-2",
          ownerId: "owner-2",
          percentage: 50,
          effectiveFrom: "2026-07-01",
        }),
      ],
    });

    expect(
      timeline.coverageForRange({
        activeFrom: "2026-01-01",
        activeTo: "2026-12-31",
      }),
    ).toEqual([
      {
        date: "2026-07-01",
        totalPercentage: 50,
        periodIds: ["period-2"],
      },
    ]);
  });

  it("represents no active periods as zero percent coverage", () => {
    const timeline = createOwnershipPeriodTimeline({ periods: [] });

    expect(
      timeline.coverageForRange({
        activeFrom: "2026-01-01",
        activeTo: "2026-12-31",
      }),
    ).toEqual([
      {
        date: "2026-01-01",
        totalPercentage: 0,
        periodIds: [],
      },
    ]);
  });
});

describe("ownership period timeline owner facts", () => {
  it("sorts periods by start date, end date with open-ended last, and owner ID", () => {
    const timeline = createOwnershipPeriodTimeline({
      periods: [
        makePeriod({
          id: "period-3",
          ownerId: "owner-2",
          percentage: 25,
          effectiveFrom: "2026-01-01",
        }),
        makePeriod({
          id: "period-1",
          ownerId: "owner-1",
          percentage: 50,
          effectiveFrom: "2025-01-01",
        }),
        makePeriod({
          id: "period-2",
          ownerId: "owner-1",
          percentage: 25,
          effectiveFrom: "2026-01-01",
          effectiveTo: "2026-06-30",
        }),
      ],
    });

    expect(timeline.orderedPeriods().map((period) => period.id)).toEqual([
      "period-1",
      "period-2",
      "period-3",
    ]);
  });

  it("surfaces owner names only in owner-facing period facts", () => {
    const timeline = createOwnershipPeriodTimeline({
      owners,
      periods: [
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
    });

    expect(
      timeline.periodsWithOwners().map((period) => period.ownerName),
    ).toEqual(["Avery Chen", "Jordan Patel"]);
    expect(
      timeline.ownerPeriodsForRange({
        activeFrom: "2025-01-01",
        activeTo: "2025-12-31",
      }),
    ).toEqual([
      expect.objectContaining({
        ownerId: "owner-1",
        ownerName: "Avery Chen",
        periods: [expect.objectContaining({ id: "period-1" })],
      }),
      expect.objectContaining({
        ownerId: "owner-2",
        ownerName: "Jordan Patel",
        periods: [expect.objectContaining({ id: "period-2" })],
      }),
    ]);
  });

  it("returns recorded owner share factors without normalization", () => {
    const timeline = createOwnershipPeriodTimeline({
      periods: [
        makePeriod({
          id: "period-1",
          ownerId: "owner-1",
          percentage: 33.33,
          effectiveFrom: "2026-01-01",
        }),
        makePeriod({
          id: "period-2",
          ownerId: "owner-2",
          percentage: 66.67,
          effectiveFrom: "2026-01-01",
        }),
      ],
    });

    expect(timeline.ownerShareFactor("owner-1", "2026-06-01")).toBe(0.3333);
    expect(timeline.ownerShareFactor("missing-owner", "2026-06-01")).toBe(0);
  });
});
