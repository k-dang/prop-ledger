/**
 * Per-(Property, Tax Year) record keeping for capital and CCA support.
 *
 * A Tax Year is a record-keeping boundary, not a computation context: this module
 * never derives a UCC chain. It only carries accountant-entered values forward by
 * provenance and flags what is missing. The persisted shapes live in the database
 * schema; this module re-exports them and adds the carryforward logic. See
 * docs/adr/0001-no-tax-year-close-state-machine.md and CONTEXT.md.
 */
import type {
  CcaClassRecord,
  NewCcaClassRecord,
  NewPropertyTaxYear,
  PropertyTaxYearRow,
} from "@/db/schema";

export type { CapitalAsset, CcaClassRecord } from "@/db/schema";

/**
 * A Property Tax Year as loaded from the database: the tax-year row plus the
 * accountant-entered CCA class records it holds. CCA is pooled by class; every
 * figure on a record is an entered value, not a calculated one.
 */
export type PropertyTaxYear = PropertyTaxYearRow & {
  cca: CcaClassRecord[];
};

/**
 * An unsaved Property Tax Year (and its CCA records) drafted in memory during
 * carryforward, before the database assigns identity. Optional CCA columns are
 * left off until an accountant enters them.
 */
export type CcaClassRecordDraft = Omit<NewCcaClassRecord, "propertyTaxYearId">;
export type PropertyTaxYearDraft = Omit<NewPropertyTaxYear, "id"> & {
  cca: CcaClassRecordDraft[];
};

/**
 * Provenance of a per-class opening UCC. The app never computes a UCC chain; an
 * opening value is either inherited from the prior year's confirmed closing, entered
 * during onboarding of an existing property, or flagged as accountant-needed. The
 * value is stored flat on a CCA class record as `openingUccProvenance` plus a
 * nullable `openingUccAmount`.
 */
export type OpeningUccProvenance = "inherited" | "entered" | "unknown";

type OpeningUcc = {
  openingUccProvenance: OpeningUccProvenance;
  openingUccAmount: number | null;
};

/** Lazily materialize an empty (unsaved) Property Tax Year. */
export function createPropertyTaxYear(
  propertyId: string,
  year: number,
): PropertyTaxYearDraft {
  return { propertyId, year, cca: [] };
}

/** Derive a class opening UCC from the prior year's confirmed closing value. */
export function inheritOpeningUcc(
  priorClosingUcc: number | null | undefined,
): OpeningUcc {
  return priorClosingUcc == null
    ? { openingUccProvenance: "unknown", openingUccAmount: null }
    : { openingUccProvenance: "inherited", openingUccAmount: priorClosingUcc };
}

/** An opening UCC entered manually while onboarding an existing property. */
export function enterOpeningUcc(amount: number): OpeningUcc {
  return { openingUccProvenance: "entered", openingUccAmount: amount };
}

/**
 * Seed the next Property Tax Year from the prior one: each class's opening UCC is
 * inherited from the prior confirmed closing (or flagged unknown), and the per-year
 * accountant inputs reset. No values are computed.
 */
export function seedNextPropertyTaxYear(
  prior: PropertyTaxYear | PropertyTaxYearDraft,
  year: number,
): PropertyTaxYearDraft {
  return {
    propertyId: prior.propertyId,
    year,
    cca: prior.cca.map((record) => ({
      ccaClass: record.ccaClass,
      ...inheritOpeningUcc(record.closingUcc),
    })),
  };
}

/**
 * Re-flag a downstream opening when the prior year's confirmed closing changes: an
 * inherited opening tracks the latest confirmed closing and reverts to unknown if
 * that closing is removed. Entered and unknown openings are left untouched.
 */
export function reflagInheritedOpening(
  opening: OpeningUcc,
  priorClosingUcc: number | null | undefined,
): OpeningUcc {
  return opening.openingUccProvenance === "inherited"
    ? inheritOpeningUcc(priorClosingUcc)
    : opening;
}
