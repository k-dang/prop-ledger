"use client";

import { CircleAlert, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (isDeleting) {
          return;
        }

        setIsOpen(open);
        if (open) {
          setError(undefined);
        }
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${fileName}`}
            title="Delete document"
          />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete document?</AlertDialogTitle>
          <AlertDialogDescription>
            Delete &ldquo;{fileName}&rdquo;? This also removes its attachments
            and stored file. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error === undefined ? null : (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Document wasn&apos;t deleted</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting…" : "Delete document"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
