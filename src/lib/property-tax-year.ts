/**
 * Per-(Property, Tax Year) record keeping for capital and CCA support.
 *
 * A Tax Year is a record-keeping boundary, not a computation context: this module
 * never derives a UCC chain. It only carries accountant-entered values forward by
 * provenance and flags what is missing. See docs/adr/0001-no-tax-year-close-state-machine.md
 * and CONTEXT.md.
 */

/**
 * A durable capital asset recorded against a property. Described once and carried
 * across years; CCA is pooled by class. Land cost is tracked but never depreciable.
 */
export type CapitalAsset = {
  id: string;
  description: string;
  ccaClass: number;
  placedInServiceDate: string;
  buildingCost: number;
  landCost: number;
  disposition?: CapitalAssetDisposition;
};

export type CapitalAssetDisposition = {
  date: string;
  proceeds: number;
};

/**
 * Provenance of a per-class opening UCC. The app never computes a UCC chain; an
 * opening value is either inherited from the prior year's confirmed closing, entered
 * during onboarding of an existing property, or flagged as accountant-needed.
 */
export type OpeningUcc =
  | { provenance: "inherited"; amount: number }
  | { provenance: "entered"; amount: number }
  | { provenance: "unknown" };

/**
 * Accountant-entered CCA values for one CRA class within a Property Tax Year. Every
 * figure here is a recorded value, not a calculated one.
 */
export type CcaClassRecord = {
  ccaClass: number;
  openingUcc: OpeningUcc;
  additions?: number;
  dispositions?: number;
  ccaClaimed?: number;
  closingUcc?: number;
};

/**
 * The per-(Property, Tax Year) record: the home for accountant-entered CCA values.
 * It carries no close or lock state and is lazily materialized — it exists only once
 * it has CCA values to hold.
 */
export type PropertyTaxYear = {
  propertyId: string;
  year: number;
  cca: CcaClassRecord[];
};

/** Lazily materialize an empty Property Tax Year. */
export function createPropertyTaxYear(
  propertyId: string,
  year: number,
): PropertyTaxYear {
  return { propertyId, year, cca: [] };
}

/** Derive a class opening UCC from the prior year's confirmed closing value. */
export function inheritOpeningUcc(
  priorClosingUcc: number | undefined,
): OpeningUcc {
  return priorClosingUcc === undefined
    ? { provenance: "unknown" }
    : { provenance: "inherited", amount: priorClosingUcc };
}

/** An opening UCC entered manually while onboarding an existing property. */
export function enterOpeningUcc(amount: number): OpeningUcc {
  return { provenance: "entered", amount };
}

/**
 * Seed the next Property Tax Year from the prior one: each class's opening UCC is
 * inherited from the prior confirmed closing (or flagged unknown), and the per-year
 * accountant inputs reset. No values are computed.
 */
export function seedNextPropertyTaxYear(
  prior: PropertyTaxYear,
  year: number,
): PropertyTaxYear {
  return {
    propertyId: prior.propertyId,
    year,
    cca: prior.cca.map((record) => ({
      ccaClass: record.ccaClass,
      openingUcc: inheritOpeningUcc(record.closingUcc),
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
  priorClosingUcc: number | undefined,
): OpeningUcc {
  return opening.provenance === "inherited"
    ? inheritOpeningUcc(priorClosingUcc)
    : opening;
}
