"use client";

import { useTransition } from "react";

export type UploadTransactionEvidence = (
  transactionId: string,
  formData: FormData,
) => boolean | Promise<boolean>;

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
