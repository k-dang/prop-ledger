import { z } from "zod";

import { createEmptyPortfolio, type Portfolio } from "./property-workspace";

export const PROPERTY_WORKSPACE_STORAGE_KEY = "tax-ready-rental-workspace:v1";

const optionalStoredStringSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : undefined),
  z.string().optional(),
);

const storedBooleanSchema = z.preprocess(
  (value) => value === true,
  z.boolean(),
);

const finiteNumberSchema = z.number().refine((value) => Number.isFinite(value));

const optionalFiniteNumberSchema = z.preprocess(
  (value) =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined,
  finiteNumberSchema.optional(),
);

const addressSchema = z.object({
  line1: z.string(),
  line2: optionalStoredStringSchema,
  municipality: z.string(),
  province: z.string(),
  postalCode: z.string(),
});

const unitSchema = z.object({
  id: z.string(),
  label: z.string(),
  unitType: z.string(),
});

const ownerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: optionalStoredStringSchema,
});

const ownershipPeriodSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  percentage: finiteNumberSchema,
  effectiveFrom: z.string(),
  effectiveTo: optionalStoredStringSchema,
});

const capitalAssetSchema = z.object({
  id: z.string(),
  description: z.string(),
  ccaClass: finiteNumberSchema,
  placedInServiceDate: z.string(),
  buildingCost: finiteNumberSchema,
  landCost: finiteNumberSchema,
  disposition: z
    .object({ date: z.string(), proceeds: finiteNumberSchema })
    .optional(),
});

const openingUccSchema = z
  .discriminatedUnion("provenance", [
    z.object({
      provenance: z.literal("inherited"),
      amount: finiteNumberSchema,
    }),
    z.object({ provenance: z.literal("entered"), amount: finiteNumberSchema }),
    z.object({ provenance: z.literal("unknown") }),
  ])
  .catch({ provenance: "unknown" });

const ccaClassRecordSchema = z.object({
  ccaClass: finiteNumberSchema,
  openingUcc: openingUccSchema,
  additions: optionalFiniteNumberSchema,
  dispositions: optionalFiniteNumberSchema,
  ccaClaimed: optionalFiniteNumberSchema,
  closingUcc: optionalFiniteNumberSchema,
});

const propertyTaxYearSchema = z.object({
  propertyId: z.string(),
  year: finiteNumberSchema,
  cca: storedArraySchema(ccaClassRecordSchema),
});

const propertySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: addressSchema,
  acquisitionDate: z.string(),
  hasPersonalUse: storedBooleanSchema,
  units: storedArraySchema(unitSchema),
  owners: storedArraySchema(ownerSchema),
  ownershipPeriods: storedArraySchema(ownershipPeriodSchema),
  capitalAssets: storedArraySchema(capitalAssetSchema),
  taxYears: storedArraySchema(propertyTaxYearSchema),
});

const portfolioSchema = z.object({
  properties: storedArraySchema(propertySchema),
});

export function parseStoredPortfolio(rawValue: string): Portfolio {
  try {
    const result = portfolioSchema.safeParse(JSON.parse(rawValue));

    return result.success ? result.data : createEmptyPortfolio();
  } catch {
    return createEmptyPortfolio();
  }
}

function storedArraySchema<T>(itemSchema: z.ZodType<T>) {
  return z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.json()).transform((items) =>
      items.flatMap((item) => {
        const result = itemSchema.safeParse(item);

        return result.success ? [result.data] : [];
      }),
    ),
  );
}
