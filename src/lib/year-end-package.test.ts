import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildYearEndPackageSnapshot,
  type YearEndPackageSource,
} from "./year-end-package";

const property: YearEndPackageSource = {
  id: "property-1",
  name: "King Street Duplex",
  line1: "100 King Street W",
  line2: null,
  municipality: "Hamilton",
  province: "ON",
  postalCode: "L8P 1A1",
  acquisitionDate: "2020-01-01",
  createdAt: new Date("2020-01-01T00:00:00Z"),
  units: [],
  owners: [
    {
      id: "owner-a",
      propertyId: "property-1",
      name: "Avery Chen",
    },
    {
      id: "owner-b",
      propertyId: "property-1",
      name: "Morgan Lee",
    },
  ],
  ownershipPeriods: [
    {
      id: "period-a",
      propertyId: "property-1",
      ownerId: "owner-a",
      percentage: 60,
      effectiveFrom: "2020-01-01",
      effectiveTo: null,
    },
    {
      id: "period-b",
      propertyId: "property-1",
      ownerId: "owner-b",
      percentage: 40,
      effectiveFrom: "2020-01-01",
      effectiveTo: null,
    },
  ],
  ledgerEntries: [
    {
      id: "expense-1",
      propertyId: "property-1",
      type: "expense",
      date: "2026-03-01",
      vendor: "Roof Co",
      memo: "Repair",
      amount: 2400,
      expenseCategory: "repairs_and_maintenance",
      incomeCategory: null,
      prepaidStartDate: null,
      prepaidEndDate: null,
      isReconciled: true,
      isCapitalAsset: true,
      reviewNotes: "Accountant to review",
      createdAt: new Date("2026-03-01T00:00:00Z"),
      splits: [],
    },
    {
      id: "income-1",
      propertyId: "property-1",
      type: "income",
      date: "2026-04-01",
      vendor: "Laundry",
      memo: null,
      amount: 1000,
      expenseCategory: null,
      incomeCategory: "laundry",
      prepaidStartDate: null,
      prepaidEndDate: null,
      isReconciled: true,
      isCapitalAsset: false,
      reviewNotes: null,
      createdAt: new Date("2026-04-01T00:00:00Z"),
      splits: [],
    },
  ],
  mortgagePayments: [
    {
      id: "mortgage-1",
      propertyId: "property-1",
      date: "2026-06-01",
      lender: "Bank",
      totalAmount: 3000,
      principal: 1800,
      interest: 1200,
      fees: 0,
    },
  ],
  documents: [
    {
      id: "doc-1",
      propertyId: "property-1",
      fileName: "roof.pdf",
      documentType: "receipt",
      storageUrl: "/uploads/roof.pdf",
      vendor: "Roof Co",
      documentDate: "2026-03-01",
      amount: 2400,
      createdAt: new Date("2026-03-01T00:00:00Z"),
      links: [
        {
          id: "link-1",
          documentId: "doc-1",
          targetType: "transaction",
          targetId: "expense-1",
        },
      ],
    },
  ],
  rentEvents: [
    {
      id: "rent-1",
      propertyId: "property-1",
      leaseId: "lease-1",
      type: "payment",
      date: "2026-01-05",
      amount: 24000,
      periodStart: null,
      periodEnd: null,
      memo: null,
    },
  ],
  accountantNotes: [
    {
      id: "note-1",
      propertyId: "property-1",
      taxYear: 2026,
      note: "Confirm capital treatment",
      createdAt: new Date("2027-01-15T00:00:00Z"),
    },
  ],
};

function golden(snapshot: ReturnType<typeof buildYearEndPackageSnapshot>) {
  return {
    scope: snapshot.scope,
    totalIncome: snapshot.t776Summary.totalIncome,
    totalExpenses: snapshot.t776Summary.totalExpenses,
    expenseAllocation: snapshot.expenseDetail[0]?.allocatedAmount,
    capitalAllocation: snapshot.capitalAssetTransactions[0]?.allocatedAmount,
    ownerCount: snapshot.ownerShareWorksheet.length,
  };
}

function fixture(name: string) {
  return JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`./__fixtures__/${name}.json`, import.meta.url)),
      "utf8",
    ),
  );
}

describe("year-end package snapshots", () => {
  it("matches the representative full-property golden output", () => {
    const snapshot = buildYearEndPackageSnapshot({
      source: property,
      taxYear: 2026,
      scope: { type: "property" },
      generatedAt: "2027-02-01T00:00:00.000Z",
    });
    expect(golden(snapshot)).toEqual(fixture("year-end-property"));
    expect(snapshot.sourceDocuments[0]?.documentId).toBe("doc-1");
    expect(JSON.stringify(snapshot)).not.toContain("avery@example.test");
  });

  it("matches the owner allocation golden output", () => {
    const snapshot = buildYearEndPackageSnapshot({
      source: property,
      taxYear: 2026,
      scope: { type: "owner", ownerId: "owner-a" },
      generatedAt: "2027-02-01T00:00:00.000Z",
    });
    expect(golden(snapshot)).toEqual(fixture("year-end-owner"));
  });

  it("adds non-rent income to received rent", () => {
    const snapshot = buildYearEndPackageSnapshot({
      source: property,
      taxYear: 2026,
      scope: { type: "property" },
      generatedAt: "2027-02-01T00:00:00.000Z",
    });

    expect(snapshot.t776Summary.otherRentalIncome).toBe(1000);
    expect(snapshot.t776Summary.totalIncome).toBe(25000);
  });

  it("returns detached data that does not change after live records are edited", () => {
    const snapshot = buildYearEndPackageSnapshot({
      source: property,
      taxYear: 2026,
      scope: { type: "property" },
      generatedAt: "2027-02-01T00:00:00.000Z",
    });
    const liveEntry = property.ledgerEntries[0];
    if (liveEntry === undefined)
      throw new Error("Expected fixture transaction.");
    liveEntry.amount = 9999;
    expect(snapshot.expenseDetail[0]?.sourceAmount).toBe(2400);
    liveEntry.amount = 2400;
  });
});
