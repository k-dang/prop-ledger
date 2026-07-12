"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import { documentLinks, documents, ledgerEntries } from "@/db/schema";
import {
  type ActionFailure,
  type ActionResult,
  runAction,
  SAVE_FAILED_MESSAGE,
} from "@/lib/action-utils";
import { validateLedgerCategory } from "@/lib/allocations";
import { transactionMutationCacheTags } from "@/lib/cache-tags";
import type { NewManualTransactionInput } from "@/lib/evidence-binder";
import {
  createPresignedEvidenceUploadUrl,
  deleteEvidenceObjectBestEffort,
  evidenceObjectStorageUrl,
  headEvidenceObject,
} from "@/lib/evidence-blob-storage";
import {
  createEvidenceObjectKey,
  type EvidenceFileDeclaration,
  validateEvidenceFileDeclaration,
  validateUploadedEvidenceObject,
} from "@/lib/evidence-upload-policy";

export type ManualTransactionCreationResult =
  | { ok: true; transactionId: string }
  | ActionFailure;

export async function createManualTransaction(
  propertyId: string,
  input: NewManualTransactionInput,
): Promise<ManualTransactionCreationResult> {
  return runAction<{ ok: true; transactionId: string }>(
    "Evidence transaction mutation",
    async () => {
      if (input.type === "expense" && input.amount <= 0) {
        return {
          ok: false,
          error: "Enter an expense amount greater than zero.",
        };
      }

      const categoryError = validateLedgerCategory(
        input.type,
        input.type === "expense"
          ? (input.expenseCategory ?? null)
          : (input.incomeCategory ?? null),
      );

      if (categoryError !== undefined) {
        return { ok: false, error: categoryError };
      }

      const { isCapitalAsset, ...transactionInput } = input;
      const transaction = {
        propertyId,
        ...transactionInput,
        isCapitalAsset: input.type === "expense" && isCapitalAsset === true,
        isReconciled: true,
      };

      const [createdTransaction] = await db
        .insert(ledgerEntries)
        .values(transaction)
        .returning({ id: ledgerEntries.id });

      return { ok: true, transactionId: createdTransaction.id };
    },
    { invalidate: transactionMutationCacheTags(propertyId) },
  );
}

export async function deleteManualTransaction(
  propertyId: string,
  transactionId: string,
): Promise<ActionResult> {
  return runAction(
    "Manual transaction delete mutation",
    async () => {
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
    },
    { invalidate: transactionMutationCacheTags(propertyId) },
  );
}

export type PresignedEvidenceUpload =
  | { ok: true; uploadUrl: string; objectKey: string }
  | ActionFailure;

export async function presignTransactionEvidenceUpload(
  propertyId: string,
  transactionId: string,
  declaration: EvidenceFileDeclaration,
): Promise<PresignedEvidenceUpload> {
  try {
    const declarationError = validateEvidenceFileDeclaration(declaration);

    if (declarationError !== undefined) {
      return { ok: false, error: declarationError };
    }

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

    const objectKey = createEvidenceObjectKey(declaration.fileName);
    const uploadUrl = await createPresignedEvidenceUploadUrl(
      objectKey,
      declaration,
    );

    return { ok: true, uploadUrl, objectKey };
  } catch (error) {
    console.error("Evidence upload presign failed", error);
    return { ok: false, error: SAVE_FAILED_MESSAGE };
  }
}

export async function confirmTransactionEvidenceUpload(
  propertyId: string,
  transactionId: string,
  objectKey: string,
  declaration: EvidenceFileDeclaration,
): Promise<ActionResult> {
  return runAction(
    "Evidence upload confirm mutation",
    async () => {
      const declarationError = validateEvidenceFileDeclaration(declaration);

      if (declarationError !== undefined) {
        return { ok: false, error: declarationError };
      }

      const transaction = await db.query.ledgerEntries.findFirst({
        where: and(
          eq(ledgerEntries.id, transactionId),
          eq(ledgerEntries.propertyId, propertyId),
        ),
      });

      if (transaction === undefined) {
        return { ok: false, error: "That transaction no longer exists." };
      }

      const storedObject = await headEvidenceObject(objectKey);
      const integrityError = validateUploadedEvidenceObject(
        storedObject,
        declaration,
      );

      if (integrityError !== undefined) {
        return { ok: false, error: integrityError };
      }

      const documentId = crypto.randomUUID();

      await db.batch([
        db.insert(documents).values({
          id: documentId,
          propertyId,
          fileName: declaration.fileName,
          documentType: "receipt",
          storageUrl: evidenceObjectStorageUrl(objectKey),
          vendor: transaction.vendor,
          documentDate: transaction.date,
          amount: transaction.amount,
        }),
        db.insert(documentLinks).values({
          documentId,
          targetType: "transaction",
          targetId: transactionId,
        }),
      ]);

      return { ok: true };
    },
    { invalidate: transactionMutationCacheTags(propertyId) },
  );
}

export async function deleteEvidenceDocument(
  propertyId: string,
  documentId: string,
): Promise<ActionResult> {
  return runAction(
    "Evidence delete mutation",
    async () => {
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
          and(
            eq(documents.id, documentId),
            eq(documents.propertyId, propertyId),
          ),
        );
      await deleteEvidenceObjectBestEffort(document.storageUrl);

      return { ok: true };
    },
    { invalidate: transactionMutationCacheTags(propertyId) },
  );
}
