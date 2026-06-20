"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import { ledgerEntries } from "@/db/schema";
import { type ActionResult, runAction } from "@/lib/action-utils";

export async function setTransactionCapitalAssetStatus(
  propertyId: string,
  transactionId: string,
  isCapitalAsset: boolean,
): Promise<ActionResult> {
  return runAction("Capital asset marker mutation", async () => {
    const updatedEntries = await db
      .update(ledgerEntries)
      .set({ isCapitalAsset })
      .where(
        and(
          eq(ledgerEntries.id, transactionId),
          eq(ledgerEntries.propertyId, propertyId),
          eq(ledgerEntries.type, "expense"),
        ),
      )
      .returning({ id: ledgerEntries.id });

    if (updatedEntries.length === 0) {
      return {
        ok: false,
        error: "Only expense transactions can be marked as capital assets.",
      };
    }

    return { ok: true };
  });
}
