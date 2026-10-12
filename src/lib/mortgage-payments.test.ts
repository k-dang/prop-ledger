import { describe, expect, it } from "vitest";

import type { MortgagePayment } from "./mortgage-payments";
import {
  isMortgagePaymentAllocated,
  mortgageInterestForYear,
  mortgagePaymentComponentsBalance,
  mortgageSplitSummary,
  totalMortgageInterest,
  validateMortgageAllocation,
  validateMortgagePaymentInput,
} from "./mortgage-payments";

function makePayment(
  payment: Partial<MortgagePayment> & Pick<MortgagePayment, "id">,
): MortgagePayment {
  return {
    propertyId: "property-1",
    date: "2026-03-01",
    lender: "Test Lender",
    totalAmount: 1500,
    principal: 1000,
    interest: 450,
    ...payment,
  };
}

describe("mortgage interest", () => {
  it("sums only the interest component across payments", () => {
    expect(
      totalMortgageInterest([
        makePayment({ id: "p1", interest: 450 }),
        makePayment({ id: "p2", interest: 440 }),
        makePayment({ id: "p3", interest: null }),
      ]),
    ).toBe(890);
  });

  it("scopes interest to a tax year by payment date", () => {
    const payments = [
      makePayment({ id: "p1", date: "2025-12-01", interest: 100 }),
      makePayment({ id: "p2", date: "2026-01-01", interest: 200 }),
      makePayment({ id: "p3", date: "2026-12-31", interest: 50 }),
    ];

    expect(mortgageInterestForYear(payments, 2026)).toBe(250);
  });
});

describe("mortgage payment allocation", () => {
  it("treats a payment with no components as unallocated", () => {
    expect(
      isMortgagePaymentAllocated(
        makePayment({ id: "p1", principal: null, interest: null }),
      ),
    ).toBe(false);
  });

  it("treats an unallocated payment as balanced", () => {
    expect(
      mortgagePaymentComponentsBalance(
        makePayment({ id: "p1", principal: null, interest: null }),
      ),
    ).toBe(true);
  });

  it("balances when components sum to the amount paid", () => {
    expect(
      mortgagePaymentComponentsBalance(
        makePayment({
          id: "p1",
          totalAmount: 1500,
          principal: 1050,
          interest: 450,
        }),
      ),
    ).toBe(true);
  });

  it("flags an allocated payment whose components miss the total", () => {
    expect(
      mortgagePaymentComponentsBalance(
        makePayment({
          id: "p1",
          totalAmount: 1500,
          principal: 1000,
          interest: 400,
        }),
      ),
    ).toBe(false);
  });
});

describe("mortgage payment validation", () => {
  it("accepts an unallocated split", () => {
    expect(
      validateMortgageAllocation({ principal: null, interest: null }),
    ).toBeUndefined();
  });

  it("accepts a balanced split", () => {
    expect(
      validateMortgageAllocation({ principal: 3000, interest: 156 }),
    ).toBeUndefined();
  });

  it("allows a split that misses the total so the mismatch stays visible", () => {
    expect(
      validateMortgageAllocation({ principal: 3000, interest: 100 }),
    ).toBeUndefined();
  });

  it("rejects negative components", () => {
    expect(validateMortgageAllocation({ principal: -1, interest: 100 })).toBe(
      "Principal can't be negative.",
    );
    expect(validateMortgageAllocation({ principal: 100, interest: -1 })).toBe(
      "Interest can't be negative.",
    );
  });

  it("rejects non-finite components", () => {
    expect(
      validateMortgageAllocation({
        principal: Number.NaN,
        interest: null,
      }),
    ).toBe("Enter a valid principal amount.");
  });

  it("requires a lender and a positive total for a full payment", () => {
    expect(
      validateMortgagePaymentInput({
        date: "2026-01-20",
        lender: "   ",
        totalAmount: 3156,
        principal: null,
        interest: null,
      }),
    ).toBe("Enter the lender or payee.");
    expect(
      validateMortgagePaymentInput({
        date: "2026-01-20",
        lender: "RBC",
        totalAmount: 0,
        principal: null,
        interest: null,
      }),
    ).toBe("Enter a payment amount greater than zero.");
    expect(
      validateMortgagePaymentInput({
        date: "2026-01-20",
        lender: "RBC",
        totalAmount: 3156,
        principal: 3000,
        interest: 156,
      }),
    ).toBeUndefined();
  });
});

describe("mortgage split summary", () => {
  it("sums the split against the payment total", () => {
    expect(mortgageSplitSummary(3156, 3000, 100)).toEqual({
      allocated: 3100,
      remaining: 56,
      balanced: false,
    });
  });

  it("reports a balanced split as fully allocated with nothing remaining", () => {
    expect(mortgageSplitSummary(3156, 3000, 156)).toEqual({
      allocated: 3156,
      remaining: 0,
      balanced: true,
    });
  });

  it("treats a missing component as zero", () => {
    expect(mortgageSplitSummary(1500, 1500, null)).toEqual({
      allocated: 1500,
      remaining: 0,
      balanced: true,
    });
  });

  it("reports a fully unallocated split against the whole total", () => {
    expect(mortgageSplitSummary(1500, null, null)).toEqual({
      allocated: 0,
      remaining: 1500,
      balanced: false,
    });
  });

  it("rounds to cents, matching the balance badge rule", () => {
    expect(mortgageSplitSummary(3156, 3155.996, null).balanced).toBe(true);
    expect(mortgageSplitSummary(3156, 3000, 100.004).remaining).toBe(56);
  });
});
