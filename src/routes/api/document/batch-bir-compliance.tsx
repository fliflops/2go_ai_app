import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDocument } from '@/services/paperless.service'
import { validateBIRCompliance } from '@/services/bir-compliance.service'
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

// Schema for AI-extracted invoice data (same as individual BIR compliance)
const BIRInvoiceExtractionSchema = z.object({
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  vendor_name: z.string().nullable(),
  vendor_address: z.string().nullable(),
  vendor_tin: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_address: z.string().nullable(),
  customer_tin: z.string().nullable(),
  total_amount: z.number().nullable(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    line_total: z.number()
  })),
  due_date: z.string().nullable(),
  subtotal: z.number().nullable(),
  vatable_sales: z.number().nullable(),
  vat_amount: z.number().nullable(),
  currency: z.string().nullable(),
  invoice_type: z.string().nullable(),
  vat_status: z.string().nullable(),
  signature_present: z.boolean(),
  bir_atp: z.boolean()
})

interface BatchBIRComplianceRequest {
  documentIds: string[]
  ruleSetName?: string
  forceReExtraction?: boolean
  complianceThreshold?: number // Override minimum compliance score
}

interface BatchBIRComplianceResult {
  documentId: string
  success: boolean
  document?: {
    id: string
    title: string
    original_file_name: string
  }
  extractedData?: any
  birCompliance?: any
  complianceStatus?: 'BIR_COMPLIANT' | 'BIR_NON_COMPLIANT' | 'ERROR'
  error?: string
  processingTimeMs: number
}

const BIR_EXTRACTION_PROMPT = `
# Philippine Invoice BIR Compliance Data Extraction

Extract structured data from Philippine invoices focusing on BIR compliance requirements.

## Critical BIR Compliance Fields:
- **invoice_number**: Must be present and non-empty
- **invoice_date**: Valid date in YYYY-MM-DD format
- **vendor_name**: Complete legal business name
- **vendor_address**: Full address with city and province
- **vendor_tin**: Tax ID in XXX-XXX-XXX-XXX format
- **customer_name**: Complete customer name
- **customer_address**: Full customer address
- **customer_tin**: Customer Tax ID
- **total_amount**: Positive amount (numeric only)
- **line_items**: Array with description, quantity, unit_price, line_total

Extract data from the following invoice text:
`

export const Route = createFileRoute('/api/document/batch-bir-compliance')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: BatchBIRComplianceRequest = await request.json()
          const { 
            documentIds, 
            ruleSetName = 'standard_bir_compliance',
            forceReExtraction = false,
            complianceThreshold
          } = body

          if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return json({
              success: false,
              error: 'Document IDs array is required'
            }, { status: 400 })
          }

          if (documentIds.length > 25) {
            return json({
              success: false,
              error: 'Maximum 25 documents can be processed in a single BIR compliance batch'
            }, { status: 400 })
          }

          const results: BatchBIRComplianceResult[] = []
          const startTime = Date.now()

          // Process documents in parallel (with lower concurrency for BIR compliance)
          const concurrencyLimit = 3 // Lower limit for more thorough processing
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
                    complianceStatus: 'ERROR' as const,
                    error: 'Document not found or has no OCR content',
                    processingTimeMs: Date.now() - docStartTime
                  }
                }

                let extractedData: any

                // AI extraction for BIR compliance
                if (forceReExtraction || !document.bir_extracted_data) {
                  const result = await generateObject({
                    model: anthropic('claude-3-5-sonnet-20241022'),
                    prompt: BIR_EXTRACTION_PROMPT + document.content,
                    schema: BIRInvoiceExtractionSchema,
                    temperature: 0.05, // Very low for consistency
                  })
                  extractedData = result.object
                } else {
                  extractedData = document.bir_extracted_data
                }

                // Validate BIR compliance
                const complianceResult = await validateBIRCompliance(extractedData, ruleSetName)

                // Apply custom compliance threshold if provided
                let isCompliant = complianceResult.isCompliant
                if (complianceThreshold && complianceResult.score < complianceThreshold) {
                  isCompliant = false
                }

                return {
                  documentId: docId,
                  success: true,
                  document: {
                    id: document.id,
                    title: document.title,
                    original_file_name: document.original_file_name
                  },
                  extractedData,
                  birCompliance: complianceResult,
                  complianceStatus: isCompliant ? 'BIR_COMPLIANT' as const : 'BIR_NON_COMPLIANT' as const,
                  processingTimeMs: Date.now() - docStartTime
                }

              } catch (error: any) {
                console.error(`Error processing BIR compliance for document ${docId}:`, error)
                
                return {
                  documentId: docId,
                  success: false,
                  complianceStatus: 'ERROR' as const,
                  error: error.message || 'Failed to process BIR compliance',
                  processingTimeMs: Date.now() - docStartTime
                }
              }
            })

            const chunkResults = await Promise.all(chunkPromises)
            results.push(...chunkResults)
          }

          // Calculate BIR compliance summary statistics
          const totalProcessingTime = Date.now() - startTime
          const compliantDocuments = results.filter(r => r.complianceStatus === 'BIR_COMPLIANT')
          const nonCompliantDocuments = results.filter(r => r.complianceStatus === 'BIR_NON_COMPLIANT')
          const errorDocuments = results.filter(r => r.complianceStatus === 'ERROR')

          // Calculate average compliance score
          const validResults = results.filter(r => r.birCompliance?.score !== undefined)
          const averageComplianceScore = validResults.length > 0 
            ? Math.round(validResults.reduce((sum, r) => sum + r.birCompliance.score, 0) / validResults.length)
            : 0

          // Identify common compliance issues
          const commonIssues: { [key: string]: number } = {}
          results.forEach(result => {
            if (result.birCompliance?.errors) {
              result.birCompliance.errors.forEach((error: any) => {
                commonIssues[error.field] = (commonIssues[error.field] || 0) + 1
              })
            }
          })

          const summary = {
            totalDocuments: documentIds.length,
            compliantDocuments: compliantDocuments.length,
            nonCompliantDocuments: nonCompliantDocuments.length,
            errorDocuments: errorDocuments.length,
            complianceRate: Math.round((compliantDocuments.length / documentIds.length) * 100),
            averageComplianceScore,
            averageProcessingTimeMs: Math.round(totalProcessingTime / documentIds.length),
            totalProcessingTimeMs: totalProcessingTime,
            commonComplianceIssues: Object.entries(commonIssues)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([field, count]) => ({ field, occurrences: count }))
          }

          return json({
            success: true,
            results,
            summary,
            ruleSetUsed: ruleSetName,
            complianceThreshold: complianceThreshold || 85,
            timestamp: new Date().toISOString(),
            birComplianceReport: {
              overallStatus: summary.complianceRate >= 80 ? 'GOOD' : summary.complianceRate >= 60 ? 'FAIR' : 'POOR',
              recommendation: summary.complianceRate < 80 
                ? 'Review and improve document quality for better BIR compliance'
                : 'Good BIR compliance rate maintained'
            }
          })

        } catch (error: any) {
          console.error('Batch BIR compliance validation error:', error)
          
          return json({
            success: false,
            error: error.message || 'Failed to perform batch BIR compliance validation',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
      },

      GET: async () => {
        // Return batch BIR compliance capabilities and guidelines
        return json({
          success: true,
          capabilities: {
            maxDocumentsPerBatch: 25,
            concurrencyLimit: 3,
            supportedRuleSets: ['standard_bir_compliance', 'enhanced_bir_compliance', 'government_bir_compliance'],
            features: [
              'BIR-focused AI data extraction',
              'Comprehensive field completeness checking',
              'Line item validation',
              'TIN format verification',
              'Compliance scoring and reporting'
            ]
          },
          birRequirements: {
            criticalFields: [
              'invoice_number',
              'invoice_date',
              'vendor_name',
              'vendor_address', 
              'vendor_tin',
              'customer_name',
              'customer_address',
              'customer_tin',
              'total_amount'
            ],
            lineItemFields: [
              'description',
              'quantity',
              'unit_price',
              'line_total'
            ],
            complianceStandards: {
              standard: 85,
              enhanced: 90,
              government: 95
            },
            processingGuidelines: {
              recommendedBatchSize: '10-15 documents for optimal performance',
              averageProcessingTime: '15-30 seconds per document',
              qualityFactors: [
                'OCR text clarity',
                'Document structure',
                'Field completeness',
                'Data accuracy'
              ]
            }
          }
        })
      }
    }
  }
})
