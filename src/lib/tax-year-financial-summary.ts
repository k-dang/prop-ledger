import type { RentEvent, T776Category } from "@/db/schema";
import {
  allocatePrepaidToYear,
  isPrepaid,
  type LedgerEntryWithSplits,
  summarizeDeductibleExpenses,
} from "./allocations";
import { entryYear } from "./evidence-binder";
import { summarizeRentLedger } from "./rent-ledger";
import { summarizeManualIncomeForTax } from "./rental-income";

export type TaxYearFinancialSummary = {
  grossRentalIncome: number;
  paymentsReceived: number;
  deductibleExpenses: number;
  netRecordedRentalIncome: number;
  incompleteTransactionCount: number;
  expenseCategoryTotals: Map<T776Category, number>;
};

export function summarizeTaxYearFinancials(
  property: {
    ledgerEntries: LedgerEntryWithSplits[];
    mortgagePayments: NonNullable<
      Parameters<typeof summarizeDeductibleExpenses>[1]
    >;
    rentEvents: RentEvent[];
  },
  taxYear: number,
  incompleteTransactionCount = 0,
): TaxYearFinancialSummary {
  const entries = property.ledgerEntries
    .filter((entry) => entryYear(entry) === taxYear)
    .map((entry) => allocateEntryToYear(entry, taxYear));
  const mortgagePayments = property.mortgagePayments.filter((payment) =>
    payment.date.startsWith(`${taxYear}-`),
  );
  const expenseSummary = summarizeDeductibleExpenses(entries, mortgagePayments);
  const rent = summarizeRentLedger(property.rentEvents, taxYear);
  const { taxableManualIncome } = summarizeManualIncomeForTax(entries);
  const grossRentalIncome = roundMoney(
    rent.grossRentalIncome + taxableManualIncome,
  );
  const deductibleExpenses = roundMoney(
    [...expenseSummary.values()].reduce((total, amount) => total + amount, 0),
  );

  return {
    grossRentalIncome,
    paymentsReceived: rent.paymentsReceived,
    deductibleExpenses,
    netRecordedRentalIncome: roundMoney(grossRentalIncome - deductibleExpenses),
    incompleteTransactionCount,
    expenseCategoryTotals: new Map(
      [...expenseSummary].map(([category, amount]) => [
        category,
        roundMoney(amount),
      ]),
    ),
  };
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

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
