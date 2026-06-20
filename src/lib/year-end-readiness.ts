import type { LedgerEntryWithSplits } from "./allocations";
import {
  entryYear,
  getCapitalAssetTransactions,
  getDocumentsForTarget,
  getEvidenceExceptionCounts,
} from "./evidence-binder";
import type { RentalProperty } from "./property-workspace";
import {
  getOwnershipTotalOnDate,
  type OwnershipValidationIssue,
  validateOwnershipPeriods,
} from "./property-workspace";

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
    }
  | {
      code: "incomplete_ownership_total";
      date: string;
      totalPercentage: number;
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

  const validationIssues = validateOwnershipPeriods(property.ownershipPeriods);

  if (validationIssues.length > 0) {
    const issue = validationIssues[0];

    return [
      {
        code: "invalid_ownership_period",
        validationCode: issue.code,
        date: issue.date,
        totalPercentage: issue.totalPercentage,
      },
    ];
  }

  const checkpoints = getOwnershipCheckpoints(
    property,
    activeStart,
    taxYearEnd,
  );

  for (const checkpoint of checkpoints) {
    const total = getOwnershipTotalOnDate(
      property.ownershipPeriods,
      checkpoint,
    );

    if (total !== 100) {
      return [
        {
          code: "incomplete_ownership_total",
          date: checkpoint,
          totalPercentage: total,
        },
      ];
    }
  }

  return [];
}

function getOwnershipCheckpoints(
  property: RentalProperty,
  activeStart: string,
  taxYearEnd: string,
) {
  const checkpoints = new Set<string>([activeStart]);

  for (const period of property.ownershipPeriods) {
    if (
      period.effectiveFrom >= activeStart &&
      period.effectiveFrom <= taxYearEnd
    ) {
      checkpoints.add(period.effectiveFrom);
    }

    if (period.effectiveTo !== null) {
      const dayAfterEnd = addIsoDays(period.effectiveTo, 1);

      if (dayAfterEnd >= activeStart && dayAfterEnd <= taxYearEnd) {
        checkpoints.add(dayAfterEnd);
      }
    }
  }

  return Array.from(checkpoints).toSorted();
}

function addIsoDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);

  return parsed.toISOString().slice(0, 10);
}
