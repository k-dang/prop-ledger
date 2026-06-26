"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PropertyWorkspaceDetail } from "@/components/property-workspace/property-detail";
import {
  addOwnerWithOwnership,
  addUnit,
  deleteOwner,
  deleteUnit,
} from "@/lib/actions";
import {
  createManualTransaction,
  deleteEvidenceDocument,
  deleteManualTransaction,
  uploadTransactionEvidence,
} from "@/lib/evidence-actions";
import type { NewManualTransactionInput } from "@/lib/evidence-binder";
import {
  getPropertyReadiness,
  type NewOwnerWithOwnershipInput,
  type NewUnitInput,
  type RentalProperty,
} from "@/lib/property-workspace";

export function PropertyWorkspace({
  propertyId,
  property,
}: {
  propertyId: string;
  property: RentalProperty | undefined;
}) {
  const router = useRouter();
  const [unitError, setUnitError] = useState<string>();
  const [ownerError, setOwnerError] = useState<string>();
  const [transactionError, setTransactionError] = useState<string>();
  const [documentError, setDocumentError] = useState<string>();

  if (property === undefined) {
    return <PropertyNotFound propertyId={propertyId} />;
  }

  const selectedId = property.id;

  async function handleAddUnit(input: NewUnitInput) {
    const result = await addUnit(selectedId, input);
    setUnitError(result.ok ? undefined : result.error);
    return result.ok;
  }

  async function handleDeleteUnit(unitId: string) {
    const result = await deleteUnit(selectedId, unitId);
    setUnitError(result.ok ? undefined : result.error);
    return result.ok;
  }

  async function handleAddOwner(input: NewOwnerWithOwnershipInput) {
    const result = await addOwnerWithOwnership(selectedId, input);
    setOwnerError(result.ok ? undefined : result.error);
    return result.ok;
  }

  async function handleDeleteOwner(ownerId: string) {
    const result = await deleteOwner(selectedId, ownerId);
    setOwnerError(result.ok ? undefined : result.error);
    return result.ok;
  }

  async function handleCreateManualTransaction(
    input: NewManualTransactionInput,
  ) {
    const result = await createManualTransaction(selectedId, input);
    setTransactionError(result.ok ? undefined : result.error);
    return result.ok;
  }

  async function handleUploadTransactionEvidence(
    transactionId: string,
    formData: FormData,
  ) {
    const result = await uploadTransactionEvidence(
      selectedId,
      transactionId,
      formData,
    );
    setDocumentError(result.ok ? undefined : result.error);
    return result.ok;
  }

  async function handleDeleteManualTransaction(transactionId: string) {
    const result = await deleteManualTransaction(selectedId, transactionId);
    setTransactionError(result.ok ? undefined : result.error);

    if (result.ok) {
      router.refresh();
    }

    return result.ok;
  }

  async function handleDeleteEvidenceDocument(documentId: string) {
    const result = await deleteEvidenceDocument(selectedId, documentId);
    setDocumentError(result.ok ? undefined : result.error);
    return result.ok;
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PropertyWorkspaceDetail
        property={property}
        readiness={getPropertyReadiness(property)}
        unitError={unitError}
        ownerError={ownerError}
        transactionError={transactionError}
        documentError={documentError}
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
        onAddOwner={handleAddOwner}
        onDeleteOwner={handleDeleteOwner}
        onCreateManualTransaction={handleCreateManualTransaction}
        onDeleteManualTransaction={handleDeleteManualTransaction}
        onUploadTransactionEvidence={handleUploadTransactionEvidence}
        onDeleteEvidenceDocument={handleDeleteEvidenceDocument}
      />
    </section>
  );
}

function PropertyNotFound({ propertyId }: { propertyId: string }) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="grid min-h-140 place-items-center rounded-md border border-dashed bg-background p-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid size-12 place-items-center rounded-md bg-blocked-surface text-blocked">
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
