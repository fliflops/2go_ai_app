import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDocument } from '@/services/paperless.service'
import { validateInvoiceData } from '@/services/document-validation.service'
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

// Schema for AI-extracted invoice data
const InvoiceExtractionSchema = z.object({
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  vendor_name: z.string().nullable(),
  vendor_address: z.string().nullable(),
  vendor_tin: z.string().nullable(),
  vendor_business_style: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_address: z.string().nullable(),
  customer_tin: z.string().nullable(),
  total_amount: z.number().nullable(),
  due_date: z.string().nullable(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    line_total: z.number()
  })),
  subtotal: z.number().nullable(),
  vatable_sales: z.number().nullable(),
  net_amount: z.number().nullable(),
  vat_amount: z.number().nullable(),
  currency: z.string().nullable(),
  invoice_type: z.string().nullable(),
  vat_status: z.string().nullable(),
  signature_present: z.boolean(),
  bir_atp: z.boolean()
})

const EXTRACTION_PROMPT = `
# Philippine Invoice Data Extraction Specialist

Extract structured data from Philippine sales invoices (goods/products or services) into JSON format following BIR requirements.

## Context
- **Tax**: VAT at 12%, VAT-exempt, zero-rated, or non-VAT
- **Currency**: PHP (₱) default. ISO codes: PHP, USD, EUR
- **TIN Format**: XXX-XXX-XXX-XXX or XXXXXXXXX
- **Date Format**: Convert to YYYY-MM-DD

## Field Extraction Rules

### Vendor (Seller)
**vendor_name**: Legal/business name with suffixes (Inc., Corp., OPC, etc.)
**vendor_address**: "Unit/Floor/Building, Street, Barangay, City, Province ZIP"
**vendor_tin**: Tax ID with/without dashes
**vendor_business_style**: Line of business (e.g., "Retail & Services")

### Customer (Buyer)
**customer_name**: From "Sold to:", "Billed to:", "Customer:"
**customer_address**: Same format as vendor
**customer_tin**: Buyer's tax ID

### Invoice Details
**invoice_number**: From "Invoice No.:", "SI No.:", "OR No.:"
**invoice_date**: Issue date in YYYY-MM-DD
**due_date**: From "Due Date:" or calculate from terms (Net 30 = +30 days, Upon receipt = invoice_date)

### Financial Fields
**total_amount**: Final payable amount (numeric, no symbols/commas)
**subtotal**: Sum of line_items before tax
**vatable_sales**: Amount subject to 12% VAT (= subtotal for VATable)
**vat_amount**: 12% VAT (= vatable_sales × 0.12). Use 0 for exempt/zero-rated
**net_amount**: If shown separately; otherwise null
**currency**: "PHP", "USD", "EUR", etc.

### Line Items
Extract all products/services as array of objects with:
- description: Product/service name with details
- quantity: number (default 1 if missing)
- unit_price: number (per unit price)
- line_total: number (quantity × unit_price)

### Classification
**invoice_type**: "goods", "services", or "mixed"
**vat_status**: "vatable", "vat_exempt", "zero_rated", or "non_vat"

### BIR Compliance
**signature_present**: true if handwritten/printed/digital signature exists; false if none
**bir_atp**: true if BOTH "BIR Permit to Print No." AND "Date Issued" are present (usually at bottom); false otherwise

## Missing Data
- Use null for missing fields (not "", not 0 unless explicitly zero)
- Booleans: only true or false

Extract data from the following invoice text:
`

export const Route = createFileRoute('/api/document/$doc_id/validate')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const { doc_id } = params
          const body = await request.json()
          const { ruleSetName = 'standard_invoice', forceReExtraction = false } = body

          // Get document from Paperless-ngx
          const document = await getDocument(doc_id)
          
          if (!document || !document.content) {
            return json({
              success: false,
              error: 'Document not found or has no OCR content'
            }, { status: 404 })
          }

          let extractedData: any

          // Check if we should use cached extraction or force re-extraction
          if (forceReExtraction || !document.extracted_data) {
            console.log('Performing AI extraction for document:', doc_id)
            
            // Use AI to extract structured data from OCR content
            const result = await generateObject({
              model: anthropic('claude-3-5-sonnet-20241022'),
              prompt: EXTRACTION_PROMPT + document.content,
              schema: InvoiceExtractionSchema,
              temperature: 0.1, // Low temperature for consistent extraction
            })

            extractedData = result.object
            
            // TODO: In the future, cache this extracted data in the database
            // await saveExtractedData(doc_id, extractedData)
            
          } else {
            // Use cached extraction data
            extractedData = document.extracted_data
          }

          // Validate the extracted data
          const validationResult = await validateInvoiceData(extractedData, ruleSetName)

          return json({
            success: true,
            document: {
              id: document.id,
              title: document.title,
              created: document.created,
              original_file_name: document.original_file_name
            },
            extractedData,
            validation: validationResult,
            ruleSetUsed: ruleSetName,
            timestamp: new Date().toISOString(),
            processingInfo: {
              wasReExtracted: forceReExtraction || !document.extracted_data,
              ocrContentLength: document.content.length
            }
          })

        } catch (error: any) {
          console.error('Document validation error:', error)
          
          return json({
            success: false,
            error: error.message || 'Failed to validate document',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
      },

      GET: async ({ params }) => {
        try {
          const { doc_id } = params

          // Get document basic info and any cached validation results
          const document = await getDocument(doc_id)
          
          if (!document) {
            return json({
              success: false,
              error: 'Document not found'
            }, { status: 404 })
          }

          return json({
            success: true,
            document: {
              id: document.id,
              title: document.title,
              created: document.created,
              original_file_name: document.original_file_name,
              hasOcrContent: !!document.content,
              ocrContentLength: document.content?.length || 0,
              hasCachedExtraction: !!document.extracted_data
            },
            // TODO: Return cached validation results if available
            // cachedValidation: document.last_validation_result
          })

        } catch (error: any) {
          console.error('Error fetching document info:', error)
          
          return json({
            success: false,
            error: 'Failed to fetch document information'
          }, { status: 500 })
        }
      }
    }
  }
})
