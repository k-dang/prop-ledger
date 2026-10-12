"use client";

import {
  CheckCircle2,
  CircleDot,
  FileText,
  type LucideIcon,
  Plus,
  Receipt,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useRef, useState, useTransition } from "react";
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
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
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
import { useMutation } from "@/hooks/use-mutation";
import { SAVE_FAILED_MESSAGE } from "@/lib/action-utils";
import {
  createLease,
  deleteLease,
  deleteRentEvent,
  recordRentEvent,
} from "@/lib/actions";
import {
  FREQUENCY_LABELS,
  formatMoney,
  getLeaseDocuments,
  type Lease,
  type NewLeaseInput,
  type NewRentEventInput,
  type RentLedger,
} from "@/lib/rent-ledger";
import { toneIcon } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import { uploadLeaseDocument } from "./lease-document-upload";

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

export function LeasesPanel({ ledger }: { ledger: RentLedger }) {
  const { error: leaseError, runMutation } = useMutation();
  const onCreateLease = async (input: NewLeaseInput) =>
    (await runMutation(() => createLease(input))).ok;
  const hasUnits = ledger.units.length > 0;
  const hasLeases = ledger.leases.length > 0;
  const unitLabels = new Map(ledger.units.map((unit) => [unit.id, unit.label]));
  const linkedDocumentCount = ledger.documents.filter((document) =>
    document.links.some((link) => link.targetType === "lease"),
  ).length;
  const openEndedLeaseCount = ledger.leases.filter(
    (lease) => lease.endDate === null,
  ).length;
  const summary = `${pluralize(ledger.leases.length, "lease")} · ${openEndedLeaseCount} open-ended · ${pluralize(linkedDocumentCount, "document")}`;
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [rentFrequency, setRentFrequency] = useState<RentFrequency>("monthly");
  const selectedUnitLabel =
    ledger.units.find((unit) => unit.id === selectedUnitId)?.label ??
    "Select unit";
  const handleSubmit = createFormSubmit(leaseFormSchema, onCreateLease);
  const formRef = useRef<HTMLFormElement>(null);

  // The lease list sits above the form, so the header action jumps to it.
  function focusForm() {
    const firstField = formRef.current?.querySelector<HTMLElement>(
      "button:not([disabled]), input:not([disabled])",
    );
    firstField?.focus();
    firstField?.scrollIntoView({ block: "center" });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {hasLeases ? (
            <CheckCircle2
              className={cn("size-4 shrink-0", toneIcon.ready)}
              aria-hidden="true"
            />
          ) : (
            <CircleDot
              className={cn("size-4 shrink-0", toneIcon.review)}
              aria-hidden="true"
            />
          )}
          <CardTitle as="h2">Leases</CardTitle>
        </div>
        <CardDescription>{summary}</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={focusForm}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Add lease
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <FormErrorAlert message={leaseError} />
        {!hasUnits ? (
          <EmptyState icon={Users}>
            {ledger.property.setupDraft
              ? "Finish setup to add units and leases."
              : "Add a unit to this property before creating a lease."}
          </EmptyState>
        ) : !hasLeases ? (
          <EmptyState icon={FileText}>No leases recorded.</EmptyState>
        ) : (
          <div className="grid gap-3">
            {ledger.leases.map((lease) => (
              <LeaseCard
                key={lease.id}
                lease={lease}
                propertyId={ledger.property.id}
                unitLabel={unitLabels.get(lease.unitId) ?? "Unknown unit"}
                documents={getLeaseDocuments(ledger.documents, lease.id)}
              />
            ))}
          </div>
        )}
        <Separator />
        <form ref={formRef} className="grid gap-3" onSubmit={handleSubmit}>
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
      </CardContent>
    </Card>
  );
}

function LeaseCard({
  lease,
  propertyId,
  unitLabel,
  documents,
}: {
  lease: Lease;
  propertyId: string;
  unitLabel: string;
  documents: RentLedger["documents"];
}) {
  const { error, runMutation } = useMutation();
  const onDeleteLease = async (leaseId: string) =>
    (await runMutation(() => deleteLease(leaseId))).ok;
  const onUploadLeaseDocument = async (leaseId: string, formData: FormData) =>
    (
      await runMutation(() =>
        uploadLeaseDocument(propertyId, leaseId, formData),
      )
    ).ok;
  const [isDeleting, startDelete] = useTransition();
  const [isUploading, startUpload] = useTransition();
  const fileInputId = `lease-document-${lease.id}`;

  function handleUploadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    startUpload(async () => {
      const saved = await onUploadLeaseDocument(lease.id, new FormData(form));

      if (saved) {
        form.reset();
      }
    });
  }

  return (
    <div className="grid gap-3 rounded-md border bg-background p-3">
      <FormErrorAlert message={error} />
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
                startDelete(async () => {
                  await onDeleteLease(lease.id);
                });
              }
            }}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <p className="m-0! font-medium text-muted-foreground text-xs uppercase">
          Lease documents
        </p>
        {documents.length === 0 ? (
          <p className="m-0 text-muted-foreground text-xs">
            No documents linked yet.
          </p>
        ) : (
          <ul className="m-0 flex flex-col gap-1 p-0">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex items-center gap-2 text-sm leading-5"
              >
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
        <form className="m-0 grid gap-2" onSubmit={handleUploadSubmit}>
          <Field className="gap-1">
            <FieldLabel htmlFor={fileInputId}>Lease document</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id={fileInputId}
                name="file"
                type="file"
                accept="application/pdf,image/*"
                className="flex-1"
                required
                disabled={isUploading}
              />
              <Button
                type="submit"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isUploading}
              >
                <Plus data-icon="inline-start" />
                {isUploading ? "Adding..." : "Add document"}
              </Button>
            </div>
            <FieldDescription>PDF or image, up to 20 MB.</FieldDescription>
          </Field>
        </form>
      </div>
    </div>
  );
}

export function RentPaymentPanel({
  ledger,
  year,
  today,
  className,
}: {
  ledger: RentLedger;
  year: number;
  today: string;
  className?: string;
}) {
  const { leases } = ledger;
  const onlyLease = leases.length === 1 ? leases[0] : undefined;
  const nextStep = ledger.property.setupDraft
    ? {
        message: "Finish setup to record rent.",
        href: `/properties/${ledger.property.id}/setup`,
        label: "Continue setup",
      }
    : ledger.units.length === 0
      ? {
          message: "Add a unit, then a lease to record rent.",
          href: "#units",
          label: "Add unit",
        }
      : {
          message: "Add a lease to record rent.",
          href: "#leases",
          label: "Add lease",
        };
  const defaultDate = today.startsWith(`${year}-`) ? today : "";
  const [selectedLeaseId, setSelectedLeaseId] = useState(onlyLease?.id ?? "");
  const [paymentDate, setPaymentDate] = useState(defaultDate);
  const [amount, setAmount] = useState(
    onlyLease ? formatFormAmount(onlyLease.rentAmount) : "",
  );
  const [memo, setMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState<string>();
  const [savedPayment, setSavedPayment] = useState<{
    tenant: string;
    amount: number;
    date: string;
  }>();
  const selectedLease = leases.find((lease) => lease.id === selectedLeaseId);
  const unitLabels = new Map(ledger.units.map((unit) => [unit.id, unit.label]));
  const canSave =
    selectedLease !== undefined && paymentDate !== "" && Number(amount) > 0;
  const handleSubmit = createFormSubmit(rentEventFormSchema, async (input) => {
    if (saving.current || !selectedLease) return false;
    saving.current = true;
    setIsSaving(true);
    setError(undefined);
    setSavedPayment(undefined);
    try {
      const result = await recordRentEvent(ledger.property.id, input);
      if (!result.ok) {
        setError(result.error ?? SAVE_FAILED_MESSAGE);
        return false;
      }
      setSavedPayment({
        tenant: selectedLease.tenantName,
        amount: input.amount,
        date: input.date,
      });
      // Keep the tenant selected, but require a fresh amount for another payment.
      setAmount("");
      setMemo("");
      setPaymentDate(defaultDate);
      return true;
    } catch {
      setError(SAVE_FAILED_MESSAGE);
      return false;
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  });
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle as="h2">Record rent</CardTitle>
        <CardDescription>
          Confirm the amount and date you received, then save.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {leases.length === 0 ? (
          <div className="grid justify-items-start gap-3 rounded-lg border border-dashed p-4">
            <p className="font-medium">{nextStep.message}</p>
            <p className="text-sm text-muted-foreground">
              A lease connects each payment to its tenant and unit.
            </p>
            <Link
              href={nextStep.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-brand underline underline-offset-4"
            >
              {nextStep.label}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <fieldset disabled={isSaving} className="grid min-w-0 gap-4">
              {onlyLease ? (
                <div className="border-b pb-4">
                  <input type="hidden" name="leaseId" value={selectedLeaseId} />
                  <p className="font-medium">{onlyLease.tenantName}</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {unitLabels.get(onlyLease.unitId) ?? "Unknown unit"} ·{" "}
                    {formatMoney(onlyLease.rentAmount)} ·{" "}
                    {FREQUENCY_LABELS[onlyLease.rentFrequency]}
                  </p>
                </div>
              ) : (
                <Field>
                  <FieldLabel htmlFor="event-lease">Tenant / lease</FieldLabel>
                  <Select
                    name="leaseId"
                    value={selectedLeaseId}
                    onValueChange={(value) => {
                      const lease = leases.find((item) => item.id === value);
                      setSelectedLeaseId(value ?? "");
                      setAmount(
                        lease ? formatFormAmount(lease.rentAmount) : "",
                      );
                    }}
                  >
                    <SelectTrigger id="event-lease" className="min-h-11 w-full">
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-left",
                          !selectedLease && "text-muted-foreground",
                        )}
                      >
                        {selectedLease
                          ? `${selectedLease.tenantName} · ${unitLabels.get(selectedLease.unitId) ?? "Unknown unit"}`
                          : "Select a tenant"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {leases.map((lease) => (
                        <SelectItem key={lease.id} value={lease.id}>
                          {lease.tenantName} ·{" "}
                          {unitLabels.get(lease.unitId) ?? "Unknown unit"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field className="min-w-0">
                  <FieldLabel htmlFor="event-amount">
                    Amount received
                  </FieldLabel>
                  <Input
                    id="event-amount"
                    name="amount"
                    className="h-11 tabular-nums"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                  {selectedLease && (
                    <FieldDescription>
                      Lease rent: {formatMoney(selectedLease.rentAmount)}
                    </FieldDescription>
                  )}
                </Field>
                <Field className="min-w-0">
                  <FieldLabel htmlFor="event-date">Date received</FieldLabel>
                  <Input
                    id="event-date"
                    name="date"
                    className="h-11 min-w-0"
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                  />
                  {paymentDate === "" && (
                    <FieldDescription>
                      Choose the date you received rent in {year}.
                    </FieldDescription>
                  )}
                </Field>
              </div>
              {paymentDate !== "" && !paymentDate.startsWith(`${year}-`) && (
                <p className="text-sm text-review-text">
                  This payment will appear in {paymentDate.slice(0, 4)}. You’re
                  viewing {year}.
                </p>
              )}
              <details>
                <summary className="cursor-pointer py-2 text-muted-foreground text-sm">
                  Add a note (optional)
                </summary>
                <Field className="mt-2">
                  <FieldLabel htmlFor="event-memo">Payment note</FieldLabel>
                  <Input
                    id="event-memo"
                    name="memo"
                    className="h-11"
                    placeholder="e.g. Partial payment"
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                  />
                </Field>
              </details>
              <FormErrorAlert message={error} />
              <Button
                type="submit"
                className="min-h-11 w-full"
                disabled={!canSave || isSaving}
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                {isSaving
                  ? "Saving…"
                  : canSave
                    ? `Record ${formatMoney(Number(amount))}`
                    : "Record rent"}
              </Button>
              <p className="text-muted-foreground text-xs">
                Records money already received. No payment is collected.
              </p>
            </fieldset>
          </form>
        )}
        {savedPayment && (
          <p
            role="status"
            className="rounded-lg border border-ready-border bg-ready-surface p-3 text-sm text-ready-text"
          >
            Recorded {formatMoney(savedPayment.amount)} for{" "}
            {savedPayment.tenant} on {savedPayment.date}.
            {!savedPayment.date.startsWith(`${year}-`) && (
              <Link
                className="ml-1 underline underline-offset-4"
                href={`/properties/${ledger.property.id}?year=${savedPayment.date.slice(0, 4)}`}
              >
                View {savedPayment.date.slice(0, 4)} payments
              </Link>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function RentActivityCard({
  ledger,
  year,
  className,
}: {
  ledger: RentLedger;
  year: number;
  className?: string;
}) {
  const { error, runMutation } = useMutation();
  const onDeleteEvent = async (eventId: string) =>
    (await runMutation(() => deleteRentEvent(ledger.property.id, eventId))).ok;
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

  const description = `Saved rent payments for ${year}, newest first.`;
  const handleDelete = (rentEventId: string) => {
    if (
      window.confirm("Delete this rent payment? This will update rent totals.")
    ) {
      startDelete(async () => {
        await onDeleteEvent(rentEventId);
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle as="h2">Rent payments</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormErrorAlert message={error} />
        {events.length === 0 ? (
          <EmptyState icon={Receipt}>
            No rent payments recorded for {year}.
          </EmptyState>
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

function formatFormAmount(value: number) {
  return value.toFixed(2);
}

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
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
