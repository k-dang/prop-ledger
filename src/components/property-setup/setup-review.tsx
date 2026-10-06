import { ArrowRight, Check, Info } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  isSectionComplete,
  normalizePostalCode,
  parseAmount,
  SECTION_TITLES,
  SETUP_SECTIONS,
  type SetupForm,
  type SetupSection,
  type SetupStep,
  sectionIndex,
} from "@/lib/property-setup";
import { formatDateWithYear } from "@/lib/property-workspace";
import { FREQUENCY_LABELS, formatMoney } from "@/lib/rent-ledger";
import { toneSurface } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import { TextField } from "./setup-fields";
import type { StepProps } from "./setup-steps";

export type UploadFailure = {
  leaseId: string;
  fileName: string;
  error: string;
};

type ReviewRow = { key: string; term: string; detail: string };

export function ReviewStep({
  form,
  errors,
  onChange,
  leaseFiles,
  onEdit,
}: StepProps & {
  leaseFiles: Record<string, File>;
  onEdit: (section: SetupSection) => void;
}) {
  const { property } = form;
  const missingLeases = form.units.filter(
    (unit) => unit.occupancy === "rented" && !leaseFiles[unit.id],
  );

  return (
    <div className="grid gap-5">
      <TextField
        path="property.name"
        label="Property name"
        hint="Shown across your workspace."
        placeholder={property.line1.trim()}
        value={property.name}
        onValueChange={(name) =>
          onChange({ ...form, property: { ...property, name } }, [
            "property.name",
          ])
        }
        error={errors["property.name"]}
      />
      <div className="divide-y">
        <ReviewSection
          title={SECTION_TITLES.property}
          onEdit={() => onEdit("property")}
          rows={[
            {
              key: "address",
              term: property.line1,
              detail: `${property.municipality}, ${property.province} ${normalizePostalCode(property.postalCode)}`,
            },
            {
              key: "acquired",
              term: "Acquired",
              detail: formatDateWithYear(property.acquisitionDate),
            },
          ]}
        />
        <ReviewSection
          title={SECTION_TITLES.ownership}
          onEdit={() => onEdit("ownership")}
          rows={form.owners.map((owner) => ({
            key: owner.id,
            term: owner.name,
            detail: `${owner.share}%`,
          }))}
        />
        <ReviewSection
          title={SECTION_TITLES.units}
          onEdit={() => onEdit("units")}
          rows={form.units.map((unit) => ({
            key: unit.id,
            term: unit.label,
            detail: unit.unitType,
          }))}
        />
        <ReviewSection
          title={SECTION_TITLES.unit}
          onEdit={() => onEdit("unit")}
          rows={form.units.map((unit) => ({
            key: unit.id,
            term: unit.label,
            detail:
              unit.occupancy === "rented"
                ? `${unit.tenantName} · ${formatMoney(parseAmount(unit.rentAmount))} ${FREQUENCY_LABELS[unit.rentFrequency].toLowerCase()} since ${formatDateWithYear(unit.startDate)}`
                : "Vacant",
          }))}
        />
      </div>
      {missingLeases.length > 0 ? (
        <div className="flex items-start gap-2.5 rounded-lg border bg-muted/50 p-3 text-sm">
          <Info
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p>
            No signed lease attached for{" "}
            {missingLeases.map((unit) => unit.label).join(", ")}. That’s fine —
            you can add it from the property page.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ReviewSection({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: ReviewRow[];
  onEdit: () => void;
}) {
  return (
    <section className="grid gap-1.5 py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {title}
        </h3>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-brand-text"
          onClick={onEdit}
        >
          Edit<span className="sr-only"> {title}</span>
        </Button>
      </div>
      <dl className="grid gap-1 text-sm">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between gap-4">
            <dt>{row.term}</dt>
            <dd className="text-right text-muted-foreground tabular-nums">
              {row.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Section list; finished sections show what was entered. */
export function SetupRail({
  form,
  step,
  maxSection,
  today,
  onSelect,
}: {
  form: SetupForm;
  step: SetupStep;
  maxSection: number;
  today: string;
  onSelect: (section: SetupSection) => void;
}) {
  const current = sectionIndex(step);

  return (
    <ol className="sticky top-20 grid gap-0.5">
      {SETUP_SECTIONS.map((section, position) => {
        const visited = position <= maxSection;
        const here = position === current;
        const done =
          visited &&
          !here &&
          section !== "review" &&
          isSectionComplete(form, section, today);
        const summary = done
          ? sectionSummary(form, section)
          : here && step.kind === "unit"
            ? sectionSummary(form, section, step.index)
            : null;
        const content = (
          <>
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border bg-background font-semibold text-xs tabular-nums",
                done && "border-ready-border bg-ready-surface text-ready",
                here && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {done ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                position + 1
              )}
            </span>
            <span className="grid min-w-0 gap-0.5 pt-0.5">
              <span>{SECTION_TITLES[section]}</span>
              {summary ? (
                <span className="text-muted-foreground text-xs leading-snug [overflow-wrap:anywhere]">
                  {summary}
                </span>
              ) : null}
            </span>
          </>
        );
        const className = cn(
          "flex w-full items-start gap-2.5 rounded-lg p-2 text-left text-muted-foreground text-sm",
          here && "bg-muted font-medium text-foreground",
        );

        return (
          <li key={section}>
            {visited && !here ? (
              <button
                type="button"
                className={cn(className, "hover:bg-muted")}
                onClick={() => onSelect(section)}
              >
                {content}
                {done ? <span className="sr-only"> (complete)</span> : null}
              </button>
            ) : (
              <span
                className={className}
                aria-current={here ? "step" : undefined}
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function sectionSummary(
  form: SetupForm,
  section: SetupSection,
  currentUnit?: number,
) {
  switch (section) {
    case "property":
      return (
        <>
          {form.property.line1}
          <br />
          Acquired {formatDateWithYear(form.property.acquisitionDate)}
        </>
      );
    case "ownership":
      return form.owners.map((owner) => (
        <span key={owner.id} className="block">
          {owner.name} <span className="tabular-nums">{owner.share}%</span>
        </span>
      ));
    case "units":
      return form.units.map((unit) => unit.label).join(", ");
    case "unit":
      return form.units.map((unit, position) => (
        <span
          key={unit.id}
          className={cn(
            "block",
            position === currentUnit && "font-medium text-foreground",
          )}
        >
          {unit.label} ·{" "}
          {unit.occupancy === "rented"
            ? unit.tenantName || "rented"
            : unit.occupancy === "vacant"
              ? "vacant"
              : "—"}
        </span>
      ));
    case "review":
      return null;
  }
}

/** Shown on the setup page of a property whose setup is already finished. */
export function SetupFinishedNotice({ propertyId }: { propertyId: string }) {
  return (
    <div className="grid max-w-2xl gap-4">
      <h1 className="font-semibold text-2xl tracking-tight">
        Setup is finished
      </h1>
      <p className="text-muted-foreground text-sm">
        Make changes to owners, units, and leases from the property page.
      </p>
      <Link
        href={`/properties/${propertyId}`}
        className={cn(buttonVariants(), "justify-self-start")}
      >
        Go to property
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Link>
    </div>
  );
}

/** Shown when the property saved but one or more lease files did not upload. */
export function UploadFailureNotice({
  propertyId,
  failures,
}: {
  propertyId: string;
  failures: UploadFailure[];
}) {
  return (
    <div className="grid max-w-2xl gap-4">
      <h1 className="font-semibold text-2xl tracking-tight">Property saved</h1>
      <div
        role="alert"
        className={cn(
          "grid gap-2 rounded-lg border p-4 text-sm",
          toneSurface.review,
        )}
      >
        <p className="font-medium">
          {failures.length === 1
            ? "One lease document didn’t upload."
            : `${failures.length} lease documents didn’t upload.`}{" "}
          Attach {failures.length === 1 ? "it" : "them"} from the property’s
          leases.
        </p>
        <ul className="grid gap-1">
          {failures.map((failure) => (
            <li key={failure.leaseId}>
              {failure.fileName}: {failure.error}
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={`/properties/${propertyId}`}
        className={cn(buttonVariants(), "justify-self-start")}
      >
        Go to property
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Link>
    </div>
  );
}
