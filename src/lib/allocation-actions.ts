"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import { ledgerEntries, transactionSplits } from "@/db/schema";
import { type ActionResult, runAction } from "@/lib/action-utils";
import {
  isRentalIncomeCategory,
  isT776Category,
  type TransactionSplitInput,
  validateLedgerCategory,
  validateTransactionSplits,
} from "@/lib/allocations";

export async function setTransactionCategory(
  propertyId: string,
  transactionId: string,
  category: string | null,
): Promise<ActionResult> {
  return runAction("Transaction category mutation", async () => {
    const entry = await findEntry(propertyId, transactionId);

    if (entry === undefined) {
      return { ok: false, error: "That transaction no longer exists." };
    }

    const categoryError = validateLedgerCategory(entry.type, category);

    if (categoryError !== undefined) {
      return { ok: false, error: categoryError };
    }

    await db
      .update(ledgerEntries)
      .set(
        entry.type === "expense"
          ? {
              expenseCategory:
                category !== null && isT776Category(category) ? category : null,
            }
          : {
              incomeCategory:
                category !== null && isRentalIncomeCategory(category)
                  ? category
                  : null,
            },
      )
      .where(eq(ledgerEntries.id, transactionId));
    return { ok: true };
  });
}

export async function setTransactionPrepaid(
  propertyId: string,
  transactionId: string,
  prepaidStartDate: string | null,
  prepaidEndDate: string | null,
): Promise<ActionResult> {
  return runAction("Transaction prepaid mutation", async () => {
    const clearing = prepaidStartDate === null && prepaidEndDate === null;

    if (!clearing && (prepaidStartDate === null || prepaidEndDate === null)) {
      return {
        ok: false,
        error: "Enter both a start and end date for the service period.",
      };
    }

    if (
      prepaidStartDate !== null &&
      prepaidEndDate !== null &&
      prepaidEndDate < prepaidStartDate
    ) {
      return {
        ok: false,
        error: "The service period end must be on or after its start.",
      };
    }

    const entry = await findEntry(propertyId, transactionId);

    if (entry === undefined) {
      return { ok: false, error: "That transaction no longer exists." };
    }

    await db
      .update(ledgerEntries)
      .set({ prepaidStartDate, prepaidEndDate })
      .where(eq(ledgerEntries.id, transactionId));
    return { ok: true };
  });
}

export async function saveTransactionSplits(
  propertyId: string,
  transactionId: string,
  splits: TransactionSplitInput[],
): Promise<ActionResult> {
  return runAction("Transaction splits mutation", async () => {
    const entry = await findEntry(propertyId, transactionId);

    if (entry === undefined) {
      return { ok: false, error: "That transaction no longer exists." };
    }

    const splitError = validateTransactionSplits(entry.type, splits);

    if (splitError !== undefined) {
      return { ok: false, error: splitError };
    }

    const deleteExisting = db
      .delete(transactionSplits)
      .where(eq(transactionSplits.ledgerEntryId, transactionId));

    if (splits.length === 0) {
      await deleteExisting;
      return { ok: true };
    }

    const rows = splits.map((split) => {
      const splitExpenseCategory = split.expenseCategory ?? "";
      const splitIncomeCategory = split.incomeCategory ?? "";
      const expenseCategory =
        entry.type === "expense" && isT776Category(splitExpenseCategory)
          ? splitExpenseCategory
          : null;
      const incomeCategory =
        entry.type === "income" && isRentalIncomeCategory(splitIncomeCategory)
          ? splitIncomeCategory
          : null;

      return {
        ledgerEntryId: transactionId,
        expenseCategory,
        incomeCategory,
        amount: split.amount,
        memo: split.memo ?? null,
      };
    });

    await db.batch([deleteExisting, db.insert(transactionSplits).values(rows)]);

    return { ok: true };
  });
}

function findEntry(propertyId: string, transactionId: string) {
  return db.query.ledgerEntries.findFirst({
    where: and(
      eq(ledgerEntries.id, transactionId),
      eq(ledgerEntries.propertyId, propertyId),
    ),
  });
}
