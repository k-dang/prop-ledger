"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import { ledgerEntries } from "@/db/schema";
import { type ActionResult, runAction } from "@/lib/action-utils";

export async function markTransactionAsCapitalAsset(
  propertyId: string,
  transactionId: string,
): Promise<ActionResult> {
  return runAction("Capital asset marker mutation", async () => {
    const entry = await db.query.ledgerEntries.findFirst({
      where: and(
        eq(ledgerEntries.id, transactionId),
        eq(ledgerEntries.propertyId, propertyId),
        eq(ledgerEntries.type, "expense"),
      ),
    });

    if (entry === undefined) {
      return {
        ok: false,
        error: "Only expense transactions can be marked as capital assets.",
      };
    }

    await db
      .update(ledgerEntries)
      .set({ isCapitalAsset: true })
      .where(eq(ledgerEntries.id, transactionId));

    return { ok: true };
  });
}
