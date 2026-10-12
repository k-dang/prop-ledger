import { z } from "zod";

export const requiredFormString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : ""),
  z.string().min(1),
);

export const optionalFormString = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string(),
  )
  .transform((value) => (value.length > 0 ? value : undefined));

/**
 * Optional numeric field: an empty value becomes `null`, otherwise the parsed
 * number is passed through. Non-numeric input parses to `NaN` so the domain
 * validator downstream reports it instead of the form silently accepting it.
 */
export const optionalFormNumber = optionalFormString.transform((value) =>
  value !== undefined ? Number(value) : null,
);

export const finiteFormNumber = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return Number.NaN;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? Number(trimmedValue) : Number.NaN;
  },
  z.number().refine((value) => Number.isFinite(value)),
);
