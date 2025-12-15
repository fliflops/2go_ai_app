import {db} from '@/db/ai_db_schema';
import {invoice_tbl, } from '@/db/ai_db_schema/schema';
import type {InvoiceParams} from '@/db/ai_db_schema/schema';

export const getInvoice = async() => {
    const invoice = await db.select().from(invoice_tbl);
    return invoice
}

export const createInvoice = async(invoice:InvoiceParams) => {
    const data = await db.insert(invoice_tbl).values(invoice)
    return data
}