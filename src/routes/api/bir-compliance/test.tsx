import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { validateBIRCompliance, getAvailableBIRRuleSets } from '@/services/bir-compliance.service'

// Sample test data for BIR compliance validation
const SAMPLE_BIR_COMPLIANT_INVOICE = {
  invoice_number: "BIR-2024-001",
  invoice_date: "2024-12-14",
  vendor_name: "ABC Corporation Inc.",
  vendor_address: "123 Business St., Makati City, Metro Manila 1200",
  vendor_tin: "123-456-789-000",
  customer_name: "XYZ Company Ltd.",
  customer_address: "456 Client Ave., Quezon City, Metro Manila 1100",
  customer_tin: "987-654-321-000",
  total_amount: 11200.00,
  line_items: [
    {
      description: "Professional Consulting Services - Q4 2024",
      quantity: 1,
      unit_price: 10000.00,
      line_total: 10000.00
    },
    {
      description: "Document Processing Fee",
      quantity: 2,
      unit_price: 600.00,
      line_total: 1200.00
    }
  ],
  subtotal: 11200.00,
  vatable_sales: 10000.00,
  vat_amount: 1200.00,
  currency: "PHP",
  invoice_type: "services",
  vat_status: "vatable",
  signature_present: true,
  bir_atp: true
}

const SAMPLE_BIR_NON_COMPLIANT_INVOICE = {
  invoice_number: null, // Missing critical field
  invoice_date: "2024-12-14",
  vendor_name: "ABC Corp", // Too short
  vendor_address: null, // Missing critical field
  vendor_tin: "invalid-tin-format", // Invalid TIN format
  customer_name: "Customer", // Too generic
  customer_address: null, // Missing critical field
  customer_tin: null, // Missing critical field
  total_amount: 0, // Invalid amount
  line_items: [
    {
      description: "", // Empty description
      quantity: 0, // Invalid quantity
      unit_price: 1000.00,
      line_total: 0 // Inconsistent calculation
    },
    {
      description: "Service 2",
      // Missing quantity field
      unit_price: 500.00,
      line_total: 500.00
    }
  ],
  subtotal: 1500.00,
  vatable_sales: 1339.29,
  vat_amount: 160.71,
  currency: "PHP",
  invoice_type: "services",
  vat_status: "vatable",
  signature_present: false, // Missing signature
  bir_atp: false // Missing BIR ATP
}

const SAMPLE_PARTIAL_COMPLIANT_INVOICE = {
  invoice_number: "PARTIAL-001",
  invoice_date: "2024-12-14",
  vendor_name: "Partial Compliance Corp Inc.",
  vendor_address: "789 Test St., Manila City, Metro Manila 1000",
  vendor_tin: "111-222-333-444",
  customer_name: "Test Customer Inc.",
  customer_address: "321 Customer Blvd., Pasig City, Metro Manila 1600",
  customer_tin: "555-666-777-888",
  total_amount: 5000.00,
  line_items: [
    {
      description: "Complete Service Item",
      quantity: 1,
      unit_price: 3000.00,
      line_total: 3000.00
    },
    {
      description: "Incomplete Item", // Missing some fields
      quantity: 1,
      // unit_price missing
      line_total: 2000.00
    }
  ],
  // Missing some optional fields
  signature_present: true,
  bir_atp: true
}

export const Route = createFileRoute('/api/bir-compliance/test')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const testType = url.searchParams.get('type') || 'all'
          const ruleSet = url.searchParams.get('ruleSet') || 'standard_bir_compliance'

          const results: any = {
            timestamp: new Date().toISOString(),
            ruleSetUsed: ruleSet,
            tests: {}
          }

          if (testType === 'compliant' || testType === 'all') {
            console.log('Testing BIR compliant invoice data...')
            const compliantResult = await validateBIRCompliance(SAMPLE_BIR_COMPLIANT_INVOICE, ruleSet)
            results.tests.birCompliantInvoice = {
              input: SAMPLE_BIR_COMPLIANT_INVOICE,
              result: compliantResult,
              expectedOutcome: 'should pass BIR compliance validation'
            }
          }

          if (testType === 'non-compliant' || testType === 'all') {
            console.log('Testing BIR non-compliant invoice data...')
            const nonCompliantResult = await validateBIRCompliance(SAMPLE_BIR_NON_COMPLIANT_INVOICE, ruleSet)
            results.tests.birNonCompliantInvoice = {
              input: SAMPLE_BIR_NON_COMPLIANT_INVOICE,
              result: nonCompliantResult,
              expectedOutcome: 'should fail BIR compliance validation'
            }
          }

          if (testType === 'partial' || testType === 'all') {
            console.log('Testing partially BIR compliant invoice data...')
            const partialResult = await validateBIRCompliance(SAMPLE_PARTIAL_COMPLIANT_INVOICE, ruleSet)
            results.tests.birPartialCompliantInvoice = {
              input: SAMPLE_PARTIAL_COMPLIANT_INVOICE,
              result: partialResult,
              expectedOutcome: 'should have moderate BIR compliance score'
            }
          }

          if (testType === 'rule-sets' || testType === 'all') {
            console.log('Testing BIR compliance rule sets...')
            const ruleSets = getAvailableBIRRuleSets()
            results.tests.birRuleSets = {
              availableRuleSets: ruleSets.map(ruleSet => ({
                name: ruleSet.name,
                description: ruleSet.description,
                ruleCount: ruleSet.rules.length,
                minimumScore: ruleSet.minimumScore
              })),
              totalRuleSets: ruleSets.length
            }
          }

          // Add BIR compliance system info
          results.birComplianceInfo = {
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
              standard: 85,
              enhanced: 90,
              government: 95
            },
            birGuidelines: {
              tinFormat: 'XXX-XXX-XXX-XXX (Philippine TIN format)',
              dateValidation: 'Must be valid date, not in future',
              amountValidation: 'Must be positive number',
              lineItemsRequired: 'At least one complete line item required'
            }
          }

          return json({
            success: true,
            ...results
          })

        } catch (error: any) {
          console.error('BIR compliance test error:', error)
          
          return json({
            success: false,
            error: error.message || 'Failed to run BIR compliance tests',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { invoiceData, ruleSetName = 'standard_bir_compliance', description } = body

          if (!invoiceData) {
            return json({
              success: false,
              error: 'Invoice data is required for custom BIR compliance testing'
            }, { status: 400 })
          }

          console.log(`Testing custom invoice data for BIR compliance with rule set: ${ruleSetName}`)
          const complianceResult = await validateBIRCompliance(invoiceData, ruleSetName)

          return json({
            success: true,
            test: {
              description: description || 'Custom BIR compliance validation test',
              input: invoiceData,
              result: complianceResult,
              ruleSetUsed: ruleSetName,
              complianceStatus: complianceResult.isCompliant ? 'BIR_COMPLIANT' : 'BIR_NON_COMPLIANT',
              timestamp: new Date().toISOString()
            }
          })

        } catch (error: any) {
          console.error('Custom BIR compliance test error:', error)
          
          return json({
            success: false,
            error: error.message || 'Failed to run custom BIR compliance test',
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
      }
    }
  }
})
