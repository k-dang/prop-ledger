"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPortfolio } from "@/lib/actions";

const CONFIRMATION = "RESET";

export function SettingsDangerZone() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    if (confirmation !== CONFIRMATION) {
      return;
    }

    startTransition(async () => {
      const result = await resetPortfolio(confirmation);

      if (!result.ok) {
        setError(result.error ?? "Unable to reset the portfolio.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-3xl border-destructive/30 bg-background">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>
          These actions permanently change the entire workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Field>
              <FieldLabel htmlFor="reset-confirmation">
                Reset portfolio data
              </FieldLabel>
              <FieldDescription>
                Deletes every property and all related units, owners, leases,
                transactions, documents, and Year-End Packages. Type RESET to
                confirm.
              </FieldDescription>
              <Input
                id="reset-confirmation"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  setError(undefined);
                }}
                autoComplete="off"
                spellCheck={false}
                className="max-w-xs bg-background"
              />
            </Field>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmation !== CONFIRMATION || isPending}
              onClick={handleReset}
            >
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              {isPending ? "Resetting…" : "Reset portfolio"}
            </Button>
          </div>
          <FormErrorAlert message={error} />
        </div>
      </CardContent>
    </Card>
  );
}
