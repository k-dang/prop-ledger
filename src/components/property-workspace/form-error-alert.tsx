import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * The single destructive alert used to surface a save/validation error string
 * across the property workspace. Renders nothing when there is no message, so
 * callers can pass error state straight through.
 */
export function FormErrorAlert({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
