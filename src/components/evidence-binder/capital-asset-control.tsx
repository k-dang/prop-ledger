"use client";

import { Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markTransactionAsCapitalAsset } from "@/lib/capital-actions";

export function CapitalAssetControl({
  propertyId,
  transactionId,
  isCapitalAsset,
}: {
  propertyId: string;
  transactionId: string;
  isCapitalAsset: boolean;
}) {
  if (isCapitalAsset) {
    return (
      <Badge
        variant="outline"
        className="mt-2 w-fit rounded-md border-sky-300 bg-sky-50 text-sky-800"
      >
        <Landmark className="size-3" aria-hidden="true" />
        Capital asset
      </Badge>
    );
  }

  return (
    <CapitalAssetButton propertyId={propertyId} transactionId={transactionId} />
  );
}

function CapitalAssetButton({
  propertyId,
  transactionId,
}: {
  propertyId: string;
  transactionId: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <div className="mt-2 grid gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 rounded-md px-2"
        disabled={isSubmitting}
        onClick={async () => {
          setError(undefined);
          setIsSubmitting(true);

          try {
            const result = await markTransactionAsCapitalAsset(
              propertyId,
              transactionId,
            );

            if (!result.ok) {
              setError(result.error);
              return;
            }

            router.refresh();
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <Landmark data-icon="inline-start" />
        {isSubmitting ? "Marking..." : "Mark capital asset"}
      </Button>
      {error !== undefined ? (
        <p className="text-red-700 text-xs">{error}</p>
      ) : null}
    </div>
  );
}
