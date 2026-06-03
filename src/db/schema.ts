import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgSchema,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const rental = pgSchema("rental");
const pgTable = rental.table.bind(rental);

/**
 * Normalized persistence for the rental property domain. Tables mirror the
 * in-memory shapes in `src/lib/property-workspace.ts` and
 * `src/lib/property-tax-year.ts`; `src/db/queries.ts` maps rows back to those
 * domain types. Money and share values use `doublePrecision` to match the
 * JS-number semantics the app has always used. ISO date fields are stored as
 * `date` columns read back as `YYYY-MM-DD` strings.
 */

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  municipality: text("municipality").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  acquisitionDate: date("acquisition_date", { mode: "string" }).notNull(),
  hasPersonalUse: boolean("has_personal_use").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  unitType: text("unit_type").notNull(),
});

export const owners = pgTable("owners", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
});

export const ownershipPeriods = pgTable("ownership_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => owners.id, { onDelete: "cascade" }),
  percentage: doublePrecision("percentage").notNull(),
  effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
  effectiveTo: date("effective_to", { mode: "string" }),
});

export const capitalAssets = pgTable("capital_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  ccaClass: integer("cca_class").notNull(),
  placedInServiceDate: date("placed_in_service_date", {
    mode: "string",
  }).notNull(),
  buildingCost: doublePrecision("building_cost").notNull(),
  landCost: doublePrecision("land_cost").notNull(),
  dispositionDate: date("disposition_date", { mode: "string" }),
  dispositionProceeds: doublePrecision("disposition_proceeds"),
});

export const propertyTaxYears = pgTable("property_tax_years", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
});

export const ccaClassRecords = pgTable("cca_class_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyTaxYearId: uuid("property_tax_year_id")
    .notNull()
    .references(() => propertyTaxYears.id, { onDelete: "cascade" }),
  ccaClass: integer("cca_class").notNull(),
  // Discriminated union OpeningUcc: provenance is one of
  // "inherited" | "entered" | "unknown"; amount is null when "unknown".
  openingUccProvenance: text("opening_ucc_provenance").notNull(),
  openingUccAmount: doublePrecision("opening_ucc_amount"),
  additions: doublePrecision("additions"),
  dispositions: doublePrecision("dispositions"),
  ccaClaimed: doublePrecision("cca_claimed"),
  closingUcc: doublePrecision("closing_ucc"),
});

export const propertiesRelations = relations(properties, ({ many }) => ({
  units: many(units),
  owners: many(owners),
  ownershipPeriods: many(ownershipPeriods),
  capitalAssets: many(capitalAssets),
  taxYears: many(propertyTaxYears),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  property: one(properties, {
    fields: [units.propertyId],
    references: [properties.id],
  }),
}));

export const ownersRelations = relations(owners, ({ one }) => ({
  property: one(properties, {
    fields: [owners.propertyId],
    references: [properties.id],
  }),
}));

export const ownershipPeriodsRelations = relations(
  ownershipPeriods,
  ({ one }) => ({
    property: one(properties, {
      fields: [ownershipPeriods.propertyId],
      references: [properties.id],
    }),
    owner: one(owners, {
      fields: [ownershipPeriods.ownerId],
      references: [owners.id],
    }),
  }),
);

export const capitalAssetsRelations = relations(capitalAssets, ({ one }) => ({
  property: one(properties, {
    fields: [capitalAssets.propertyId],
    references: [properties.id],
  }),
}));

export const propertyTaxYearsRelations = relations(
  propertyTaxYears,
  ({ one, many }) => ({
    property: one(properties, {
      fields: [propertyTaxYears.propertyId],
      references: [properties.id],
    }),
    cca: many(ccaClassRecords),
  }),
);

export const ccaClassRecordsRelations = relations(
  ccaClassRecords,
  ({ one }) => ({
    propertyTaxYear: one(propertyTaxYears, {
      fields: [ccaClassRecords.propertyTaxYearId],
      references: [propertyTaxYears.id],
    }),
  }),
);

/**
 * Inferred row and insert types — the single source of truth for the domain
 * shapes. `src/lib/property-workspace.ts` and `src/lib/property-tax-year.ts`
 * re-export these (under domain-facing names) and add the logic that operates on
 * them; `src/db/queries.ts` returns these shapes directly.
 */
export type Property = typeof properties.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Owner = typeof owners.$inferSelect;
export type OwnershipPeriod = typeof ownershipPeriods.$inferSelect;
export type CapitalAsset = typeof capitalAssets.$inferSelect;
export type PropertyTaxYearRow = typeof propertyTaxYears.$inferSelect;
export type CcaClassRecord = typeof ccaClassRecords.$inferSelect;

export type NewProperty = typeof properties.$inferInsert;
export type NewUnit = typeof units.$inferInsert;
export type NewOwner = typeof owners.$inferInsert;
export type NewOwnershipPeriod = typeof ownershipPeriods.$inferInsert;
export type NewCcaClassRecord = typeof ccaClassRecords.$inferInsert;
export type NewPropertyTaxYear = typeof propertyTaxYears.$inferInsert;
