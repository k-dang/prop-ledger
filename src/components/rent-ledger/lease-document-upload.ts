"use client";

import type { ActionResult } from "@/lib/action-utils";
import {
  confirmLeaseDocumentUpload,
  presignLeaseDocumentUpload,
} from "@/lib/actions";
import { uploadEvidenceFile } from "@/lib/evidence-upload";

export type UploadLeaseDocument = (
  leaseId: string,
  formData: FormData,
) => boolean | Promise<boolean>;

export async function uploadLeaseDocument(
  propertyId: string,
  leaseId: string,
  formData: FormData,
): Promise<ActionResult> {
  return uploadEvidenceFile(
    formData,
    (declaration) =>
      presignLeaseDocumentUpload(propertyId, leaseId, declaration),
    (objectKey, declaration) =>
      confirmLeaseDocumentUpload(propertyId, leaseId, objectKey, declaration),
  );
}
