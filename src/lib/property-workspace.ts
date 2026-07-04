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
import {
  createOwnershipPeriodTimeline,
  type OwnershipCoverageFinding,
  type OwnershipValidationIssue,
} from "./ownership-period-timeline";
import type { RentLedger } from "./rent-ledger";

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

export type PropertyWorkspaceData = {
  property: RentalProperty;
  rentLedger: RentLedger;
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

export function getPropertyReadiness(
  property: RentalProperty,
): PropertyReadiness {
  const ownershipTimeline = createOwnershipPeriodTimeline({
    periods: property.ownershipPeriods,
  });
  const ownershipPeriods = ownershipTimeline.orderedPeriods();
  const ownershipIssues = ownershipTimeline.validate();
  const ownershipCoverageDate = property.acquisitionDate;
  const ownershipCoverage = ownershipTimeline.coverageForRange({
    activeFrom: ownershipCoverageDate,
    activeTo: ownershipCoverageDate,
  });
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
    ownershipCoverage.length === 0;

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
        ownershipCoverage[0],
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
  coverageFinding: OwnershipCoverageFinding | undefined,
  coverageDate: string,
) {
  if (issues.length > 0) {
    return issues[0]?.message ?? "Review ownership shares.";
  }

  if (periodCount === 0) {
    return "Add ownership shares.";
  }

  if (coverageFinding !== undefined) {
    return `Shares total ${formatPercent(coverageFinding.totalPercentage)}% on ${formatDisplayDate(coverageFinding.date)}.`;
  }

  return `Shares total 100% on ${formatDisplayDate(coverageDate)}.`;
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

export function formatPercent(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}
