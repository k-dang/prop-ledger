import { z } from "zod";

export const TAX_YEAR_STORAGE_KEY = "tax-ready-rental-workspace:tax-year:v1";

const taxYearSchema = z
  .number()
  .int()
  .refine((value) => value >= 2000 && value <= 2100);

export function getDefaultTaxYear() {
  return new Date().getFullYear();
}

export function parseStoredTaxYear(rawValue: string): number {
  try {
    const result = taxYearSchema.safeParse(JSON.parse(rawValue));

    return result.success ? result.data : getDefaultTaxYear();
  } catch {
    return getDefaultTaxYear();
  }
}
