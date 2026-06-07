CREATE TABLE "rental"."ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"type" text NOT NULL,
	"date" date NOT NULL,
	"vendor" text NOT NULL,
	"memo" text,
	"amount" double precision NOT NULL,
	"category" text,
	"is_personal" boolean DEFAULT false NOT NULL,
	"is_reconciled" boolean DEFAULT false NOT NULL,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rental"."documents" ADD COLUMN "vendor" text;--> statement-breakpoint
ALTER TABLE "rental"."documents" ADD COLUMN "document_date" date;--> statement-breakpoint
ALTER TABLE "rental"."documents" ADD COLUMN "amount" double precision;--> statement-breakpoint
ALTER TABLE "rental"."ledger_entries" ADD CONSTRAINT "ledger_entries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;