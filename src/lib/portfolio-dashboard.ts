import { roundMoney } from "@/lib/money";
import type { RentEvent, T776Category } from "../db/schema";
import { T776_CATEGORIES } from "../db/schema";
import { entryYear, formatExpenseCategory } from "./evidence-binder";
import type { RentalProperty } from "./property-workspace";
import { isValidTaxYear } from "./tax-year";
import { summarizeTaxYearFinancials } from "./tax-year-financial-summary";
import type { FilingStatus } from "./year-end-readiness";
import { getFilingReadiness } from "./year-end-readiness-view-model";

export { isValidTaxYear } from "./tax-year";

export type DashboardPropertySource = RentalProperty & {
  rentEvents: RentEvent[];
};

export type PropertyDashboardStatus = FilingStatus | "not_active";

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

  const readiness = getFilingReadiness(property, taxYear, "portfolio");
  const financials = summarizeTaxYearFinancials(
    property,
    taxYear,
    readiness.yearEnd.uncategorizedTransactions,
  );
  const categories = financials.expenseCategoryTotals;
  const attentionItems: DashboardAttentionItem[] = readiness.rows.flatMap(
    (row) =>
      row.status === "clear"
        ? []
        : [
            {
              id: `${property.id}:${row.id === "property_setup" ? "setup" : row.id}`,
              propertyId: property.id,
              propertyName: property.name,
              severity: row.status,
              label: row.label,
              detail: row.detail,
              count: row.count,
              href: row.href,
            },
          ],
  );

  return {
    summary: {
      propertyId: property.id,
      propertyName: property.name,
      status: readiness.status,
      openExceptionCount: readiness.openExceptionCount,
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
