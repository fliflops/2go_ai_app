import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { validateInvoiceData } from '@/services/document-validation.service'
import { getValidationConfigs } from '@/services/validation-config.service'

// Sample test data for validation
const SAMPLE_VALID_INVOICE = {
  invoice_number: "INV-2024-001",
  invoice_date: "2024-12-14",
  vendor_name: "ABC Corporation Inc.",
  vendor_address: "123 Business St., Makati City, Metro Manila 1200",
  vendor_tin: "123-456-789-000",
  vendor_business_style: "Retail & Services",
  customer_name: "XYZ Company Ltd.",
  customer_address: "456 Client Ave., Quezon City, Metro Manila 1100",
  customer_tin: "987-654-321-000",
  total_amount: 1120.00,
  due_date: "2024-12-28",
  line_items: [
    {
      description: "Professional Consulting Services",
      quantity: 1,
      unit_price: 1000.00,
      line_total: 1000.00
    }
  ],
  subtotal: 1000.00,
  vatable_sales: 1000.00,
  net_amount: null,
  vat_amount: 120.00,
  currency: "PHP",
  invoice_type: "services",
  vat_status: "vatable",
  signature_present: true,
  bir_atp: true
}

const SAMPLE_INVALID_INVOICE = {
  invoice_number: null, // Missing required field
  invoice_date: "2024-12-14",
  vendor_name: "ABC Corporation Inc.",
  vendor_address: "123 Business St., Makati City, Metro Manila 1200",
  vendor_tin: "invalid-tin", // Invalid TIN format
  vendor_business_style: "Retail & Services",
  customer_name: "XYZ Company Ltd.",
  customer_address: null,
  customer_tin: null,
  total_amount: 0, // Invalid amount
  due_date: "2024-12-28",
  line_items: [],
  subtotal: 1000.00,
  vatable_sales: 1000.00,
  net_amount: null,
  vat_amount: 150.00, // VAT calculation mismatch
  currency: "PHP",
  invoice_type: "services",
  vat_status: "vatable",
  signature_present: false, // Missing signature
  bir_atp: false // Missing BIR ATP
}

export const Route = createFileRoute('/api/validation/test')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const testType = url.searchParams.get('type') || 'all'
          const ruleSet = url.searchParams.get('ruleSet') || 'standard_invoice'

          const results: any = {
            timestamp: new Date().toISOString(),
            ruleSetUsed: ruleSet,
            tests: {}
          }

          if (testType === 'valid' || testType === 'all') {
            console.log('Testing valid invoice data...')
            const validResult = await validateInvoiceData(SAMPLE_VALID_INVOICE, ruleSet)
            results.tests.validInvoice = {
              input: SAMPLE_VALID_INVOICE,
              result: validResult,
              expectedOutcome: 'should pass validation'
            }
          }

          if (testType === 'invalid' || testType === 'all') {
            console.log('Testing invalid invoice data...')
            const invalidResult = await validateInvoiceData(SAMPLE_INVALID_INVOICE, ruleSet)
            results.tests.invalidInvoice = {
              input: SAMPLE_INVALID_INVOICE,
              result: invalidResult,
              expectedOutcome: 'should fail validation'
            }
          }

          if (testType === 'configs' || testType === 'all') {
            console.log('Testing validation configurations...')
            const configs = await getValidationConfigs()
            results.tests.configurations = {
              availableConfigs: configs.map(config => ({
                id: config.id,
                name: config.name,
                ruleCount: config.rules.length,
                isActive: config.isActive
              })),
              totalConfigs: configs.length
            }
          }

          // Add system info
          results.systemInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
          }

          return json({
            success: true,
            ...results
          })

        } catch (error: any) {
          console.error('Validation test error:', error)
          
          return json({
            success: false,
            error: error.message || 'Failed to run validation tests',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { invoiceData, ruleSetName = 'standard_invoice', description } = body

          if (!invoiceData) {
            return json({
              success: false,
              error: 'Invoice data is required for custom testing'
            }, { status: 400 })
          }

          console.log(`Testing custom invoice data with rule set: ${ruleSetName}`)
          const validationResult = await validateInvoiceData(invoiceData, ruleSetName)

          return json({
            success: true,
            test: {
              description: description || 'Custom invoice validation test',
              input: invoiceData,
              result: validationResult,
              ruleSetUsed: ruleSetName,
              timestamp: new Date().toISOString()
            }
          })

        } catch (error: any) {
          console.error('Custom validation test error:', error)
          
          return json({
            success: false,
            error: error.message || 'Failed to run custom validation test',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
      }
    }
  }
})
