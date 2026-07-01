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
import { MortgagePaymentsPanel } from "@/components/evidence-binder/allocation-controls";
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
  RentIncomeSummaryStrip,
  RentLedgerDetail,
} from "@/components/rent-ledger/rent-ledger-detail";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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

type SetupSectionProps = {
  property: RentalProperty;
  readiness: PropertyReadiness;
  unitError?: string;
  ownerError?: string;
  onAddUnit: (input: NewUnitInput) => boolean | Promise<boolean>;
  onDeleteUnit: (unitId: string) => boolean | Promise<boolean>;
  onAddOwner: (input: NewOwnerWithOwnershipInput) => boolean | Promise<boolean>;
  onDeleteOwner: (ownerId: string) => boolean | Promise<boolean>;
};

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
  const deferActivity = readiness.setupGapCount > 0;

  return (
    <>
      <section id="setup" className="grid scroll-mt-4 gap-4">
        <PropertySetupOverview
          property={property}
          readiness={readiness}
          year={year}
        />
        <SetupSection
          property={property}
          readiness={readiness}
          unitError={unitError}
          ownerError={ownerError}
          onAddUnit={onAddUnit}
          onDeleteUnit={onDeleteUnit}
          onAddOwner={onAddOwner}
          onDeleteOwner={onDeleteOwner}
        />
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
          onRecordEvent={onRecordRentEvent}
          onDeleteEvent={onDeleteRentEvent}
          onAddLeaseDocument={onAddLeaseDocument}
          showActivityTools={false}
          showActivityTable={false}
        />
      </section>
      <WorkflowDetails
        id="mortgage-payments"
        title="Mortgage payments"
        description={
          deferActivity
            ? "Available after setup, but secondary to the current readiness gap."
            : "Record deductible interest and supporting principal amounts."
        }
        open={!deferActivity}
      >
        <MortgagePaymentsPanel
          propertyId={property.id}
          payments={property.mortgagePayments}
        />
      </WorkflowDetails>
      <WorkflowDetails
        id="tax-activity"
        title="Record taxable activity"
        description={
          deferActivity
            ? "Rent, deductions, and income are available, but setup should be fixed first."
            : `Rent payments, deductions, and non-rent income for ${year}.`
        }
        open={!deferActivity}
      >
        <section
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
              Rent payments, deductions, and non-rent income for {year}.
            </p>
          </div>
          <RentIncomeSummaryStrip ledger={rentLedger} year={year} />
          <div className="grid gap-4 xl:grid-cols-[minmax(21rem,0.42fr)_minmax(0,1fr)] xl:items-start">
            <RentActivityTools
              ledger={rentLedger}
              year={year}
              error={rentEventError}
              onRecordEvent={onRecordRentEvent}
              onDeleteEvent={onDeleteRentEvent}
              showActivity={false}
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
          </div>
        </section>
      </WorkflowDetails>
      <EvidenceBinderPanel property={property} />
    </>
  );
}

function WorkflowDetails({
  id,
  title,
  description,
  open,
  children,
}: {
  id: string;
  title: string;
  description: string;
  open: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(open);
  const panelId = `${id}-panel`;

  return (
    <section
      id={id}
      className="grid scroll-mt-4 rounded-md border bg-background text-foreground"
    >
      <button
        type="button"
        aria-controls={panelId}
        aria-expanded={expanded}
        className="flex items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => {
          setExpanded((current) => !current);
        }}
      >
        <span className="min-w-0">
          <span className="block font-heading font-medium text-base leading-snug">
            {title}
          </span>
          <span className="block text-muted-foreground text-sm">
            {description}
          </span>
        </span>
        <span className="shrink-0 rounded-md border px-2 py-1 text-muted-foreground text-xs">
          {expanded ? "Hide" : "Open"}
        </span>
      </button>
      {expanded ? (
        <div id={panelId} className="grid gap-4 border-t px-4 py-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function SetupSection({
  property,
  readiness,
  unitError,
  ownerError,
  onAddUnit,
  onDeleteUnit,
  onAddOwner,
  onDeleteOwner,
}: SetupSectionProps) {
  const hasUnits = property.units.length > 0;
  const hasOwners = getOwnershipHistory(property).length > 0;
  const complete = readiness.setupGapCount === 0;
  const summary = `${pluralize(property.units.length, "unit")} · ${pluralize(
    property.owners.length,
    "owner",
  )}`;

  return (
    <Card id="property-setup" className="rounded-md py-0">
      <h2 className="sr-only">Property setup</h2>
      <Accordion defaultValue={complete ? [] : ["setup"]}>
        <AccordionItem value="setup" className="border-b-0">
          <AccordionTrigger className="items-center px-4 py-3 hover:no-underline">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
              {complete ? (
                <CheckCircle2
                  className="size-4 shrink-0 text-ready"
                  aria-hidden="true"
                />
              ) : (
                <CircleDot
                  className="size-4 shrink-0 text-review"
                  aria-hidden="true"
                />
              )}
              <span className="font-medium text-sm">Property setup</span>
              <Badge variant="outline" className="rounded-md tabular-nums">
                {summary}
              </Badge>
              {complete ? (
                <span className="ml-auto hidden text-muted-foreground text-xs sm:inline">
                  Complete - edit anytime
                </span>
              ) : (
                <span className="ml-auto hidden text-muted-foreground text-xs sm:inline">
                  Open to resolve setup gaps
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent id="property-setup-panel" className="px-4">
            <div className="grid gap-6 border-t pt-4 md:grid-cols-2">
              <SetupSubsection
                id="units"
                title="Units"
                description="Rental spaces under this property."
                action={<AddUnitSheet error={unitError} onSubmit={onAddUnit} />}
                error={unitError}
                empty={
                  hasUnits ? null : (
                    <EmptyState icon={Home}>No units recorded yet.</EmptyState>
                  )
                }
              >
                {hasUnits ? (
                  <UnitsTable property={property} onDeleteUnit={onDeleteUnit} />
                ) : null}
              </SetupSubsection>
              <SetupSubsection
                id="ownership-history"
                title="Ownership history"
                description="Effective-dated shares."
                action={
                  <AddOwnerSheet
                    acquisitionDate={property.acquisitionDate}
                    error={ownerError}
                    onSubmit={onAddOwner}
                  />
                }
                error={ownerError}
                empty={
                  hasOwners ? null : (
                    <EmptyState icon={Users}>
                      No ownership periods recorded yet.
                    </EmptyState>
                  )
                }
              >
                {hasOwners ? (
                  <OwnersTable
                    property={property}
                    onDeleteOwner={onDeleteOwner}
                  />
                ) : null}
              </SetupSubsection>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function AddUnitSheet({
  error,
  onSubmit,
}: {
  error?: string;
  onSubmit: (input: NewUnitInput) => boolean | Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const handleSubmit = createFormSubmit(unitFormSchema, async (input) => {
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
        Add unit
      </Button>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Add unit</SheetTitle>
          <SheetDescription>
            A rental space under this property.
          </SheetDescription>
        </SheetHeader>
        <form className="grid gap-4 px-4 pb-4" onSubmit={handleSubmit}>
          <FormErrorAlert message={error} />
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
          <Button type="submit" className="justify-self-start">
            <Plus data-icon="inline-start" />
            Add unit
          </Button>
        </form>
      </SheetContent>
    </Sheet>
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

function SetupSubsection({
  id,
  title,
  description,
  action,
  error,
  empty,
  children,
}: {
  id: string;
  title: string;
  description: string;
  action: ReactNode;
  error?: string;
  empty: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="grid scroll-mt-4 content-start gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        {action}
      </div>
      <FormErrorAlert message={error} />
      {empty}
      {children}
    </section>
  );
}

function UnitsTable({
  property,
  onDeleteUnit,
}: {
  property: RentalProperty;
  onDeleteUnit: (unitId: string) => boolean | Promise<boolean>;
}) {
  function handleDelete(unitId: string, label: string) {
    if (!window.confirm(`Delete unit "${label}"?`)) {
      return;
    }

    void onDeleteUnit(unitId);
  }

  return (
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
                onClick={() => handleDelete(unit.id, unit.label)}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OwnersTable({
  property,
  onDeleteOwner,
}: {
  property: RentalProperty;
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
                onClick={() => handleDelete(period.ownerId, period.ownerName)}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
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
  const setupGaps = readiness.tasks.filter(
    (task) => task.status !== "complete",
  );
  const nextSetupGap = setupGaps[0];
  const setupComplete = nextSetupGap === undefined;
  const readinessTone =
    nextSetupGap === undefined
      ? "ready"
      : getSetupTaskTone(nextSetupGap.status);
  const StatusIcon =
    nextSetupGap === undefined
      ? CheckCircle2
      : getSetupTaskIcon(nextSetupGap.status);
  const setupGapLabel = `${readiness.setupGapCount} setup gap${
    readiness.setupGapCount === 1 ? "" : "s"
  }`;
  const setupStatusLabel = setupComplete
    ? "Setup complete"
    : `${setupGapLabel}: ${nextSetupGap.label}`;
  const setupStatusDetail = setupComplete
    ? `${readiness.completedCount} of ${readiness.totalCount} setup items complete.`
    : nextSetupGap.detail;
  const setupAction =
    nextSetupGap === undefined ? null : getSetupAction(nextSetupGap.id);
  const setupFacts = [
    { label: "Units", value: property.units.length },
    { label: "Owners", value: property.owners.length },
    { label: "Ownership periods", value: property.ownershipPeriods.length },
  ];

  return (
    <Card className="rounded-md">
      <CardHeader className="pb-3">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                Acquired {formatDisplayDate(property.acquisitionDate)}
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
            <Badge
              variant="outline"
              className={cn("rounded-md", toneSurface[readinessTone])}
            >
              {setupGapLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 border-t p-4">
        <div
          className={cn(
            "grid gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
            toneSurface[readinessTone],
          )}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <StatusIcon
              className={cn("mt-0.5 size-4 shrink-0", toneIcon[readinessTone])}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-medium text-sm">{setupStatusLabel}</p>
              <p className="text-xs">{setupStatusDetail}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="justify-self-start rounded-md bg-background/70 text-xs tabular-nums sm:justify-self-end"
          >
            {readiness.completedCount}/{readiness.totalCount} complete
          </Badge>
          {setupAction ? (
            <Link
              href={setupAction.href}
              className={cn(
                buttonVariants({ variant: "default" }),
                "justify-self-start rounded-md sm:col-start-2 sm:justify-self-end",
              )}
            >
              {setupAction.label}
            </Link>
          ) : null}
        </div>
        <dl className="grid overflow-hidden rounded-md border sm:grid-cols-3 sm:divide-x">
          {setupFacts.map((fact) => (
            <div
              className="flex items-center justify-between gap-3 px-3 py-2"
              key={fact.label}
            >
              <dt className="text-muted-foreground text-xs">{fact.label}</dt>
              <dd className="font-semibold text-sm tabular-nums">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function getSetupAction(id: PropertyReadiness["tasks"][number]["id"]) {
  if (id === "units") {
    return { href: "#units", label: "Add unit" };
  }

  if (id === "owners" || id === "ownership") {
    return { href: "#ownership-history", label: "Fix ownership shares" };
  }

  return { href: "#property-setup", label: "Review setup" };
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
