CREATE TABLE "rental"."mortgage_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"date" date NOT NULL,
	"lender" text NOT NULL,
	"total_amount" double precision NOT NULL,
	"principal" double precision,
	"interest" double precision,
	"fees" double precision,
	"memo" text
);
--> statement-breakpoint
CREATE TABLE "rental"."transaction_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ledger_entry_id" uuid NOT NULL,
	"expense_category" text,
	"income_category" text,
	"amount" double precision NOT NULL,
	"memo" text
);
--> statement-breakpoint
ALTER TABLE "rental"."ledger_entries" ADD COLUMN "prepaid_start_date" date;--> statement-breakpoint
ALTER TABLE "rental"."ledger_entries" ADD COLUMN "prepaid_end_date" date;--> statement-breakpoint
ALTER TABLE "rental"."mortgage_payments" ADD CONSTRAINT "mortgage_payments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "rental"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental"."transaction_splits" ADD CONSTRAINT "transaction_splits_ledger_entry_id_ledger_entries_id_fk" FOREIGN KEY ("ledger_entry_id") REFERENCES "rental"."ledger_entries"("id") ON DELETE cascade ON UPDATE no action;