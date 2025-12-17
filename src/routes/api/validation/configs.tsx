import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getValidationConfigs,
  getValidationConfig,
  createValidationConfig,
  updateValidationConfig,
  deleteValidationConfig,
  validateValidationConfig,
  getValidationConfigByPoType
} from '@/services/validation-config.service'

export const Route = createFileRoute('/api/validation/configs')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const poType = url.searchParams.get('poType')
          const configId = url.searchParams.get('id')

          if (configId) {
            // Get specific configuration
            const config = await getValidationConfig(configId)
            
            if (!config) {
              return json({
                success: false,
                error: 'Validation configuration not found'
              }, { status: 404 })
            }

            return json({
              success: true,
              config
            })
          }

          if (poType) {
            // Get configuration by PO type
            const config = await getValidationConfigByPoType(poType)
            
            return json({
              success: true,
              config: config || null,
              message: config ? 'Configuration found for PO type' : 'No specific configuration for PO type, use default'
            })
          }

          // Get all configurations
          const configs = await getValidationConfigs()
          
          return json({
            success: true,
            configs: configs.map(config => ({
              id: config.id,
              name: config.name,
              description: config.description,
              poType: config.poType,
              isActive: config.isActive,
              ruleCount: config.rules.length,
              createdAt: config.createdAt,
              updatedAt: config.updatedAt
            }))
          })

        } catch (error: any) {
          console.error('Error fetching validation configurations:', error)
          
          return json({
            success: false,
            error: 'Failed to fetch validation configurations'
          }, { status: 500 })
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { name, description, poType, rules } = body

          // Validate the configuration
          const validation = validateValidationConfig({
            name,
            description,
            poType,
            isActive: true,
            rules
          })

          if (!validation.isValid) {
            return json({
              success: false,
              error: 'Invalid validation configuration',
              details: validation.errors
            }, { status: 400 })
          }

          // Create the configuration
          const newConfig = await createValidationConfig({
            name,
            description,
            poType,
            isActive: true,
            rules
          })

          return json({
            success: true,
            config: newConfig,
            message: 'Validation configuration created successfully'
          })

        } catch (error: any) {
          console.error('Error creating validation configuration:', error)
          
          return json({
            success: false,
            error: 'Failed to create validation configuration'
          }, { status: 500 })
        }
      },

      PUT: async ({ request }) => {
        try {
          const body = await request.json()
          const { id, name, description, poType, rules, isActive } = body

          if (!id) {
            return json({
              success: false,
              error: 'Configuration ID is required for updates'
            }, { status: 400 })
          }

          // Validate the updates if rules are being changed
          if (rules) {
            const validation = validateValidationConfig({
              name: name || 'temp',
              description: description || 'temp',
              poType,
              isActive: isActive !== undefined ? isActive : true,
              rules
            })

            if (!validation.isValid) {
              return json({
                success: false,
                error: 'Invalid validation configuration',
                details: validation.errors
              }, { status: 400 })
            }
          }

          // Update the configuration
          const updatedConfig = await updateValidationConfig(id, {
            name,
            description,
            poType,
            rules,
            isActive
          })

          if (!updatedConfig) {
            return json({
              success: false,
              error: 'Validation configuration not found'
            }, { status: 404 })
          }

          return json({
            success: true,
            config: updatedConfig,
            message: 'Validation configuration updated successfully'
          })

        } catch (error: any) {
          console.error('Error updating validation configuration:', error)
          
          return json({
            success: false,
            error: 'Failed to update validation configuration'
          }, { status: 500 })
        }
      },

      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const id = url.searchParams.get('id')

          if (!id) {
            return json({
              success: false,
              error: 'Configuration ID is required'
            }, { status: 400 })
          }

          const deleted = await deleteValidationConfig(id)

          if (!deleted) {
            return json({
              success: false,
              error: 'Validation configuration not found'
            }, { status: 404 })
          }

          return json({
            success: true,
            message: 'Validation configuration deleted successfully'
          })

        } catch (error: any) {
          console.error('Error deleting validation configuration:', error)
          
          return json({
            success: false,
            error: 'Failed to delete validation configuration'
          }, { status: 500 })
        }
      }
    }
  }
})
