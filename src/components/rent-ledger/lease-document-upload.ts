"use client";

import type { ActionResult } from "@/lib/action-utils";
import {
  confirmLeaseDocumentUpload,
  presignLeaseDocumentUpload,
} from "@/lib/actions";
import { validateEvidenceFileDeclaration } from "@/lib/evidence-upload-policy";

export type UploadLeaseDocument = (
  leaseId: string,
  formData: FormData,
) => boolean | Promise<boolean>;

const UPLOAD_FAILED_MESSAGE =
  "The upload failed, so nothing was attached. Check your connection and try again.";

/** Uploads a lease PDF or image directly to R2, then links it to the lease. */
export async function uploadLeaseDocument(
  propertyId: string,
  leaseId: string,
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

  const presigned = await presignLeaseDocumentUpload(
    propertyId,
    leaseId,
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

  return confirmLeaseDocumentUpload(
    propertyId,
    leaseId,
    presigned.objectKey,
    declaration,
  );
}
