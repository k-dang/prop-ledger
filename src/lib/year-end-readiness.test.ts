import { describe, expect, it } from "vitest";
import type {
  DocumentWithLinks,
  LedgerEntryWithSplits,
} from "@/lib/evidence-binder";
import type { OwnershipPeriod, RentalProperty } from "@/lib/property-workspace";
import {
  getDefaultTaxYear,
  getYearEndDashboardCounts,
  getYearEndReadiness,
} from "./year-end-readiness";

function makeEntry(
  entry: Partial<LedgerEntryWithSplits> & Pick<LedgerEntryWithSplits, "id">,
): LedgerEntryWithSplits {
  return {
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
    isPersonal: false,
    isReconciled: true,
    isCapitalAsset: false,
    reviewNotes: null,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    splits: [],
    ...entry,
  };
}

function makeDocument(
  document: Partial<DocumentWithLinks> & Pick<DocumentWithLinks, "id">,
): DocumentWithLinks {
  return {
    propertyId: "property-1",
    fileName: "receipt.pdf",
    documentType: "receipt",
    storageUrl: "/uploads/receipt.pdf",
    vendor: null,
    documentDate: null,
    amount: null,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    links: [],
    ...document,
  };
}

function makeOwnershipPeriod(
  period: Partial<OwnershipPeriod> & Pick<OwnershipPeriod, "id" | "ownerId">,
): OwnershipPeriod {
  return {
    propertyId: "property-1",
    percentage: 100,
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    ...period,
  };
}

function makeProperty(property: Partial<RentalProperty> = {}): RentalProperty {
  return {
    id: "property-1",
    name: "King Street Duplex",
    line1: "100 King Street W",
    line2: null,
    municipality: "Hamilton",
    province: "ON",
    postalCode: "L8P 1A1",
    acquisitionDate: "2021-04-15",
    hasPersonalUse: false,
    createdAt: new Date("2021-04-15T00:00:00.000Z"),
    units: [],
    owners: [
      {
        id: "owner-1",
        propertyId: "property-1",
        name: "Avery Chen",
        email: null,
      },
    ],
    ownershipPeriods: [
      makeOwnershipPeriod({ id: "period-1", ownerId: "owner-1" }),
    ],
    ledgerEntries: [],
    mortgagePayments: [],
    documents: [],
    ...property,
  };
}

describe("year-end readiness", () => {
  it("classifies unresolved transaction evidence as blocking and review items as warnings", () => {
    const property = makeProperty({
      hasPersonalUse: true,
      ownershipPeriods: [
        makeOwnershipPeriod({
          id: "period-1",
          ownerId: "owner-1",
          percentage: 75,
        }),
      ],
      ledgerEntries: [
        makeEntry({ id: "uncategorized", expenseCategory: null }),
        makeEntry({
          id: "capital",
          isCapitalAsset: true,
          expenseCategory: "repairs_and_maintenance",
        }),
      ],
      documents: [
        makeDocument({
          id: "capital-doc",
          links: [
            {
              id: "link-1",
              documentId: "capital-doc",
              targetType: "transaction",
              targetId: "capital",
            },
          ],
        }),
      ],
    });

    const readiness = getYearEndReadiness(property, 2026);

    expect(readiness.blockingCount).toBe(2);
    expect(readiness.warningCount).toBe(3);
    expect(readiness.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "uncategorized_transactions",
          status: "blocking",
          count: 1,
        }),
        expect.objectContaining({
          id: "missing_documents",
          status: "blocking",
          count: 1,
        }),
        expect.objectContaining({
          id: "capital_assets",
          status: "warning",
          count: 1,
        }),
        expect.objectContaining({
          id: "ownership_allocations",
          status: "warning",
          count: 1,
          ownershipWarning: expect.objectContaining({
            code: "incomplete_ownership_total",
            totalPercentage: 75,
          }),
        }),
        expect.objectContaining({
          id: "personal_use",
          status: "warning",
          count: 1,
        }),
      ]),
    );
  });

  it("recomputes readiness from current records rather than stored state", () => {
    const openProperty = makeProperty({
      ledgerEntries: [makeEntry({ id: "txn-1", expenseCategory: null })],
      documents: [],
    });
    const resolvedProperty = makeProperty({
      ledgerEntries: [
        makeEntry({
          id: "txn-1",
          expenseCategory: "insurance",
        }),
      ],
      documents: [
        makeDocument({
          id: "doc-1",
          links: [
            {
              id: "link-1",
              documentId: "doc-1",
              targetType: "transaction",
              targetId: "txn-1",
            },
          ],
        }),
      ],
    });

    expect(getYearEndReadiness(openProperty, 2026).blockingCount).toBe(2);
    expect(getYearEndReadiness(resolvedProperty, 2026).blockingCount).toBe(0);
  });

  it("limits transaction counts and capital warnings to the selected tax year", () => {
    const property = makeProperty({
      ledgerEntries: [
        makeEntry({ id: "missing-2026", date: "2026-01-15" }),
        makeEntry({
          id: "missing-2025",
          date: "2025-12-15",
          expenseCategory: null,
        }),
        makeEntry({
          id: "capital-2026",
          date: "2026-03-01",
          isCapitalAsset: true,
        }),
      ],
    });

    expect(getYearEndDashboardCounts(property, 2026)).toEqual({
      taxYear: 2026,
      missingReceipts: 2,
      uncategorizedTransactions: 0,
      capitalAssetTransactions: 1,
    });
  });

  it("checks ownership coverage across mid-year ownership changes", () => {
    const property = makeProperty({
      ownershipPeriods: [
        makeOwnershipPeriod({
          id: "period-1",
          ownerId: "owner-1",
          percentage: 100,
          effectiveFrom: "2026-01-01",
          effectiveTo: "2026-06-30",
        }),
        makeOwnershipPeriod({
          id: "period-2",
          ownerId: "owner-1",
          percentage: 50,
          effectiveFrom: "2026-07-01",
        }),
      ],
    });

    expect(getYearEndReadiness(property, 2026).items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ownership_allocations",
          status: "warning",
          ownershipWarning: {
            code: "incomplete_ownership_total",
            date: "2026-07-01",
            totalPercentage: 50,
          },
        }),
      ]),
    );
  });

  it("uses the current calendar year as the default tax year", () => {
    expect(getDefaultTaxYear(new Date("2027-03-15T00:00:00.000Z"))).toBe(2027);
  });
});
