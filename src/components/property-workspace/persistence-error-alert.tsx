import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export function PersistenceErrorAlert({ error }: { error?: string }) {
  if (error === undefined) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
