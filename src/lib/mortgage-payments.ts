import type { MortgagePayment, NewMortgagePayment } from "@/db/schema";
import { roundMoney } from "@/lib/money";

export type { MortgagePayment } from "@/db/schema";

export type NewMortgagePaymentInput = Omit<
  NewMortgagePayment,
  "id" | "propertyId"
>;

export function totalMortgageInterest(payments: MortgagePayment[]): number {
  return roundMoney(
    payments.reduce((total, payment) => total + (payment.interest ?? 0), 0),
  );
}

export function mortgageInterestForYear(
  payments: MortgagePayment[],
  year: number,
): number {
  const yearPrefix = `${year}-`;

  return totalMortgageInterest(
    payments.filter((payment) => payment.date.startsWith(yearPrefix)),
  );
}

export function isMortgagePaymentAllocated(
  payment: Pick<MortgagePayment, "principal" | "interest">,
): boolean {
  return payment.principal !== null || payment.interest !== null;
}

export type MortgagePaymentAllocation = {
  principal: number | null;
  interest: number | null;
};

/**
 * Returns an error message when a payment's principal/interest split is
 * unusable, or `undefined` when it is valid. Both components are optional:
 * `null` keeps the payment unallocated, and a split that misses the total is
 * allowed so the mismatch stays visible instead of being silently corrected.
 */
export function validateMortgageAllocation(
  allocation: MortgagePaymentAllocation,
): string | undefined {
  return (
    validateMortgageComponent("Principal", allocation.principal) ??
    validateMortgageComponent("Interest", allocation.interest)
  );
}

/** Validates a full payment record before it is inserted or updated. */
export function validateMortgagePaymentInput(
  input: NewMortgagePaymentInput,
): string | undefined {
  if (input.lender.trim().length === 0) {
    return "Enter the lender or payee.";
  }

  if (!Number.isFinite(input.totalAmount) || input.totalAmount <= 0) {
    return "Enter a payment amount greater than zero.";
  }

  return validateMortgageAllocation({
    principal: input.principal ?? null,
    interest: input.interest ?? null,
  });
}

function validateMortgageComponent(
  label: string,
  value: number | null,
): string | undefined {
  if (value === null) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    return `Enter a valid ${label.toLowerCase()} amount.`;
  }

  if (value < 0) {
    return `${label} can't be negative.`;
  }

  return undefined;
}

/**
 * Sums a principal/interest split against the payment total. Every balance
 * display and status badge goes through here so the live hint and the stored
 * badge can never disagree about rounding.
 */
export function mortgageSplitSummary(
  totalAmount: number,
  principal: number | null,
  interest: number | null,
): {
  allocated: number;
  remaining: number;
  balanced: boolean;
} {
  const allocated = roundMoney((principal ?? 0) + (interest ?? 0));
  const total = roundMoney(totalAmount);

  return {
    allocated,
    remaining: roundMoney(total - allocated),
    balanced: allocated === total,
  };
}

export function mortgagePaymentComponentsBalance(
  payment: Pick<MortgagePayment, "totalAmount" | "principal" | "interest">,
): boolean {
  if (!isMortgagePaymentAllocated(payment)) {
    return true;
  }

  return mortgageSplitSummary(
    payment.totalAmount,
    payment.principal,
    payment.interest,
  ).balanced;
}
