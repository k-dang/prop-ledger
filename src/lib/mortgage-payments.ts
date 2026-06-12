import type { MortgagePayment, NewMortgagePayment } from "@/db/schema";

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
  payment: Pick<MortgagePayment, "principal" | "interest" | "fees">,
): boolean {
  return (
    payment.principal !== null ||
    payment.interest !== null ||
    payment.fees !== null
  );
}

export function mortgagePaymentComponentsBalance(
  payment: Pick<
    MortgagePayment,
    "totalAmount" | "principal" | "interest" | "fees"
  >,
): boolean {
  if (!isMortgagePaymentAllocated(payment)) {
    return true;
  }

  const componentTotal = roundMoney(
    (payment.principal ?? 0) + (payment.interest ?? 0) + (payment.fees ?? 0),
  );

  return componentTotal === roundMoney(payment.totalAmount);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
