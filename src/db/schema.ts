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

export const RENT_FREQUENCIES = ["monthly", "biweekly", "weekly"] as const;
export type RentFrequency = (typeof RENT_FREQUENCIES)[number];

export const leases = pgTable("leases", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  tenantName: text("tenant_name").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  rentAmount: doublePrecision("rent_amount").notNull(),
  rentFrequency: text("rent_frequency").$type<RentFrequency>().notNull(),
});

/**
 * Every entry in the rent ledger. `charge` accrues earned rent; `payment`,
 * `credit`, and `writeoff` reduce a tenant's outstanding balance; `other_income`
 * is rental income (laundry, parking, fees) that does not affect arrears. Charges
 * and payments are deliberately separate rows so accrual income is never confused
 * with cash received. `leaseId` is null only for property-level other income.
 */
export const RENT_EVENT_TYPES = [
  "charge",
  "payment",
  "credit",
  "writeoff",
  "other_income",
] as const;
export type RentEventType = (typeof RENT_EVENT_TYPES)[number];

export const rentEvents = pgTable("rent_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  leaseId: uuid("lease_id").references(() => leases.id, {
    onDelete: "cascade",
  }),
  type: text("type").$type<RentEventType>().notNull(),
  date: date("date", { mode: "string" }).notNull(),
  amount: doublePrecision("amount").notNull(),
  periodStart: date("period_start", { mode: "string" }),
  periodEnd: date("period_end", { mode: "string" }),
  memo: text("memo"),
});

export const T776_CATEGORIES = [
  "advertising",
  "insurance",
  "interest_and_bank_charges",
  "office_expenses",
  "professional_fees",
  "repairs_and_maintenance",
  "salaries_wages_and_benefits",
  "property_taxes",
  "travel",
  "utilities",
  "other_expenses",
] as const;
export type T776Category = (typeof T776_CATEGORIES)[number];

export const RENTAL_INCOME_CATEGORIES = [
  "rent",
  "other_income",
  "laundry",
  "parking",
  "fees",
  "recoveries",
] as const;
export type RentalIncomeCategory = (typeof RENTAL_INCOME_CATEGORIES)[number];

export const LEDGER_ENTRY_TYPES = ["expense", "income"] as const;
export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  type: text("type").$type<LedgerEntryType>().notNull(),
  date: date("date", { mode: "string" }).notNull(),
  vendor: text("vendor").notNull(),
  memo: text("memo"),
  amount: doublePrecision("amount").notNull(),
  expenseCategory: text("expense_category").$type<T776Category>(),
  incomeCategory: text("income_category").$type<RentalIncomeCategory>(),
  isPersonal: boolean("is_personal").notNull().default(false),
  isReconciled: boolean("is_reconciled").notNull().default(false),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const propertyTaxYears = pgTable("property_tax_years", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
});

export type OpeningUccProvenance = "inherited" | "entered" | "unknown";

export const ccaClassRecords = pgTable("cca_class_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyTaxYearId: uuid("property_tax_year_id")
    .notNull()
    .references(() => propertyTaxYears.id, { onDelete: "cascade" }),
  ccaClass: integer("cca_class").notNull(),
  openingUccProvenance: text("opening_ucc_provenance")
    .$type<OpeningUccProvenance>()
    .notNull(),
  openingUccAmount: doublePrecision("opening_ucc_amount"),
  additions: doublePrecision("additions"),
  dispositions: doublePrecision("dispositions"),
  ccaClaimed: doublePrecision("cca_claimed"),
  closingUcc: doublePrecision("closing_ucc"),
});

/**
 * Reusable evidence records. A document is uploaded once and linked to the
 * records it supports through `documentLinks`, so the same lease agreement or
 * receipt can back several ledger rows. `storageUrl` points at the local upload
 * path in Phase 3 and can later move to object storage without changing links.
 */
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  documentType: text("document_type").notNull(),
  storageUrl: text("storage_url"),
  vendor: text("vendor"),
  documentDate: date("document_date", { mode: "string" }),
  amount: doublePrecision("amount"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * The link side of the document evidence model. `targetType`/`targetId` is a
 * polymorphic reference (no DB-level FK) so one table covers every kind of record
 * a document can support; application code enforces the target exists.
 */
export const DOCUMENT_LINK_TARGETS = [
  "lease",
  "transaction",
  "rent_event",
  "loan",
  "capital_asset",
  "year_end_package",
] as const;
export type DocumentLinkTarget = (typeof DOCUMENT_LINK_TARGETS)[number];

export const documentLinks = pgTable("document_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  targetType: text("target_type").$type<DocumentLinkTarget>().notNull(),
  targetId: uuid("target_id").notNull(),
});

export const propertiesRelations = relations(properties, ({ many }) => ({
  units: many(units),
  owners: many(owners),
  ownershipPeriods: many(ownershipPeriods),
  capitalAssets: many(capitalAssets),
  taxYears: many(propertyTaxYears),
  rentEvents: many(rentEvents),
  ledgerEntries: many(ledgerEntries),
  documents: many(documents),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  property: one(properties, {
    fields: [units.propertyId],
    references: [properties.id],
  }),
  leases: many(leases),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  unit: one(units, {
    fields: [leases.unitId],
    references: [units.id],
  }),
  rentEvents: many(rentEvents),
}));

export const rentEventsRelations = relations(rentEvents, ({ one }) => ({
  property: one(properties, {
    fields: [rentEvents.propertyId],
    references: [properties.id],
  }),
  lease: one(leases, {
    fields: [rentEvents.leaseId],
    references: [leases.id],
  }),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  property: one(properties, {
    fields: [ledgerEntries.propertyId],
    references: [properties.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  property: one(properties, {
    fields: [documents.propertyId],
    references: [properties.id],
  }),
  links: many(documentLinks),
}));

export const documentLinksRelations = relations(documentLinks, ({ one }) => ({
  document: one(documents, {
    fields: [documentLinks.documentId],
    references: [documents.id],
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
export type Lease = typeof leases.$inferSelect;
export type RentEvent = typeof rentEvents.$inferSelect;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentLink = typeof documentLinks.$inferSelect;

export type NewProperty = typeof properties.$inferInsert;
export type NewUnit = typeof units.$inferInsert;
export type NewOwner = typeof owners.$inferInsert;
export type NewOwnershipPeriod = typeof ownershipPeriods.$inferInsert;
export type NewCcaClassRecord = typeof ccaClassRecords.$inferInsert;
export type NewPropertyTaxYear = typeof propertyTaxYears.$inferInsert;
export type NewLease = typeof leases.$inferInsert;
export type NewRentEvent = typeof rentEvents.$inferInsert;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
export type NewDocument = typeof documents.$inferInsert;
export type NewDocumentLink = typeof documentLinks.$inferInsert;
