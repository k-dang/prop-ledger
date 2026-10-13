"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteEvidenceDocument(propertyId, documentId);

      if (result.ok) {
        setIsOpen(false);
        return;
      }

      setError(result.error);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${fileName}`}
        title="Delete document"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            setError(undefined);
          }
        }}
        title="Delete document?"
        description={
          <>
            Delete &ldquo;{fileName}&rdquo;? This also removes its attachments
            and stored file. This action cannot be undone.
          </>
        }
        confirmLabel="Delete document"
        isPending={isDeleting}
        error={
          error === undefined
            ? undefined
            : { title: "Document wasn't deleted", message: error }
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
