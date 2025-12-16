CREATE TABLE "ai_db_schema"."invoice_contract_validation_tbl" (
	"id" char(36) PRIMARY KEY NOT NULL,
	"fk_invoice_Id" char,
	"validation_details" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_db_schema"."invoice_contract_validation_tbl" ADD CONSTRAINT "invoice_contract_validation_tbl_fk_invoice_Id_invoice_tbl_id_fk" FOREIGN KEY ("fk_invoice_Id") REFERENCES "ai_db_schema"."invoice_tbl"("id") ON DELETE no action ON UPDATE no action;