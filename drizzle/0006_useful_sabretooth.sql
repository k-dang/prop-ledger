CREATE TABLE "rental"."accountant_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental"."year_end_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"scope" text NOT NULL,
	"owner_id" uuid,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rental"."accountant_notes" ADD CONSTRAINT "accountant_notes_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."year_end_packages" ADD CONSTRAINT "year_end_packages_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."year_end_packages" ADD CONSTRAINT "year_end_packages_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "rental"."owners"("id") ON DELETE restrict ON UPDATE no action;