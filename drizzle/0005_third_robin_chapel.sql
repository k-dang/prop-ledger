DROP TABLE "rental"."capital_assets" CASCADE;--> statement-breakpoint
DROP TABLE "rental"."cca_class_records" CASCADE;--> statement-breakpoint
ALTER TABLE "rental"."ledger_entries" ADD COLUMN "is_capital_asset" boolean DEFAULT false NOT NULL;
