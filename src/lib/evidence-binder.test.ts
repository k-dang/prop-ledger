import { describe, expect, it } from "vitest";

import type { DocumentWithLinks, LedgerEntry } from "./evidence-binder";
import {
  buildSourceDocumentIndex,
  getDocumentsForTarget,
  getEvidenceExceptionCounts,
  summarizeRentalExpenses,
} from "./evidence-binder";

function makeEntry(entry: Partial<LedgerEntry> & Pick<LedgerEntry, "id">) {
  return {
    propertyId: "property-1",
    type: "expense",
    date: "2026-02-01",
    vendor: "Vendor",
    memo: null,
    amount: 100,
    expenseCategory: "repairs_and_maintenance",
    incomeCategory: null,
    isPersonal: false,
    isReconciled: false,
    reviewNotes: null,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    ...entry,
  } satisfies LedgerEntry;
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

describe("evidence binder exceptions", () => {
  it("counts uncategorized and missing receipt records", () => {
    const entries = [
      makeEntry({ id: "categorized", isReconciled: true }),
      makeEntry({ id: "uncategorized-expense", expenseCategory: null }),
      makeEntry({
        id: "uncategorized-income",
        type: "income",
        expenseCategory: null,
        incomeCategory: null,
      }),
    ];
    const documents = [
      makeDocument({
        id: "doc-1",
        links: [
          {
            id: "link-1",
            documentId: "doc-1",
            targetType: "transaction",
            targetId: "categorized",
          },
        ],
      }),
      makeDocument({ id: "doc-2", fileName: "not-attached.pdf" }),
    ];

    expect(
      getEvidenceExceptionCounts({ ledgerEntries: entries, documents }),
    ).toEqual({
      uncategorizedTransactions: 2,
      missingReceipts: 1,
    });
  });
});

describe("document linking and indexes", () => {
  it("finds documents linked to one target", () => {
    const rentDocument = makeDocument({
      id: "doc-1",
      links: [
        {
          id: "link-1",
          documentId: "doc-1",
          targetType: "rent_event",
          targetId: "rent-1",
        },
      ],
    });
    const transactionDocument = makeDocument({
      id: "doc-2",
      links: [
        {
          id: "link-2",
          documentId: "doc-2",
          targetType: "transaction",
          targetId: "txn-1",
        },
      ],
    });

    expect(
      getDocumentsForTarget(
        [rentDocument, transactionDocument],
        "rent_event",
        "rent-1",
      ),
    ).toEqual([rentDocument]);
  });

  it("builds a readable source document index with metadata and link targets", () => {
    const documents = [
      makeDocument({
        id: "doc-2",
        fileName: "statement.pdf",
        documentType: "statement",
        vendor: "Bank",
        documentDate: "2026-03-01",
        amount: 1200,
        storageUrl: "https://example.test/statement.pdf",
        links: [
          {
            id: "link-2",
            documentId: "doc-2",
            targetType: "loan",
            targetId: "loan-1",
          },
        ],
      }),
      makeDocument({
        id: "doc-1",
        fileName: "receipt.pdf",
        documentDate: "2026-02-01",
      }),
    ];

    expect(buildSourceDocumentIndex(documents)).toEqual([
      {
        documentId: "doc-1",
        fileName: "receipt.pdf",
        documentType: "receipt",
        vendor: null,
        documentDate: "2026-02-01",
        amount: null,
        linkedTargets: [],
        readableUrl: "/uploads/receipt.pdf",
      },
      {
        documentId: "doc-2",
        fileName: "statement.pdf",
        documentType: "statement",
        vendor: "Bank",
        documentDate: "2026-03-01",
        amount: 1200,
        linkedTargets: ["loan:loan-1"],
        readableUrl: "https://example.test/statement.pdf",
      },
    ]);
  });
});

describe("expense summaries", () => {
  it("excludes uncategorized entries and income from rental expense totals", () => {
    const summary = summarizeRentalExpenses([
      makeEntry({ id: "repair", amount: 250 }),
      makeEntry({ id: "insurance", expenseCategory: "insurance", amount: 500 }),
      makeEntry({ id: "unknown", expenseCategory: null, amount: 12 }),
      makeEntry({
        id: "income",
        type: "income",
        expenseCategory: null,
        incomeCategory: "rent",
        amount: 100,
      }),
    ]);

    expect(Object.fromEntries(summary)).toEqual({
      repairs_and_maintenance: 250,
      insurance: 500,
    });
  });
});
