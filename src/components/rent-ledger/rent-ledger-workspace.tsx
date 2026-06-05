"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { RentLedgerDetail } from "@/components/rent-ledger/rent-ledger-detail";
import {
  addLeaseDocument,
  createLease,
  generateLeaseCharges,
  recordRentEvent,
} from "@/lib/actions";
import type {
  NewLeaseDocumentInput,
  NewLeaseInput,
  NewRentEventInput,
  RentLedger,
} from "@/lib/rent-ledger";

export function RentLedgerWorkspace({
  propertyId,
  ledger,
  year,
}: {
  propertyId: string;
  ledger: RentLedger | undefined;
  year: number;
}) {
  const [leaseError, setLeaseError] = useState<string>();
  const [eventError, setEventError] = useState<string>();
  const [documentError, setDocumentError] = useState<string>();

  if (ledger === undefined) {
    return <RentLedgerNotFound propertyId={propertyId} />;
  }

  async function handleCreateLease(input: NewLeaseInput) {
    const result = await createLease(input);
    setLeaseError(result.ok ? undefined : result.error);
    return result.ok;
  }

  async function handleGenerateCharges(leaseId: string) {
    const result = await generateLeaseCharges(leaseId, `${year}-12-31`);
    setLeaseError(result.ok ? undefined : result.error);
    return result.ok;
  }

  async function handleRecordEvent(input: NewRentEventInput) {
    const result = await recordRentEvent(propertyId, input);
    setEventError(result.ok ? undefined : result.error);
    return result.ok;
  }

  async function handleAddLeaseDocument(input: NewLeaseDocumentInput) {
    const result = await addLeaseDocument(propertyId, input);
    setDocumentError(result.ok ? undefined : result.error);
    return result.ok;
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <RentLedgerDetail
        ledger={ledger}
        year={year}
        leaseError={leaseError}
        eventError={eventError}
        documentError={documentError}
        onCreateLease={handleCreateLease}
        onGenerateCharges={handleGenerateCharges}
        onRecordEvent={handleRecordEvent}
        onAddLeaseDocument={handleAddLeaseDocument}
      />
    </section>
  );
}

function RentLedgerNotFound({ propertyId }: { propertyId: string }) {
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
