ALTER TABLE "rental"."ledger_entries" ADD COLUMN "expense_category" text;
--> statement-breakpoint
ALTER TABLE "rental"."ledger_entries" ADD COLUMN "income_category" text;
--> statement-breakpoint
UPDATE "rental"."ledger_entries"
SET "expense_category" = "category"
WHERE "type" = 'expense';
--> statement-breakpoint
ALTER TABLE "rental"."ledger_entries" DROP COLUMN "category";
