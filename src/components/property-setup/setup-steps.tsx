import { Plus, Trash2 } from "lucide-react";
import type { Ref } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RENT_FREQUENCIES } from "@/db/schema";
import {
  type FieldErrors,
  LAYOUTS,
  type LayoutKey,
  MAX_ROWS,
  newSetupOwner,
  newSetupUnit,
  type Occupancy,
  type OwnerMode,
  ownersDroppedBy,
  ownershipTotal,
  PROVINCES,
  type SetupForm,
  type SetupOwner,
  type SetupStep,
  type SetupUnit,
  UNIT_TYPES,
  unitsDroppedBy,
  withLayout,
  withOwner,
  withOwnerMode,
  withUnit,
} from "@/lib/property-setup";
import { formatDateWithYear, formatPercent } from "@/lib/property-workspace";
import { FREQUENCY_LABELS } from "@/lib/rent-ledger";
import { toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import {
  ChoiceCards,
  DateField,
  GroupError,
  LeaseFileField,
  SelectField,
  TextField,
} from "./setup-fields";

/**
 * Props every wizard screen takes. Screens build the next form themselves and
 * pass the error paths the edit resolves (`"all"` after removing a row).
 */
export type StepProps = {
  form: SetupForm;
  errors: FieldErrors;
  onChange: (next: SetupForm, clear?: string[] | "all") => void;
};

type ChoiceOption<Value> = { value: Value; title: string; description: string };

const OWNER_OPTIONS = [
  { value: "solo", title: "Just me", description: "You own 100%" },
  {
    value: "partner",
    title: "Me and one other person, equally",
    description: "Spouse, partner or co-owner — 50% each",
  },
  {
    value: "multi",
    title: "Several owners or unequal shares",
    description: "You’ll enter each share",
  },
] as const satisfies readonly ChoiceOption<OwnerMode>[];

const LAYOUT_OPTIONS = Object.entries(LAYOUTS).map(([value, layout]) => ({
  value: value as LayoutKey,
  title: layout.label,
  description: layout.description,
}));

const OCCUPANCY_OPTIONS = [
  {
    value: "rented",
    title: "Yes, it’s rented",
    description: "Add the tenant and rent",
  },
  {
    value: "vacant",
    title: "No, it’s vacant",
    description: "Nothing else needed",
  },
] as const satisfies readonly ChoiceOption<Occupancy>[];

const FREQUENCY_OPTIONS = RENT_FREQUENCIES.map((value) => ({
  value,
  label: FREQUENCY_LABELS[value],
}));
const PROVINCE_OPTIONS = PROVINCES.map((value) => ({ value, label: value }));
const UNIT_TYPE_OPTIONS = UNIT_TYPES.map((value) => ({ value, label: value }));

/** `A`, `A and B`, or `A, B, and C`. */
function listNames(names: string[]) {
  return new Intl.ListFormat("en-CA", { type: "conjunction" }).format(names);
}

export function StepHeading({
  ref,
  form,
  step,
  resuming,
}: {
  ref: Ref<HTMLHeadingElement>;
  form: SetupForm;
  step: SetupStep;
  resuming: boolean;
}) {
  const copy = stepCopy(form, step, resuming);

  return (
    <div className="grid gap-1">
      {copy.eyebrow ? (
        <p className="font-medium text-muted-foreground text-sm">
          {copy.eyebrow}
        </p>
      ) : null}
      <h2
        ref={ref}
        tabIndex={-1}
        className="font-semibold text-xl tracking-tight outline-none"
      >
        {copy.title}
      </h2>
      <p className="text-muted-foreground text-sm">{copy.lede}</p>
    </div>
  );
}

function stepCopy(form: SetupForm, step: SetupStep, resuming: boolean) {
  switch (step.kind) {
    case "property":
      return {
        title: "Where is it, and when did you take ownership?",
        lede: "Ownership shares start on your acquisition date — usually the closing date.",
      };
    case "ownership":
      return {
        title: "Who owns it?",
        lede: `Each owner reports their share of the income and expenses. Shares apply from ${formatDateWithYear(form.property.acquisitionDate)}.`,
      };
    case "units":
      return {
        title: "How is it rented out?",
        lede: "We’ll create a unit for each rentable space so rent lands in the right place. Rename them if you like.",
      };
    case "unit": {
      const unit = form.units[step.index];
      const named = unit.label.trim() !== `Unit ${step.index + 1}`;
      return {
        eyebrow:
          form.units.length > 1
            ? `Unit ${step.index + 1} of ${form.units.length}${named ? ` · ${unit.label}` : ""}`
            : unit.label,
        title: "Is it rented right now?",
        lede: "Vacant is fine — add a tenant whenever it’s rented.",
      };
    }
    case "review":
      return {
        title: "Check it over",
        lede: resuming
          ? "Owners, units, and leases are saved when you finish setup."
          : "Nothing is saved until you create the property.",
      };
  }
}

export function PropertyStep({ form, errors, onChange }: StepProps) {
  const { property } = form;

  function set(patch: Partial<SetupForm["property"]>) {
    onChange(
      { ...form, property: { ...property, ...patch } },
      Object.keys(patch).map((key) => `property.${key}`),
    );
  }

  return (
    <div className="grid gap-4">
      <TextField
        path="property.line1"
        label="Street address"
        autoComplete="address-line1"
        value={property.line1}
        onValueChange={(line1) => set({ line1 })}
        error={errors["property.line1"]}
      />
      <TextField
        path="property.line2"
        label="Apartment, suite, etc."
        optional
        autoComplete="address-line2"
        value={property.line2}
        onValueChange={(line2) => set({ line2 })}
      />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_5.5rem_9.5rem]">
        <TextField
          path="property.municipality"
          label="Municipality"
          autoComplete="address-level2"
          value={property.municipality}
          onValueChange={(municipality) => set({ municipality })}
          error={errors["property.municipality"]}
        />
        <SelectField
          path="property.province"
          label="Province"
          value={property.province}
          options={PROVINCE_OPTIONS}
          onValueChange={(province) => set({ province })}
          error={errors["property.province"]}
        />
        <TextField
          path="property.postalCode"
          label="Postal code"
          autoComplete="postal-code"
          placeholder="A1A 1A1"
          value={property.postalCode}
          onValueChange={(postalCode) => set({ postalCode })}
          error={errors["property.postalCode"]}
        />
      </div>
      <DateField
        path="property.acquisitionDate"
        label="Acquisition date"
        className="sm:max-w-64"
        value={property.acquisitionDate}
        onValueChange={(acquisitionDate) => set({ acquisitionDate })}
        error={errors["property.acquisitionDate"]}
      />
    </div>
  );
}

export function OwnershipStep({ form, errors, onChange }: StepProps) {
  const mode = form.ownerMode;

  function setMode(next: OwnerMode) {
    const dropped = ownersDroppedBy(form, next);
    if (
      dropped.length > 0 &&
      !window.confirm(
        `Switching removes ${listNames(dropped)} from the owners.`,
      )
    ) {
      return;
    }
    onChange(withOwnerMode(form, next), ["ownerMode", "owners"]);
  }

  function setOwner(position: number, patch: Partial<SetupOwner>) {
    onChange(withOwner(form, position, patch), [
      ...Object.keys(patch).map((key) => `owners.${position}.${key}`),
      "owners",
    ]);
  }

  return (
    <div className="grid gap-4">
      <ChoiceCards
        path="ownerMode"
        label="Who owns it?"
        value={mode}
        options={OWNER_OPTIONS}
        onValueChange={setMode}
        error={errors.ownerMode}
      />
      {mode ? (
        <div className={mode === "partner" ? "grid gap-2" : "grid gap-3"}>
          <div
            className={cn(
              "grid",
              mode === "partner" ? "gap-4 sm:grid-cols-2" : "gap-3",
            )}
          >
            {form.owners.map((owner, position) => (
              <div
                key={owner.id}
                className={
                  mode === "multi"
                    ? "grid grid-cols-[minmax(0,1fr)_6.5rem_2rem] items-start gap-3"
                    : "contents"
                }
              >
                <TextField
                  path={`owners.${position}.name`}
                  label={
                    mode === "solo" ? "Your name" : `Owner ${position + 1}`
                  }
                  autoComplete={position === 0 ? "name" : "off"}
                  value={owner.name}
                  onValueChange={(name) => setOwner(position, { name })}
                  error={errors[`owners.${position}.name`]}
                  hint={
                    mode === "solo"
                      ? "As it appears on your T776. You own 100%."
                      : undefined
                  }
                />
                {mode === "multi" ? (
                  <>
                    <TextField
                      path={`owners.${position}.share`}
                      label="Share"
                      inputMode="decimal"
                      suffix="%"
                      value={owner.share}
                      onValueChange={(share) => setOwner(position, { share })}
                      error={errors[`owners.${position}.share`]}
                    />
                    {form.owners.length > 2 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-7 text-muted-foreground hover:text-blocked"
                        aria-label={`Remove owner ${position + 1}`}
                        onClick={() =>
                          onChange(
                            {
                              ...form,
                              owners: form.owners.filter(
                                (_, i) => i !== position,
                              ),
                            },
                            "all",
                          )
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            ))}
          </div>
          {mode === "partner" ? (
            <p className="text-muted-foreground text-sm">
              Each owns 50%. Need different shares?{" "}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-brand-text"
                onClick={() => setMode("multi")}
              >
                Enter shares instead
              </Button>
            </p>
          ) : null}
          {mode === "multi" ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                disabled={form.owners.length >= MAX_ROWS}
                onClick={() =>
                  onChange(
                    { ...form, owners: [...form.owners, newSetupOwner()] },
                    ["owners"],
                  )
                }
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                Add owner
              </Button>
              <ShareTotal total={ownershipTotal(form)} />
            </>
          ) : null}
        </div>
      ) : null}
      <GroupError path="owners" error={errors.owners} />
      {mode ? (
        <p className="text-muted-foreground text-sm">
          Ownership changed after you bought it? Add that history later from the
          property page.
        </p>
      ) : null}
    </div>
  );
}

function ShareTotal({ total }: { total: number }) {
  const full = Math.abs(total - 100) < 0.001;
  const over = total > 100.001;

  return (
    <div className="grid gap-2 rounded-lg bg-muted px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>
          Total ownership{" "}
          <span className="font-medium tabular-nums">
            {formatPercent(total)}%
          </span>
        </span>
        <Badge
          variant="outline"
          className={toneSurface[full ? "ready" : over ? "blocked" : "review"]}
        >
          <span className="tabular-nums">
            {full
              ? "Adds up to 100%"
              : over
                ? `${formatPercent(total - 100)}% over`
                : `${formatPercent(100 - total)}% unassigned`}
          </span>
        </Badge>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-background">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            full ? "bg-ready" : over ? "bg-blocked" : "bg-brand",
          )}
          style={{ width: `${Math.min(total, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function UnitsStep({ form, errors, onChange }: StepProps) {
  function setUnit(position: number, patch: Partial<SetupUnit>) {
    onChange(withUnit(form, position, patch), [
      ...Object.keys(patch).map((key) => `units.${position}.${key}`),
      "units",
    ]);
  }

  return (
    <div className="grid gap-4">
      <ChoiceCards
        path="layout"
        label="How is it rented out?"
        value={form.layout}
        options={LAYOUT_OPTIONS}
        onValueChange={(layout) => {
          const dropped = unitsDroppedBy(form, layout);
          if (
            dropped.length > 0 &&
            !window.confirm(
              `Switching to ${LAYOUTS[layout].label} removes ${listNames(dropped)} and what you entered for ${dropped.length === 1 ? "it" : "them"}.`,
            )
          ) {
            return;
          }
          onChange(withLayout(form, layout), ["layout", "units"]);
        }}
        error={errors.layout}
        columns={3}
      />
      {form.layout ? (
        <div className="grid gap-5 sm:gap-3">
          {form.units.map((unit, position) => (
            <div
              key={unit.id}
              className="grid grid-cols-[minmax(0,1fr)_2rem] items-start gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_2rem]"
            >
              <TextField
                path={`units.${position}.label`}
                label="Unit name"
                value={unit.label}
                onValueChange={(label) => setUnit(position, { label })}
                error={errors[`units.${position}.label`]}
              />
              <SelectField
                path={`units.${position}.unitType`}
                label="Type"
                className="max-sm:col-start-1 max-sm:row-start-2"
                value={unit.unitType}
                options={UNIT_TYPE_OPTIONS}
                onValueChange={(unitType) => setUnit(position, { unitType })}
                error={errors[`units.${position}.unitType`]}
              />
              {form.units.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-7 text-muted-foreground hover:text-blocked max-sm:col-start-2 max-sm:row-start-1"
                  aria-label={`Remove ${unit.label || `unit ${position + 1}`}`}
                  onClick={() =>
                    onChange(
                      {
                        ...form,
                        units: form.units.filter((_, i) => i !== position),
                      },
                      "all",
                    )
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="justify-self-start"
            disabled={form.units.length >= MAX_ROWS}
            onClick={() =>
              onChange(
                {
                  ...form,
                  units: [
                    ...form.units,
                    newSetupUnit(`Unit ${form.units.length + 1}`),
                  ],
                },
                ["units"],
              )
            }
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            Add unit
          </Button>
        </div>
      ) : null}
      <GroupError path="units" error={errors.units} />
    </div>
  );
}

export function UnitStep({
  form,
  errors,
  onChange,
  position,
  file,
  onFileChange,
}: StepProps & {
  position: number;
  file: File | undefined;
  onFileChange: (file: File | undefined) => void;
}) {
  const unit = form.units[position];
  const path = `units.${position}`;

  function set(patch: Partial<SetupUnit>) {
    onChange(withUnit(form, position, patch), [
      ...Object.keys(patch).map((key) => `${path}.${key}`),
      "units",
    ]);
  }

  return (
    <div className="grid gap-4">
      <ChoiceCards
        path={`${path}.occupancy`}
        label="Is it rented right now?"
        value={unit.occupancy}
        options={OCCUPANCY_OPTIONS}
        onValueChange={(occupancy) => set({ occupancy })}
        error={errors[`${path}.occupancy`]}
        columns={2}
      />
      {unit.occupancy === "rented" ? (
        <>
          <TextField
            path={`${path}.tenantName`}
            label="Tenant name(s)"
            autoComplete="off"
            hint="Everyone named on the lease."
            value={unit.tenantName}
            onValueChange={(tenantName) => set({ tenantName })}
            error={errors[`${path}.tenantName`]}
          />
          <DateField
            path={`${path}.startDate`}
            label="Lease start"
            className="sm:max-w-64"
            value={unit.startDate}
            onValueChange={(startDate) => set({ startDate })}
            error={errors[`${path}.startDate`]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              path={`${path}.rentAmount`}
              label="Rent"
              inputMode="decimal"
              prefix="$"
              value={unit.rentAmount}
              onValueChange={(rentAmount) => set({ rentAmount })}
              error={errors[`${path}.rentAmount`]}
            />
            <SelectField
              path={`${path}.rentFrequency`}
              label="Paid"
              value={unit.rentFrequency}
              options={FREQUENCY_OPTIONS}
              onValueChange={(rentFrequency) => set({ rentFrequency })}
            />
          </div>
          <LeaseFileField
            path={`${path}.leaseFile`}
            file={file}
            onFileChange={onFileChange}
          />
        </>
      ) : null}
    </div>
  );
}
