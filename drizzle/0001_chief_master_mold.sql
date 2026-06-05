CREATE TABLE "rental"."document_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"document_type" text NOT NULL,
	"storage_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental"."leases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"tenant_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"rent_amount" double precision NOT NULL,
	"rent_frequency" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental"."rent_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"lease_id" uuid,
	"type" text NOT NULL,
	"date" date NOT NULL,
	"amount" double precision NOT NULL,
	"period_start" date,
	"period_end" date,
	"memo" text
);
--> statement-breakpoint
ALTER TABLE "rental"."document_links" ADD CONSTRAINT "document_links_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "rental"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."documents" ADD CONSTRAINT "documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."leases" ADD CONSTRAINT "leases_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "rental"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."rent_events" ADD CONSTRAINT "rent_events_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."rent_events" ADD CONSTRAINT "rent_events_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "rental"."leases"("id") ON DELETE cascade ON UPDATE no action;