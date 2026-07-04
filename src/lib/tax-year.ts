import { getDefaultTaxYear } from "./year-end-readiness";

export const MIN_TAX_YEAR = 2000;
export const MAX_TAX_YEAR = 2100;

export type TaxYearSearchParam = string | string[] | undefined;

export function isValidTaxYear(year: number) {
  return Number.isInteger(year) && year >= MIN_TAX_YEAR && year <= MAX_TAX_YEAR;
}

export function parseTaxYearSearchParam(
  raw: TaxYearSearchParam,
  fallback = getDefaultTaxYear(),
): number {
  if (raw === undefined || Array.isArray(raw)) {
    return fallback;
  }

  if (!/^\d{4}$/.test(raw)) {
    return fallback;
  }

  const parsed = Number(raw);

  return isValidTaxYear(parsed) ? parsed : fallback;
}
