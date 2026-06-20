"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import { documentLinks, documents, ledgerEntries } from "@/db/schema";
import { type ActionResult, runAction } from "@/lib/action-utils";
import type { NewManualTransactionInput } from "@/lib/evidence-binder";
import {
  cleanupStoredEvidenceFile,
  deleteEvidenceFileBestEffort,
  isSupportedEvidenceFile,
  saveEvidenceFile,
} from "@/lib/evidence-file-storage";

export async function createManualTransaction(
  propertyId: string,
  input: NewManualTransactionInput,
): Promise<ActionResult> {
  return runAction("Evidence transaction mutation", async () => {
    if (input.type === "expense" && input.amount <= 0) {
      return { ok: false, error: "Enter an expense amount greater than zero." };
    }

    const { isCapitalAsset, ...transactionInput } = input;
    const transaction = {
      propertyId,
      ...transactionInput,
      isCapitalAsset: input.type === "expense" && isCapitalAsset === true,
      isReconciled: true,
    };

    await db.insert(ledgerEntries).values(transaction);
    return { ok: true };
  });
}

export async function deleteManualTransaction(
  propertyId: string,
  transactionId: string,
): Promise<ActionResult> {
  return runAction("Manual transaction delete mutation", async () => {
    const transaction = await db.query.ledgerEntries.findFirst({
      where: and(
        eq(ledgerEntries.id, transactionId),
        eq(ledgerEntries.propertyId, propertyId),
      ),
      columns: { id: true },
    });

    if (transaction === undefined) {
      return { ok: false, error: "That transaction no longer exists." };
    }

    await db.batch([
      db
        .delete(documentLinks)
        .where(
          and(
            eq(documentLinks.targetType, "transaction"),
            eq(documentLinks.targetId, transactionId),
          ),
        ),
      db
        .delete(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.id, transactionId),
            eq(ledgerEntries.propertyId, propertyId),
          ),
        ),
    ]);

    return { ok: true };
  });
}

export async function uploadTransactionEvidence(
  propertyId: string,
  transactionId: string,
  formData: FormData,
): Promise<ActionResult> {
  return runAction("Evidence upload mutation", async () => {
    const transaction = await db.query.ledgerEntries.findFirst({
      where: and(
        eq(ledgerEntries.id, transactionId),
        eq(ledgerEntries.propertyId, propertyId),
      ),
    });

    if (transaction === undefined) {
      return { ok: false, error: "That transaction no longer exists." };
    }

    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose a PDF or image file." };
    }

    if (!isSupportedEvidenceFile(file)) {
      return { ok: false, error: "Evidence files must be PDF or image files." };
    }

    const storedFile = await saveEvidenceFile(file);

    const documentId = crypto.randomUUID();
    const document = {
      id: documentId,
      propertyId,
      fileName: file.name,
      documentType: "receipt",
      storageUrl: storedFile.storageUrl,
      vendor: transaction.vendor,
      documentDate: transaction.date,
      amount: transaction.amount,
    };

    try {
      await db.batch([
        db.insert(documents).values(document),
        db.insert(documentLinks).values({
          documentId,
          targetType: "transaction",
          targetId: transactionId,
        }),
      ]);
    } catch (error) {
      await cleanupStoredEvidenceFile(storedFile);
      throw error;
    }

    return { ok: true };
  });
}

export async function deleteEvidenceDocument(
  propertyId: string,
  documentId: string,
): Promise<ActionResult> {
  return runAction("Evidence delete mutation", async () => {
    const document = await db.query.documents.findFirst({
      where: and(
        eq(documents.id, documentId),
        eq(documents.propertyId, propertyId),
      ),
    });

    if (document === undefined) {
      return { ok: false, error: "That document no longer exists." };
    }

    await db
      .delete(documents)
      .where(
        and(eq(documents.id, documentId), eq(documents.propertyId, propertyId)),
      );
    await deleteEvidenceFileBestEffort(document.storageUrl);

    return { ok: true };
  });
}
