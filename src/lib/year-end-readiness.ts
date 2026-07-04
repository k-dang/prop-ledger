import type { LedgerEntryWithSplits } from "./allocations";
import {
  entryYear,
  getCapitalAssetTransactions,
  getDocumentsForTarget,
  getEvidenceExceptionCounts,
} from "./evidence-binder";
import {
  createOwnershipPeriodTimeline,
  type OwnershipValidationIssue,
} from "./ownership-period-timeline";
import type { RentalProperty } from "./property-workspace";

export type ReadinessStatus = "clear" | "blocking" | "warning";

export type YearEndReadinessItemId =
  | "uncategorized_transactions"
  | "missing_documents"
  | "capital_assets"
  | "ownership_allocations";

type YearEndReadinessItemBase<TId extends YearEndReadinessItemId> = {
  id: TId;
  status: ReadinessStatus;
  count: number;
};

export type YearEndReadinessItem =
  | YearEndReadinessItemBase<"uncategorized_transactions">
  | YearEndReadinessItemBase<"missing_documents">
  | (YearEndReadinessItemBase<"capital_assets"> & {
      supportedCapitalTransactions: number;
    })
  | (YearEndReadinessItemBase<"ownership_allocations"> & {
      ownershipWarning: OwnershipReadinessWarning | null;
    });

export type OwnershipReadinessWarning =
  | {
      code: "invalid_ownership_period";
      validationCode: OwnershipValidationIssue["code"];
      date?: string;
      totalPercentage?: number;
      periodIds: string[];
    }
  | {
      code: "incomplete_ownership_total";
      date: string;
      totalPercentage: number;
      periodIds: string[];
    };

export type YearEndDashboardCounts = {
  taxYear: number;
  missingReceipts: number;
  uncategorizedTransactions: number;
  capitalAssetTransactions: number;
};

export type YearEndReadiness = YearEndDashboardCounts & {
  propertyId: string;
  propertyName: string;
  blockingCount: number;
  warningCount: number;
  clearCount: number;
  items: YearEndReadinessItem[];
};

export function getDefaultTaxYear(now = new Date()): number {
  return now.getFullYear();
}

export function getYearEndDashboardCounts(
  property: RentalProperty,
  taxYear: number,
): YearEndDashboardCounts {
  const transactions = getLedgerEntriesForYear(property.ledgerEntries, taxYear);
  const exceptionCounts = getEvidenceExceptionCounts({
    ledgerEntries: transactions,
    documents: property.documents,
  });

  return {
    taxYear,
    missingReceipts: exceptionCounts.missingReceipts,
    uncategorizedTransactions: exceptionCounts.uncategorizedTransactions,
    capitalAssetTransactions: getCapitalAssetTransactions(
      property.ledgerEntries,
      taxYear,
    ).length,
  };
}

export function getYearEndReadiness(
  property: RentalProperty,
  taxYear: number,
): YearEndReadiness {
  const dashboardCounts = getYearEndDashboardCounts(property, taxYear);
  const capitalTransactions = getCapitalAssetTransactions(
    property.ledgerEntries,
    taxYear,
  );
  const supportedCapitalCount = capitalTransactions.filter(
    (entry) =>
      getDocumentsForTarget(property.documents, "transaction", entry.id)
        .length > 0,
  ).length;
  const ownershipWarnings = getOwnershipAllocationWarnings(property, taxYear);

  const items: YearEndReadinessItem[] = [
    {
      id: "uncategorized_transactions",
      status:
        dashboardCounts.uncategorizedTransactions > 0 ? "blocking" : "clear",
      count: dashboardCounts.uncategorizedTransactions,
    },
    {
      id: "missing_documents",
      status: dashboardCounts.missingReceipts > 0 ? "blocking" : "clear",
      count: dashboardCounts.missingReceipts,
    },
    {
      id: "capital_assets",
      status: capitalTransactions.length > 0 ? "warning" : "clear",
      count: capitalTransactions.length,
      supportedCapitalTransactions: supportedCapitalCount,
    },
    {
      id: "ownership_allocations",
      status: ownershipWarnings.length > 0 ? "warning" : "clear",
      count: ownershipWarnings.length,
      ownershipWarning: ownershipWarnings[0] ?? null,
    },
  ];

  return {
    propertyId: property.id,
    propertyName: property.name,
    ...dashboardCounts,
    blockingCount: items.filter((item) => item.status === "blocking").length,
    warningCount: items.filter((item) => item.status === "warning").length,
    clearCount: items.filter((item) => item.status === "clear").length,
    items,
  };
}

function getLedgerEntriesForYear(
  entries: LedgerEntryWithSplits[],
  taxYear: number,
) {
  return entries.filter((entry) => entryYear(entry) === taxYear);
}

function getOwnershipAllocationWarnings(
  property: RentalProperty,
  taxYear: number,
): OwnershipReadinessWarning[] {
  const taxYearStart = `${taxYear}-01-01`;
  const taxYearEnd = `${taxYear}-12-31`;
  const activeStart =
    property.acquisitionDate > taxYearStart
      ? property.acquisitionDate
      : taxYearStart;

  if (activeStart > taxYearEnd) {
    return [];
  }

  const ownershipTimeline = createOwnershipPeriodTimeline({
    periods: property.ownershipPeriods,
  });
  const validationWarnings = ownershipTimeline.validate().map((issue) => ({
    code: "invalid_ownership_period" as const,
    validationCode: issue.code,
    date: issue.date,
    totalPercentage: issue.totalPercentage,
    periodIds: issue.periodIds,
  }));

  if (validationWarnings.length > 0) {
    return validationWarnings;
  }

  const coverageWarnings = ownershipTimeline
    .coverageForRange({ activeFrom: activeStart, activeTo: taxYearEnd })
    .map((finding) => ({
      code: "incomplete_ownership_total" as const,
      date: finding.date,
      totalPercentage: finding.totalPercentage,
      periodIds: finding.periodIds,
    }));

  return [...validationWarnings, ...coverageWarnings];
}
