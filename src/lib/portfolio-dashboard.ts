import type { RentEvent, T776Category } from "../db/schema";
import { T776_CATEGORIES } from "../db/schema";
import { entryYear, formatExpenseCategory } from "./evidence-binder";
import {
  getPropertyReadiness,
  type RentalProperty,
} from "./property-workspace";
import { isValidTaxYear } from "./tax-year";
import { summarizeTaxYearFinancials } from "./tax-year-financial-summary";
import { getYearEndReadiness } from "./year-end-readiness";
import { getYearEndReadinessRows } from "./year-end-readiness-view-model";

export { isValidTaxYear } from "./tax-year";

export type DashboardPropertySource = RentalProperty & {
  rentEvents: RentEvent[];
};

export type PropertyDashboardStatus =
  | "ready"
  | "needs_review"
  | "blocked"
  | "not_active";

export type FinancialSummary = {
  grossRentalIncome: number;
  paymentsReceived: number;
  deductibleExpenses: number;
  netRecordedRentalIncome: number;
  incompleteTransactionCount: number;
};

export type PropertyDashboardSummary = FinancialSummary & {
  propertyId: string;
  propertyName: string;
  status: PropertyDashboardStatus;
  openExceptionCount: number;
};

export type DashboardAttentionItem = {
  id: string;
  propertyId: string;
  propertyName: string;
  severity: "blocking" | "warning";
  label: string;
  detail: string;
  count: number;
  href: string;
};

export type ExpenseCategorySummary = {
  category: T776Category;
  label: string;
  amount: number;
  percentage: number;
};

export type PortfolioDashboardSummary = {
  taxYear: number;
  availableTaxYears: number[];
  totals: FinancialSummary;
  readinessCounts: Record<PropertyDashboardStatus, number>;
  attentionItems: DashboardAttentionItem[];
  expenseCategories: ExpenseCategorySummary[];
  properties: PropertyDashboardSummary[];
};

export function buildPortfolioDashboard(
  properties: DashboardPropertySource[],
  taxYear: number,
  // Defaults to the wall-clock year so the route can call this with just the
  // selected year; tests pass it explicitly to stay deterministic.
  currentYear = new Date().getFullYear(),
): PortfolioDashboardSummary {
  const results = properties.map((property) =>
    buildPropertyResult(property, taxYear),
  );
  const summaries = results.map((result) => result.summary);
  const categoryTotals = mergeCategoryTotals(
    results.map((result) => result.categories),
  );
  const attentionItems = results.flatMap((result) => result.attentionItems);
  const activeSummaries = summaries.filter(
    (property) => property.status !== "not_active",
  );
  const totals = activeSummaries.reduce<FinancialSummary>(
    (result, property) => ({
      grossRentalIncome: roundMoney(
        result.grossRentalIncome + property.grossRentalIncome,
      ),
      paymentsReceived: roundMoney(
        result.paymentsReceived + property.paymentsReceived,
      ),
      deductibleExpenses: roundMoney(
        result.deductibleExpenses + property.deductibleExpenses,
      ),
      netRecordedRentalIncome: roundMoney(
        result.netRecordedRentalIncome + property.netRecordedRentalIncome,
      ),
      incompleteTransactionCount:
        result.incompleteTransactionCount + property.incompleteTransactionCount,
    }),
    emptyFinancialSummary(),
  );
  const readinessCounts = summaries.reduce<
    Record<PropertyDashboardStatus, number>
  >(
    (counts, property) => {
      counts[property.status] += 1;
      return counts;
    },
    { ready: 0, needs_review: 0, blocked: 0, not_active: 0 },
  );
  const expenseCategories = buildExpenseCategorySummaries(categoryTotals);

  return {
    taxYear,
    availableTaxYears: getAvailableTaxYears(properties, taxYear, currentYear),
    totals,
    readinessCounts,
    attentionItems: attentionItems.toSorted(compareAttentionItems),
    expenseCategories,
    properties: summaries.toSorted((a, b) =>
      a.propertyName.localeCompare(b.propertyName),
    ),
  };
}

type PropertyResult = {
  summary: PropertyDashboardSummary;
  categories: Map<T776Category, number>;
  attentionItems: DashboardAttentionItem[];
};

function buildPropertyResult(
  property: DashboardPropertySource,
  taxYear: number,
): PropertyResult {
  if (!isActiveForYear(property, taxYear)) {
    return {
      summary: inactivePropertySummary(property),
      categories: new Map(),
      attentionItems: [],
    };
  }

  const setup = getPropertyReadiness(property);
  const readiness = getYearEndReadiness(property, taxYear);
  const financials = summarizeTaxYearFinancials(
    property,
    taxYear,
    readiness.uncategorizedTransactions,
  );
  const categories = financials.expenseCategoryTotals;
  const blockingCount = setup.setupGapCount + readiness.blockingCount;
  const warningCount = readiness.warningCount;
  const attentionItems = buildAttentionItems(
    property,
    taxYear,
    setup,
    readiness,
  );
  // Derive the exception count from the same deduped attention items the UI
  // renders, so the comparison table's "Exceptions" column always reconciles
  // with the "Needs attention" list (e.g. the ownership_allocations item that
  // buildAttentionItems suppresses when a setup ownership gap already covers it).
  const openExceptionCount = attentionItems.reduce(
    (total, item) => total + item.count,
    0,
  );

  return {
    summary: {
      propertyId: property.id,
      propertyName: property.name,
      status:
        blockingCount > 0
          ? "blocked"
          : warningCount > 0
            ? "needs_review"
            : "ready",
      openExceptionCount,
      grossRentalIncome: financials.grossRentalIncome,
      paymentsReceived: financials.paymentsReceived,
      deductibleExpenses: financials.deductibleExpenses,
      netRecordedRentalIncome: financials.netRecordedRentalIncome,
      incompleteTransactionCount: financials.incompleteTransactionCount,
    },
    categories,
    attentionItems,
  };
}

function mergeCategoryTotals(
  perProperty: Map<T776Category, number>[],
): Map<T776Category, number> {
  const totals = new Map<T776Category, number>();

  for (const categories of perProperty) {
    for (const [category, amount] of categories) {
      totals.set(category, roundMoney((totals.get(category) ?? 0) + amount));
    }
  }

  return totals;
}

function buildAttentionItems(
  property: DashboardPropertySource,
  taxYear: number,
  setup: ReturnType<typeof getPropertyReadiness>,
  readiness: ReturnType<typeof getYearEndReadiness>,
): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];
  const setupGaps = setup.tasks.filter((task) => task.status !== "complete");

  if (setupGaps.length > 0) {
    items.push({
      id: `${property.id}:setup`,
      propertyId: property.id,
      propertyName: property.name,
      severity: "blocking",
      label: "Complete property setup",
      detail: setupGaps.map((task) => task.label).join(", "),
      count: setupGaps.length,
      href: `/properties/${property.id}`,
    });
  }

  for (const row of getYearEndReadinessRows({
    propertyId: property.id,
    taxYear,
    readiness,
    setupReadiness: setup,
    surface: "portfolio",
  })) {
    if (row.status === "clear") {
      continue;
    }

    items.push({
      id: `${property.id}:${row.id}`,
      propertyId: property.id,
      propertyName: property.name,
      severity: row.status,
      label: row.label,
      detail: row.detail,
      count: row.count,
      href: row.href,
    });
  }

  return items;
}

function buildExpenseCategorySummaries(
  totals: Map<T776Category, number>,
): ExpenseCategorySummary[] {
  const totalExpenses = roundMoney(
    [...totals.values()].reduce((total, amount) => total + amount, 0),
  );

  return T776_CATEGORIES.flatMap((category) => {
    const amount = totals.get(category) ?? 0;

    return amount === 0
      ? []
      : [
          {
            category,
            label: formatExpenseCategory(category),
            amount,
            // Clamp so a stray negative category total (e.g. a refund booked as
            // a negative expense) can never produce a width that overflows the
            // progress bar in the UI.
            percentage:
              totalExpenses === 0
                ? 0
                : Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round((amount / totalExpenses) * 1000) / 10,
                    ),
                  ),
          },
        ];
  }).toSorted((a, b) => b.amount - a.amount);
}

function getAvailableTaxYears(
  properties: DashboardPropertySource[],
  selectedYear: number,
  currentYear: number,
) {
  const years = new Set<number>([selectedYear, currentYear]);

  for (const property of properties) {
    years.add(Number(property.acquisitionDate.slice(0, 4)));

    for (const event of property.rentEvents.filter(
      (candidate) => candidate.type === "payment",
    )) {
      years.add(Number(event.date.slice(0, 4)));
    }

    for (const entry of property.ledgerEntries) {
      years.add(entryYear(entry));
    }

    for (const payment of property.mortgagePayments) {
      years.add(Number(payment.date.slice(0, 4)));
    }
  }

  return [...years].filter(isValidTaxYear).toSorted((a, b) => b - a);
}

function inactivePropertySummary(
  property: DashboardPropertySource,
): PropertyDashboardSummary {
  return {
    propertyId: property.id,
    propertyName: property.name,
    status: "not_active",
    openExceptionCount: 0,
    ...emptyFinancialSummary(),
  };
}

function emptyFinancialSummary(): FinancialSummary {
  return {
    grossRentalIncome: 0,
    paymentsReceived: 0,
    deductibleExpenses: 0,
    netRecordedRentalIncome: 0,
    incompleteTransactionCount: 0,
  };
}

function isActiveForYear(
  property: Pick<DashboardPropertySource, "acquisitionDate">,
  taxYear: number,
) {
  return property.acquisitionDate <= `${taxYear}-12-31`;
}

function compareAttentionItems(
  left: DashboardAttentionItem,
  right: DashboardAttentionItem,
) {
  if (left.severity !== right.severity) {
    return left.severity === "blocking" ? -1 : 1;
  }

  if (left.count !== right.count) {
    return right.count - left.count;
  }

  return left.propertyName.localeCompare(right.propertyName);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
