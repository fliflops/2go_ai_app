import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDocument } from '@/services/paperless.service'
import { validateInvoiceData } from '@/services/document-validation.service'
import { getValidationConfig, configToRuleSet } from '@/services/validation-config.service'
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

// Schema for AI-extracted invoice data (same as in individual validation)
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

interface BatchValidationRequest {
  documentIds: string[]
  ruleSetName?: string
  poType?: string // Future: for PO-specific validation
  forceReExtraction?: boolean
}

interface BatchValidationResult {
  documentId: string
  success: boolean
  document?: {
    id: string
    title: string
    original_file_name: string
  }
  extractedData?: any
  validation?: any
  error?: string
  processingTimeMs: number
}

const EXTRACTION_PROMPT = `
# Philippine Invoice Data Extraction Specialist

Extract structured data from Philippine sales invoices (goods/products or services) into JSON format following BIR requirements.

## Context
- **Tax**: VAT at 12%, VAT-exempt, zero-rated, or non-VAT
- **Currency**: PHP (₱) default. ISO codes: PHP, USD, EUR
- **TIN Format**: XXX-XXX-XXX-XXX or XXXXXXXXX
- **Date Format**: Convert to YYYY-MM-DD

## BIR Compliance Fields (Critical for Validation)
**signature_present**: true if handwritten/printed/digital signature exists; false if none
**bir_atp**: true if BOTH "BIR Permit to Print No." AND "Date Issued" are present (usually at bottom); false otherwise

Extract data from the following invoice text:
`

export const Route = createFileRoute('/api/document/batch-validate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: BatchValidationRequest = await request.json()
          const { 
            documentIds, 
            ruleSetName = 'standard_invoice', 
            poType,
            forceReExtraction = false 
          } = body

          if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return json({
              success: false,
              error: 'Document IDs array is required'
            }, { status: 400 })
          }

          if (documentIds.length > 50) {
            return json({
              success: false,
              error: 'Maximum 50 documents can be processed in a single batch'
            }, { status: 400 })
          }

          // Determine validation rule set
          let validationRuleSet = ruleSetName
          if (poType) {
            const poConfig = await getValidationConfig(`po_${poType}`)
            if (poConfig) {
              validationRuleSet = poConfig.id
            }
          }

          const results: BatchValidationResult[] = []
          const startTime = Date.now()

          // Process documents in parallel (with concurrency limit)
          const concurrencyLimit = 5
          const chunks = []
          for (let i = 0; i < documentIds.length; i += concurrencyLimit) {
            chunks.push(documentIds.slice(i, i + concurrencyLimit))
          }

          for (const chunk of chunks) {
            const chunkPromises = chunk.map(async (docId) => {
              const docStartTime = Date.now()
              
              try {
                // Get document from Paperless-ngx
                const document = await getDocument(docId)
                
                if (!document || !document.content) {
                  return {
                    documentId: docId,
                    success: false,
                    error: 'Document not found or has no OCR content',
                    processingTimeMs: Date.now() - docStartTime
                  }
                }

                let extractedData: any

                // AI extraction (same logic as individual validation)
                if (forceReExtraction || !document.extracted_data) {
                  const result = await generateObject({
                    model: anthropic('claude-3-5-sonnet-20241022'),
                    prompt: EXTRACTION_PROMPT + document.content,
                    schema: InvoiceExtractionSchema,
                    temperature: 0.1,
                  })
                  extractedData = result.object
                } else {
                  extractedData = document.extracted_data
                }

                // Validate the extracted data
                const validationResult = await validateInvoiceData(extractedData, validationRuleSet)

                return {
                  documentId: docId,
                  success: true,
                  document: {
                    id: document.id,
                    title: document.title,
                    original_file_name: document.original_file_name
                  },
                  extractedData,
                  validation: validationResult,
                  processingTimeMs: Date.now() - docStartTime
                }

              } catch (error: any) {
                console.error(`Error processing document ${docId}:`, error)
                
                return {
                  documentId: docId,
                  success: false,
                  error: error.message || 'Failed to process document',
                  processingTimeMs: Date.now() - docStartTime
                }
              }
            })

            const chunkResults = await Promise.all(chunkPromises)
            results.push(...chunkResults)
          }

          // Calculate summary statistics
          const totalProcessingTime = Date.now() - startTime
          const successfulValidations = results.filter(r => r.success && r.validation?.isValid)
          const failedValidations = results.filter(r => r.success && !r.validation?.isValid)
          const processingErrors = results.filter(r => !r.success)

          const summary = {
            totalDocuments: documentIds.length,
            successfulValidations: successfulValidations.length,
            failedValidations: failedValidations.length,
            processingErrors: processingErrors.length,
            averageProcessingTimeMs: Math.round(totalProcessingTime / documentIds.length),
            totalProcessingTimeMs: totalProcessingTime,
            validationPassRate: Math.round((successfulValidations.length / documentIds.length) * 100)
          }

          return json({
            success: true,
            results,
            summary,
            ruleSetUsed: validationRuleSet,
            timestamp: new Date().toISOString()
          })

        } catch (error: any) {
          console.error('Batch validation error:', error)
          
          return json({
            success: false,
            error: error.message || 'Failed to perform batch validation',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
      },

      GET: async () => {
        // Return batch validation capabilities and limits
        return json({
          success: true,
          capabilities: {
            maxDocumentsPerBatch: 50,
            concurrencyLimit: 5,
            supportedRuleSets: ['standard_invoice', 'government_invoice', 'purchase_order_based'],
            features: [
              'AI-powered data extraction',
              'Configurable validation rules',
              'BIR compliance checking',
              'Parallel processing',
              'Detailed error reporting'
            ]
          }
        })
      }
    }
  }
})
