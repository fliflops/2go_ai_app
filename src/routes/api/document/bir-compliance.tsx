import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { validateBIRCompliance, getAvailableBIRRuleSets } from '@/services/bir-compliance.service'

export const Route = createFileRoute('/api/document/bir-compliance')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { invoiceData, ruleSetName = 'standard_bir_compliance' } = body

          if (!invoiceData) {
            return json({
              success: false,
              error: 'Invoice data is required for BIR compliance validation'
            }, { status: 400 })
          }

          // Perform BIR compliance validation
          const complianceResult = await validateBIRCompliance(invoiceData, ruleSetName)

          return json({
            success: true,
            birCompliance: complianceResult,
            ruleSetUsed: ruleSetName,
            timestamp: new Date().toISOString(),
            complianceStatus: complianceResult.isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT'
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

      GET: async () => {
        try {
          // Return available BIR compliance rule sets
          const ruleSets = getAvailableBIRRuleSets()
          
          return json({
            success: true,
            ruleSets: ruleSets.map(ruleSet => ({
              name: ruleSet.name,
              description: ruleSet.description,
              ruleCount: ruleSet.rules.length,
              minimumScore: ruleSet.minimumScore
            })),
            complianceInfo: {
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
              birGuidelines: {
                tinFormat: 'XXX-XXX-XXX-XXX (9-12 digits)',
                dateFormat: 'YYYY-MM-DD (not in future)',
                minimumScore: 85
              }
            }
          })

        } catch (error: any) {
          console.error('Error fetching BIR compliance rule sets:', error)
          
          return json({
            success: false,
            error: 'Failed to fetch BIR compliance rule sets'
          }, { status: 500 })
        }
      }
    }
  }
})
