"use client";

import type { ActionFailure, ActionResult } from "./action-utils";
import {
  type EvidenceFileDeclaration,
  validateEvidenceFileDeclaration,
} from "./evidence-upload-policy";

type PresignedUpload =
  | { ok: true; uploadUrl: string; objectKey: string }
  | ActionFailure;

const UPLOAD_FAILED_MESSAGE =
  "The upload failed, so nothing was attached. Check your connection and try again.";

/** Validate, upload directly to storage, then confirm the record-specific link. */
export async function uploadEvidenceFile(
  formData: FormData,
  presign: (declaration: EvidenceFileDeclaration) => Promise<PresignedUpload>,
  confirm: (
    objectKey: string,
    declaration: EvidenceFileDeclaration,
  ) => Promise<ActionResult>,
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
  const error = validateEvidenceFileDeclaration(declaration);
  if (error !== undefined) {
    return { ok: false, error };
  }

  const presigned = await presign(declaration);
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

  return confirm(presigned.objectKey, declaration);
}
