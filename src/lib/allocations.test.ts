import { describe, expect, it } from "vitest";

import type { LedgerEntryWithSplits, TransactionSplit } from "./allocations";
import {
  allocatePrepaidToYear,
  splitsBalance,
  splitsTotal,
  summarizeDeductibleExpenses,
  validateLedgerCategory,
  validateTransactionSplits,
} from "./allocations";

function makeSplit(
  split: Partial<TransactionSplit> & Pick<TransactionSplit, "id">,
): TransactionSplit {
  return {
    ledgerEntryId: "entry-1",
    expenseCategory: "repairs_and_maintenance",
    incomeCategory: null,
    amount: 100,
    memo: null,
    ...split,
  };
}

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
    isReconciled: false,
    reviewNotes: null,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    splits: [],
    ...entry,
  };
}

describe("transaction splits", () => {
  it("sums split amounts with money rounding", () => {
    expect(
      splitsTotal([{ amount: 10.1 }, { amount: 20.2 }, { amount: 0.05 }]),
    ).toBe(30.35);
  });

  it("treats an unsplit transaction as balanced", () => {
    expect(splitsBalance(100, [])).toBe(true);
  });

  it("balances when splits sum to the amount", () => {
    expect(splitsBalance(100, [{ amount: 60 }, { amount: 40 }])).toBe(true);
  });

  it("flags splits that do not reconcile to the amount", () => {
    expect(splitsBalance(100, [{ amount: 60 }, { amount: 30 }])).toBe(false);
  });

  it("requires a positive amount and category for every expense split", () => {
    expect(
      validateTransactionSplits("expense", [
        { amount: 25, expenseCategory: "utilities" },
      ]),
    ).toBeUndefined();
    expect(validateTransactionSplits("expense", [{ amount: 0 }])).toBe(
      "Each split needs an amount greater than zero.",
    );
    expect(validateTransactionSplits("expense", [{ amount: 25 }])).toBe(
      "Each expense split needs an expense category.",
    );
    expect(
      validateTransactionSplits("expense", [
        { amount: 25, expenseCategory: "parking" },
      ]),
    ).toBe("Choose valid expense split categories.");
  });

  it("requires a positive amount and category for every income split", () => {
    expect(
      validateTransactionSplits("income", [
        { amount: 25, incomeCategory: "parking" },
      ]),
    ).toBeUndefined();
    expect(validateTransactionSplits("income", [{ amount: 25 }])).toBe(
      "Each income split needs an income category.",
    );
    expect(
      validateTransactionSplits("income", [
        { amount: 25, incomeCategory: "utilities" },
      ]),
    ).toBe("Choose valid income split categories.");
  });
});

describe("category validation", () => {
  it("validates categories against the entry type", () => {
    expect(validateLedgerCategory("expense", "utilities")).toBeUndefined();
    expect(validateLedgerCategory("income", "parking")).toBeUndefined();
    expect(validateLedgerCategory("expense", "parking")).toBe(
      "Choose a valid expense category.",
    );
    expect(validateLedgerCategory("income", "utilities")).toBe(
      "Choose a valid income category.",
    );
  });
});

describe("category split summaries", () => {
  it("sums split categories instead of the parent category", () => {
    const summary = summarizeDeductibleExpenses([
      makeEntry({
        id: "split-entry",
        expenseCategory: null,
        amount: 300,
        splits: [
          makeSplit({
            id: "s1",
            expenseCategory: "repairs_and_maintenance",
            amount: 200,
          }),
          makeSplit({ id: "s2", expenseCategory: "utilities", amount: 100 }),
        ],
      }),
    ]);

    expect(Object.fromEntries(summary)).toEqual({
      repairs_and_maintenance: 200,
      utilities: 100,
    });
  });
});

describe("mortgage interest in expense totals", () => {
  it("folds only mortgage-payment interest into interest and bank charges", () => {
    const summary = summarizeDeductibleExpenses(
      [],
      [
        {
          id: "payment-1",
          propertyId: "property-1",
          date: "2026-03-01",
          lender: "Test Lender",
          totalAmount: 1500,
          principal: 1000,
          interest: 450,
          fees: 50,
          memo: null,
        },
      ],
    );

    expect(Object.fromEntries(summary)).toEqual({
      interest_and_bank_charges: 450,
    });
  });
});

describe("prepaid expense allocation", () => {
  it("allocates the full amount when the service period sits within one year", () => {
    expect(
      allocatePrepaidToYear(
        {
          amount: 1200,
          prepaidStartDate: "2026-01-01",
          prepaidEndDate: "2026-12-31",
        },
        2026,
      ),
    ).toBe(1200);
  });

  it("allocates nothing to a year outside the service period", () => {
    expect(
      allocatePrepaidToYear(
        {
          amount: 1200,
          prepaidStartDate: "2026-01-01",
          prepaidEndDate: "2026-12-31",
        },
        2027,
      ),
    ).toBe(0);
  });

  it("splits a multi-year service period by day count", () => {
    const inserted = {
      amount: 365,
      prepaidStartDate: "2026-07-01",
      prepaidEndDate: "2027-06-30",
    };

    expect(allocatePrepaidToYear(inserted, 2026)).toBe(184);
    expect(allocatePrepaidToYear(inserted, 2027)).toBe(181);
  });

  it("allocates nothing for a transaction that is not prepaid", () => {
    expect(
      allocatePrepaidToYear(
        { amount: 500, prepaidStartDate: null, prepaidEndDate: null },
        2026,
      ),
    ).toBe(0);
  });
});
