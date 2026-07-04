import type { PropertyReadiness } from "./property-workspace";
import type {
  OwnershipReadinessWarning,
  ReadinessStatus,
  YearEndReadiness,
  YearEndReadinessItem,
} from "./year-end-readiness";

export type ReadinessSurface = "property" | "year-end" | "portfolio";

export type YearEndReadinessRow = {
  id: string;
  label: string;
  status: ReadinessStatus;
  count: number;
  detail: string;
  href: string;
  actionLabel: string;
};

export function getYearEndReadinessRows({
  propertyId,
  taxYear,
  readiness,
  setupReadiness,
  surface,
}: {
  propertyId: string;
  taxYear: number;
  readiness: YearEndReadiness;
  setupReadiness?: PropertyReadiness;
  surface: ReadinessSurface;
}): YearEndReadinessRow[] {
  const rows: YearEndReadinessRow[] = [];
  const hasOwnershipSetupGap =
    setupReadiness?.tasks.some(
      (task) => task.id === "ownership" && task.status !== "complete",
    ) ?? false;

  for (const item of readiness.items) {
    if (item.id === "ownership_allocations" && hasOwnershipSetupGap) {
      continue;
    }

    rows.push(toReadinessRow(item, propertyId, taxYear, surface));
  }

  return rows;
}

export function formatOwnershipReadinessWarning(
  warning: OwnershipReadinessWarning,
  formatDate: (value: string) => string,
  formatPercent: (value: number) => string,
) {
  if (warning.code === "incomplete_ownership_total") {
    return `Ownership shares total ${formatPercent(warning.totalPercentage)}% on ${formatDate(warning.date)}.`;
  }

  if (warning.validationCode === "OVER_ALLOCATED") {
    const total =
      warning.totalPercentage === undefined
        ? ""
        : ` ${formatPercent(warning.totalPercentage)}%`;
    const date =
      warning.date === undefined ? "" : ` on ${formatDate(warning.date)}`;

    return `Active ownership shares cannot exceed 100 percent.${total}${date}.`;
  }

  if (warning.validationCode === "INVALID_DATE_RANGE") {
    return "Review ownership effective dates before export.";
  }

  return "Review ownership percentages before export.";
}

function toReadinessRow(
  item: YearEndReadinessItem,
  propertyId: string,
  taxYear: number,
  surface: ReadinessSurface,
): YearEndReadinessRow {
  const transactionsHref = (issue: "uncategorized" | "missing_receipt") =>
    `/transactions?propertyId=${propertyId}&year=${taxYear}&issue=${issue}`;
  const yearEndHref = `/year-end?propertyId=${propertyId}&year=${taxYear}`;
  const propertyHref =
    surface === "portfolio"
      ? `/properties/${propertyId}`
      : "#ownership-history";

  switch (item.id) {
    case "uncategorized_transactions":
      return {
        id: item.id,
        label:
          surface === "portfolio"
            ? "Categorize transactions"
            : "Uncategorized transactions",
        status: item.status,
        count: item.count,
        detail:
          item.count > 0
            ? `${item.count} transaction${plural(item.count)} need${item.count === 1 ? "s" : ""} a category before export.`
            : "All transactions for this year have a category or split.",
        href: transactionsHref("uncategorized"),
        actionLabel: item.count > 0 ? "Review" : "View",
      };
    case "missing_documents":
      return {
        id: item.id,
        label:
          surface === "portfolio"
            ? "Attach missing evidence"
            : "Missing receipts",
        status: item.status,
        count: item.count,
        detail:
          item.count > 0
            ? `${item.count} expense${plural(item.count)} need${item.count === 1 ? "s" : ""} receipt or invoice support.`
            : "Expense records for this year have supporting documents.",
        href: transactionsHref("missing_receipt"),
        actionLabel: item.count > 0 ? "Attach" : "View",
      };
    case "capital_assets":
      return {
        id: item.id,
        label:
          surface === "portfolio"
            ? "Review capital assets"
            : "Capital asset review",
        status: item.status,
        count: item.count,
        detail:
          item.count > 0
            ? `${item.count} marked capital transaction${plural(item.count)} need accountant review; ${item.supportedCapitalTransactions} have support attached.`
            : "No capital asset transactions are marked for this year.",
        href: yearEndHref,
        actionLabel: item.count > 0 ? "Open" : "View",
      };
    case "ownership_allocations":
      return {
        id: item.id,
        label: "Ownership allocations",
        status: item.status,
        count: item.count,
        detail:
          item.ownershipWarning === null
            ? "Ownership shares total 100% through the active part of this tax year."
            : "Review ownership allocations before export.",
        href: propertyHref,
        actionLabel: item.count > 0 ? "Review" : "View",
      };
    default:
      return assertNever(item);
  }
}

function plural(count: number) {
  return count === 1 ? "" : "s";
}

function assertNever(value: never): never {
  throw new Error(`Unhandled readiness item: ${JSON.stringify(value)}`);
}
