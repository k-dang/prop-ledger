import type { T776Category } from "./ledger-categories";

export type YearEndPackageSnapshot = {
  version: 2;
  generatedAt: string;
  taxYear: number;
  scope:
    | { type: "property"; label: string }
    | { type: "owner"; ownerId: string; label: string };
  property: { id: string; name: string; address: string };
  t776Summary: {
    grossRent: number;
    otherRentalIncome: number;
    totalIncome: number;
    expenses: { category: T776Category; label: string; amount: number }[];
    totalExpenses: number;
  };
  ownerShareWorksheet: {
    ownerId: string;
    ownerName: string;
    periods: { from: string; to: string | null; percentage: number }[];
  }[];
  rentLedger: {
    rentReceived: number;
    paymentCount: number;
  };
  expenseDetail: {
    transactionId: string;
    date: string;
    vendor: string;
    memo: string | null;
    category: T776Category | null;
    categoryLabel: string;
    sourceAmount: number;
    allocatedAmount: number;
    documentIds: string[];
  }[];
  capitalAssetTransactions: {
    transactionId: string;
    date: string;
    vendor: string;
    memo: string | null;
    sourceAmount: number;
    allocatedAmount: number;
    documentIds: string[];
  }[];
  sourceDocuments: {
    documentId: string;
    fileName: string;
    documentType: string;
    vendor: string | null;
    documentDate: string | null;
    amount: number | null;
    linkedTargets: string[];
    readableUrl: string | null;
  }[];
  accountantNotes: string[];
  unresolvedExceptions: {
    id: string;
    status: "blocking" | "warning";
    count: number;
  }[];
};
