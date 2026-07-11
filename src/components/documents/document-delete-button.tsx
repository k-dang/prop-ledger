"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteEvidenceDocument } from "@/lib/evidence-actions";

export function DocumentDeleteButton({
  propertyId,
  documentId,
  fileName,
}: {
  propertyId: string;
  documentId: string;
  fileName: string;
}) {
  const [error, setError] = useState<string>();
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Delete ${fileName}? This also removes its attachments and the stored file.`,
      )
    ) {
      return;
    }

    startDelete(async () => {
      const result = await deleteEvidenceDocument(propertyId, documentId);
      setError(result.ok ? undefined : result.error);
    });
  }

  return (
    <div className="grid justify-items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${fileName}`}
        title="Delete document"
        disabled={isDeleting}
        onClick={handleDelete}
      >
        <Trash2 aria-hidden="true" />
      </Button>
      {error === undefined ? null : (
        <p className="text-destructive text-xs">{error}</p>
      )}
    </div>
  );
}
