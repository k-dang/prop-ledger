"use client";

import { CircleAlert } from "lucide-react";
import { type ReactNode, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import type { Button } from "@/components/ui/button";

/**
 * Owns the pending payload for one confirm dialog: `request` a value to open
 * it, `take` the value to close it and act on it. Pass `open` and
 * `onOpenChange` straight into {@link ConfirmDialog}.
 */
export function usePendingConfirm<T>() {
  const [target, setTarget] = useState<T | null>(null);

  return {
    target,
    open: target !== null,
    request: (value: T) => setTarget(value),
    onOpenChange: (open: boolean) => {
      if (!open) setTarget(null);
    },
    take: () => {
      const value = target;
      setTarget(null);
      return value;
    },
  };
}

/**
 * The single confirm pattern for destructive / discarding actions.
 * Controlled — callers own `open` and close it in `onConfirm`.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "destructive",
  isPending = false,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  isPending?: boolean;
  /** Shown between the description and footer; the dialog stays open. */
  error?: { title: string; message: string };
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error === undefined ? null : (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>{error.title}</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant={variant}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
