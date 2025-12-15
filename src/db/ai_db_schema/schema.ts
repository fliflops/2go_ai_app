import {char, integer, varchar,date, boolean, timestamp, pgSchema, pgTable } from 'drizzle-orm/pg-core'
import { createSelectSchema } from "drizzle-zod";
import { nanoid } from 'nanoid'
import {z} from 'zod';

export const schema = pgSchema('ai_db_schema')
export const invoice_tbl = schema.table('invoice_tbl', 
    {
        id: char("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => nanoid()),
        ocr_id:integer('ocr_id').unique(),
        invoiceNumber:  varchar('invoice_number', { length: 255 }),
        invoiceDate:    date('invoice_date'),
        vendorName:     varchar('vendor_name', { length: 500 }),
        vendorTin:      varchar('vendor_tin', { length: 100 }),
        customerName:   varchar('customer_name', { length: 500 }),
        customerTin:    varchar('customer_tin', { length: 100 }),
        totalAmount:    varchar('total_amount', { length: 50 }), // Store as string to preserve decimals
        currency:       varchar('currency', { length: 10 }),
        vatAmount:      varchar('vat_amount', { length: 50 }),
        signaturePresent: boolean('signature_present'),
        birAtp:         boolean('bir_atp'),
        attachmentValidationStatus: varchar('attachment_validation_status', { length: 50 }).default('pending'),
        birValidationStatus: varchar('bir_validation_status', { length: 50 }).default('pending'),
        amountValidationStatus: varchar('amount_validation_status', { length: 50 }).default('pending'),
        createdAt:      timestamp('created_at').defaultNow(),
        updatedAt:      timestamp('updated_at').defaultNow().$onUpdateFn(() => new Date()),

    }
)

export const insertInvoiceSchema = createSelectSchema(invoice_tbl)
.extend({})
.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type InvoiceParams = z.infer<typeof insertInvoiceSchema>


