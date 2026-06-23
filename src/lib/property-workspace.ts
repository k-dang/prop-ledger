import type {
  NewOwner,
  NewOwnershipPeriod,
  NewProperty,
  NewUnit,
  Owner,
  OwnershipPeriod,
  Property,
  Unit,
} from "@/db/schema";
import type { LedgerEntryWithSplits } from "./allocations";
import type { DocumentWithLinks } from "./evidence-binder";
import type { MortgagePayment } from "./mortgage-payments";

export type { OwnershipPeriod };
export type RentalUnit = Unit;
export type PropertyOwner = Owner;

/**
 * Form inputs for the create/add server actions: the insert shapes minus the
 * columns the database fills in (`id`, `createdAt`) and the `propertyId` the
 * action supplies from context. Components build these; `src/lib/actions.ts`
 * writes them straight through.
 */
export type NewPropertyInput = Omit<NewProperty, "id" | "createdAt">;
export type NewUnitInput = Omit<NewUnit, "id" | "propertyId">;
export type NewOwnerInput = Omit<NewOwner, "id" | "propertyId">;
export type NewOwnershipPeriodInput = Omit<
  NewOwnershipPeriod,
  "id" | "propertyId"
>;
export type NewOwnerWithOwnershipInput = NewOwnerInput &
  Pick<NewOwnershipPeriodInput, "percentage" | "effectiveFrom" | "effectiveTo">;

/**
 * A rental property loaded as an aggregate: the property row plus its related
 * collections. The address lives flat on the row (`line1`, `municipality`, …) and
 * optional columns read back as `null`, matching the database schema.
 */
export type RentalProperty = Property & {
  units: Unit[];
  owners: Owner[];
  ownershipPeriods: OwnershipPeriod[];
  ledgerEntries: LedgerEntryWithSplits[];
  mortgagePayments: MortgagePayment[];
  documents: DocumentWithLinks[];
};

export type Portfolio = {
  properties: RentalProperty[];
};

export type OwnershipValidationIssue = {
  code: "INVALID_PERCENTAGE" | "INVALID_DATE_RANGE" | "OVER_ALLOCATED";
  message: string;
  date?: string;
  totalPercentage?: number;
  periodIds: string[];
};

export type SetupTask = {
  id: "property-details" | "units" | "owners" | "ownership";
  label: string;
  status: "complete" | "missing" | "warning";
  detail: string;
};

export type PropertyReadiness = {
  propertyId: string;
  propertyName: string;
  readinessPercent: number;
  completedCount: number;
  totalCount: number;
  setupGapCount: number;
  tasks: SetupTask[];
};

export function canAddOwnershipPeriod(
  existingPeriods: OwnershipPeriod[],
  nextPeriod: OwnershipPeriod,
) {
  const issues = validateOwnershipPeriods([...existingPeriods, nextPeriod]);

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function validateOwnershipPeriods(
  periods: OwnershipPeriod[],
): OwnershipValidationIssue[] {
  const issues: OwnershipValidationIssue[] = [];

  for (const period of periods) {
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

  const validPeriods = periods.filter(
    (period) =>
      period.percentage > 0 &&
      period.percentage <= 100 &&
      (period.effectiveTo === null ||
        period.effectiveTo >= period.effectiveFrom),
  );

  for (const boundary of getPeriodBoundaries(validPeriods)) {
    const activePeriods = validPeriods.filter((period) =>
      isOwnershipActiveOnDate(period, boundary),
    );
    const totalPercentage = roundShareTotal(
      activePeriods.reduce((total, period) => total + period.percentage, 0),
    );

    if (totalPercentage > 100) {
      issues.push({
        code: "OVER_ALLOCATED",
        message: "Active ownership shares cannot exceed 100 percent.",
        date: boundary,
        totalPercentage,
        periodIds: activePeriods.map((period) => period.id),
      });
    }
  }

  return issues;
}

function getSortedOwnershipPeriods(property: RentalProperty) {
  return property.ownershipPeriods.toSorted((a, b) => {
    if (a.effectiveFrom !== b.effectiveFrom) {
      return a.effectiveFrom.localeCompare(b.effectiveFrom);
    }

    return a.ownerId.localeCompare(b.ownerId);
  });
}

export function getOwnershipHistory(property: RentalProperty) {
  const ownersById = new Map(property.owners.map((owner) => [owner.id, owner]));

  return getSortedOwnershipPeriods(property).map((period) => {
    const owner = ownersById.get(period.ownerId);

    return {
      ...period,
      ownerName: owner?.name ?? "Unknown owner",
      ownerEmail: owner?.email ?? null,
      dateRange: formatDateRange(period.effectiveFrom, period.effectiveTo),
      percentageLabel: `${formatPercent(period.percentage)}%`,
    };
  });
}

export function getOwnershipTotalOnDate(
  periods: OwnershipPeriod[],
  date: string,
) {
  return roundShareTotal(
    periods
      .filter((period) => isOwnershipActiveOnDate(period, date))
      .reduce((total, period) => total + period.percentage, 0),
  );
}

export function getPropertyReadiness(
  property: RentalProperty,
): PropertyReadiness {
  const ownershipPeriods = getSortedOwnershipPeriods(property);
  const ownershipIssues = validateOwnershipPeriods(ownershipPeriods);
  const ownershipCoverageDate = property.acquisitionDate;
  const ownershipTotalAtCoverageDate = getOwnershipTotalOnDate(
    ownershipPeriods,
    ownershipCoverageDate,
  );
  const hasPropertyDetails =
    property.name.trim().length > 0 &&
    property.line1.trim().length > 0 &&
    property.municipality.trim().length > 0 &&
    property.province.trim().length > 0 &&
    property.postalCode.trim().length > 0 &&
    property.acquisitionDate.trim().length > 0;
  const hasOwnershipSetup =
    ownershipPeriods.length > 0 &&
    ownershipIssues.length === 0 &&
    ownershipTotalAtCoverageDate === 100;

  const tasks: SetupTask[] = [
    {
      id: "property-details",
      label: "Property details",
      status: hasPropertyDetails ? "complete" : "missing",
      detail: hasPropertyDetails
        ? "Address and acquisition date recorded."
        : "Add the address and acquisition date.",
    },
    {
      id: "units",
      label: "Units",
      status: property.units.length > 0 ? "complete" : "missing",
      detail:
        property.units.length > 0
          ? `${property.units.length} unit${property.units.length === 1 ? "" : "s"} recorded.`
          : "Add at least one unit.",
    },
    {
      id: "owners",
      label: "Owners",
      status: property.owners.length > 0 ? "complete" : "missing",
      detail:
        property.owners.length > 0
          ? `${property.owners.length} owner${property.owners.length === 1 ? "" : "s"} recorded.`
          : "Add each co-owner.",
    },
    {
      id: "ownership",
      label: "Ownership shares",
      status:
        ownershipIssues.length > 0
          ? "warning"
          : hasOwnershipSetup
            ? "complete"
            : "missing",
      detail: getOwnershipReadinessDetail(
        ownershipPeriods.length,
        ownershipIssues,
        ownershipTotalAtCoverageDate,
        ownershipCoverageDate,
      ),
    },
  ];
  const completedCount = tasks.filter(
    (task) => task.status === "complete",
  ).length;
  const setupGapCount = tasks.length - completedCount;

  return {
    propertyId: property.id,
    propertyName: property.name,
    readinessPercent: Math.round((completedCount / tasks.length) * 100),
    completedCount,
    totalCount: tasks.length,
    setupGapCount,
    tasks,
  };
}

function getOwnershipReadinessDetail(
  periodCount: number,
  issues: OwnershipValidationIssue[],
  totalAtCoverageDate: number,
  coverageDate: string,
) {
  if (issues.length > 0) {
    return issues[0]?.message ?? "Review ownership shares.";
  }

  if (periodCount === 0) {
    return "Add ownership shares.";
  }

  if (totalAtCoverageDate !== 100) {
    return `Shares total ${formatPercent(totalAtCoverageDate)}% on ${formatDisplayDate(coverageDate)}.`;
  }

  return `Shares total 100% on ${formatDisplayDate(coverageDate)}.`;
}

function isOwnershipActiveOnDate(period: OwnershipPeriod, date: string) {
  return (
    period.effectiveFrom <= date &&
    (period.effectiveTo === null || period.effectiveTo >= date)
  );
}

function getPeriodBoundaries(periods: OwnershipPeriod[]) {
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

function addIsoDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);

  return parsed.toISOString().slice(0, 10);
}

function formatDateRange(start: string, end: string | null) {
  return end === null ? `${start} onward` : `${start} to ${end}`;
}

export function formatDisplayDate(date: string) {
  const [, month, day] = date.split("-");
  const monthName =
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][Number(month) - 1] ?? "January";

  return `${monthName} ${Number(day)}`;
}

function roundShareTotal(total: number) {
  return Math.round(total * 100) / 100;
}

export function formatPercent(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}
