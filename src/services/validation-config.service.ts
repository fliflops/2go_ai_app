import { ValidationRule, ValidationRuleSet } from './document-validation.service'

/**
 * Service for managing validation configurations
 * This allows for dynamic rule management in the future
 */

export interface ValidationConfig {
  id: string
  name: string
  description: string
  poType?: string // Future: Purchase Order type
  isActive: boolean
  rules: ValidationRule[]
  createdAt: string
  updatedAt: string
}

// In-memory storage for now (future: move to database)
let validationConfigs: ValidationConfig[] = [
  {
    id: 'standard_invoice',
    name: 'Standard Invoice Validation',
    description: 'Basic validation for standard Philippine invoices',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rules: [
      {
        field: 'bir_atp',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'BIR Authority to Print (ATP) is required and must be present on the invoice'
      },
      {
        field: 'signature_present',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'Authorized signature is required on the invoice'
      },
      {
        field: 'invoice_number',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Invoice number is required'
      },
      {
        field: 'vendor_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          const tinPattern = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{9,12})$/
          return tinPattern.test(value.replace(/\s/g, ''))
        },
        errorMessage: 'Valid vendor TIN is required (format: XXX-XXX-XXX-XXX)'
      },
      {
        field: 'total_amount',
        required: true,
        validator: (value: number | null) => value !== null && value > 0,
        errorMessage: 'Total amount must be greater than zero'
      }
    ]
  },
  {
    id: 'government_invoice',
    name: 'Government Invoice Validation',
    description: 'Enhanced validation for government-related invoices',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rules: [
      {
        field: 'bir_atp',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'BIR Authority to Print (ATP) is mandatory for government invoices'
      },
      {
        field: 'signature_present',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'Authorized signature is mandatory for government invoices'
      },
      {
        field: 'invoice_number',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Invoice number is required'
      },
      {
        field: 'vendor_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          const tinPattern = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{9,12})$/
          return tinPattern.test(value.replace(/\s/g, ''))
        },
        errorMessage: 'Valid vendor TIN is required for government transactions'
      },
      {
        field: 'customer_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          const tinPattern = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{9,12})$/
          return tinPattern.test(value.replace(/\s/g, ''))
        },
        errorMessage: 'Customer TIN is required for government transactions'
      },
      {
        field: 'vat_status',
        required: true,
        validator: (value: string | null) => {
          const validStatuses = ['vatable', 'vat_exempt', 'zero_rated', 'non_vat']
          return value !== null && validStatuses.includes(value)
        },
        errorMessage: 'Valid VAT status is required (vatable, vat_exempt, zero_rated, or non_vat)'
      }
    ]
  }
]

/**
 * Get all validation configurations
 */
export async function getValidationConfigs(): Promise<ValidationConfig[]> {
  return validationConfigs.filter(config => config.isActive)
}

/**
 * Get a specific validation configuration by ID
 */
export async function getValidationConfig(id: string): Promise<ValidationConfig | null> {
  return validationConfigs.find(config => config.id === id && config.isActive) || null
}

/**
 * Create a new validation configuration
 */
export async function createValidationConfig(config: Omit<ValidationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ValidationConfig> {
  const newConfig: ValidationConfig = {
    ...config,
    id: generateConfigId(config.name),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  validationConfigs.push(newConfig)
  return newConfig
}

/**
 * Update an existing validation configuration
 */
export async function updateValidationConfig(id: string, updates: Partial<Omit<ValidationConfig, 'id' | 'createdAt'>>): Promise<ValidationConfig | null> {
  const configIndex = validationConfigs.findIndex(config => config.id === id)
  
  if (configIndex === -1) {
    return null
  }
  
  validationConfigs[configIndex] = {
    ...validationConfigs[configIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  return validationConfigs[configIndex]
}

/**
 * Delete a validation configuration (soft delete by setting isActive to false)
 */
export async function deleteValidationConfig(id: string): Promise<boolean> {
  const configIndex = validationConfigs.findIndex(config => config.id === id)
  
  if (configIndex === -1) {
    return false
  }
  
  validationConfigs[configIndex].isActive = false
  validationConfigs[configIndex].updatedAt = new Date().toISOString()
  
  return true
}

/**
 * Convert ValidationConfig to ValidationRuleSet for compatibility
 */
export function configToRuleSet(config: ValidationConfig): ValidationRuleSet {
  return {
    name: config.name,
    description: config.description,
    rules: config.rules
  }
}

/**
 * Get validation configuration by PO type (future use case)
 */
export async function getValidationConfigByPoType(poType: string): Promise<ValidationConfig | null> {
  return validationConfigs.find(config => 
    config.isActive && config.poType === poType
  ) || null
}

/**
 * Generate a unique configuration ID from name
 */
function generateConfigId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Validate a validation rule (meta-validation)
 */
export function validateValidationRule(rule: ValidationRule): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!rule.field || rule.field.trim().length === 0) {
    errors.push('Field name is required')
  }
  
  if (!rule.errorMessage || rule.errorMessage.trim().length === 0) {
    errors.push('Error message is required')
  }
  
  if (rule.required && !rule.validator) {
    // For required fields without custom validators, we'll use default validation
    // This is acceptable
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate a complete validation configuration
 */
export function validateValidationConfig(config: Omit<ValidationConfig, 'id' | 'createdAt' | 'updatedAt'>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!config.name || config.name.trim().length === 0) {
    errors.push('Configuration name is required')
  }
  
  if (!config.description || config.description.trim().length === 0) {
    errors.push('Configuration description is required')
  }
  
  if (!config.rules || config.rules.length === 0) {
    errors.push('At least one validation rule is required')
  } else {
    // Validate each rule
    config.rules.forEach((rule, index) => {
      const ruleValidation = validateValidationRule(rule)
      if (!ruleValidation.isValid) {
        errors.push(`Rule ${index + 1}: ${ruleValidation.errors.join(', ')}`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}