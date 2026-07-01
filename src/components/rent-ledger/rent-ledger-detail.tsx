"use client";

import {
  FileText,
  type LucideIcon,
  Plus,
  Receipt,
  Trash2,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { z } from "zod";

import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import {
  finiteFormNumber,
  optionalFormString,
  requiredFormString,
} from "@/components/property-workspace/form-schemas";
import { createFormSubmit } from "@/components/property-workspace/form-submit";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RENT_FREQUENCIES, type RentFrequency } from "@/db/schema";
import {
  formatMoney,
  getLeaseDocuments,
  type Lease,
  type NewLeaseDocumentInput,
  type NewLeaseInput,
  type NewRentEventInput,
  type RentLedger,
  summarizeRentLedger,
} from "@/lib/rent-ledger";
import { cn } from "@/lib/utils";

const FREQUENCY_LABELS: Record<RentFrequency, string> = {
  monthly: "Monthly",
  biweekly: "Biweekly",
  weekly: "Weekly",
};

const leaseFormSchema = z
  .object({
    unitId: requiredFormString,
    tenantName: requiredFormString,
    startDate: requiredFormString,
    endDate: optionalFormString,
    rentAmount: finiteFormNumber,
    rentFrequency: z.enum(RENT_FREQUENCIES),
  })
  .transform(
    (data): NewLeaseInput => ({
      unitId: data.unitId,
      tenantName: data.tenantName,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      rentAmount: data.rentAmount,
      rentFrequency: data.rentFrequency,
    }),
  );

const rentEventFormSchema = z
  .object({
    leaseId: requiredFormString,
    date: requiredFormString,
    amount: finiteFormNumber,
    memo: optionalFormString,
  })
  .transform(
    (data): NewRentEventInput => ({
      type: "payment",
      leaseId: data.leaseId,
      date: data.date,
      amount: data.amount,
      memo: data.memo ?? null,
    }),
  );

const leaseDocumentFormSchema = z.object({
  fileName: requiredFormString,
  documentType: requiredFormString,
  storageUrl: optionalFormString,
});

export function RentLedgerDetail({
  ledger,
  year,
  leaseError,
  eventError,
  documentError,
  onCreateLease,
  onDeleteLease,
  onRecordEvent,
  onDeleteEvent,
  onAddLeaseDocument,
  showActivityTools = true,
  showActivityTable = true,
}: {
  ledger: RentLedger;
  year: number;
  leaseError?: string;
  eventError?: string;
  documentError?: string;
  onCreateLease: (input: NewLeaseInput) => boolean | Promise<boolean>;
  onDeleteLease: (leaseId: string) => boolean | Promise<boolean>;
  onRecordEvent: (input: NewRentEventInput) => boolean | Promise<boolean>;
  onDeleteEvent: (rentEventId: string) => boolean | Promise<boolean>;
  onAddLeaseDocument: (
    input: NewLeaseDocumentInput,
  ) => boolean | Promise<boolean>;
  showActivityTools?: boolean;
  showActivityTable?: boolean;
}) {
  const unitLabels = new Map(ledger.units.map((unit) => [unit.id, unit.label]));

  return (
    <div className="grid gap-4">
      <div
        className={cn(
          "grid gap-4",
          showActivityTools && "xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]",
        )}
      >
        <LeasesPanel
          ledger={ledger}
          unitLabels={unitLabels}
          leaseError={leaseError}
          documentError={documentError}
          onCreateLease={onCreateLease}
          onDeleteLease={onDeleteLease}
          onAddLeaseDocument={onAddLeaseDocument}
        />
        {showActivityTools ? (
          <RentActivityTools
            ledger={ledger}
            year={year}
            error={eventError}
            onRecordEvent={onRecordEvent}
            onDeleteEvent={onDeleteEvent}
          />
        ) : null}
      </div>
      {showActivityTable ? (
        <RentActivityCard
          ledger={ledger}
          year={year}
          variant="table"
          onDeleteEvent={onDeleteEvent}
        />
      ) : null}
    </div>
  );
}

export function RentActivityTools({
  ledger,
  year,
  error,
  onRecordEvent,
  onDeleteEvent,
  className,
  showActivity = true,
}: {
  ledger: RentLedger;
  year: number;
  error?: string;
  onRecordEvent: (input: NewRentEventInput) => boolean | Promise<boolean>;
  onDeleteEvent: (rentEventId: string) => boolean | Promise<boolean>;
  className?: string;
  showActivity?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)}>
      <RentEventPanel
        leases={ledger.leases}
        error={error}
        onRecordEvent={onRecordEvent}
      />
      {showActivity ? (
        <RentActivityCard
          ledger={ledger}
          year={year}
          variant="compact"
          onDeleteEvent={onDeleteEvent}
        />
      ) : null}
    </div>
  );
}

export function RentIncomeSummaryStrip({
  ledger,
  year,
  className,
}: {
  ledger: RentLedger;
  year: number;
  className?: string;
}) {
  const summary = summarizeRentLedger(ledger.rentEvents, year);
  const payments = ledger.rentEvents
    .filter(
      (event) => event.type === "payment" && event.date.startsWith(`${year}-`),
    )
    .toSorted((a, b) => b.date.localeCompare(a.date));
  const latestPayment = payments[0];
  const figures = [
    {
      label: "Rent received",
      value: formatMoney(summary.paymentsReceived),
      hint: `Gross rent for ${year}`,
    },
    {
      label: "Payments recorded",
      value: String(summary.paymentCount),
      hint: "Saved rent payment records",
    },
    {
      label: "Latest payment",
      value:
        latestPayment === undefined
          ? "No payments"
          : formatMoney(latestPayment.amount),
      hint: latestPayment?.date ?? "Record payments as they are received",
    },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
    >
      <dl className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {figures.map((figure) => (
          <div className="min-w-0 p-3" key={figure.label}>
            <dt className="text-muted-foreground text-xs">{figure.label}</dt>
            <dd className="mt-1 truncate font-semibold text-lg tabular-nums">
              {figure.value}
            </dd>
            <dd className="mt-1 truncate text-muted-foreground text-xs">
              {figure.hint}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LeasesPanel({
  ledger,
  unitLabels,
  leaseError,
  documentError,
  onCreateLease,
  onDeleteLease,
  onAddLeaseDocument,
}: {
  ledger: RentLedger;
  unitLabels: Map<string, string>;
  leaseError?: string;
  documentError?: string;
  onCreateLease: (input: NewLeaseInput) => boolean | Promise<boolean>;
  onDeleteLease: (leaseId: string) => boolean | Promise<boolean>;
  onAddLeaseDocument: (
    input: NewLeaseDocumentInput,
  ) => boolean | Promise<boolean>;
}) {
  const hasUnits = ledger.units.length > 0;
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [rentFrequency, setRentFrequency] = useState<RentFrequency>("monthly");
  const selectedUnitLabel =
    ledger.units.find((unit) => unit.id === selectedUnitId)?.label ??
    "Select unit";
  const handleSubmit = createFormSubmit(leaseFormSchema, onCreateLease);

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Leases</CardTitle>
        <CardDescription>
          Tenant, unit, rent amount, and lease documents for payment records.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="lease-unit">Unit</FieldLabel>
              <Select
                name="unitId"
                disabled={!hasUnits}
                value={selectedUnitId}
                onValueChange={(value) => {
                  setSelectedUnitId(value ?? "");
                }}
              >
                <SelectTrigger id="lease-unit" className="w-full">
                  <span
                    className={cn(
                      "flex flex-1 text-left",
                      selectedUnitId === "" && "text-muted-foreground",
                    )}
                  >
                    {selectedUnitLabel}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {ledger.units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="lease-tenant">Tenant</FieldLabel>
              <Input id="lease-tenant" name="tenantName" required />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="lease-start">Start date</FieldLabel>
              <DatePickerField id="lease-start" name="startDate" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="lease-end">End date</FieldLabel>
              <DatePickerField id="lease-end" name="endDate" />
            </Field>
            <Field>
              <FieldLabel htmlFor="lease-rent">Rent</FieldLabel>
              <Input
                id="lease-rent"
                name="rentAmount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lease-frequency">Frequency</FieldLabel>
              <Select
                name="rentFrequency"
                value={rentFrequency}
                onValueChange={(value) => {
                  setRentFrequency(value as RentFrequency);
                }}
              >
                <SelectTrigger id="lease-frequency" className="w-full">
                  <span className="flex flex-1 text-left">
                    {FREQUENCY_LABELS[rentFrequency]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {RENT_FREQUENCIES.map((frequency) => (
                    <SelectItem key={frequency} value={frequency}>
                      {FREQUENCY_LABELS[frequency]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!hasUnits}>
              <Plus data-icon="inline-start" />
              Add lease
            </Button>
          </div>
        </form>
        <FormErrorAlert message={leaseError} />
        {documentError ? <FormErrorAlert message={documentError} /> : null}
        {!hasUnits ? (
          <EmptyState icon={Users}>
            Add a unit to this property before creating a lease.
          </EmptyState>
        ) : ledger.leases.length === 0 ? (
          <EmptyState icon={FileText}>No leases recorded.</EmptyState>
        ) : (
          <div className="grid gap-3">
            {ledger.leases.map((lease) => (
              <LeaseCard
                key={lease.id}
                lease={lease}
                unitLabel={unitLabels.get(lease.unitId) ?? "Unknown unit"}
                documents={getLeaseDocuments(ledger.documents, lease.id)}
                onDeleteLease={onDeleteLease}
                onAddLeaseDocument={onAddLeaseDocument}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeaseCard({
  lease,
  unitLabel,
  documents,
  onDeleteLease,
  onAddLeaseDocument,
}: {
  lease: Lease;
  unitLabel: string;
  documents: RentLedger["documents"];
  onDeleteLease: (leaseId: string) => boolean | Promise<boolean>;
  onAddLeaseDocument: (
    input: NewLeaseDocumentInput,
  ) => boolean | Promise<boolean>;
}) {
  const [isDeleting, startDelete] = useTransition();

  const handleDocumentSubmit = createFormSubmit(
    leaseDocumentFormSchema,
    (data) =>
      onAddLeaseDocument({
        leaseId: lease.id,
        fileName: data.fileName,
        documentType: data.documentType,
        storageUrl: data.storageUrl ?? null,
      }),
  );

  return (
    <div className="grid gap-3 rounded-md border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm">{lease.tenantName}</p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {unitLabel} · {formatMoney(lease.rentAmount)}{" "}
            {FREQUENCY_LABELS[lease.rentFrequency].toLowerCase()} ·{" "}
            {lease.startDate}
            {lease.endDate ? ` to ${lease.endDate}` : " onward"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete lease for ${lease.tenantName}`}
            disabled={isDeleting}
            onClick={() => {
              if (
                window.confirm(
                  `Delete the lease for ${lease.tenantName}? Recorded rent payments must be deleted first.`,
                )
              ) {
                startDelete(() => void onDeleteLease(lease.id));
              }
            }}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
      <Separator />
      <div className="grid gap-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Lease documents
        </p>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No documents linked yet.
          </p>
        ) : (
          <ul className="grid gap-1">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center gap-2 text-sm">
                <FileText
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {document.storageUrl ? (
                  <a
                    href={document.storageUrl}
                    className="truncate underline underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {document.fileName}
                  </a>
                ) : (
                  <span className="truncate">{document.fileName}</span>
                )}
                <span className="text-muted-foreground text-xs">
                  ({document.documentType})
                </span>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={handleDocumentSubmit}
        >
          <Input
            name="fileName"
            placeholder="Document name"
            aria-label="Document name"
            required
          />
          <Input
            name="documentType"
            defaultValue="lease"
            aria-label="Document type"
            required
          />
          <Input
            name="storageUrl"
            placeholder="Link (optional)"
            aria-label="Document link"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="sm:col-span-3 sm:w-auto sm:justify-self-end"
          >
            <Plus data-icon="inline-start" />
            Link document
          </Button>
        </form>
      </div>
    </div>
  );
}

function RentEventPanel({
  leases,
  error,
  onRecordEvent,
}: {
  leases: Lease[];
  error?: string;
  onRecordEvent: (input: NewRentEventInput) => boolean | Promise<boolean>;
}) {
  const [selectedLeaseId, setSelectedLeaseId] = useState("");
  const hasLeases = leases.length > 0;
  const selectedLeaseLabel =
    leases.find((lease) => lease.id === selectedLeaseId)?.tenantName ??
    "Select lease";
  const handleSubmit = createFormSubmit(rentEventFormSchema, onRecordEvent);

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Record rent payment</CardTitle>
        <CardDescription>
          Record the rent amount received during the selected tax year.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="event-lease">Lease</FieldLabel>
              <Select
                name="leaseId"
                disabled={!hasLeases}
                value={selectedLeaseId}
                onValueChange={(value) => {
                  setSelectedLeaseId(value ?? "");
                }}
              >
                <SelectTrigger id="event-lease" className="w-full">
                  <span
                    className={cn(
                      "flex flex-1 text-left",
                      selectedLeaseId === "" && "text-muted-foreground",
                    )}
                  >
                    {selectedLeaseLabel}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {leases.map((lease) => (
                    <SelectItem key={lease.id} value={lease.id}>
                      {lease.tenantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="event-date">Date</FieldLabel>
              <DatePickerField id="event-date" name="date" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="event-amount">Amount</FieldLabel>
              <Input
                id="event-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="event-memo">Memo</FieldLabel>
            <Input id="event-memo" name="memo" placeholder="Optional note" />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={selectedLeaseId === ""}>
              <Plus data-icon="inline-start" />
              Record payment
            </Button>
          </div>
        </form>
        <FormErrorAlert message={error} />
      </CardContent>
    </Card>
  );
}

export function RentActivityCard({
  ledger,
  year,
  variant,
  className,
  onDeleteEvent,
}: {
  ledger: RentLedger;
  year: number;
  variant: "compact" | "table";
  className?: string;
  onDeleteEvent: (rentEventId: string) => boolean | Promise<boolean>;
}) {
  const [isDeleting, startDelete] = useTransition();
  const unitLabels = new Map(ledger.units.map((unit) => [unit.id, unit.label]));
  const tenantByLease = new Map(
    ledger.leases.map((lease) => [
      lease.id,
      `${lease.tenantName} · ${unitLabels.get(lease.unitId) ?? "Unknown unit"}`,
    ]),
  );
  const events = ledger.rentEvents
    .filter(
      (event) => event.type === "payment" && event.date.startsWith(`${year}-`),
    )
    .toSorted((a, b) => b.date.localeCompare(a.date));

  const description =
    variant === "compact"
      ? "Recent rent payments for this tax year."
      : `Saved rent payments for ${year}, newest first.`;
  const handleDelete = (rentEventId: string) => {
    if (
      window.confirm("Delete this rent payment? This will update rent totals.")
    ) {
      startDelete(() => void onDeleteEvent(rentEventId));
    }
  };

  return (
    <Card className={cn("rounded-md", className)}>
      <CardHeader>
        <CardTitle as="h2">Rent payments</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState icon={Receipt}>
            No rent payments recorded for {year}.
          </EmptyState>
        ) : variant === "compact" ? (
          <ul className="grid gap-2">
            {events.map((event) => (
              <li
                className="grid gap-1 rounded-md border bg-background p-3"
                key={event.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {event.leaseId
                        ? (tenantByLease.get(event.leaseId) ?? "-")
                        : "Property-level"}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {event.date}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums text-sm">
                    {formatMoney(event.amount)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete rent payment from ${event.date}`}
                    disabled={isDeleting}
                    onClick={() => {
                      handleDelete(event.id);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                  <span>{event.memo ?? "No memo"}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tenant / unit</TableHead>
                <TableHead>Memo</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.date}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.leaseId
                      ? (tenantByLease.get(event.leaseId) ?? "—")
                      : "Property-level"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.memo ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(event.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete rent payment from ${event.date}`}
                      disabled={isDeleting}
                      onClick={() => {
                        handleDelete(event.id);
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-muted-foreground text-sm">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
