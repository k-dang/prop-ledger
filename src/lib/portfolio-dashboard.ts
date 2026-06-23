import type { RentEvent, T776Category } from "../db/schema";
import { T776_CATEGORIES } from "../db/schema";
import {
  allocatePrepaidToYear,
  isPrepaid,
  type LedgerEntryWithSplits,
  summarizeDeductibleExpenses,
} from "./allocations";
import { entryYear, formatExpenseCategory } from "./evidence-binder";
import {
  getPropertyReadiness,
  type RentalProperty,
} from "./property-workspace";
import { summarizeRentLedger } from "./rent-ledger";
import { getYearEndReadiness } from "./year-end-readiness";

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
  const { financials, categories } = summarizePropertyFinancials(
    property,
    taxYear,
    readiness.uncategorizedTransactions,
  );
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
      ...financials,
    },
    categories,
    attentionItems,
  };
}

function summarizePropertyFinancials(
  property: DashboardPropertySource,
  taxYear: number,
  incompleteTransactionCount: number,
): { financials: FinancialSummary; categories: Map<T776Category, number> } {
  const entries = property.ledgerEntries
    .filter((entry) => entryYear(entry) === taxYear)
    .map((entry) => allocateEntryToYear(entry, taxYear));
  const mortgagePayments = property.mortgagePayments.filter((payment) =>
    payment.date.startsWith(`${taxYear}-`),
  );
  const expenseSummary = summarizeDeductibleExpenses(entries, mortgagePayments);
  const categories = new Map<T776Category, number>();

  for (const [category, amount] of expenseSummary) {
    categories.set(category, roundMoney(amount));
  }

  const rent = summarizeRentLedger(property.rentEvents, taxYear);
  const manualIncome = roundMoney(
    entries
      .filter((entry) => entry.type === "income")
      .reduce((total, entry) => total + entry.amount, 0),
  );
  const grossRentalIncome = roundMoney(rent.grossRentalIncome + manualIncome);
  const deductibleExpenses = roundMoney(
    [...expenseSummary.values()].reduce((total, amount) => total + amount, 0),
  );

  return {
    financials: {
      grossRentalIncome,
      paymentsReceived: rent.paymentsReceived,
      deductibleExpenses,
      netRecordedRentalIncome: roundMoney(
        grossRentalIncome - deductibleExpenses,
      ),
      incompleteTransactionCount,
    },
    categories,
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

function allocateEntryToYear(
  entry: LedgerEntryWithSplits,
  taxYear: number,
): LedgerEntryWithSplits {
  if (!isPrepaid(entry)) {
    return entry;
  }

  const amount = allocatePrepaidToYear(entry, taxYear);
  const splitRatio = entry.amount === 0 ? 0 : amount / entry.amount;

  return {
    ...entry,
    amount,
    splits: entry.splits.map((split) => ({
      ...split,
      amount: roundMoney(split.amount * splitRatio),
    })),
  };
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

  for (const item of readiness.items) {
    if (item.status === "clear") {
      continue;
    }

    // An incomplete ownership setup task already surfaces the same root cause as
    // the ownership_allocations readiness warning, so drop the duplicate here.
    if (
      item.id === "ownership_allocations" &&
      setupGaps.some((task) => task.id === "ownership")
    ) {
      continue;
    }

    const common = {
      id: `${property.id}:${item.id}`,
      propertyId: property.id,
      propertyName: property.name,
      severity: item.status,
      count: item.count,
    } as const;

    if (item.id === "uncategorized_transactions") {
      items.push({
        ...common,
        label: "Categorize transactions",
        detail: `${item.count} transaction${plural(item.count)} need review.`,
        href: transactionHref(property.id, taxYear, "uncategorized"),
      });
    } else if (item.id === "missing_documents") {
      items.push({
        ...common,
        label: "Attach missing evidence",
        detail: `${item.count} expense${plural(item.count)} need receipt or invoice support.`,
        href: transactionHref(property.id, taxYear, "missing_receipt"),
      });
    } else if (item.id === "capital_assets") {
      items.push({
        ...common,
        label: "Review capital assets",
        detail: `${item.count} marked transaction${plural(item.count)} need accountant review.`,
        href: `/year-end?propertyId=${property.id}&year=${taxYear}`,
      });
    } else {
      items.push({
        ...common,
        label: "Review ownership allocations",
        detail: `${item.count} ownership issue${plural(item.count)} remain.`,
        href: `/properties/${property.id}`,
      });
    }
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

    for (const event of property.rentEvents) {
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

const MIN_TAX_YEAR = 2000;
const MAX_TAX_YEAR = 2100;

/** Shared bound for selectable tax years; keeps the route and the aggregator
 * from drifting on what counts as a valid year. */
export function isValidTaxYear(year: number) {
  return Number.isInteger(year) && year >= MIN_TAX_YEAR && year <= MAX_TAX_YEAR;
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

function transactionHref(
  propertyId: string,
  taxYear: number,
  issue: "uncategorized" | "missing_receipt",
) {
  return `/transactions?propertyId=${propertyId}&year=${taxYear}&issue=${issue}`;
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

function plural(count: number) {
  return count === 1 ? "" : "s";
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
