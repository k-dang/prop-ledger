import { describe, expect, it } from "vitest";

import {
  createPropertyTaxYear,
  enterOpeningUcc,
  inheritOpeningUcc,
  type PropertyTaxYear,
  reflagInheritedOpening,
  seedNextPropertyTaxYear,
} from "./property-tax-year";

describe("property tax year carryforward", () => {
  it("materializes an empty year lazily", () => {
    expect(createPropertyTaxYear("property-1", 2026)).toEqual({
      propertyId: "property-1",
      year: 2026,
      cca: [],
    });
  });

  it("inherits a confirmed prior closing as the next opening", () => {
    expect(inheritOpeningUcc(12000)).toEqual({
      provenance: "inherited",
      amount: 12000,
    });
  });

  it("flags an opening unknown when the prior closing is absent", () => {
    expect(inheritOpeningUcc(undefined)).toEqual({ provenance: "unknown" });
  });

  it("seeds the next year, inheriting confirmed closings and flagging the rest", () => {
    const prior: PropertyTaxYear = {
      propertyId: "property-1",
      year: 2026,
      cca: [
        {
          ccaClass: 1,
          openingUcc: { provenance: "entered", amount: 200000 },
          closingUcc: 196000,
        },
        { ccaClass: 8, openingUcc: { provenance: "unknown" } },
      ],
    };

    expect(seedNextPropertyTaxYear(prior, 2027)).toEqual({
      propertyId: "property-1",
      year: 2027,
      cca: [
        {
          ccaClass: 1,
          openingUcc: { provenance: "inherited", amount: 196000 },
        },
        { ccaClass: 8, openingUcc: { provenance: "unknown" } },
      ],
    });
  });

  it("re-flags an inherited opening when the prior closing changes or is removed", () => {
    const inherited = inheritOpeningUcc(196000);

    expect(reflagInheritedOpening(inherited, 190000)).toEqual({
      provenance: "inherited",
      amount: 190000,
    });
    expect(reflagInheritedOpening(inherited, undefined)).toEqual({
      provenance: "unknown",
    });
  });

  it("leaves entered openings untouched when re-flagging", () => {
    const entered = enterOpeningUcc(200000);

    expect(reflagInheritedOpening(entered, 999)).toEqual(entered);
  });
});
