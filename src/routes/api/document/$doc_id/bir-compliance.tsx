import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDocument } from '@/services/paperless.service'
import { validateBIRCompliance } from '@/services/bir-compliance.service'
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

// Schema for AI-extracted invoice data (focused on BIR compliance fields)
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
  // Additional fields for comprehensive validation
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

const BIR_EXTRACTION_PROMPT = `
# Philippine Invoice BIR Compliance Data Extraction

Extract structured data from Philippine invoices focusing on BIR compliance requirements.

## Critical BIR Compliance Fields (MUST BE ACCURATE):

### Vendor Information
**vendor_name**: Complete legal business name with suffixes (Inc., Corp., OPC, etc.)
**vendor_address**: Full address "Unit/Floor/Building, Street, Barangay, City, Province ZIP"
**vendor_tin**: Tax Identification Number in XXX-XXX-XXX-XXX format

### Customer Information  
**customer_name**: Complete customer/buyer name from "Sold to:", "Billed to:", "Customer:"
**customer_address**: Full customer address in same format as vendor
**customer_tin**: Customer's Tax Identification Number

### Invoice Details
**invoice_number**: From "Invoice No.:", "SI No.:", "OR No.:" - MUST be present
**invoice_date**: Issue date in YYYY-MM-DD format - MUST be valid date
**total_amount**: Final payable amount (numeric only, no symbols/commas) - MUST be > 0

### Line Items (CRITICAL for BIR Compliance)
Extract ALL products/services with complete details:
- **description**: Detailed product/service name (cannot be empty)
- **quantity**: Numeric quantity (must be > 0)
- **unit_price**: Price per unit (must be > 0)  
- **line_total**: Total for line item (quantity × unit_price)

### BIR Compliance Indicators
**signature_present**: true if ANY signature exists (handwritten/printed/digital); false if none
**bir_atp**: true if BOTH "BIR Permit to Print No." AND "Date Issued" are clearly present; false otherwise

## Validation Rules:
- Use null for truly missing fields (not empty strings)
- All amounts must be positive numbers
- TIN format: XXX-XXX-XXX-XXX or 9-12 digits
- Line items array cannot be empty for BIR compliance
- Each line item must have all 4 required fields

Extract data from the following invoice text:
`

export const Route = createFileRoute('/api/document/$doc_id/bir-compliance')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const { doc_id } = params
          const body = await request.json()
          const { ruleSetName = 'standard_bir_compliance', forceReExtraction = false } = body

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
          if (forceReExtraction || !document.bir_extracted_data) {
            console.log('Performing BIR-focused AI extraction for document:', doc_id)
            
            // Use AI to extract structured data with BIR compliance focus
            const result = await generateObject({
              model: anthropic('claude-3-5-sonnet-20241022'),
              prompt: BIR_EXTRACTION_PROMPT + document.content,
              schema: BIRInvoiceExtractionSchema,
              temperature: 0.05, // Very low temperature for consistent BIR compliance extraction
            })

            extractedData = result.object
            
            // TODO: Cache this BIR-specific extracted data in the database
            // await saveBIRExtractedData(doc_id, extractedData)
            
          } else {
            // Use cached BIR extraction data
            extractedData = document.bir_extracted_data
          }

          // Validate BIR compliance
          const complianceResult = await validateBIRCompliance(extractedData, ruleSetName)

          return json({
            success: true,
            document: {
              id: document.id,
              title: document.title,
              created: document.created,
              original_file_name: document.original_file_name
            },
            extractedData,
            birCompliance: complianceResult,
            ruleSetUsed: ruleSetName,
            timestamp: new Date().toISOString(),
            complianceStatus: complianceResult.isCompliant ? 'BIR_COMPLIANT' : 'BIR_NON_COMPLIANT',
            processingInfo: {
              wasReExtracted: forceReExtraction || !document.bir_extracted_data,
              ocrContentLength: document.content.length,
              extractionFocus: 'BIR_COMPLIANCE'
            }
          })

        } catch (error: any) {
          console.error('BIR compliance validation error:', error)
          
          return json({
            success: false,
            error: error.message || 'Failed to validate BIR compliance',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
      },

      GET: async ({ params }) => {
        try {
          const { doc_id } = params

          // Get document basic info and any cached BIR compliance results
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
              hasCachedBIRExtraction: !!document.bir_extracted_data
            },
            birComplianceInfo: {
              requiredFields: [
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
              lineItemRequiredFields: [
                'description',
                'quantity',
                'unit_price',
                'line_total'
              ],
              complianceStandards: {
                minimumScore: 85,
                criticalFields: ['invoice_number', 'vendor_tin', 'customer_tin', 'total_amount'],
                birRequirements: 'All fields must be present and valid for BIR compliance'
              }
            }
            // TODO: Return cached BIR compliance results if available
            // cachedBIRCompliance: document.last_bir_compliance_result
          })

        } catch (error: any) {
          console.error('Error fetching document BIR compliance info:', error)
          
          return json({
            success: false,
            error: 'Failed to fetch document BIR compliance information'
          }, { status: 500 })
        }
      }
    }
  }
})
