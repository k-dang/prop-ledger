"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Home,
  type LucideIcon,
  MapPin,
  Plus,
  Receipt,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { z } from "zod";
import { EvidenceBinderPanel } from "@/components/evidence-binder/evidence-workspace";
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
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toneSurface } from "@/lib/status-styles";
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
    ownerEmail: optionalFormString,
    percentage: finiteFormNumber,
    effectiveFrom: requiredFormString,
    effectiveTo: optionalFormString,
  })
  .transform(
    (data): NewOwnerWithOwnershipInput => ({
      name: data.ownerName,
      email: data.ownerEmail,
      percentage: data.percentage,
      effectiveFrom: data.effectiveFrom,
      effectiveTo: data.effectiveTo,
    }),
  );

export function PropertyWorkspaceDetail({
  property,
  readiness,
  unitError,
  ownerError,
  transactionError,
  documentError,
  onAddUnit,
  onDeleteUnit,
  onAddOwner,
  onDeleteOwner,
  onCreateManualTransaction,
  onDeleteManualTransaction,
  onUploadTransactionEvidence,
  onDeleteEvidenceDocument,
}: {
  property: RentalProperty;
  readiness: PropertyReadiness;
  unitError?: string;
  ownerError?: string;
  transactionError?: string;
  documentError?: string;
  onAddUnit: (input: NewUnitInput) => boolean | Promise<boolean>;
  onDeleteUnit: (unitId: string) => boolean | Promise<boolean>;
  onAddOwner: (input: NewOwnerWithOwnershipInput) => boolean | Promise<boolean>;
  onDeleteOwner: (ownerId: string) => boolean | Promise<boolean>;
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
      <PropertySummary property={property} readiness={readiness} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SetupChecklist readiness={readiness} />
        <PropertyFacts property={property} />
      </div>
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
      <EvidenceBinderPanel
        property={property}
        transactionError={transactionError}
        documentError={documentError}
        onCreateManualTransaction={onCreateManualTransaction}
        onDeleteManualTransaction={onDeleteManualTransaction}
        onUploadTransactionEvidence={onUploadTransactionEvidence}
        onDeleteEvidenceDocument={onDeleteEvidenceDocument}
      />
    </>
  );
}

function PropertySummary({
  property,
  readiness,
}: {
  property: RentalProperty;
  readiness: PropertyReadiness;
}) {
  return (
    <Card className="rounded-md">
      <CardHeader className="gap-3 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <CardTitle as="h1" className="truncate text-xl">
            {property.name}
          </CardTitle>
          <CardDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {property.line1}, {property.municipality}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Acquired {property.acquisitionDate}
            </span>
          </CardDescription>
        </div>
        <CardAction className="flex flex-wrap items-center justify-end gap-2">
          <Badge className="rounded-md bg-ready text-ready-foreground">
            {readiness.readinessPercent}% ready
          </Badge>
          <Badge
            variant="outline"
            className={cn("rounded-md", toneSurface.info)}
          >
            {readiness.setupGapCount} setup gaps
          </Badge>
          <Link
            href={`/properties/${property.id}/rent-ledger`}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-md")}
          >
            <Receipt data-icon="inline-start" />
            Rent ledger
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="py-3 first:pt-0 sm:px-5 sm:py-0 sm:first:pt-0 sm:first:pl-0">
            <dt className="text-muted-foreground text-xs">Units</dt>
            <dd className="mt-1 font-semibold text-2xl tabular-nums">
              {property.units.length}
            </dd>
          </div>
          <div className="py-3 sm:px-5 sm:py-0">
            <dt className="text-muted-foreground text-xs">Owners</dt>
            <dd className="mt-1 font-semibold text-2xl tabular-nums">
              {property.owners.length}
            </dd>
          </div>
          <div className="py-3 last:pb-0 sm:px-5 sm:py-0 sm:last:pb-0">
            <dt className="text-muted-foreground text-xs">Ownership periods</dt>
            <dd className="mt-1 font-semibold text-2xl tabular-nums">
              {property.ownershipPeriods.length}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function SetupChecklist({ readiness }: { readiness: PropertyReadiness }) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Setup checklist</CardTitle>
        <CardDescription>Property readiness</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {readiness.tasks.map((task) => (
          <div
            className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-3 rounded-md border bg-background p-3"
            key={task.id}
          >
            {task.status === "complete" ? (
              <CheckCircle2
                className="mt-0.5 size-5 text-ready"
                aria-hidden="true"
              />
            ) : task.status === "warning" ? (
              <AlertTriangle
                className="mt-0.5 size-5 text-blocked"
                aria-hidden="true"
              />
            ) : (
              <CircleDot
                className="mt-0.5 size-5 text-review"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm">{task.label}</p>
              <p className="mt-1 text-muted-foreground text-sm">
                {task.detail}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "rounded-md",
                task.status === "complete" && toneSurface.ready,
                task.status === "missing" && toneSurface.review,
                task.status === "warning" && toneSurface.blocked,
              )}
            >
              {formatSetupStatus(task.status)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
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

function PropertyFacts({ property }: { property: RentalProperty }) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle as="h2">Property facts</CardTitle>
        <CardDescription>Details used across annual records.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">Municipality</p>
            <p className="mt-1 font-medium text-sm">{property.municipality}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Province</p>
            <p className="mt-1 font-medium text-sm">{property.province}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Postal code</p>
            <p className="mt-1 font-medium text-sm">{property.postalCode}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Acquisition date</p>
            <p className="mt-1 font-medium text-sm">
              {property.acquisitionDate}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
            <FieldLabel htmlFor="ownerEmail">Email</FieldLabel>
            <Input id="ownerEmail" name="ownerEmail" type="email" />
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
              <Input
                id="ownerEffectiveFrom"
                name="effectiveFrom"
                type="date"
                defaultValue={acquisitionDate}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ownerEffectiveTo">Effective to</FieldLabel>
              <Input id="ownerEffectiveTo" name="effectiveTo" type="date" />
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
                <TableHead>Email</TableHead>
                <TableHead>Share</TableHead>
                <TableHead>Effective dates</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((period) => (
                <TableRow key={period.id}>
                  <TableCell>{period.ownerName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {period.ownerEmail || "Not recorded"}
                  </TableCell>
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
