import { z } from "zod";
import {
  type NewLease,
  type NewOwner,
  type NewOwnershipPeriod,
  type NewUnit,
  RENT_FREQUENCIES,
} from "@/db/schema";
import type { RentalProperty } from "@/lib/property-workspace";

/**
 * The guided property setup flow (`/properties/new`, `/properties/[id]/setup`).
 *
 * The wizard edits one `SetupForm` of raw field values. "Save and finish later"
 * stores the property row plus the rest of the form as `properties.setupDraft`;
 * completing setup validates the whole form and writes owners, ownership
 * periods, units, and leases in one batch. Records are never written
 * piecemeal, so resuming a draft never has to reconcile existing rows.
 *
 * Validation lives here so the wizard and the server actions share one set of
 * rules and messages.
 */

export const PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;
type Province = (typeof PROVINCES)[number];

export const UNIT_TYPES = [
  "House",
  "Apartment",
  "Basement apartment",
  "Room",
  "Other",
] as const;

const OWNER_MODES = ["solo", "partner", "multi"] as const;
export type OwnerMode = (typeof OWNER_MODES)[number];

const OCCUPANCIES = ["rented", "vacant"] as const;
export type Occupancy = (typeof OCCUPANCIES)[number];

/** Preset unit layouts; choosing one generates the units, which stay editable. */
export const LAYOUTS = {
  house: {
    label: "Whole house",
    description: "One unit, rented as a whole",
    units: [["Whole house", "House"]],
  },
  basement: {
    label: "House with a basement unit",
    description: "Main floor and basement",
    units: [
      ["Main floor", "Apartment"],
      ["Basement", "Basement apartment"],
    ],
  },
  duplex: {
    label: "Duplex",
    description: "Upper and lower units",
    units: [
      ["Upper", "Apartment"],
      ["Lower", "Apartment"],
    ],
  },
  triplex: {
    label: "Triplex",
    description: "Three separate units",
    units: [
      ["Unit 1", "Apartment"],
      ["Unit 2", "Apartment"],
      ["Unit 3", "Apartment"],
    ],
  },
  custom: {
    label: "Something else",
    description: "Name the units yourself",
    units: [["Unit 1", "Apartment"]],
  },
} as const satisfies Record<
  string,
  { label: string; description: string; units: [string, string][] }
>;
export type LayoutKey = keyof typeof LAYOUTS;
const LAYOUT_KEYS = Object.keys(LAYOUTS) as [LayoutKey, ...LayoutKey[]];

/** Most owners or units a setup holds; the wizard stops adding rows here. */
export const MAX_ROWS = 20;
/** Longest text answer; the wizard's text inputs enforce it. */
export const MAX_TEXT_LENGTH = 200;
const text = z.string().max(MAX_TEXT_LENGTH);
// `id` is a client-generated key so React rows and lease files survive edits.
const setupOwnerSchema = z.object({ id: text, name: text, share: text });
const setupUnitSchema = z.object({
  id: text,
  label: text,
  unitType: text,
  occupancy: z.enum(OCCUPANCIES).nullable(),
  tenantName: text,
  startDate: text,
  rentAmount: text,
  rentFrequency: z.enum(RENT_FREQUENCIES),
});

/** Everything except the property row; stored as `properties.setupDraft`. */
const setupDraftSchema = z.object({
  ownerMode: z.enum(OWNER_MODES).nullable(),
  owners: z.array(setupOwnerSchema).max(MAX_ROWS),
  layout: z.enum(LAYOUT_KEYS).nullable(),
  units: z.array(setupUnitSchema).max(MAX_ROWS),
});

/** Shape check for untrusted input. Field rules live in the step validators. */
export const setupFormSchema = setupDraftSchema.extend({
  property: z.object({
    name: text,
    line1: text,
    line2: text,
    municipality: text,
    province: text,
    postalCode: text,
    acquisitionDate: text,
  }),
});

export type PropertySetupDraft = z.infer<typeof setupDraftSchema>;
export type SetupForm = z.infer<typeof setupFormSchema>;
export type SetupOwner = SetupForm["owners"][number];
export type SetupUnit = SetupForm["units"][number];

/** Field path (e.g. `owners.0.share`) to message. */
export type FieldErrors = Record<string, string>;

/** Wizard screens: three shared steps, one per unit, then review. */
export type SetupStep =
  | { kind: "property" }
  | { kind: "ownership" }
  | { kind: "units" }
  | { kind: "unit"; index: number }
  | { kind: "review" };

export const SETUP_SECTIONS = [
  "property",
  "ownership",
  "units",
  "unit",
  "review",
] as const;
export type SetupSection = (typeof SETUP_SECTIONS)[number];

/** Sections the property page's "Finish setting up" checklist tracks. */
export const SETUP_CHECKLIST = SETUP_SECTIONS.filter(
  (section) => section !== "review",
);

export const SECTION_TITLES: Record<SetupSection, string> = {
  property: "Property",
  ownership: "Ownership",
  units: "Units",
  unit: "Tenants & leases",
  review: "Review",
};

export function setupSteps(form: SetupForm): SetupStep[] {
  return [
    { kind: "property" },
    { kind: "ownership" },
    { kind: "units" },
    ...form.units.map((_, index) => ({ kind: "unit" as const, index })),
    { kind: "review" },
  ];
}

export function sectionIndex(step: SetupStep) {
  return SETUP_SECTIONS.indexOf(step.kind);
}

export function emptySetupForm(): SetupForm {
  return {
    property: {
      name: "",
      line1: "",
      line2: "",
      municipality: "",
      province: "ON",
      postalCode: "",
      acquisitionDate: "",
    },
    ownerMode: null,
    owners: [],
    layout: null,
    units: [],
  };
}

/**
 * Rebuilds the wizard form for a property that was saved part-way through
 * setup. The stored draft is re-checked here, the one place it is read back;
 * a draft that no longer fits the schema starts those answers over.
 */
export function setupFormFromProperty(
  property: Pick<
    RentalProperty,
    | "name"
    | "line1"
    | "line2"
    | "municipality"
    | "province"
    | "postalCode"
    | "acquisitionDate"
    | "setupDraft"
  >,
): SetupForm {
  const draft = setupDraftSchema.safeParse(property.setupDraft);

  return {
    property: {
      name: property.name,
      line1: property.line1,
      line2: property.line2 ?? "",
      municipality: property.municipality,
      province: property.province,
      postalCode: property.postalCode,
      acquisitionDate: property.acquisitionDate,
    },
    ...(draft.success ? draft.data : toSetupDraft(emptySetupForm())),
  };
}

export function newSetupOwner(name = "", share = ""): SetupOwner {
  return { id: crypto.randomUUID(), name, share };
}

export function newSetupUnit(label = "", unitType = "Apartment"): SetupUnit {
  return {
    id: crypto.randomUUID(),
    label,
    unitType,
    occupancy: null,
    tenantName: "",
    startDate: "",
    rentAmount: "",
    rentFrequency: "monthly",
  };
}

export function withOwner(
  form: SetupForm,
  position: number,
  patch: Partial<SetupOwner>,
): SetupForm {
  const owners = form.owners.map((owner, i) =>
    i === position ? { ...owner, ...patch } : owner,
  );
  return { ...form, owners };
}

export function withUnit(
  form: SetupForm,
  position: number,
  patch: Partial<SetupUnit>,
): SetupForm {
  const units = form.units.map((unit, i) =>
    i === position ? { ...unit, ...patch } : unit,
  );
  return { ...form, units };
}

/**
 * Owners with any answer (name or share) that switching to `mode` would
 * remove, labelled by name or position, so the wizard can confirm first.
 */
export function ownersDroppedBy(form: SetupForm, mode: OwnerMode) {
  const kept =
    mode === "solo" ? 1 : mode === "partner" ? 2 : form.owners.length;
  return form.owners.flatMap((owner, index) =>
    index >= kept && (owner.name.trim() || owner.share.trim())
      ? [owner.name.trim() || `Owner ${index + 1}`]
      : [],
  );
}

/** Switching modes keeps the names already typed. */
export function withOwnerMode(form: SetupForm, mode: OwnerMode): SetupForm {
  if (form.ownerMode === mode) return form;

  const [first, second] = form.owners;
  const owner = (current: SetupOwner | undefined, share: string) =>
    current ? { ...current, share } : newSetupOwner("", share);
  const owners =
    mode === "solo"
      ? [owner(first, "100")]
      : mode === "partner"
        ? [owner(first, "50"), owner(second, "50")]
        : form.owners.length >= 2
          ? form.owners
          : [owner(first, ""), owner(second, "")];

  return { ...form, ownerMode: mode, owners };
}

/** The name and type the current layout gave unit `index` (or "Add unit" did). */
function defaultUnit(form: SetupForm, index: number) {
  const preset = form.layout ? LAYOUTS[form.layout].units : [];
  return preset[index] ?? [`Unit ${index + 1}`, "Apartment"];
}

/**
 * Units with any answer (occupancy, or a name or type changed from the
 * default) that switching to `layout` would remove, labelled for a confirm.
 */
export function unitsDroppedBy(form: SetupForm, layout: LayoutKey) {
  return form.units.flatMap((unit, index) => {
    if (index < LAYOUTS[layout].units.length) return [];
    const [label, unitType] = defaultUnit(form, index);
    const answered =
      unit.occupancy !== null ||
      unit.label.trim() !== label ||
      unit.unitType !== unitType;
    return answered ? [unit.label.trim() || `Unit ${index + 1}`] : [];
  });
}

/**
 * Regenerates units for a layout. Units in the same position keep their tenant
 * answers and any name or type the user changed; defaults follow the new layout.
 */
export function withLayout(form: SetupForm, layout: LayoutKey): SetupForm {
  if (form.layout === layout) return form;

  const units = LAYOUTS[layout].units.map(([label, unitType], index) => {
    const previous = form.units[index];
    if (previous === undefined) return newSetupUnit(label, unitType);

    const [oldLabel, oldType] = defaultUnit(form, index);
    return {
      ...previous,
      label: previous.label.trim() === oldLabel ? label : previous.label,
      unitType: previous.unitType === oldType ? unitType : previous.unitType,
    };
  });

  return { ...form, layout, units };
}

const POSTAL_CODE = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Formats a valid postal code as `A1A 1A1`. */
export function normalizePostalCode(value: string) {
  const compact = value.trim().toUpperCase().replace(/[ -]/, "");
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

/** A real `YYYY-MM-DD` calendar date (`Date` would roll Feb 29, 2025 into March). */
function isIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** Parses a typed amount like `$1,200` or `50`; NaN when blank. */
export function parseAmount(value: string) {
  const trimmed = value.trim().replace(/[$,\s]/g, "");
  return trimmed.length > 0 ? Number(trimmed) : Number.NaN;
}

export function ownershipTotal(form: SetupForm) {
  const total = form.owners.reduce(
    (sum, owner) => sum + (parseAmount(owner.share) || 0),
    0,
  );
  return Math.round(total * 100) / 100;
}

/** Address and acquisition date. `today` is `YYYY-MM-DD`. */
export function validatePropertyStep(
  form: SetupForm,
  today: string,
): FieldErrors {
  const errors: FieldErrors = {};
  const { property } = form;

  if (!property.line1.trim()) {
    errors["property.line1"] = "Enter the street address.";
  }
  if (!property.municipality.trim()) {
    errors["property.municipality"] = "Enter the municipality.";
  }
  if (!PROVINCES.includes(property.province as Province)) {
    errors["property.province"] = "Choose a province or territory.";
  }
  if (!property.postalCode.trim()) {
    errors["property.postalCode"] = "Enter the postal code.";
  } else if (!POSTAL_CODE.test(property.postalCode.trim())) {
    errors["property.postalCode"] = "Use a Canadian postal code, like L8P 1A1.";
  }
  if (!property.acquisitionDate) {
    errors["property.acquisitionDate"] = "Enter the date you took ownership.";
  } else if (!isIsoDate(property.acquisitionDate)) {
    errors["property.acquisitionDate"] = "Enter a valid date.";
  } else if (property.acquisitionDate > today) {
    errors["property.acquisitionDate"] =
      "The acquisition date can’t be in the future.";
  }

  return errors;
}

export function validateOwnershipStep(form: SetupForm): FieldErrors {
  if (form.ownerMode === null) {
    return { ownerMode: "Choose who owns the property." };
  }

  const errors: FieldErrors = {};
  let hasShareErrors = false;
  form.owners.forEach((owner, index) => {
    if (!owner.name.trim()) {
      errors[`owners.${index}.name`] = "Enter the owner’s name.";
    }
    const share = parseAmount(owner.share);
    if (!(share > 0 && share <= 100)) {
      errors[`owners.${index}.share`] = "Between 0 and 100.";
      hasShareErrors = true;
    }
  });

  const total = ownershipTotal(form);
  if (form.owners.length === 0) {
    errors.owners = "Add at least one owner.";
  } else if (!hasShareErrors && Math.abs(total - 100) > 0.001) {
    errors.owners = `Shares must add up to 100%. They add up to ${total}%.`;
  }

  return errors;
}

export function validateUnitsStep(form: SetupForm): FieldErrors {
  if (form.layout === null) {
    return { layout: "Choose how the property is rented out." };
  }

  const errors: FieldErrors = {};
  const seen = new Set<string>();
  form.units.forEach((unit, index) => {
    const label = unit.label.trim().toLowerCase();
    if (!label) {
      errors[`units.${index}.label`] = "Name this unit.";
    } else if (seen.has(label)) {
      errors[`units.${index}.label`] = "Each unit needs a different name.";
    }
    seen.add(label);
    if (!unit.unitType.trim()) {
      errors[`units.${index}.unitType`] = "Choose a unit type.";
    }
  });
  if (form.units.length === 0) {
    errors.units = "Add at least one unit.";
  }

  return errors;
}

export function validateUnitStep(form: SetupForm, index: number): FieldErrors {
  const unit = form.units[index];
  const path = `units.${index}`;

  if (unit.occupancy === null) {
    return { [`${path}.occupancy`]: "Choose rented or vacant." };
  }
  if (unit.occupancy === "vacant") return {};

  const errors: FieldErrors = {};
  if (!unit.tenantName.trim()) {
    errors[`${path}.tenantName`] = "Enter the tenant’s name.";
  }
  if (!unit.startDate) {
    errors[`${path}.startDate`] = "Enter the lease start date.";
  } else if (!isIsoDate(unit.startDate)) {
    errors[`${path}.startDate`] = "Enter a valid date.";
  }
  const rent = parseAmount(unit.rentAmount);
  if (!(Number.isFinite(rent) && rent > 0)) {
    errors[`${path}.rentAmount`] = "Enter the rent amount.";
  }

  return errors;
}

export function validateStep(
  form: SetupForm,
  step: SetupStep,
  today: string,
): FieldErrors {
  switch (step.kind) {
    case "property":
      return validatePropertyStep(form, today);
    case "ownership":
      return validateOwnershipStep(form);
    case "units":
      return validateUnitsStep(form);
    case "unit":
      return validateUnitStep(form, step.index);
    case "review":
      return {};
  }
}

export function isSectionComplete(
  form: SetupForm,
  section: Exclude<SetupSection, "review">,
  today: string,
) {
  return setupSteps(form)
    .filter((step) => step.kind === section)
    .every((step) => isEmpty(validateStep(form, step, today)));
}

/** First screen that still fails validation, or review when everything passes. */
export function firstIncompleteStep(form: SetupForm, today: string) {
  const steps = setupSteps(form);
  const index = steps.findIndex(
    (step) => !isEmpty(validateStep(form, step, today)),
  );
  return index === -1 ? steps.length - 1 : index;
}

export function validateSetup(form: SetupForm, today: string): FieldErrors {
  return Object.assign(
    {},
    ...setupSteps(form).map((step) => validateStep(form, step, today)),
  );
}

export function isEmpty(errors: FieldErrors) {
  return Object.keys(errors).length === 0;
}

/**
 * Property row columns from a form whose property step is valid. A blank name
 * falls back to the street address.
 */
export function toPropertyValues(form: SetupForm) {
  const { property } = form;
  const line2 = property.line2.trim();

  return {
    name: property.name.trim() || property.line1.trim(),
    line1: property.line1.trim(),
    line2: line2.length > 0 ? line2 : null,
    municipality: property.municipality.trim(),
    province: property.province,
    postalCode: normalizePostalCode(property.postalCode),
    acquisitionDate: property.acquisitionDate,
  };
}

/**
 * Rows written when setup completes, from a form that passed `validateSetup`.
 * `leaseIdByUnit` maps each rented unit's form `id` to its new lease, so the
 * browser can attach lease files afterwards.
 */
export function toSetupRows(form: SetupForm, propertyId: string) {
  const ownerRows = form.owners.map(
    (owner) =>
      ({
        id: crypto.randomUUID(),
        propertyId,
        name: owner.name.trim(),
      }) satisfies NewOwner,
  );
  const periodRows = form.owners.map(
    (owner, index) =>
      ({
        propertyId,
        ownerId: ownerRows[index].id,
        percentage: parseAmount(owner.share),
        effectiveFrom: form.property.acquisitionDate,
        effectiveTo: null,
      }) satisfies NewOwnershipPeriod,
  );
  const unitRows = form.units.map(
    (unit) =>
      ({
        id: crypto.randomUUID(),
        propertyId,
        label: unit.label.trim(),
        unitType: unit.unitType.trim(),
      }) satisfies NewUnit,
  );
  const leaseIdByUnit: Record<string, string> = {};
  const leaseRows = form.units.flatMap((unit, index) => {
    if (unit.occupancy !== "rented") return [];

    const id = crypto.randomUUID();
    leaseIdByUnit[unit.id] = id;
    return [
      {
        id,
        unitId: unitRows[index].id,
        tenantName: unit.tenantName.trim(),
        startDate: unit.startDate,
        rentAmount: parseAmount(unit.rentAmount),
        rentFrequency: unit.rentFrequency,
      } satisfies NewLease,
    ];
  });

  return { ownerRows, periodRows, unitRows, leaseRows, leaseIdByUnit };
}

/** The draft half of a form, for `properties.setupDraft`. */
export function toSetupDraft(form: SetupForm): PropertySetupDraft {
  const { property: _property, ...draft } = form;
  return draft;
}
