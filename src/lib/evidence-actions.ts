"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import { documentLinks, documents, ledgerEntries } from "@/db/schema";
import {
  type ActionResult,
  runAction,
  SAVE_FAILED_MESSAGE,
} from "@/lib/action-utils";
import type { NewManualTransactionInput } from "@/lib/evidence-binder";
import {
  cleanupStoredEvidenceFile,
  deleteEvidenceFile,
  isSupportedEvidenceFile,
  type StoredEvidenceFile,
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

    await db.insert(ledgerEntries).values({
      propertyId,
      ...transactionInput,
      isCapitalAsset: input.type === "expense" && isCapitalAsset === true,
      isPersonal: false,
      isReconciled: true,
    });
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

    try {
      await createEvidenceDocumentLink({
        propertyId,
        transactionId,
        storedFile,
        originalFileName: file.name,
        transaction,
      });
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
    await deleteEvidenceFile(document.storageUrl);

    return { ok: true };
  });
}

async function createEvidenceDocumentLink({
  propertyId,
  transactionId,
  storedFile,
  originalFileName,
  transaction,
}: {
  propertyId: string;
  transactionId: string;
  storedFile: StoredEvidenceFile;
  originalFileName: string;
  transaction: typeof ledgerEntries.$inferSelect;
}) {
  const [inserted] = await db
    .insert(documents)
    .values({
      propertyId,
      fileName: originalFileName,
      documentType: "receipt",
      storageUrl: storedFile.storageUrl,
      vendor: transaction.vendor,
      documentDate: transaction.date,
      amount: transaction.amount,
    })
    .returning({ id: documents.id });

  if (inserted === undefined) {
    throw new Error(SAVE_FAILED_MESSAGE);
  }

  try {
    await db.insert(documentLinks).values({
      documentId: inserted.id,
      targetType: "transaction",
      targetId: transactionId,
    });
  } catch (error) {
    await db.delete(documents).where(eq(documents.id, inserted.id));
    throw error;
  }
}
