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
