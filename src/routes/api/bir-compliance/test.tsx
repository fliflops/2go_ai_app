import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { validateBIRCompliance, getAvailableBIRRuleSets } from '@/services/bir-compliance.service'

// Sample test data for BIR compliance validation (Official BIR Requirements)
const SAMPLE_BIR_COMPLIANT_INVOICE = {
  // General Requirements (Mandatory)
  seller_registered_name: "ABC Corporation Inc.",
  seller_tin: "123-456-789-000 (Non-VAT)",
  seller_address: "123 Business St., Makati City, Metro Manila 1200",
  invoice_word_present: true,
  transaction_date: "2024-12-14",
  buyer_registered_name: "XYZ Company Ltd.",
  buyer_address: "456 Client Ave., Quezon City, Metro Manila 1100",
  buyer_tin: "987-654-321-000",
  serial_number: "BIR-2024-001",
  total_amount: 11200.00,
  
  // Line Items (Mandatory)
  line_items: [
    {
      quantity: 1,
      unit_cost: 10000.00,
      description: "Professional Consulting Services - Q4 2024",
      line_total: 10000.00
    },
    {
      quantity: 2,
      unit_cost: 600.00,
      description: "Document Processing Fee",
      line_total: 1200.00
    }
  ],
  
  // Document Control Info (Mandatory)
  document_control_type: "system",
  ptu_accn_number: "PTU-2024-12345",
  
  // VAT Registration Status
  vat_registration_status: "non_vat_registered",
  
  // Non-VAT Registered Fields
  vatable_sales: 10000.00,
  vat_amount: 1200.00,
  zero_rated_sales: 0,
  vat_exempt_sales: 0,
  
  // Legacy fields for backward compatibility
  invoice_number: "BIR-2024-001",
  invoice_date: "2024-12-14",
  vendor_name: "ABC Corporation Inc.",
  vendor_address: "123 Business St., Makati City, Metro Manila 1200",
  vendor_tin: "123-456-789-000",
  customer_name: "XYZ Company Ltd.",
  customer_address: "456 Client Ave., Quezon City, Metro Manila 1100",
  customer_tin: "987-654-321-000"
}

const SAMPLE_BIR_NON_COMPLIANT_INVOICE = {
  // General Requirements (Many Missing)
  seller_registered_name: null, // Missing critical field
  seller_tin: "invalid-tin", // Invalid TIN format
  seller_address: null, // Missing critical field
  invoice_word_present: false, // Missing "Invoice" word
  transaction_date: "2025-01-01", // Future date (invalid)
  buyer_registered_name: "Customer", // Too generic
  buyer_address: null, // Missing critical field
  buyer_tin: null, // Missing critical field
  serial_number: null, // Missing serial number
  total_amount: 0, // Invalid amount
  
  // Line Items (Incomplete)
  line_items: [
    {
      quantity: 0, // Invalid quantity
      unit_cost: 1000.00,
      description: "", // Empty description
      line_total: 0 // Inconsistent calculation
    },
    {
      quantity: 1, // Present but other issues
      unit_cost: 500.00,
      description: "Service 2",
      line_total: 500.00
    }
  ],
  
  // Document Control Info (Missing)
  document_control_type: null, // Missing document control
  atp_ocn_number: null,
  ptu_accn_number: null,
  
  // VAT Registration Status (Missing)
  vat_registration_status: null, // Missing VAT status
  
  // Conflicting VAT fields (Business Rule Violation)
  vat_exempt_statement: true, // VAT-registered field
  vat_amount: 160.71, // Non-VAT registered field (conflict!)
  
  // Legacy fields
  invoice_number: null,
  invoice_date: "2025-01-01",
  vendor_name: "ABC Corp",
  vendor_address: null,
  vendor_tin: "invalid-tin",
  customer_name: "Customer",
  customer_address: null,
  customer_tin: null
}

const SAMPLE_PARTIAL_COMPLIANT_INVOICE = {
  // General Requirements (Most Present)
  seller_registered_name: "Partial Compliance Corp Inc.",
  seller_tin: "111-222-333-444 (VAT)", // Has VAT label
  seller_address: "789 Test St., Manila City, Metro Manila 1000",
  invoice_word_present: true,
  transaction_date: "2024-12-14",
  buyer_registered_name: "Test Customer Inc.",
  buyer_address: "321 Customer Blvd., Pasig City, Metro Manila 1600",
  buyer_tin: "555-666-777-888",
  serial_number: "PARTIAL-001",
  total_amount: 5000.00,
  
  // Line Items (Partially Complete)
  line_items: [
    {
      quantity: 1,
      unit_cost: 3000.00,
      description: "Complete Service Item",
      line_total: 3000.00
    },
    {
      quantity: 1,
      // unit_cost missing (will cause validation error)
      description: "Incomplete Item",
      line_total: 2000.00
    }
  ],
  
  // Document Control Info (Present)
  document_control_type: "manual",
  atp_ocn_number: "ATP-2024-67890",
  
  // VAT Registration Status (Present)
  vat_registration_status: "vat_registered",
  
  // VAT-Registered Fields (Missing required EXEMPT statement)
  // vat_exempt_statement: false, // Missing - should be true for VAT-registered
  
  // Legacy fields
  invoice_number: "PARTIAL-001",
  invoice_date: "2024-12-14",
  vendor_name: "Partial Compliance Corp Inc.",
  vendor_address: "789 Test St., Manila City, Metro Manila 1000",
  vendor_tin: "111-222-333-444",
  customer_name: "Test Customer Inc.",
  customer_address: "321 Customer Blvd., Pasig City, Metro Manila 1600",
  customer_tin: "555-666-777-888"
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
