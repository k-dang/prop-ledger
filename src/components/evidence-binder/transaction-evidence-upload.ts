"use client";

import { useTransition } from "react";

import type { ActionResult } from "@/lib/action-utils";
import {
  confirmTransactionEvidenceUpload,
  presignTransactionEvidenceUpload,
} from "@/lib/evidence-actions";
import { validateEvidenceFileDeclaration } from "@/lib/evidence-upload-policy";

export type UploadTransactionEvidence = (
  transactionId: string,
  formData: FormData,
) => boolean | Promise<boolean>;

const UPLOAD_FAILED_MESSAGE =
  "The upload failed, so nothing was attached. Check your connection and try again.";

/**
 * Uploads evidence in the three-step presigned flow (ADR 0002): the server
 * mints a presigned PUT URL, the browser sends the bytes straight to R2, and
 * the server confirms the object landed before recording the document.
 */
export async function uploadTransactionEvidence(
  propertyId: string,
  transactionId: string,
  formData: FormData,
): Promise<ActionResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, error: "Choose a PDF or image file." };
  }

  const declaration = {
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  };
  const declarationError = validateEvidenceFileDeclaration(declaration);

  if (declarationError !== undefined) {
    return { ok: false, error: declarationError };
  }

  const presigned = await presignTransactionEvidenceUpload(
    propertyId,
    transactionId,
    declaration,
  );

  if (!presigned.ok) {
    return presigned;
  }

  try {
    const response = await fetch(presigned.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!response.ok) {
      return { ok: false, error: UPLOAD_FAILED_MESSAGE };
    }
  } catch {
    return { ok: false, error: UPLOAD_FAILED_MESSAGE };
  }

  return confirmTransactionEvidenceUpload(
    propertyId,
    transactionId,
    presigned.objectKey,
    declaration,
  );
}

export function useTransactionEvidenceUpload({
  transactionId,
  onUploadEvidence,
}: {
  transactionId: string;
  onUploadEvidence: UploadTransactionEvidence;
}) {
  const [isUploading, startUpload] = useTransition();

  function uploadForm(form: HTMLFormElement) {
    startUpload(async () => {
      const saved = await onUploadEvidence(transactionId, new FormData(form));

      if (saved) {
        form.reset();
      }
    });
  }

  function uploadFile(input: HTMLInputElement, file: File) {
    const formData = new FormData();
    formData.set("file", file);

    startUpload(async () => {
      const saved = await onUploadEvidence(transactionId, formData);

      if (saved) {
        input.value = "";
      }
    });
  }

  return { isUploading, uploadFile, uploadForm };
}
