import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { validateInvoiceData, getAvailableRuleSets } from '@/services/document-validation.service'

export const Route = createFileRoute('/api/document/validate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { invoiceData, ruleSetName = 'standard_invoice' } = body

          if (!invoiceData) {
            return json({
              success: false,
              error: 'Invoice data is required'
            }, { status: 400 })
          }

          // Perform validation
          const validationResult = await validateInvoiceData(invoiceData, ruleSetName)

          return json({
            success: true,
            validation: validationResult,
            ruleSetUsed: ruleSetName,
            timestamp: new Date().toISOString()
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

      GET: async () => {
        try {
          // Return available validation rule sets
          const ruleSets = getAvailableRuleSets()
          
          return json({
            success: true,
            ruleSets: ruleSets.map(ruleSet => ({
              name: ruleSet.name,
              description: ruleSet.description,
              ruleCount: ruleSet.rules.length
            }))
          })

        } catch (error: any) {
          console.error('Error fetching validation rule sets:', error)
          
          return json({
            success: false,
            error: 'Failed to fetch validation rule sets'
          }, { status: 500 })
        }
      }
    }
  }
})
