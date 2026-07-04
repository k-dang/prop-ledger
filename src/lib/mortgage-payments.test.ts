import { describe, expect, it } from "vitest";

import type { MortgagePayment } from "./mortgage-payments";
import {
  isMortgagePaymentAllocated,
  mortgageInterestForYear,
  mortgagePaymentComponentsBalance,
  totalMortgageInterest,
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
