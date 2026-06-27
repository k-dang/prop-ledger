"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import { mortgagePayments } from "@/db/schema";
import { type ActionResult, runAction } from "@/lib/action-utils";
import { mortgagePaymentMutationCacheTags } from "@/lib/cache-tags";
import type { NewMortgagePaymentInput } from "@/lib/mortgage-payments";

export async function recordMortgagePayment(
  propertyId: string,
  input: NewMortgagePaymentInput,
): Promise<ActionResult> {
  return runAction(
    "Mortgage payment mutation",
    async () => {
      if (input.lender.trim().length === 0) {
        return { ok: false, error: "Enter the lender or payee." };
      }

      if (!Number.isFinite(input.totalAmount) || input.totalAmount <= 0) {
        return {
          ok: false,
          error: "Enter a payment amount greater than zero.",
        };
      }

      await db.insert(mortgagePayments).values({ propertyId, ...input });

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
        .where(
          and(
            eq(mortgagePayments.id, paymentId),
            eq(mortgagePayments.propertyId, propertyId),
          ),
        );
      return { ok: true };
    },
    { invalidate: mortgagePaymentMutationCacheTags(propertyId) },
  );
}
