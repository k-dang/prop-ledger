import { describe, expect, it } from "vitest";
import type { DocumentWithLinks } from "./evidence-binder";
import {
  buildPortfolioDashboard,
  type DashboardPropertySource,
} from "./portfolio-dashboard";

function makeProperty(
  overrides: Partial<DashboardPropertySource> = {},
): DashboardPropertySource {
  const id = overrides.id ?? "property-1";

  return {
    id,
    name: "King Street Duplex",
    line1: "100 King Street W",
    line2: null,
    municipality: "Hamilton",
    province: "ON",
    postalCode: "L8P 1A1",
    acquisitionDate: "2021-04-15",
    createdAt: new Date("2021-04-15T00:00:00.000Z"),
    units: [
      { id: `${id}-unit`, propertyId: id, label: "Upper", unitType: "Unit" },
    ],
    owners: [
      {
        id: `${id}-owner`,
        propertyId: id,
        name: "Avery Chen",
        email: null,
      },
    ],
    ownershipPeriods: [
      {
        id: `${id}-ownership`,
        propertyId: id,
        ownerId: `${id}-owner`,
        percentage: 100,
        effectiveFrom: "2021-04-15",
        effectiveTo: null,
      },
    ],
    ledgerEntries: [],
    mortgagePayments: [],
    documents: [],
    rentEvents: [],
    ...overrides,
  };
}

function makeDocument(transactionId: string): DocumentWithLinks {
  return {
    id: `document-${transactionId}`,
    propertyId: "property-1",
    fileName: "receipt.pdf",
    documentType: "receipt",
    storageUrl: "/uploads/receipt.pdf",
    vendor: null,
    documentDate: null,
    amount: null,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    links: [
      {
        id: `link-${transactionId}`,
        documentId: `document-${transactionId}`,
        targetType: "transaction",
        targetId: transactionId,
      },
    ],
  };
}

function makeEntry(
  id: string,
  overrides: Partial<DashboardPropertySource["ledgerEntries"][number]> = {},
): DashboardPropertySource["ledgerEntries"][number] {
  return {
    id,
    propertyId: "property-1",
    type: "expense",
    date: "2026-02-01",
    vendor: "Vendor",
    memo: null,
    amount: 100,
    expenseCategory: "repairs_and_maintenance",
    incomeCategory: null,
    prepaidStartDate: null,
    prepaidEndDate: null,
    isReconciled: true,
    isCapitalAsset: false,
    reviewNotes: null,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    splits: [],
    ...overrides,
  };
}

describe("portfolio dashboard summary", () => {
  it("aggregates accrual income, cash received, expenses, and net income", () => {
    const expense = makeEntry("expense-1", { amount: 800 });
    const manualIncome = makeEntry("income-1", {
      type: "income",
      amount: 120,
      expenseCategory: null,
      incomeCategory: "laundry",
    });
    const property = makeProperty({
      ledgerEntries: [expense, manualIncome],
      documents: [makeDocument("expense-1")],
      mortgagePayments: [
        {
          id: "mortgage-1",
          propertyId: "property-1",
          date: "2026-03-01",
          lender: "Bank",
          totalAmount: 1600,
          principal: 1100,
          interest: 500,
          fees: null,
          memo: null,
        },
      ],
      rentEvents: [
        {
          id: "charge-1",
          propertyId: "property-1",
          leaseId: null,
          type: "charge",
          date: "2026-01-01",
          amount: 2400,
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
          memo: null,
        },
        {
          id: "payment-1",
          propertyId: "property-1",
          leaseId: null,
          type: "payment",
          date: "2026-01-05",
          amount: 2000,
          periodStart: null,
          periodEnd: null,
          memo: null,
        },
      ],
    });

    const summary = buildPortfolioDashboard([property], 2026, 2026);

    expect(summary.totals).toEqual({
      grossRentalIncome: 2520,
      paymentsReceived: 2000,
      deductibleExpenses: 1300,
      netRecordedRentalIncome: 1220,
      incompleteTransactionCount: 0,
    });
    expect(summary.expenseCategories).toEqual([
      {
        category: "repairs_and_maintenance",
        label: "Repairs and maintenance",
        amount: 800,
        percentage: 61.5,
      },
      {
        category: "interest_and_bank_charges",
        label: "Interest and bank charges",
        amount: 500,
        percentage: 38.5,
      },
    ]);
    expect(summary.properties[0]?.status).toBe("ready");
  });

  it("allocates a prepaid expense to the overlapping portion of the year", () => {
    const prepaid = makeEntry("prepaid-insurance", {
      amount: 1200,
      date: "2026-07-01",
      expenseCategory: "insurance",
      prepaidStartDate: "2026-07-01",
      prepaidEndDate: "2027-06-30",
    });
    const property = makeProperty({
      ledgerEntries: [prepaid],
      documents: [makeDocument("prepaid-insurance")],
    });

    const summary = buildPortfolioDashboard([property], 2026, 2026);

    // 1200 * 184 days falling in 2026 / 365 total prepaid days = 604.93.
    expect(summary.totals.deductibleExpenses).toBe(604.93);
    expect(summary.expenseCategories).toEqual([
      {
        category: "insurance",
        label: "Insurance",
        amount: 604.93,
        percentage: 100,
      },
    ]);
  });

  it("merges expense categories across multiple properties", () => {
    const alpha = makeProperty({
      id: "alpha",
      name: "Alpha",
      ledgerEntries: [
        makeEntry("a-repairs", {
          amount: 600,
          expenseCategory: "repairs_and_maintenance",
        }),
        makeEntry("a-insurance", { amount: 100, expenseCategory: "insurance" }),
      ],
    });
    const beta = makeProperty({
      id: "beta",
      name: "Beta",
      ledgerEntries: [
        makeEntry("b-repairs", {
          amount: 400,
          expenseCategory: "repairs_and_maintenance",
        }),
        makeEntry("b-utilities", { amount: 200, expenseCategory: "utilities" }),
      ],
    });

    const summary = buildPortfolioDashboard([alpha, beta], 2026, 2026);

    expect(summary.totals.deductibleExpenses).toBe(1300);
    expect(summary.expenseCategories).toEqual([
      {
        category: "repairs_and_maintenance",
        label: "Repairs and maintenance",
        amount: 1000,
        percentage: 76.9,
      },
      {
        category: "utilities",
        label: "Utilities",
        amount: 200,
        percentage: 15.4,
      },
      {
        category: "insurance",
        label: "Insurance",
        amount: 100,
        percentage: 7.7,
      },
    ]);
  });

  it("derives available tax years from activity and drops out-of-range years", () => {
    const property = makeProperty({
      acquisitionDate: "2024-06-01",
      ledgerEntries: [makeEntry("entry-2026", { date: "2026-02-01" })],
      mortgagePayments: [
        {
          id: "ancient-mortgage",
          propertyId: "property-1",
          date: "1999-01-01",
          lender: "Bank",
          totalAmount: 100,
          principal: 100,
          interest: 0,
          fees: null,
          memo: null,
        },
      ],
      rentEvents: [
        {
          id: "charge-2025",
          propertyId: "property-1",
          leaseId: null,
          type: "charge",
          date: "2025-03-01",
          amount: 1000,
          periodStart: "2025-03-01",
          periodEnd: "2025-03-31",
          memo: null,
        },
      ],
    });

    const summary = buildPortfolioDashboard([property], 2026, 2026);

    // 1999 from the mortgage payment is outside the valid window and dropped.
    expect(summary.availableTaxYears).toEqual([2026, 2025, 2024]);
  });

  it("excludes properties acquired after the selected year from totals", () => {
    const active = makeProperty({
      id: "active",
      name: "Active Property",
      rentEvents: [
        {
          id: "charge-1",
          propertyId: "active",
          leaseId: null,
          type: "charge",
          date: "2026-01-01",
          amount: 1000,
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
          memo: null,
        },
      ],
    });
    const future = makeProperty({
      id: "future",
      name: "Future Property",
      acquisitionDate: "2027-01-01",
      rentEvents: [
        {
          id: "future-charge",
          propertyId: "future",
          leaseId: null,
          type: "charge",
          date: "2027-01-01",
          amount: 9000,
          periodStart: "2027-01-01",
          periodEnd: "2027-01-31",
          memo: null,
        },
      ],
    });

    const summary = buildPortfolioDashboard([active, future], 2026, 2026);

    expect(summary.totals.grossRentalIncome).toBe(1000);
    expect(summary.readinessCounts).toEqual({
      ready: 1,
      needs_review: 0,
      blocked: 0,
      not_active: 1,
    });
    expect(
      summary.properties.find((property) => property.propertyId === "future")
        ?.status,
    ).toBe("not_active");
  });

  it("prioritizes blocking setup and evidence work before warnings", () => {
    const uncategorized = makeEntry("uncategorized", {
      expenseCategory: null,
    });
    const capital = makeEntry("capital", { isCapitalAsset: true });
    const property = makeProperty({
      units: [],
      ledgerEntries: [uncategorized, capital],
      documents: [makeDocument("capital")],
    });

    const summary = buildPortfolioDashboard([property], 2026, 2026);

    expect(summary.properties[0]).toEqual(
      expect.objectContaining({
        status: "blocked",
        incompleteTransactionCount: 1,
      }),
    );
    expect(summary.attentionItems.map((item) => item.label)).toEqual([
      "Complete property setup",
      "Categorize transactions",
      "Attach missing evidence",
      "Review capital assets",
    ]);
    expect(summary.attentionItems.at(-1)?.severity).toBe("warning");
  });
});
