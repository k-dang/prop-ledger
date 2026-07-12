"use client";

import { AlertTriangle } from "lucide-react";
import { useReducer } from "react";
import { uploadTransactionEvidence } from "@/components/evidence-binder/transaction-evidence-upload";
import { PropertyWorkspaceDetail } from "@/components/property-workspace/property-detail";
import {
  addLeaseDocument,
  addOwnerWithOwnership,
  addUnit,
  createLease,
  deleteLease,
  deleteOwner,
  deleteRentEvent,
  deleteUnit,
  recordRentEvent,
} from "@/lib/actions";
import {
  createManualTransaction,
  deleteEvidenceDocument,
  deleteManualTransaction,
  type ManualTransactionCreationResult,
} from "@/lib/evidence-actions";
import type { NewManualTransactionInput } from "@/lib/evidence-binder";
import {
  getPropertyReadiness,
  type NewOwnerWithOwnershipInput,
  type NewUnitInput,
  type PropertyWorkspaceData,
} from "@/lib/property-workspace";
import type {
  NewLeaseDocumentInput,
  NewLeaseInput,
  NewRentEventInput,
} from "@/lib/rent-ledger";

type WorkspaceErrorKey =
  | "leaseDocument"
  | "lease"
  | "owner"
  | "rentEvent"
  | "transaction"
  | "transactionDocument"
  | "unit";

type WorkspaceErrors = Partial<Record<WorkspaceErrorKey, string>>;

function workspaceErrorReducer(
  state: WorkspaceErrors,
  {
    error,
    key,
  }: {
    error?: string;
    key: WorkspaceErrorKey;
  },
): WorkspaceErrors {
  if (state[key] === error) {
    return state;
  }

  return { ...state, [key]: error };
}

export function PropertyWorkspace({
  propertyId,
  workspace,
  year,
}: {
  propertyId: string;
  workspace: PropertyWorkspaceData | undefined;
  year: number;
}) {
  const [errors, dispatchError] = useReducer(workspaceErrorReducer, {});

  if (workspace === undefined) {
    return <PropertyNotFound propertyId={propertyId} />;
  }

  const { property, rentLedger } = workspace;
  const selectedId = property.id;

  async function runWorkspaceMutation(
    key: WorkspaceErrorKey,
    mutate: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    const result = await mutate();
    dispatchError({ key, error: result.ok ? undefined : result.error });
    return result.ok;
  }

  async function handleAddUnit(input: NewUnitInput) {
    return runWorkspaceMutation("unit", () => addUnit(selectedId, input));
  }

  async function handleDeleteUnit(unitId: string) {
    return runWorkspaceMutation("unit", () => deleteUnit(selectedId, unitId));
  }

  async function handleAddOwner(input: NewOwnerWithOwnershipInput) {
    return runWorkspaceMutation("owner", () =>
      addOwnerWithOwnership(selectedId, input),
    );
  }

  async function handleDeleteOwner(ownerId: string) {
    return runWorkspaceMutation("owner", () =>
      deleteOwner(selectedId, ownerId),
    );
  }

  async function handleCreateLease(input: NewLeaseInput) {
    return runWorkspaceMutation("lease", () => createLease(input));
  }

  async function handleDeleteLease(leaseId: string) {
    return runWorkspaceMutation("lease", () => deleteLease(leaseId));
  }

  async function handleRecordRentEvent(input: NewRentEventInput) {
    return runWorkspaceMutation("rentEvent", () =>
      recordRentEvent(selectedId, input),
    );
  }

  async function handleDeleteRentEvent(rentEventId: string) {
    return runWorkspaceMutation("rentEvent", () =>
      deleteRentEvent(selectedId, rentEventId),
    );
  }

  async function handleAddLeaseDocument(input: NewLeaseDocumentInput) {
    return runWorkspaceMutation("leaseDocument", () =>
      addLeaseDocument(selectedId, input),
    );
  }

  async function handleCreateManualTransaction(
    input: NewManualTransactionInput,
  ): Promise<ManualTransactionCreationResult> {
    const result = await createManualTransaction(selectedId, input);
    dispatchError({
      key: "transaction",
      error: result.ok ? undefined : result.error,
    });
    return result;
  }

  async function handleUploadTransactionEvidence(
    transactionId: string,
    formData: FormData,
  ) {
    return runWorkspaceMutation("transactionDocument", () =>
      uploadTransactionEvidence(selectedId, transactionId, formData),
    );
  }

  async function handleDeleteManualTransaction(transactionId: string) {
    return runWorkspaceMutation("transaction", () =>
      deleteManualTransaction(selectedId, transactionId),
    );
  }

  async function handleDeleteEvidenceDocument(documentId: string) {
    return runWorkspaceMutation("transactionDocument", () =>
      deleteEvidenceDocument(selectedId, documentId),
    );
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PropertyWorkspaceDetail
        property={property}
        rentLedger={rentLedger}
        year={year}
        readiness={getPropertyReadiness(property)}
        unitError={errors.unit}
        ownerError={errors.owner}
        leaseError={errors.lease}
        rentEventError={errors.rentEvent}
        transactionError={errors.transaction}
        leaseDocumentError={errors.leaseDocument}
        transactionDocumentError={errors.transactionDocument}
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
        onAddOwner={handleAddOwner}
        onDeleteOwner={handleDeleteOwner}
        onCreateLease={handleCreateLease}
        onDeleteLease={handleDeleteLease}
        onRecordRentEvent={handleRecordRentEvent}
        onDeleteRentEvent={handleDeleteRentEvent}
        onAddLeaseDocument={handleAddLeaseDocument}
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
