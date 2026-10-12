"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import { mortgagePayments } from "@/db/schema";
import { type ActionResult, runAction } from "@/lib/action-utils";
import { mortgagePaymentMutationCacheTags } from "@/lib/cache-tags";
import {
  type MortgagePaymentAllocation,
  type NewMortgagePaymentInput,
  validateMortgageAllocation,
  validateMortgagePaymentInput,
} from "@/lib/mortgage-payments";

export async function recordMortgagePayment(
  propertyId: string,
  input: NewMortgagePaymentInput,
): Promise<ActionResult> {
  return runAction(
    "Mortgage payment mutation",
    async () => {
      const inputError = validateMortgagePaymentInput(input);

      if (inputError !== undefined) {
        return { ok: false, error: inputError };
      }

      await db.insert(mortgagePayments).values({ propertyId, ...input });

      return { ok: true };
    },
    { invalidate: mortgagePaymentMutationCacheTags(propertyId) },
  );
}

/**
 * Rewrites only the principal/interest split of an existing payment, leaving
 * its date, lender, and total untouched.
 */
export async function setMortgagePaymentAllocation(
  propertyId: string,
  paymentId: string,
  allocation: MortgagePaymentAllocation,
): Promise<ActionResult> {
  return runAction(
    "Mortgage payment allocation mutation",
    async () => {
      const allocationError = validateMortgageAllocation(allocation);

      if (allocationError !== undefined) {
        return { ok: false, error: allocationError };
      }

      const updated = await db
        .update(mortgagePayments)
        .set(allocation)
        .where(paymentScope(propertyId, paymentId))
        .returning({ id: mortgagePayments.id });

      if (updated.length === 0) {
        return { ok: false, error: "That payment no longer exists." };
      }

      return { ok: true };
    },
    { invalidate: mortgagePaymentMutationCacheTags(propertyId) },
  );
}

export async function deleteMortgagePayment(
  propertyId: string,
  paymentId: string,
): Promise<ActionResult> {
  return runAction(
    "Mortgage payment delete mutation",
    async () => {
      await db
        .delete(mortgagePayments)
        .where(paymentScope(propertyId, paymentId));
      return { ok: true };
    },
    { invalidate: mortgagePaymentMutationCacheTags(propertyId) },
  );
}

function paymentScope(propertyId: string, paymentId: string) {
  return and(
    eq(mortgagePayments.id, paymentId),
    eq(mortgagePayments.propertyId, propertyId),
  );
}
