import type {
  Document,
  DocumentLink,
  LedgerEntry,
  LedgerEntryType,
  RentalIncomeCategory,
  T776Category,
} from "@/db/schema";
import { type LedgerEntryWithSplits, splitsBalance } from "./allocations";

export type {
  LedgerEntry,
  RentalIncomeCategory,
  T776Category,
} from "@/db/schema";
export type { LedgerEntryWithSplits } from "./allocations";

export const T776_CATEGORY_OPTIONS: { value: T776Category; label: string }[] = [
  { value: "advertising", label: "Advertising" },
  { value: "insurance", label: "Insurance" },
  { value: "interest_and_bank_charges", label: "Interest and bank charges" },
  { value: "office_expenses", label: "Office expenses" },
  { value: "professional_fees", label: "Professional fees" },
  { value: "repairs_and_maintenance", label: "Repairs and maintenance" },
  {
    value: "salaries_wages_and_benefits",
    label: "Salaries, wages, and benefits",
  },
  { value: "property_taxes", label: "Property taxes" },
  { value: "travel", label: "Travel" },
  { value: "utilities", label: "Utilities" },
  { value: "other_expenses", label: "Other expenses" },
];

export const RENTAL_INCOME_CATEGORY_OPTIONS: {
  value: RentalIncomeCategory;
  label: string;
}[] = [
  { value: "other_income", label: "Other rental income" },
  { value: "laundry", label: "Laundry" },
  { value: "parking", label: "Parking" },
  { value: "fees", label: "Fees" },
  { value: "recoveries", label: "Recoveries" },
];

export type DocumentWithLinks = Document & { links: DocumentLink[] };

export type EvidenceBinder = {
  ledgerEntries: LedgerEntryWithSplits[];
  documents: DocumentWithLinks[];
};

export type NewManualTransactionInput = {
  type: LedgerEntryType;
  date: string;
  vendor: string;
  memo?: string;
  amount: number;
  expenseCategory?: T776Category;
  incomeCategory?: RentalIncomeCategory;
  isCapitalAsset?: boolean;
  reviewNotes?: string;
};

export type ManualTransactionFormDraft = {
  type: LedgerEntryType;
  date: string;
  vendor: string;
  amount: string;
  category: string;
  memo: string;
  reviewNotes: string;
};

export function createEmptyManualTransactionDraft(): ManualTransactionFormDraft {
  return {
    type: "expense",
    date: "",
    vendor: "",
    amount: "",
    category: "",
    memo: "",
    reviewNotes: "",
  };
}

export const INBOX_ISSUE_TYPES = [
  "uncategorized",
  "missing_receipt",
  "split_mismatch",
] as const;
export type InboxIssueType = (typeof INBOX_ISSUE_TYPES)[number];

export const INBOX_ISSUE_OPTIONS: { value: InboxIssueType; label: string }[] = [
  { value: "uncategorized", label: "Uncategorized" },
  { value: "missing_receipt", label: "Missing receipt" },
  { value: "split_mismatch", label: "Split mismatch" },
];

export function getEntryIssues(
  entry: LedgerEntryWithSplits,
  documents: DocumentWithLinks[],
): InboxIssueType[] {
  const issues: InboxIssueType[] = [];

  if (isUncategorized(entry)) {
    issues.push("uncategorized");
  }

  if (
    entry.type === "expense" &&
    !hasDocumentLink(documents, "transaction", entry.id)
  ) {
    issues.push("missing_receipt");
  }

  if (!splitsBalance(entry.amount, entry.splits)) {
    issues.push("split_mismatch");
  }

  return issues;
}

export type EvidenceExceptionCounts = {
  uncategorizedTransactions: number;
  missingReceipts: number;
  splitMismatches: number;
};

export function getEvidenceExceptionCounts(
  binder: EvidenceBinder,
): EvidenceExceptionCounts {
  const counts: EvidenceExceptionCounts = {
    uncategorizedTransactions: 0,
    missingReceipts: 0,
    splitMismatches: 0,
  };

  for (const entry of binder.ledgerEntries) {
    for (const issue of getEntryIssues(entry, binder.documents)) {
      if (issue === "uncategorized") {
        counts.uncategorizedTransactions += 1;
      } else if (issue === "missing_receipt") {
        counts.missingReceipts += 1;
      } else {
        counts.splitMismatches += 1;
      }
    }
  }

  return counts;
}

function isUncategorized(entry: LedgerEntryWithSplits): boolean {
  if (entry.splits.length > 0) {
    return false;
  }

  return entry.type === "expense"
    ? entry.expenseCategory === null
    : entry.incomeCategory === null;
}

export function entryMatchesCategory(
  entry: LedgerEntryWithSplits,
  category: string,
): boolean {
  if (entry.expenseCategory === category || entry.incomeCategory === category) {
    return true;
  }

  return entry.splits.some(
    (split) =>
      split.expenseCategory === category || split.incomeCategory === category,
  );
}

export function entryYear(entry: LedgerEntry): number {
  return Number(entry.date.slice(0, 4));
}

export function getDocumentsForTarget(
  documents: DocumentWithLinks[],
  targetType: DocumentLink["targetType"],
  targetId: string,
): DocumentWithLinks[] {
  return documents.filter((document) =>
    document.links.some(
      (link) => link.targetType === targetType && link.targetId === targetId,
    ),
  );
}

export function getCapitalAssetTransactions(
  entries: LedgerEntry[],
  year: number,
): LedgerEntry[] {
  return entries
    .filter(
      (entry) =>
        entry.type === "expense" &&
        entry.isCapitalAsset &&
        entryYear(entry) === year,
    )
    .toSorted((a, b) => a.date.localeCompare(b.date));
}

export type SourceDocumentIndexRow = {
  documentId: string;
  fileName: string;
  documentType: string;
  vendor: string | null;
  documentDate: string | null;
  amount: number | null;
  linkedTargets: string[];
  readableUrl: string | null;
};

export function buildSourceDocumentIndex(
  documents: DocumentWithLinks[],
): SourceDocumentIndexRow[] {
  return documents
    .map((document) => ({
      documentId: document.id,
      fileName: document.fileName,
      documentType: document.documentType,
      vendor: document.vendor,
      documentDate: document.documentDate,
      amount: document.amount,
      linkedTargets: document.links.map(
        (link) => `${link.targetType}:${link.targetId}`,
      ),
      readableUrl: document.storageUrl,
    }))
    .toSorted((a, b) => {
      const dateCompare = (a.documentDate ?? "").localeCompare(
        b.documentDate ?? "",
      );

      return dateCompare === 0
        ? a.fileName.localeCompare(b.fileName)
        : dateCompare;
    });
}

export function summarizeRentalExpenses(
  entries: LedgerEntry[],
): Map<T776Category, number> {
  const summary = new Map<T776Category, number>();

  for (const entry of entries) {
    if (entry.type !== "expense" || entry.expenseCategory === null) {
      continue;
    }

    summary.set(
      entry.expenseCategory,
      roundMoney((summary.get(entry.expenseCategory) ?? 0) + entry.amount),
    );
  }

  return summary;
}

export function formatExpenseCategory(value: T776Category | null): string {
  if (value === null) {
    return "Uncategorized expense";
  }

  return (
    T776_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function formatIncomeCategory(
  value: RentalIncomeCategory | null,
): string {
  if (value === null) {
    return "Uncategorized income";
  }

  return (
    RENTAL_INCOME_CATEGORY_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function formatLedgerCategory(entry: LedgerEntry): string {
  return entry.type === "expense"
    ? formatExpenseCategory(entry.expenseCategory)
    : formatIncomeCategory(entry.incomeCategory);
}

function hasDocumentLink(
  documents: DocumentWithLinks[],
  targetType: DocumentLink["targetType"],
  targetId: string,
) {
  return documents.some((document) =>
    document.links.some(
      (link) => link.targetType === targetType && link.targetId === targetId,
    ),
  );
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
