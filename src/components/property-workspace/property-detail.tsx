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
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
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
import { Separator } from "@/components/ui/separator";
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
  onAddOwner,
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
  onAddOwner: (input: NewOwnerWithOwnershipInput) => boolean | Promise<boolean>;
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
      <div className="grid gap-4 xl:grid-cols-2">
        <UnitsPanel
          property={property}
          error={unitError}
          onSubmit={onAddUnit}
        />
        <OwnersPanel
          property={property}
          error={ownerError}
          onSubmit={onAddOwner}
        />
      </div>
      <OwnershipPanel property={property} />
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
          <CardTitle className="truncate text-xl">{property.name}</CardTitle>
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
          <Badge className="rounded-md bg-emerald-700">
            {readiness.readinessPercent}% ready
          </Badge>
          <Badge
            variant="outline"
            className="rounded-md border-sky-300 bg-sky-50 text-sky-800"
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
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border bg-background p-3">
            <p className="text-muted-foreground text-xs">Units</p>
            <p className="mt-1 font-semibold text-2xl">
              {property.units.length}
            </p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-muted-foreground text-xs">Owners</p>
            <p className="mt-1 font-semibold text-2xl">
              {property.owners.length}
            </p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-muted-foreground text-xs">Ownership periods</p>
            <p className="mt-1 font-semibold text-2xl">
              {property.ownershipPeriods.length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SetupChecklist({ readiness }: { readiness: PropertyReadiness }) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Setup checklist</CardTitle>
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
                className="mt-0.5 size-5 text-emerald-700"
                aria-hidden="true"
              />
            ) : task.status === "warning" ? (
              <AlertTriangle
                className="mt-0.5 size-5 text-red-700"
                aria-hidden="true"
              />
            ) : (
              <CircleDot
                className="mt-0.5 size-5 text-amber-700"
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
                task.status === "complete" &&
                  "border-emerald-300 bg-emerald-50 text-emerald-800",
                task.status === "missing" &&
                  "border-amber-300 bg-amber-50 text-amber-800",
                task.status === "warning" &&
                  "border-red-300 bg-red-50 text-red-800",
              )}
            >
              {task.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PropertyFacts({ property }: { property: RentalProperty }) {
  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Property facts</CardTitle>
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
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md",
              property.hasPersonalUse
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-emerald-300 bg-emerald-50 text-emerald-800",
            )}
          >
            Personal use: {property.hasPersonalUse ? "yes" : "no"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function UnitsPanel({
  property,
  error,
  onSubmit,
}: {
  property: RentalProperty;
  error?: string;
  onSubmit: (input: NewUnitInput) => boolean | Promise<boolean>;
}) {
  const handleSubmit = createFormSubmit(unitFormSchema, onSubmit);

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Units</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {property.units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>{unit.label}</TableCell>
                  <TableCell>{unit.unitType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function OwnersPanel({
  property,
  error,
  onSubmit,
}: {
  property: RentalProperty;
  error?: string;
  onSubmit: (input: NewOwnerWithOwnershipInput) => boolean | Promise<boolean>;
}) {
  const handleSubmit = createFormSubmit(ownerFormSchema, onSubmit);

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Owners</CardTitle>
        <CardDescription>People sharing the property records.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,1.6fr)_auto] lg:items-end"
          onSubmit={handleSubmit}
        >
          <Field>
            <FieldLabel className="lg:min-h-8" htmlFor="ownerName">
              Owner name
            </FieldLabel>
            <Input id="ownerName" name="ownerName" required />
          </Field>
          <Field>
            <FieldLabel className="lg:min-h-8" htmlFor="ownerEmail">
              Email
            </FieldLabel>
            <Input id="ownerEmail" name="ownerEmail" type="email" />
          </Field>
          <Field>
            <FieldLabel className="lg:min-h-8" htmlFor="ownerPercentage">
              Share %
            </FieldLabel>
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
          <Field>
            <FieldLabel className="lg:min-h-8" htmlFor="ownerEffectiveFrom">
              Effective from
            </FieldLabel>
            <Input
              id="ownerEffectiveFrom"
              name="effectiveFrom"
              type="date"
              defaultValue={property.acquisitionDate}
              required
            />
          </Field>
          <Field>
            <FieldLabel className="lg:min-h-8" htmlFor="ownerEffectiveTo">
              Effective to
            </FieldLabel>
            <Input id="ownerEffectiveTo" name="effectiveTo" type="date" />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto">
              <Plus data-icon="inline-start" />
              Add
            </Button>
          </div>
        </form>
        <FormErrorAlert message={error} />
        {property.owners.length === 0 ? (
          <EmptyState icon={Users}>No owners recorded.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {property.owners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell>{owner.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {owner.email || "Not recorded"}
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

function OwnershipPanel({ property }: { property: RentalProperty }) {
  const history = getOwnershipHistory(property);

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Ownership history</CardTitle>
        <CardDescription>Effective-dated shares.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {history.length === 0 ? (
          <EmptyState icon={Users}>No ownership periods recorded.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Share</TableHead>
                <TableHead>Effective dates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((period) => (
                <TableRow key={period.id}>
                  <TableCell>{period.ownerName}</TableCell>
                  <TableCell>{period.percentageLabel}</TableCell>
                  <TableCell>{period.dateRange}</TableCell>
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
