"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { addOwner, addOwnershipPeriod, addUnit } from "@/lib/actions";
import { PropertyWorkspaceDetail } from "@/components/property-workspace/property-detail";
import type {
  NewOwnerInput,
  NewOwnershipPeriodInput,
  NewUnitInput,
} from "@/components/property-workspace/workspace-types";
import {
  getPropertyReadiness,
  type RentalProperty,
} from "@/lib/property-workspace";

export function PropertyWorkspace({
  propertyId,
  property,
}: {
  propertyId: string;
  property: RentalProperty | undefined;
}) {
  const [ownershipError, setOwnershipError] = useState<string>();

  if (property === undefined) {
    return <PropertyNotFound propertyId={propertyId} />;
  }

  const selectedId = property.id;

  function handleAddUnit(input: NewUnitInput) {
    return addUnit(selectedId, input);
  }

  function handleAddOwner(input: NewOwnerInput) {
    return addOwner(selectedId, input);
  }

  async function handleAddOwnershipPeriod(input: NewOwnershipPeriodInput) {
    const result = await addOwnershipPeriod(selectedId, input);
    setOwnershipError(result.ok ? undefined : result.error);
    return result.ok;
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PropertyWorkspaceDetail
        property={property}
        readiness={getPropertyReadiness(property)}
        ownershipError={ownershipError}
        onAddUnit={handleAddUnit}
        onAddOwner={handleAddOwner}
        onAddOwnershipPeriod={handleAddOwnershipPeriod}
      />
    </section>
  );
}

function PropertyNotFound({ propertyId }: { propertyId: string }) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="grid min-h-140 place-items-center rounded-md border border-dashed bg-background p-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid size-12 place-items-center rounded-md bg-red-50 text-red-700">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-semibold text-xl">Property not found</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            No stored property matches {propertyId}. Select another property
            from the dashboard.
          </p>
        </div>
      </div>
    </section>
  );
}
