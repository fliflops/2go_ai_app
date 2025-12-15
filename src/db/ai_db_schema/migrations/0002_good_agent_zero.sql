ALTER TABLE "ai_db_schema"."invoice_tbl" ADD COLUMN "invoice_type" varchar(255);--> statement-breakpoint
ALTER TABLE "ai_db_schema"."invoice_tbl" ADD COLUMN "parsed_data" json;