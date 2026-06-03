CREATE SCHEMA IF NOT EXISTS "rental";
--> statement-breakpoint
CREATE TABLE "rental"."capital_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"description" text NOT NULL,
	"cca_class" integer NOT NULL,
	"placed_in_service_date" date NOT NULL,
	"building_cost" double precision NOT NULL,
	"land_cost" double precision NOT NULL,
	"disposition_date" date,
	"disposition_proceeds" double precision
);
--> statement-breakpoint
CREATE TABLE "rental"."cca_class_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_tax_year_id" uuid NOT NULL,
	"cca_class" integer NOT NULL,
	"opening_ucc_provenance" text NOT NULL,
	"opening_ucc_amount" double precision,
	"additions" double precision,
	"dispositions" double precision,
	"cca_claimed" double precision,
	"closing_ucc" double precision
);
--> statement-breakpoint
CREATE TABLE "rental"."owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text
);
--> statement-breakpoint
CREATE TABLE "rental"."ownership_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"percentage" double precision NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date
);
--> statement-breakpoint
CREATE TABLE "rental"."properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"municipality" text NOT NULL,
	"province" text NOT NULL,
	"postal_code" text NOT NULL,
	"acquisition_date" date NOT NULL,
	"has_personal_use" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental"."property_tax_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental"."units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"label" text NOT NULL,
	"unit_type" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rental"."capital_assets" ADD CONSTRAINT "capital_assets_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."cca_class_records" ADD CONSTRAINT "cca_class_records_property_tax_year_id_property_tax_years_id_fk" FOREIGN KEY ("property_tax_year_id") REFERENCES "rental"."property_tax_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."owners" ADD CONSTRAINT "owners_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."ownership_periods" ADD CONSTRAINT "ownership_periods_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."ownership_periods" ADD CONSTRAINT "ownership_periods_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "rental"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."property_tax_years" ADD CONSTRAINT "property_tax_years_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."units" ADD CONSTRAINT "units_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;