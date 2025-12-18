import {db} from '@/db/ai_db_schema';
import {desc,count, sql, and, SQL, eq} from 'drizzle-orm'
import {invoice_contract_validation_tbl, invoice_tbl } from '@/db/ai_db_schema/schema';
import type {InvoiceParams} from '@/db/ai_db_schema/schema';

export const getInvoice = async(filters:SQL[]) => {
    const conditions = filters.length > 0 ? and(...filters) : undefined
    const invoice = await db.select().from(invoice_tbl).where(conditions).limit(1)
    if(invoice.length > 0) return invoice[0] 
    return null
}

export const createInvoice = async(invoice:InvoiceParams) => {
    const data = await db.insert(invoice_tbl).values(invoice)
    return data
}

export const getPaginatedInvoice = async({
    page=1,
    limit=10,
    search= '',
    sortBy='createdAt',
    sortOrder='desc'
}: {
    page:number;
    limit: number;
    search:string;
    sortBy:string;
    sortOrder: string
}) => {

// Validate pagination parameters
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(Math.max(1, limit), 100) // Max 100 items per page
    const offset = (validatedPage - 1) * validatedLimit

    // Validate sort parameters
    //const validSortColumns = ['createdAt', 'updatedAt', 'invoiceDate', 'client', 'invoiceNo']
    // const validatedSortBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt'
    // const validatedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    // Build where conditions for search
    let whereConditions = sql`1=1`
    if (search) {
        whereConditions = sql`(
            ${invoice_tbl.customerName} ILIKE ${`%${search}%`} OR 
            ${invoice_tbl.invoiceNumber} ILIKE ${`%${search}%`}
        )`
    }

    // Get total count for pagination
    const totalCountResult = await db
    .select({ count: count() })
    .from(invoice_tbl)
    .where(whereConditions)

    const totalCount = totalCountResult[0]?.count || 0
    const totalPages = Math.ceil(totalCount / validatedLimit)

    //// Build order by clause
    // const orderByColumn = invoice_tbl[validatedSortBy as keyof typeof invoice_tbl]
    // const orderBy = validatedSortOrder === 'desc' ? desc(orderByColumn) : orderByColumn

    const invoices = await db.select()
    .from(invoice_tbl)
    .where(whereConditions)
    .orderBy(desc(invoice_tbl.createdAt))
    .limit(validatedLimit)
    .offset(offset)

    // Calculate pagination metadata
    const hasNextPage = validatedPage < totalPages
    const hasPreviousPage = validatedPage > 1

    return {
        data: invoices,
        pagination: {
            page: validatedPage,
            limit: validatedLimit,
            totalCount,
            totalPages,
            hasNextPage,
            hasPreviousPage,
        },
        filters:{
            search,
            // sortBy: validatedSortBy,
            // sortOrder: validatedSortOrder,
        }
    }

}

export const updateInvoice = async (params:{where:{
    id: string
}; data:{
    parsedData: any;
    attachmentValidationStatus:string;
    amountValidationStatus:string;
    birValidationStatus: string;
}}) => {

    const {where,data} = params;

    await db.update(invoice_tbl).set({
        parsedData: data.parsedData,
        attachmentValidationStatus: data.attachmentValidationStatus,
        amountValidationStatus: data.amountValidationStatus,
        birValidationStatus: data.birValidationStatus
    })
    .where(eq(invoice_tbl.id, where.id))
} 

export const updateInvoiceById = async <
  T extends Partial<typeof invoice_tbl.$inferInsert>
>(params: {
  id: string;
  data: T;
}) => {
  const { id, data } = params;

  if (Object.keys(data).length === 0) {
    throw new Error('No fields provided for update');
  }

  const result = await db
    .update(invoice_tbl)
    .set(data)
    .where(eq(invoice_tbl.id, id));

  return result.rowCount;
};