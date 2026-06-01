import { describe, expect, it } from "vitest";

import { getDefaultTaxYear, parseStoredTaxYear } from "./tax-year-storage";

describe("stored tax year parsing", () => {
  it("returns the stored year when it is a valid integer in range", () => {
    expect(parseStoredTaxYear(JSON.stringify(2024))).toBe(2024);
  });

  it("falls back to the default year for out-of-range values", () => {
    expect(parseStoredTaxYear(JSON.stringify(1999))).toBe(getDefaultTaxYear());
    expect(parseStoredTaxYear(JSON.stringify(2101))).toBe(getDefaultTaxYear());
  });

  it("falls back to the default year for non-numeric or malformed values", () => {
    expect(parseStoredTaxYear(JSON.stringify("2024"))).toBe(
      getDefaultTaxYear(),
    );
    expect(parseStoredTaxYear(JSON.stringify(2024.5))).toBe(
      getDefaultTaxYear(),
    );
    expect(parseStoredTaxYear("not json")).toBe(getDefaultTaxYear());
  });
});
