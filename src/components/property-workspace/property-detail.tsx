"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Home,
  type LucideIcon,
  MapPin,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { z } from "zod";
import {
  DeductionsAndIncomePanel,
  EvidenceBinderPanel,
} from "@/components/evidence-binder/evidence-workspace";
import { FormErrorAlert } from "@/components/property-workspace/form-error-alert";
import {
  finiteFormNumber,
  optionalFormString,
  requiredFormString,
} from "@/components/property-workspace/form-schemas";
import { createFormSubmit } from "@/components/property-workspace/form-submit";
import {
  RentActivityCard,
  RentActivityTools,
  RentArrearsCard,
  RentLedgerDetail,
} from "@/components/rent-ledger/rent-ledger-detail";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { NewManualTransactionInput } from "@/lib/evidence-binder";
import {
  getOwnershipHistory,
  type NewOwnerWithOwnershipInput,
  type NewUnitInput,
  type PropertyReadiness,
  type RentalProperty,
} from "@/lib/property-workspace";
import type {
  NewLeaseDocumentInput,
  NewLeaseInput,
  NewRentEventInput,
  RentLedger,
} from "@/lib/rent-ledger";
import { toneIcon, toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

const unitFormSchema = z
  .object({
    unitLabel: requiredFormString,
    unitType: requiredFormString,
  })
  .transform(
    (data): NewUnitInput => ({
      label: data.unitLabel,
      unitType: data.unitType,
    }),
  );

const ownerFormSchema = z
  .object({
    ownerName: requiredFormString,
    percentage: finiteFormNumber,
    effectiveFrom: requiredFormString,
    effectiveTo: optionalFormString,
  })
  .transform(
    (data): NewOwnerWithOwnershipInput => ({
      name: data.ownerName,
      percentage: data.percentage,
      effectiveFrom: data.effectiveFrom,
      effectiveTo: data.effectiveTo,
    }),
  );

export function PropertyWorkspaceDetail({
  property,
  rentLedger,
  year,
  readiness,
  unitError,
  ownerError,
  leaseError,
  rentEventError,
  transactionError,
  leaseDocumentError,
  transactionDocumentError,
  onAddUnit,
  onDeleteUnit,
  onAddOwner,
  onDeleteOwner,
  onCreateLease,
  onDeleteLease,
  onGenerateRentCharges,
  onRecordRentEvent,
  onDeleteRentEvent,
  onAddLeaseDocument,
  onCreateManualTransaction,
  onDeleteManualTransaction,
  onUploadTransactionEvidence,
  onDeleteEvidenceDocument,
}: {
  property: RentalProperty;
  rentLedger: RentLedger;
  year: number;
  readiness: PropertyReadiness;
  unitError?: string;
  ownerError?: string;
  leaseError?: string;
  rentEventError?: string;
  transactionError?: string;
  leaseDocumentError?: string;
  transactionDocumentError?: string;
  onAddUnit: (input: NewUnitInput) => boolean | Promise<boolean>;
  onDeleteUnit: (unitId: string) => boolean | Promise<boolean>;
  onAddOwner: (input: NewOwnerWithOwnershipInput) => boolean | Promise<boolean>;
  onDeleteOwner: (ownerId: string) => boolean | Promise<boolean>;
  onCreateLease: (input: NewLeaseInput) => boolean | Promise<boolean>;
  onDeleteLease: (leaseId: string) => boolean | Promise<boolean>;
  onGenerateRentCharges: (leaseId: string) => boolean | Promise<boolean>;
  onRecordRentEvent: (input: NewRentEventInput) => boolean | Promise<boolean>;
  onDeleteRentEvent: (rentEventId: string) => boolean | Promise<boolean>;
  onAddLeaseDocument: (
    input: NewLeaseDocumentInput,
  ) => boolean | Promise<boolean>;
  onCreateManualTransaction: (
    input: NewManualTransactionInput,
  ) => boolean | Promise<boolean>;
  onDeleteManualTransaction: (
    transactionId: string,
  ) => boolean | Promise<boolean>;
  onUploadTransactionEvidence: (
    transactionId: string,
    formData: FormData,
  ) => boolean | Promise<boolean>;
  onDeleteEvidenceDocument: (documentId: string) => boolean | Promise<boolean>;
}) {
  return (
    <>
      <section id="setup" className="grid scroll-mt-4 gap-4">
        <PropertySetupOverview
          property={property}
          readiness={readiness}
          year={year}
        />
        <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
          <UnitsPanel
            property={property}
            error={unitError}
            onSubmit={onAddUnit}
            onDeleteUnit={onDeleteUnit}
          />
          <OwnershipPanel
            property={property}
            error={ownerError}
            onSubmit={onAddOwner}
            onDeleteOwner={onDeleteOwner}
          />
        </div>
      </section>
      <section
        id="tax-activity"
        aria-labelledby="tax-activity-title"
        className="grid scroll-mt-4 gap-3"
      >
        <div>
          <h2
            id="tax-activity-title"
            className="font-heading font-medium text-base leading-snug"
          >
            Record taxable activity
          </h2>
          <p className="text-muted-foreground text-sm">
            Rent items, arrears, deductions, and non-rent income for {year}.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(21rem,0.42fr)_minmax(0,1fr)] xl:items-start">
          <RentActivityTools
            ledger={rentLedger}
            year={year}
            error={rentEventError}
            onRecordEvent={onRecordRentEvent}
            onDeleteEvent={onDeleteRentEvent}
            showActivity={false}
            showArrears={false}
          />
          <DeductionsAndIncomePanel
            property={property}
            error={transactionError}
            evidenceError={transactionDocumentError}
            onSubmit={onCreateManualTransaction}
            onDeleteTransaction={onDeleteManualTransaction}
            onUploadEvidence={onUploadTransactionEvidence}
            onDeleteDocument={onDeleteEvidenceDocument}
          />
          <RentActivityCard
            ledger={rentLedger}
            year={year}
            variant="table"
            className="xl:col-span-2"
            onDeleteEvent={onDeleteRentEvent}
          />
          <RentArrearsCard ledger={rentLedger} className="xl:col-span-2" />
        </div>
      </section>
      <section id="rent" className="scroll-mt-4">
        <RentLedgerDetail
          ledger={rentLedger}
          year={year}
          leaseError={leaseError}
          eventError={rentEventError}
          documentError={leaseDocumentError}
          onCreateLease={onCreateLease}
          onDeleteLease={onDeleteLease}
          onGenerateCharges={onGenerateRentCharges}
          onRecordEvent={onRecordRentEvent}
          onDeleteEvent={onDeleteRentEvent}
          onAddLeaseDocument={onAddLeaseDocument}
          showActivityTools={false}
          showActivityTable={false}
        />
      </section>
      <section id="transactions" className="scroll-mt-4">
        <EvidenceBinderPanel property={property} />
      </section>
    </>
  );
}

function PropertySetupOverview({
  property,
  readiness,
  year,
}: {
  property: RentalProperty;
  readiness: PropertyReadiness;
  year: number;
}) {
  const readinessTone =
    readiness.setupGapCount === 0 ? toneSurface.ready : toneSurface.review;
  const setupGapLabel = `${readiness.setupGapCount} setup gap${
    readiness.setupGapCount === 1 ? "" : "s"
  }`;
  const setupFacts = [
    { label: "Units", value: property.units.length },
    { label: "Owners", value: property.owners.length },
    { label: "Ownership periods", value: property.ownershipPeriods.length },
  ];

  return (
    <Card className="rounded-md">
      <CardHeader className="pb-4">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle as="h1" className="truncate text-xl">
              {property.name}
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {property.line1}, {property.municipality}, {property.province}{" "}
                {property.postalCode}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Acquired {property.acquisitionDate}
              </span>
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <div className="flex items-center gap-1 rounded-md border bg-background p-1">
              <span className="sr-only">Tax year</span>
              <Link
                href={`/properties/${property.id}?year=${year - 1}`}
                aria-label={`View ${year - 1}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "size-7 rounded-sm",
                )}
              >
                <ChevronLeft aria-hidden="true" />
              </Link>
              <span className="px-2 font-medium text-sm tabular-nums">
                {year}
              </span>
              <Link
                href={`/properties/${property.id}?year=${year + 1}`}
                aria-label={`View ${year + 1}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "size-7 rounded-sm",
                )}
              >
                <ChevronRight aria-hidden="true" />
              </Link>
            </div>
            <Badge className="rounded-md bg-ready text-ready-foreground">
              {readiness.readinessPercent}% ready
            </Badge>
            <Badge
              variant="outline"
              className={cn("rounded-md", readinessTone)}
            >
              {setupGapLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-t p-0">
        <div className="grid divide-y lg:grid-cols-[minmax(16rem,0.36fr)_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
          <div className="grid content-start gap-4 p-4">
            <div>
              <p className="font-medium text-sm">Setup readiness</p>
              <p className="text-muted-foreground text-sm">
                {readiness.completedCount} of {readiness.totalCount} setup items
                complete.
              </p>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              aria-label={`${readiness.readinessPercent}% setup ready`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={readiness.readinessPercent}
              role="progressbar"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  readiness.setupGapCount === 0 ? "bg-ready" : "bg-review",
                )}
                style={{ width: `${readiness.readinessPercent}%` }}
              />
            </div>
            <dl className="grid divide-y border-t">
              {setupFacts.map((fact) => (
                <div
                  className="flex items-center justify-between gap-3 py-2"
                  key={fact.label}
                >
                  <dt className="text-muted-foreground text-xs">
                    {fact.label}
                  </dt>
                  <dd className="font-semibold text-base tabular-nums">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="grid divide-y">
            {readiness.tasks.map((task) => (
              <SetupTaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SetupTaskRow({ task }: { task: PropertyReadiness["tasks"][number] }) {
  const tone = getSetupTaskTone(task.status);
  const Icon = getSetupTaskIcon(task.status);

  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[20px_minmax(0,1fr)_auto]">
      <Icon
        className={cn("mt-0.5 size-4", toneIcon[tone])}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-medium text-sm">{task.label}</p>
        <p className="text-muted-foreground text-xs">{task.detail}</p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "col-start-2 justify-self-start rounded-md text-xs sm:col-start-auto sm:justify-self-end",
          toneSurface[tone],
        )}
      >
        {formatSetupStatus(task.status)}
      </Badge>
    </div>
  );
}

function getSetupTaskTone(
  status: PropertyReadiness["tasks"][number]["status"],
) {
  if (status === "complete") {
    return "ready";
  }

  if (status === "warning") {
    return "blocked";
  }

  return "review";
}

function getSetupTaskIcon(
  status: PropertyReadiness["tasks"][number]["status"],
) {
  if (status === "complete") {
    return CheckCircle2;
  }

  if (status === "warning") {
    return AlertTriangle;
  }

  return CircleDot;
}

function formatSetupStatus(
  status: PropertyReadiness["tasks"][number]["status"],
) {
  if (status === "complete") {
    return "Complete";
  }

  if (status === "missing") {
    return "Missing";
  }

  return "Needs review";
}

function UnitsPanel({
  property,
  error,
  onSubmit,
  onDeleteUnit,
}: {
  property: RentalProperty;
  error?: string;
  onSubmit: (input: NewUnitInput) => boolean | Promise<boolean>;
  onDeleteUnit: (unitId: string) => boolean | Promise<boolean>;
}) {
  const handleSubmit = createFormSubmit(unitFormSchema, onSubmit);

  function handleDelete(unitId: string, label: string) {
    if (!window.confirm(`Delete unit "${label}"?`)) {
      return;
    }

    void onDeleteUnit(unitId);
  }

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Units</CardTitle>
        <CardDescription>Rental spaces under this property.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={handleSubmit}
        >
          <Field>
            <FieldLabel htmlFor="unitLabel">Unit label</FieldLabel>
            <Input id="unitLabel" name="unitLabel" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="unitType">Unit type</FieldLabel>
            <Input
              id="unitType"
              name="unitType"
              required
              defaultValue="Apartment"
            />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto">
              <Plus data-icon="inline-start" />
              Add
            </Button>
          </div>
        </form>
        <FormErrorAlert message={error} />
        {property.units.length === 0 ? (
          <EmptyState icon={Home}>No units recorded.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {property.units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>{unit.label}</TableCell>
                  <TableCell>{unit.unitType}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-md px-2 text-blocked"
                      onClick={() => {
                        handleDelete(unit.id, unit.label);
                      }}
                    >
                      <Trash2 data-icon="inline-start" />
                      Delete
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

function AddOwnerSheet({
  acquisitionDate,
  error,
  onSubmit,
}: {
  acquisitionDate: string;
  error?: string;
  onSubmit: (input: NewOwnerWithOwnershipInput) => boolean | Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const handleSubmit = createFormSubmit(ownerFormSchema, async (input) => {
    const saved = await onSubmit(input);

    if (saved) {
      setOpen(false);
    }

    return saved;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Add owner
      </Button>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Add owner</SheetTitle>
          <SheetDescription>
            Add an owner and the effective-dated share for this property.
          </SheetDescription>
        </SheetHeader>
        <form className="grid gap-4 px-4 pb-4" onSubmit={handleSubmit}>
          <FormErrorAlert message={error} />
          <Field>
            <FieldLabel htmlFor="ownerName">Owner name</FieldLabel>
            <Input id="ownerName" name="ownerName" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="ownerPercentage">Share %</FieldLabel>
            <Input
              id="ownerPercentage"
              name="percentage"
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="ownerEffectiveFrom">
                Effective from
              </FieldLabel>
              <DatePickerField
                id="ownerEffectiveFrom"
                name="effectiveFrom"
                defaultValue={acquisitionDate}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ownerEffectiveTo">Effective to</FieldLabel>
              <DatePickerField id="ownerEffectiveTo" name="effectiveTo" />
            </Field>
          </div>
          <Button type="submit" className="justify-self-start">
            <Plus data-icon="inline-start" />
            Add owner
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function OwnershipPanel({
  property,
  error,
  onSubmit,
  onDeleteOwner,
}: {
  property: RentalProperty;
  error?: string;
  onSubmit: (input: NewOwnerWithOwnershipInput) => boolean | Promise<boolean>;
  onDeleteOwner: (ownerId: string) => boolean | Promise<boolean>;
}) {
  const history = getOwnershipHistory(property);

  function handleDelete(ownerId: string, ownerName: string) {
    if (
      !window.confirm(
        `Delete owner "${ownerName}" and their ownership periods?`,
      )
    ) {
      return;
    }

    void onDeleteOwner(ownerId);
  }

  return (
    <Card className="rounded-md">
      <CardHeader>
        <div>
          <CardTitle as="h2">Ownership history</CardTitle>
          <CardDescription>Effective-dated shares.</CardDescription>
        </div>
        <CardAction>
          <AddOwnerSheet
            acquisitionDate={property.acquisitionDate}
            error={error}
            onSubmit={onSubmit}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <FormErrorAlert message={error} />
        {history.length === 0 ? (
          <EmptyState icon={Users}>No ownership periods recorded.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Share</TableHead>
                <TableHead>Effective dates</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((period) => (
                <TableRow key={period.id}>
                  <TableCell>{period.ownerName}</TableCell>
                  <TableCell>{period.percentageLabel}</TableCell>
                  <TableCell>{period.dateRange}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-md px-2 text-blocked"
                      onClick={() => {
                        handleDelete(period.ownerId, period.ownerName);
                      }}
                    >
                      <Trash2 data-icon="inline-start" />
                      Delete
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
