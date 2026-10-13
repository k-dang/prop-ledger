"use client";

import { Home, type LucideIcon, Trash2, Users } from "lucide-react";
import { type ReactNode, useState } from "react";
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
  ConfirmDialog,
  usePendingConfirm,
} from "@/components/ui/confirm-dialog";
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
import { useMutation } from "@/hooks/use-mutation";
import {
  addOwnerWithOwnership,
  addUnit,
  deleteOwner,
  deleteUnit,
} from "@/lib/actions";
import { createOwnershipPeriodTimeline } from "@/lib/ownership-period-timeline";
import {
  formatPercent,
  type NewOwnerWithOwnershipInput,
  type NewUnitInput,
  type RentalProperty,
} from "@/lib/property-workspace";

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

export function PropertySetup({ property }: { property: RentalProperty }) {
  const { error: unitError, runMutation: runUnitMutation } = useMutation();
  const { error: ownerError, runMutation: runOwnerMutation } = useMutation();
  const onAddUnit = async (input: NewUnitInput) =>
    (await runUnitMutation(() => addUnit(property.id, input))).ok;
  const onDeleteUnit = async (unitId: string) =>
    (await runUnitMutation(() => deleteUnit(property.id, unitId))).ok;
  const onAddOwner = async (input: NewOwnerWithOwnershipInput) =>
    (await runOwnerMutation(() => addOwnerWithOwnership(property.id, input)))
      .ok;
  const onDeleteOwner = async (ownerId: string) =>
    (await runOwnerMutation(() => deleteOwner(property.id, ownerId))).ok;
  const hasUnits = property.units.length > 0;
  const ownershipHistory = getOwnershipDisplayHistory(property);
  const hasOwners = ownershipHistory.length > 0;

  return (
    <div id="property-setup" className="grid gap-6 md:grid-cols-2">
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
            history={ownershipHistory}
            onDeleteOwner={onDeleteOwner}
          />
        ) : null}
      </SetupSubsection>
    </div>
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
  const confirm = usePendingConfirm<{ id: string; label: string }>();

  return (
    <>
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
                  onClick={() =>
                    confirm.request({ id: unit.id, label: unit.label })
                  }
                >
                  <Trash2 data-icon="inline-start" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete unit?"
        description={
          confirm.target
            ? `Delete unit "${confirm.target.label}"?`
            : "Delete this unit?"
        }
        confirmLabel="Delete unit"
        onConfirm={() => {
          const target = confirm.take();
          if (target) void onDeleteUnit(target.id);
        }}
      />
    </>
  );
}

function OwnersTable({
  history,
  onDeleteOwner,
}: {
  history: ReturnType<typeof getOwnershipDisplayHistory>;
  onDeleteOwner: (ownerId: string) => boolean | Promise<boolean>;
}) {
  const confirm = usePendingConfirm<{ id: string; name: string }>();

  return (
    <>
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
                  onClick={() =>
                    confirm.request({
                      id: period.ownerId,
                      name: period.ownerName,
                    })
                  }
                >
                  <Trash2 data-icon="inline-start" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete owner?"
        description={
          confirm.target
            ? `Delete owner "${confirm.target.name}" and their ownership periods?`
            : "Delete this owner?"
        }
        confirmLabel="Delete owner"
        onConfirm={() => {
          const target = confirm.take();
          if (target) void onDeleteOwner(target.id);
        }}
      />
    </>
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

function getOwnershipDisplayHistory(property: RentalProperty) {
  return createOwnershipPeriodTimeline({
    owners: property.owners,
    periods: property.ownershipPeriods,
  })
    .periodsWithOwners()
    .map((period) => ({
      ...period,
      dateRange: formatDateRange(period.effectiveFrom, period.effectiveTo),
      percentageLabel: `${formatPercent(period.percentage)}%`,
    }));
}

function formatDateRange(start: string, end: string | null) {
  return end === null ? `${start} onward` : `${start} to ${end}`;
}
