"use client";

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  FileText,
  type LucideIcon,
  Plus,
  Receipt,
  Users,
} from "lucide-react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  RENT_EVENT_TYPES,
  RENT_FREQUENCIES,
  type RentEventType,
  type RentFrequency,
} from "@/db/schema";
import {
  computeLeaseBalances,
  formatMoney,
  getLeaseDocuments,
  type Lease,
  type NewLeaseDocumentInput,
  type NewLeaseInput,
  type NewRentEventInput,
  type RentLedger,
  summarizeArrears,
  summarizeRentLedger,
} from "@/lib/rent-ledger";
import { toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

const FREQUENCY_LABELS: Record<RentFrequency, string> = {
  monthly: "Monthly",
  biweekly: "Biweekly",
  weekly: "Weekly",
};

const EVENT_TYPE_LABELS: Record<RentEventType, string> = {
  charge: "Rent charge",
  payment: "Payment",
  credit: "Credit",
  writeoff: "Write-off",
  other_income: "Other income",
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
    type: z.enum(RENT_EVENT_TYPES),
    leaseId: optionalFormString,
    date: requiredFormString,
    amount: finiteFormNumber,
    memo: optionalFormString,
  })
  .transform(
    (data): NewRentEventInput => ({
      type: data.type,
      leaseId: data.leaseId ?? null,
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
  yearHref,
  leaseError,
  eventError,
  documentError,
  onCreateLease,
  onGenerateCharges,
  onRecordEvent,
  onAddLeaseDocument,
}: {
  ledger: RentLedger;
  year: number;
  yearHref: (target: number) => string;
  leaseError?: string;
  eventError?: string;
  documentError?: string;
  onCreateLease: (input: NewLeaseInput) => boolean | Promise<boolean>;
  onGenerateCharges: (leaseId: string) => boolean | Promise<boolean>;
  onRecordEvent: (input: NewRentEventInput) => boolean | Promise<boolean>;
  onAddLeaseDocument: (
    input: NewLeaseDocumentInput,
  ) => boolean | Promise<boolean>;
}) {
  const summary = summarizeRentLedger(ledger.rentEvents, year);
  const arrears = summarizeArrears(ledger.leases, ledger.rentEvents);
  const balances = computeLeaseBalances(ledger.rentEvents);
  const unitLabels = new Map(ledger.units.map((unit) => [unit.id, unit.label]));

  return (
    <div className="grid gap-4">
      <LedgerHeader year={year} yearHref={yearHref} />
      <SummaryCard summary={summary} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <LeasesPanel
          ledger={ledger}
          balances={balances}
          unitLabels={unitLabels}
          leaseError={leaseError}
          documentError={documentError}
          onCreateLease={onCreateLease}
          onGenerateCharges={onGenerateCharges}
          onAddLeaseDocument={onAddLeaseDocument}
        />
        <div className="flex min-w-0 flex-col gap-4">
          <RentEventPanel
            leases={ledger.leases}
            error={eventError}
            onRecordEvent={onRecordEvent}
          />
          <ArrearsPanel arrears={arrears} unitLabels={unitLabels} />
        </div>
      </div>
      <RentLedgerTable ledger={ledger} unitLabels={unitLabels} year={year} />
    </div>
  );
}

function LedgerHeader({
  year,
  yearHref,
}: {
  year: number;
  yearHref: (target: number) => string;
}) {
  return (
    <Card className="rounded-md">
      <CardHeader className="gap-3 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <CardTitle as="h2">Rent tracking</CardTitle>
          <CardDescription className="mt-1">
            Leases, accrual rent, payments, and arrears for {year}.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={yearHref(year - 1)}
            aria-label={`View ${year - 1}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "rounded-md",
            )}
          >
            <ChevronLeft aria-hidden="true" />
          </Link>
          <Badge className="rounded-md bg-ready text-ready-foreground">
            <CalendarRange data-icon="inline-start" />
            {year}
          </Badge>
          <Link
            href={yearHref(year + 1)}
            aria-label={`View ${year + 1}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "rounded-md",
            )}
          >
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>
      </CardHeader>
    </Card>
  );
}

function SummaryCard({
  summary,
}: {
  summary: ReturnType<typeof summarizeRentLedger>;
}) {
  const figures = [
    { label: "Gross rent", value: summary.grossRent, hint: "Charges accrued" },
    {
      label: "Other income",
      value: summary.otherIncome,
      hint: "Laundry, parking, fees",
    },
    {
      label: "Payments received",
      value: summary.paymentsReceived,
      hint: "Cash applied",
    },
    { label: "Credits", value: summary.credits, hint: "Concessions" },
    { label: "Write-offs", value: summary.writeoffs, hint: "Uncollectible" },
    {
      label: "Arrears at year end",
      value: summary.arrearsAtYearEnd,
      hint: "Outstanding balance",
    },
  ];

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Year summary</CardTitle>
        <CardDescription>
          Gross rent on an accrual basis, with arrears support.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {figures.map((figure) => (
            <div
              className="rounded-md border bg-background p-3"
              key={figure.label}
            >
              <p className="text-muted-foreground text-xs">{figure.label}</p>
              <p className="mt-1 font-semibold text-2xl">
                {formatMoney(figure.value)}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                {figure.hint}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LeasesPanel({
  ledger,
  balances,
  unitLabels,
  leaseError,
  documentError,
  onCreateLease,
  onGenerateCharges,
  onAddLeaseDocument,
}: {
  ledger: RentLedger;
  balances: ReturnType<typeof computeLeaseBalances>;
  unitLabels: Map<string, string>;
  leaseError?: string;
  documentError?: string;
  onCreateLease: (input: NewLeaseInput) => boolean | Promise<boolean>;
  onGenerateCharges: (leaseId: string) => boolean | Promise<boolean>;
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
          Lease terms drive the accrual rent schedule.
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
              <Input id="lease-start" name="startDate" type="date" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="lease-end">End date</FieldLabel>
              <Input id="lease-end" name="endDate" type="date" />
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
                balance={balances.get(lease.id)?.balance ?? 0}
                documents={getLeaseDocuments(ledger.documents, lease.id)}
                onGenerateCharges={onGenerateCharges}
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
  balance,
  documents,
  onGenerateCharges,
  onAddLeaseDocument,
}: {
  lease: Lease;
  unitLabel: string;
  balance: number;
  documents: RentLedger["documents"];
  onGenerateCharges: (leaseId: string) => boolean | Promise<boolean>;
  onAddLeaseDocument: (
    input: NewLeaseDocumentInput,
  ) => boolean | Promise<boolean>;
}) {
  const [isGenerating, startGenerate] = useTransition();

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
        <Badge
          variant="outline"
          className={cn(
            "rounded-md",
            balance > 0 ? toneSurface.blocked : toneSurface.ready,
          )}
        >
          {balance > 0 ? `${formatMoney(balance)} owing` : "Paid up"}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isGenerating}
          onClick={() => startGenerate(() => void onGenerateCharges(lease.id))}
        >
          <CalendarRange data-icon="inline-start" />
          Generate charges
        </Button>
        <span className="text-muted-foreground text-xs">
          Accrues monthly rent through year end.
        </span>
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
  const [eventType, setEventType] = useState<RentEventType>("payment");
  const [selectedLeaseId, setSelectedLeaseId] = useState("");
  const selectedLeaseLabel =
    leases.find((lease) => lease.id === selectedLeaseId)?.tenantName ??
    "Property-level / none";
  const handleSubmit = createFormSubmit(rentEventFormSchema, onRecordEvent);

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Record activity</CardTitle>
        <CardDescription>
          Payments, credits, write-offs, and other income.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="event-type">Type</FieldLabel>
              <Select
                name="type"
                value={eventType}
                onValueChange={(value) => {
                  setEventType(value as RentEventType);
                }}
              >
                <SelectTrigger id="event-type" className="w-full">
                  <span className="flex flex-1 text-left">
                    {EVENT_TYPE_LABELS[eventType]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {RENT_EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EVENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="event-lease">Lease</FieldLabel>
              <Select
                name="leaseId"
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
              <Input id="event-date" name="date" type="date" required />
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
            <Button type="submit">
              <Plus data-icon="inline-start" />
              Record
            </Button>
          </div>
        </form>
        <FormErrorAlert message={error} />
      </CardContent>
    </Card>
  );
}

function ArrearsPanel({
  arrears,
  unitLabels,
}: {
  arrears: ReturnType<typeof summarizeArrears>;
  unitLabels: Map<string, string>;
}) {
  const outstanding = arrears.filter((row) => row.balance > 0);

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Arrears</CardTitle>
        <CardDescription>Outstanding rent by tenant and unit.</CardDescription>
      </CardHeader>
      <CardContent>
        {outstanding.length === 0 ? (
          <EmptyState icon={Receipt}>No outstanding arrears.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstanding.map((row) => (
                <TableRow key={row.leaseId}>
                  <TableCell>{row.tenantName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {unitLabels.get(row.unitId) ?? "Unknown unit"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(row.balance)}
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

function RentLedgerTable({
  ledger,
  unitLabels,
  year,
}: {
  ledger: RentLedger;
  unitLabels: Map<string, string>;
  year: number;
}) {
  const tenantByLease = new Map(
    ledger.leases.map((lease) => [
      lease.id,
      `${lease.tenantName} · ${unitLabels.get(lease.unitId) ?? "Unknown unit"}`,
    ]),
  );
  const events = ledger.rentEvents
    .filter((event) => event.date.startsWith(`${year}-`))
    .toSorted((a, b) => b.date.localeCompare(a.date));

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Rent activity</CardTitle>
        <CardDescription>All {year} rent events, newest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState icon={Receipt}>
            No rent activity recorded for {year}.
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tenant / unit</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md">
                      {EVENT_TYPE_LABELS[event.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.leaseId
                      ? (tenantByLease.get(event.leaseId) ?? "—")
                      : "Property-level"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.periodStart && event.periodEnd
                      ? `${event.periodStart} – ${event.periodEnd}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(event.amount)}
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
