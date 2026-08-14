DELETE FROM "rental"."document_links"
WHERE "target_type" = 'year_end_package';
--> statement-breakpoint
DROP TABLE "rental"."year_end_packages" CASCADE;
