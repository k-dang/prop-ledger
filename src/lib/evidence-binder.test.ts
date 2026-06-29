import { describe, expect, it } from "vitest";

import type {
  DocumentWithLinks,
  LedgerEntryWithSplits,
} from "./evidence-binder";
import {
  buildSourceDocumentIndex,
  entryMatchesCategory,
  entryYear,
  getCapitalAssetTransactions,
  getDocumentsForTarget,
  getEntryIssues,
  getEvidenceExceptionCounts,
  RENTAL_INCOME_CATEGORY_OPTIONS,
  summarizeRentalExpenses,
} from "./evidence-binder";

function makeEntry(
  entry: Partial<LedgerEntryWithSplits> & Pick<LedgerEntryWithSplits, "id">,
) {
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
    isReconciled: false,
    isCapitalAsset: false,
    reviewNotes: null,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    splits: [],
    ...entry,
  } satisfies LedgerEntryWithSplits;
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
      splitMismatches: 0,
    });
  });

  it("treats a split transaction as categorized and flags unbalanced splits", () => {
    const entries = [
      makeEntry({
        id: "split-balanced",
        expenseCategory: null,
        amount: 300,
        splits: [
          {
            id: "s1",
            ledgerEntryId: "split-balanced",
            expenseCategory: "utilities",
            incomeCategory: null,
            amount: 200,
            memo: null,
          },
          {
            id: "s2",
            ledgerEntryId: "split-balanced",
            expenseCategory: "repairs_and_maintenance",
            incomeCategory: null,
            amount: 100,
            memo: null,
          },
        ],
      }),
      makeEntry({
        id: "split-unbalanced",
        amount: 300,
        splits: [
          {
            id: "s3",
            ledgerEntryId: "split-unbalanced",
            expenseCategory: "utilities",
            incomeCategory: null,
            amount: 100,
            memo: null,
          },
        ],
      }),
    ];
    const documents = [
      makeDocument({
        id: "doc-balanced",
        links: [
          {
            id: "link-balanced",
            documentId: "doc-balanced",
            targetType: "transaction",
            targetId: "split-balanced",
          },
        ],
      }),
      makeDocument({
        id: "doc-unbalanced",
        links: [
          {
            id: "link-unbalanced",
            documentId: "doc-unbalanced",
            targetType: "transaction",
            targetId: "split-unbalanced",
          },
        ],
      }),
    ];

    expect(
      getEvidenceExceptionCounts({ ledgerEntries: entries, documents }),
    ).toEqual({
      uncategorizedTransactions: 0,
      missingReceipts: 0,
      splitMismatches: 1,
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
            targetType: "mortgage_payment",
            targetId: "payment-1",
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
        linkedTargets: ["mortgage_payment:payment-1"],
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
        incomeCategory: "parking",
        amount: 100,
      }),
    ]);

    expect(Object.fromEntries(summary)).toEqual({
      repairs_and_maintenance: 250,
      insurance: 500,
    });
  });
});

describe("inbox filtering", () => {
  it("reads the tax year from a transaction date", () => {
    expect(entryYear(makeEntry({ id: "e", date: "2025-09-30" }))).toBe(2025);
  });

  it("matches a transaction by its own category or a split category", () => {
    const splitEntry = makeEntry({
      id: "split",
      expenseCategory: null,
      splits: [
        {
          id: "s1",
          ledgerEntryId: "split",
          expenseCategory: "utilities",
          incomeCategory: null,
          amount: 50,
          memo: null,
        },
      ],
    });

    expect(
      entryMatchesCategory(makeEntry({ id: "own" }), "repairs_and_maintenance"),
    ).toBe(true);
    expect(entryMatchesCategory(splitEntry, "utilities")).toBe(true);
    expect(entryMatchesCategory(splitEntry, "insurance")).toBe(false);
  });

  it("derives the issue list used to filter the inbox", () => {
    const entry = makeEntry({
      id: "needs-work",
      expenseCategory: null,
      amount: 100,
      splits: [
        {
          id: "s1",
          ledgerEntryId: "needs-work",
          expenseCategory: "utilities",
          incomeCategory: null,
          amount: 40,
          memo: null,
        },
      ],
    });

    expect(getEntryIssues(entry, [])).toEqual([
      "missing_receipt",
      "split_mismatch",
    ]);
  });
});

describe("capital asset transaction selection", () => {
  it("lists only marked expense transactions for the selected year", () => {
    const entries = [
      makeEntry({
        id: "marked-2026-late",
        date: "2026-05-01",
        amount: 300,
        isCapitalAsset: true,
      }),
      makeEntry({ id: "unmarked", date: "2026-04-01", isCapitalAsset: false }),
      makeEntry({
        id: "marked-income",
        type: "income",
        expenseCategory: null,
        incomeCategory: "parking",
        isCapitalAsset: true,
      }),
      makeEntry({
        id: "marked-2025",
        date: "2025-12-31",
        isCapitalAsset: true,
      }),
      makeEntry({
        id: "marked-2026-early",
        date: "2026-01-15",
        amount: 100,
        isCapitalAsset: true,
      }),
    ];

    expect(
      getCapitalAssetTransactions(entries, 2026).map((entry) => entry.id),
    ).toEqual(["marked-2026-early", "marked-2026-late"]);
  });
});

describe("income categories", () => {
  it("excludes rent because rent is recorded in the rent ledger", () => {
    const values = RENTAL_INCOME_CATEGORY_OPTIONS.map((option) => option.value);

    expect(values).toEqual([
      "other_income",
      "laundry",
      "parking",
      "fees",
      "recoveries",
    ]);
    expect((values as readonly string[]).includes("rent")).toBe(false);
  });
});
