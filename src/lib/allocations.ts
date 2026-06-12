import type {
  LedgerEntry,
  LedgerEntryType,
  MortgagePayment,
  RentalIncomeCategory,
  T776Category,
  TransactionSplit,
} from "@/db/schema";
import { RENTAL_INCOME_CATEGORIES, T776_CATEGORIES } from "../db/schema";

export type { TransactionSplit } from "@/db/schema";

export type LedgerEntryWithSplits = LedgerEntry & {
  splits: TransactionSplit[];
};

export type TransactionSplitInput = {
  expenseCategory?: string;
  incomeCategory?: string;
  amount: number;
  memo?: string;
};

export function isT776Category(value: string): value is T776Category {
  return (T776_CATEGORIES as readonly string[]).includes(value);
}

export function isRentalIncomeCategory(
  value: string,
): value is RentalIncomeCategory {
  return (RENTAL_INCOME_CATEGORIES as readonly string[]).includes(value);
}

export function validateLedgerCategory(
  type: LedgerEntryType,
  category: string | null,
): string | undefined {
  if (category === null) {
    return undefined;
  }

  if (type === "expense") {
    return isT776Category(category)
      ? undefined
      : "Choose a valid expense category.";
  }

  return isRentalIncomeCategory(category)
    ? undefined
    : "Choose a valid income category.";
}

export function validateTransactionSplits(
  entryType: LedgerEntryType,
  splits: TransactionSplitInput[],
): string | undefined {
  for (const split of splits) {
    if (!Number.isFinite(split.amount) || split.amount <= 0) {
      return "Each split needs an amount greater than zero.";
    }

    if (entryType === "expense") {
      if (split.expenseCategory === undefined) {
        return "Each expense split needs an expense category.";
      }

      if (!isT776Category(split.expenseCategory)) {
        return "Choose valid expense split categories.";
      }

      continue;
    }

    if (split.incomeCategory === undefined) {
      return "Each income split needs an income category.";
    }

    if (!isRentalIncomeCategory(split.incomeCategory)) {
      return "Choose valid income split categories.";
    }
  }

  return undefined;
}

export function splitsTotal(splits: { amount: number }[]): number {
  return roundMoney(splits.reduce((total, split) => total + split.amount, 0));
}

export function splitsBalance(
  amount: number,
  splits: { amount: number }[],
): boolean {
  if (splits.length === 0) {
    return true;
  }

  return splitsTotal(splits) === roundMoney(amount);
}

export function summarizeDeductibleExpenses(
  entries: LedgerEntryWithSplits[],
  mortgagePayments: MortgagePayment[] = [],
): Map<T776Category, number> {
  const summary = new Map<T776Category, number>();

  const add = (category: T776Category, amount: number) => {
    summary.set(category, roundMoney((summary.get(category) ?? 0) + amount));
  };

  for (const entry of entries) {
    if (entry.type !== "expense") {
      continue;
    }

    if (entry.splits.length > 0) {
      for (const split of entry.splits) {
        if (split.expenseCategory !== null) {
          add(split.expenseCategory, split.amount);
        }
      }
    } else if (entry.expenseCategory !== null) {
      add(entry.expenseCategory, entry.amount);
    }
  }

  for (const payment of mortgagePayments) {
    if (payment.interest !== null && payment.interest !== 0) {
      add("interest_and_bank_charges", payment.interest);
    }
  }

  return summary;
}

export function allocatePrepaidToYear(
  entry: Pick<LedgerEntry, "amount" | "prepaidStartDate" | "prepaidEndDate">,
  year: number,
): number {
  if (entry.prepaidStartDate === null || entry.prepaidEndDate === null) {
    return 0;
  }

  const totalDays = inclusiveDayCount(
    entry.prepaidStartDate,
    entry.prepaidEndDate,
  );

  if (totalDays <= 0) {
    return 0;
  }

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const overlapStart =
    entry.prepaidStartDate > yearStart ? entry.prepaidStartDate : yearStart;
  const overlapEnd =
    entry.prepaidEndDate < yearEnd ? entry.prepaidEndDate : yearEnd;

  if (overlapEnd < overlapStart) {
    return 0;
  }

  const overlapDays = inclusiveDayCount(overlapStart, overlapEnd);

  return roundMoney((entry.amount * overlapDays) / totalDays);
}

export function isPrepaid(
  entry: Pick<LedgerEntry, "prepaidStartDate" | "prepaidEndDate">,
): boolean {
  return entry.prepaidStartDate !== null && entry.prepaidEndDate !== null;
}

function inclusiveDayCount(start: string, end: string): number {
  const ms =
    Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`);

  return Math.round(ms / 86_400_000) + 1;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
