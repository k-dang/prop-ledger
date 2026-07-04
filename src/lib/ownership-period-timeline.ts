import type { Owner, OwnershipPeriod } from "@/db/schema";

type TimelineOwner = Pick<Owner, "id" | "name">;

export type OwnershipDateRange = {
  activeFrom: string;
  activeTo: string;
};

export type OwnershipValidationIssue = {
  code: "INVALID_PERCENTAGE" | "INVALID_DATE_RANGE" | "OVER_ALLOCATED";
  message: string;
  date?: string;
  totalPercentage?: number;
  periodIds: string[];
};

export type OwnershipCoverageFinding = {
  date: string;
  totalPercentage: number;
  periodIds: string[];
};

export type OwnershipPeriodWithOwner = OwnershipPeriod & {
  ownerName: string;
};

export type OwnerPeriodsForRange = {
  ownerId: string;
  ownerName: string;
  periods: OwnershipPeriod[];
};

export function createOwnershipPeriodTimeline({
  owners = [],
  periods,
}: {
  owners?: readonly TimelineOwner[];
  periods: readonly OwnershipPeriod[];
}) {
  const orderedPeriods = periods.toSorted(compareOwnershipPeriods);
  const ownersById = new Map(owners.map((owner) => [owner.id, owner]));

  return {
    orderedPeriods() {
      return [...orderedPeriods];
    },
    periodsWithOwners() {
      return orderedPeriods.map((period): OwnershipPeriodWithOwner => {
        const owner = ownersById.get(period.ownerId);

        return {
          ...period,
          ownerName: owner?.name ?? "Unknown owner",
        };
      });
    },
    validate() {
      return validateOrderedPeriods(orderedPeriods);
    },
    coverageForRange(range: OwnershipDateRange) {
      return coverageForRange(orderedPeriods, range);
    },
    totalOnDate(date: string) {
      return totalOnDate(orderedPeriods, date);
    },
    ownerShareFactor(ownerId: string, date: string) {
      return (
        orderedPeriods
          .filter(
            (period) =>
              period.ownerId === ownerId &&
              isOwnershipActiveOnDate(period, date),
          )
          .reduce((total, period) => total + period.percentage, 0) / 100
      );
    },
    ownerPeriodsForRange(range: OwnershipDateRange, ownerId?: string) {
      return ownerPeriodsForRange(
        orderedPeriods,
        owners,
        ownersById,
        range,
        ownerId,
      );
    },
  };
}

function validateOrderedPeriods(
  orderedPeriods: readonly OwnershipPeriod[],
): OwnershipValidationIssue[] {
  const issues: OwnershipValidationIssue[] = [];

  for (const period of orderedPeriods) {
    if (period.percentage <= 0 || period.percentage > 100) {
      issues.push({
        code: "INVALID_PERCENTAGE",
        message: "Ownership share must be greater than 0 and no more than 100.",
        periodIds: [period.id],
      });
    }

    if (
      period.effectiveTo !== null &&
      period.effectiveTo < period.effectiveFrom
    ) {
      issues.push({
        code: "INVALID_DATE_RANGE",
        message: "End date must be on or after the start date.",
        periodIds: [period.id],
      });
    }
  }

  const validPeriods = orderedPeriods.filter(
    (period) =>
      period.percentage > 0 &&
      period.percentage <= 100 &&
      (period.effectiveTo === null ||
        period.effectiveTo >= period.effectiveFrom),
  );

  for (const boundary of getPeriodBoundaries(validPeriods)) {
    const active = totalOnDate(validPeriods, boundary);

    if (active.totalPercentage > 100) {
      issues.push({
        code: "OVER_ALLOCATED",
        message: "Active ownership shares cannot exceed 100 percent.",
        date: boundary,
        totalPercentage: active.totalPercentage,
        periodIds: active.periodIds,
      });
    }
  }

  return issues;
}

function coverageForRange(
  orderedPeriods: readonly OwnershipPeriod[],
  range: OwnershipDateRange,
): OwnershipCoverageFinding[] {
  if (range.activeFrom > range.activeTo) {
    return [];
  }

  return getRangeCheckpoints(orderedPeriods, range).flatMap((checkpoint) => {
    const active = totalOnDate(orderedPeriods, checkpoint);

    return active.totalPercentage === 100
      ? []
      : [
          {
            date: checkpoint,
            totalPercentage: active.totalPercentage,
            periodIds: active.periodIds,
          },
        ];
  });
}

function totalOnDate(
  orderedPeriods: readonly OwnershipPeriod[],
  date: string,
): OwnershipCoverageFinding {
  const activePeriods = orderedPeriods.filter((period) =>
    isOwnershipActiveOnDate(period, date),
  );

  return {
    date,
    totalPercentage: roundShareTotal(
      activePeriods.reduce((total, period) => total + period.percentage, 0),
    ),
    periodIds: activePeriods.map((period) => period.id),
  };
}

function ownerPeriodsForRange(
  orderedPeriods: readonly OwnershipPeriod[],
  owners: readonly TimelineOwner[],
  ownersById: ReadonlyMap<string, TimelineOwner>,
  range: OwnershipDateRange,
  ownerId?: string,
): OwnerPeriodsForRange[] {
  const selectedOwners =
    owners.length > 0
      ? owners
      : Array.from(new Set(orderedPeriods.map((period) => period.ownerId)))
          .toSorted()
          .map((id) => ({ id, name: "Unknown owner" }));
  const filteredOwners =
    ownerId === undefined
      ? selectedOwners
      : selectedOwners.filter((owner) => owner.id === ownerId);

  return filteredOwners.map((owner) => ({
    ownerId: owner.id,
    ownerName: ownersById.get(owner.id)?.name ?? owner.name,
    periods: orderedPeriods.filter(
      (period) => period.ownerId === owner.id && overlapsRange(period, range),
    ),
  }));
}

function getPeriodBoundaries(periods: readonly OwnershipPeriod[]) {
  return Array.from(
    new Set(
      periods.flatMap((period) => {
        const boundaries = [period.effectiveFrom];

        if (period.effectiveTo !== null) {
          boundaries.push(addIsoDays(period.effectiveTo, 1));
        }

        return boundaries;
      }),
    ),
  ).toSorted();
}

function getRangeCheckpoints(
  orderedPeriods: readonly OwnershipPeriod[],
  range: OwnershipDateRange,
) {
  const checkpoints = new Set<string>([range.activeFrom]);

  for (const period of orderedPeriods) {
    if (
      period.effectiveFrom >= range.activeFrom &&
      period.effectiveFrom <= range.activeTo
    ) {
      checkpoints.add(period.effectiveFrom);
    }

    if (period.effectiveTo !== null) {
      const dayAfterEnd = addIsoDays(period.effectiveTo, 1);

      if (dayAfterEnd >= range.activeFrom && dayAfterEnd <= range.activeTo) {
        checkpoints.add(dayAfterEnd);
      }
    }
  }

  return Array.from(checkpoints).toSorted();
}

function isOwnershipActiveOnDate(period: OwnershipPeriod, date: string) {
  return (
    period.effectiveFrom <= date &&
    (period.effectiveTo === null || period.effectiveTo >= date)
  );
}

function overlapsRange(period: OwnershipPeriod, range: OwnershipDateRange) {
  if (range.activeFrom > range.activeTo) {
    return false;
  }

  return (
    period.effectiveFrom <= range.activeTo &&
    (period.effectiveTo === null || period.effectiveTo >= range.activeFrom)
  );
}

function compareOwnershipPeriods(
  left: OwnershipPeriod,
  right: OwnershipPeriod,
) {
  if (left.effectiveFrom !== right.effectiveFrom) {
    return left.effectiveFrom.localeCompare(right.effectiveFrom);
  }

  const leftEnd = left.effectiveTo ?? "9999-12-31";
  const rightEnd = right.effectiveTo ?? "9999-12-31";
  if (leftEnd !== rightEnd) {
    return leftEnd.localeCompare(rightEnd);
  }

  if (left.ownerId !== right.ownerId) {
    return left.ownerId.localeCompare(right.ownerId);
  }

  return left.id.localeCompare(right.id);
}

function addIsoDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);

  return parsed.toISOString().slice(0, 10);
}

function roundShareTotal(total: number) {
  return Math.round(total * 100) / 100;
}
