import type { AccountantNote, RentEvent, T776Category } from "../db/schema";
import { T776_CATEGORIES } from "../db/schema";
import type { YearEndPackageSnapshot } from "../domain/year-end-package";
import {
  allocatePrepaidToYear,
  isPrepaid,
  type LedgerEntryWithSplits,
  summarizeDeductibleExpenses,
} from "./allocations";
import {
  buildSourceDocumentIndex,
  entryYear,
  formatExpenseCategory,
  getCapitalAssetTransactions,
  getDocumentsForTarget,
} from "./evidence-binder";
import type { RentalProperty } from "./property-workspace";
import { summarizeRentLedger } from "./rent-ledger";
import { summarizeManualIncomeForTax } from "./rental-income";
import { getYearEndReadiness } from "./year-end-readiness";

export type PackageScope =
  | { type: "property" }
  | { type: "owner"; ownerId: string };

export type YearEndPackageSource = RentalProperty & {
  rentEvents: RentEvent[];
  accountantNotes: AccountantNote[];
};

export type { YearEndPackageSnapshot } from "../domain/year-end-package";

export function buildYearEndPackageSnapshot({
  source,
  taxYear,
  scope,
  generatedAt,
}: {
  source: YearEndPackageSource;
  taxYear: number;
  scope: PackageScope;
  generatedAt: string;
}): YearEndPackageSnapshot {
  const allocation = createAllocation(source, scope);
  const entries = source.ledgerEntries.filter(
    (entry) => entryYear(entry) === taxYear,
  );
  const allocatedEntries = entries.map((entry) =>
    allocateEntry(entry, taxYear, allocation.factorFor(entry.date)),
  );
  const allocatedMortgagePayments = source.mortgagePayments
    .filter((payment) => payment.date.startsWith(`${taxYear}-`))
    .map((payment) => ({
      ...payment,
      interest:
        payment.interest === null
          ? null
          : round(payment.interest * allocation.factorFor(payment.date)),
    }));
  const allocatedRentEvents = source.rentEvents.map((event) => ({
    ...event,
    amount: round(event.amount * allocation.factorFor(event.date)),
  }));
  const expenseSummary = summarizeDeductibleExpenses(
    allocatedEntries,
    allocatedMortgagePayments,
  );
  const rentSummary = summarizeRentLedger(allocatedRentEvents, taxYear);
  const { taxableManualIncome } = summarizeManualIncomeForTax(
    allocatedEntries,
    allocatedRentEvents,
    taxYear,
  );

  return {
    version: 1,
    generatedAt,
    taxYear,
    scope: allocation.snapshotScope,
    property: propertyIdentity(source),
    t776Summary: buildT776Summary(
      rentSummary,
      taxableManualIncome,
      expenseSummary,
    ),
    ownerShareWorksheet: buildOwnerShareWorksheet(source, taxYear, scope),
    rentLedger: {
      grossRent: rentSummary.grossRent,
      otherIncome: rentSummary.otherIncome,
      paymentsReceived: rentSummary.paymentsReceived,
      credits: rentSummary.credits,
      writeoffs: rentSummary.writeoffs,
      arrearsAtYearEnd: rentSummary.arrearsAtYearEnd,
    },
    expenseDetail: buildExpenseDetail(source, entries, allocatedEntries),
    capitalAssetTransactions: buildCapitalTransactions(
      source,
      taxYear,
      allocation.factorFor,
    ),
    sourceDocuments: buildPackageDocumentIndex(source, entries),
    accountantNotes: source.accountantNotes
      .filter((note) => note.taxYear === taxYear)
      .map((note) => note.note),
    unresolvedExceptions: getYearEndReadiness(source, taxYear).items.flatMap(
      (item) =>
        item.status === "clear"
          ? []
          : [{ id: item.id, status: item.status, count: item.count }],
    ),
  };
}

function createAllocation(source: YearEndPackageSource, scope: PackageScope) {
  if (scope.type === "property") {
    return {
      snapshotScope: { type: "property", label: "Full property" } as const,
      factorFor: (_date: string) => 1,
    };
  }

  const owner = source.owners.find(
    (candidate) => candidate.id === scope.ownerId,
  );
  if (owner === undefined)
    throw new Error("Owner does not belong to this property.");

  return {
    snapshotScope: {
      type: "owner",
      ownerId: owner.id,
      label: owner.name,
    } as const,
    factorFor: (date: string) => ownershipShare(source, owner.id, date) / 100,
  };
}

function allocateEntry(
  entry: LedgerEntryWithSplits,
  taxYear: number,
  factor: number,
): LedgerEntryWithSplits {
  const yearAmount = isPrepaid(entry)
    ? allocatePrepaidToYear(entry, taxYear)
    : entry.amount;
  const splitRatio = entry.amount === 0 ? 0 : yearAmount / entry.amount;

  return {
    ...entry,
    amount: round(yearAmount * factor),
    splits: entry.splits.map((split) => ({
      ...split,
      amount: round(split.amount * splitRatio * factor),
    })),
  };
}

function buildT776Summary(
  rent: ReturnType<typeof summarizeRentLedger>,
  manualIncome: number,
  expenseSummary: Map<T776Category, number>,
) {
  const expenses = T776_CATEGORIES.flatMap((category) => {
    const amount = expenseSummary.get(category) ?? 0;
    return amount === 0
      ? []
      : [{ category, label: formatExpenseCategory(category), amount }];
  });

  return {
    grossRent: rent.grossRent,
    otherRentalIncome: rent.otherIncome,
    manualIncome,
    totalIncome: round(rent.grossRentalIncome + manualIncome),
    expenses,
    totalExpenses: round(expenses.reduce((sum, row) => sum + row.amount, 0)),
  };
}

function buildExpenseDetail(
  source: YearEndPackageSource,
  sourceEntries: LedgerEntryWithSplits[],
  allocatedEntries: LedgerEntryWithSplits[],
): YearEndPackageSnapshot["expenseDetail"] {
  return sourceEntries.flatMap((entry, index) => {
    if (entry.type !== "expense") return [];
    const allocated = allocatedEntries[index];
    if (allocated === undefined) return [];
    const documents = getDocumentsForTarget(
      source.documents,
      "transaction",
      entry.id,
    ).map((document) => document.id);
    const sourceParts = expenseParts(entry);
    const allocatedParts = expenseParts(allocated);

    return sourceParts.map((part, partIndex) => ({
      transactionId: entry.id,
      date: entry.date,
      vendor: entry.vendor,
      memo: entry.memo,
      category: part.category,
      categoryLabel: formatExpenseCategory(part.category),
      sourceAmount: part.amount,
      allocatedAmount: allocatedParts[partIndex]?.amount ?? 0,
      documentIds: documents,
    }));
  });
}

function expenseParts(entry: LedgerEntryWithSplits) {
  return entry.splits.length > 0
    ? entry.splits.map((split) => ({
        category: split.expenseCategory,
        amount: split.amount,
      }))
    : [{ category: entry.expenseCategory, amount: entry.amount }];
}

function buildCapitalTransactions(
  source: YearEndPackageSource,
  taxYear: number,
  factorFor: (date: string) => number,
) {
  return getCapitalAssetTransactions(source.ledgerEntries, taxYear).map(
    (entry) => ({
      transactionId: entry.id,
      date: entry.date,
      vendor: entry.vendor,
      memo: entry.reviewNotes ?? entry.memo,
      sourceAmount: entry.amount,
      allocatedAmount: round(entry.amount * factorFor(entry.date)),
      documentIds: getDocumentsForTarget(
        source.documents,
        "transaction",
        entry.id,
      ).map((document) => document.id),
    }),
  );
}

function buildPackageDocumentIndex(
  source: YearEndPackageSource,
  entries: LedgerEntryWithSplits[],
) {
  const transactionIds = new Set(entries.map((entry) => entry.id));
  return buildSourceDocumentIndex(
    source.documents.filter((document) =>
      document.links.some(
        (link) =>
          link.targetType === "transaction" &&
          transactionIds.has(link.targetId),
      ),
    ),
  );
}

function buildOwnerShareWorksheet(
  source: YearEndPackageSource,
  taxYear: number,
  scope: PackageScope,
) {
  const yearStart = `${taxYear}-01-01`;
  const yearEnd = `${taxYear}-12-31`;
  return source.owners
    .filter((owner) => scope.type === "property" || owner.id === scope.ownerId)
    .map((owner) => ({
      ownerId: owner.id,
      ownerName: owner.name,
      periods: source.ownershipPeriods
        .filter(
          (period) =>
            period.ownerId === owner.id &&
            period.effectiveFrom <= yearEnd &&
            (period.effectiveTo === null || period.effectiveTo >= yearStart),
        )
        .map((period) => ({
          from: period.effectiveFrom,
          to: period.effectiveTo,
          percentage: period.percentage,
        })),
    }));
}

function propertyIdentity(source: YearEndPackageSource) {
  return {
    id: source.id,
    name: source.name,
    address: [
      source.line1,
      source.line2,
      source.municipality,
      source.province,
      source.postalCode,
    ]
      .filter(Boolean)
      .join(", "),
  };
}

function ownershipShare(
  source: YearEndPackageSource,
  ownerId: string,
  date: string,
) {
  return source.ownershipPeriods
    .filter(
      (period) =>
        period.ownerId === ownerId &&
        period.effectiveFrom <= date &&
        (period.effectiveTo === null || period.effectiveTo >= date),
    )
    .reduce((sum, period) => sum + period.percentage, 0);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
