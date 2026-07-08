"use client";

import { Landmark } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { setTransactionCapitalAssetStatus } from "@/lib/capital-actions";
import { toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

export function CapitalAssetControl({
  propertyId,
  transactionId,
  isCapitalAsset,
}: {
  propertyId: string;
  transactionId: string;
  isCapitalAsset: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const nextStatus = !isCapitalAsset;

  return (
    <div className="grid gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-7 rounded-md px-2",
          isCapitalAsset && cn(toneSurface.info, "hover:bg-info-border/40"),
        )}
        disabled={isSubmitting}
        onClick={async () => {
          setError(undefined);
          setIsSubmitting(true);

          try {
            const result = await setTransactionCapitalAssetStatus(
              propertyId,
              transactionId,
              nextStatus,
            );

            if (!result.ok) {
              setError(result.error);
            }
          } catch {
            setError("Unable to update the capital asset status.");
          }

          setIsSubmitting(false);
        }}
      >
        <Landmark data-icon="inline-start" />
        {isSubmitting
          ? isCapitalAsset
            ? "Unmarking..."
            : "Marking..."
          : isCapitalAsset
            ? "Unmark capital asset"
            : "Mark capital asset"}
      </Button>
      {error !== undefined ? (
        <p className="text-blocked text-xs">{error}</p>
      ) : null}
    </div>
  );
}
