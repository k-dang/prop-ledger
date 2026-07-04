import { describe, expect, it } from "vitest";
import { parseTaxYearSearchParam } from "./tax-year";

describe("parseTaxYearSearchParam", () => {
  const fallback = 2026;

  it("falls back when the year is missing", () => {
    expect(parseTaxYearSearchParam(undefined, fallback)).toBe(fallback);
  });

  it("accepts a valid four-digit year inside bounds", () => {
    expect(parseTaxYearSearchParam("2025", fallback)).toBe(2025);
  });

  it("falls back for non-numeric, decimal, and out-of-range years", () => {
    expect(parseTaxYearSearchParam("next", fallback)).toBe(fallback);
    expect(parseTaxYearSearchParam("2025.5", fallback)).toBe(fallback);
    expect(parseTaxYearSearchParam("1999", fallback)).toBe(fallback);
    expect(parseTaxYearSearchParam("2101", fallback)).toBe(fallback);
  });

  it("falls back for repeated year parameters", () => {
    expect(parseTaxYearSearchParam(["2025", "2026"], fallback)).toBe(fallback);
  });
});
