import { z } from 'zod'

// Validation rule types
export interface ValidationRule {
  field: string
  required: boolean
  validator?: (value: any) => boolean
  errorMessage: string
}

export interface ValidationRuleSet {
  name: string
  description: string
  rules: ValidationRule[]
}

// Validation result types
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  score: number // 0-100 completeness score
  summary: string
}

export interface ValidationError {
  field: string
  message: string
  severity: 'critical' | 'major' | 'minor'
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// Invoice data schema for validation
const InvoiceDataSchema = z.object({
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

  vat_exempt_sales: z.number().nullable(),
  zero_rated_sales: z.number().nullable(),
  percentage_tax_sales: z.number().nullable(),

  net_amount: z.number().nullable(),
  vat_amount: z.number().nullable(),
  currency: z.string().nullable(),
  invoice_type: z.string().nullable(),
  vat_status: z.string().nullable(),

  has_invoice_word: z.boolean(),
  has_serial_number: z.boolean(),
  has_qty_unit_desc: z.boolean(),
  has_vat_label: z.boolean(),
  has_exempt_label: z.boolean(),
  has_sales_breakdown: z.boolean(),
  document_control_type: z.string().nullable(),
  document_control_number: z.string().nullable(),
  document_control_date: z.string().nullable(),
  signature_present: z.boolean(),
  form_2307_attached: z.boolean(),
  form_2307_consistent: z.boolean().nullable(),
  rag_validation: z.object({}).catchall(z.unknown()).optional(),
})

export type InvoiceData = z.infer<typeof InvoiceDataSchema>

// Predefined validation rule sets
export const VALIDATION_RULE_SETS: Record<string, ValidationRuleSet> = {
  'bir_invoice': {
    name: 'BIR 2307 Invoice Validation',
    description: 'BIR 2307 existence validation for invoices',
    rules: [
      {
        field: 'form_2307_attached',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'BIR Form 2307 is required'
      },
      {
        field: 'form_2307_consistent',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'BIR Form 2307 contents must be aligned with invoice data.'
      }
    ]
  },
  'standard_invoice': {
    name: 'Standard Invoice Validation',
    description: 'Basic validation for standard Philippine invoices',
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
          // Basic TIN format validation (XXX-XXX-XXX-XXX or XXXXXXXXX)
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
  'government_invoice': {
    name: 'Government Invoice Validation',
    description: 'Enhanced validation for government-related invoices',
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
  },
  'purchase_order_based': {
    name: 'Purchase Order Based Validation',
    description: 'Validation for invoices that require PO matching (future use case)',
    rules: [
      {
        field: 'bir_atp',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'BIR Authority to Print (ATP) is required'
      },
      {
        field: 'signature_present',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'Authorized signature is required'
      },
      // Future: Add PO number validation, line item matching, etc.
    ]
  }
}

/**
 * Validates invoice data against a specific rule set
 */
export async function validateInvoiceData(
  invoiceData: any,
  ruleSetName: string = 'bir_invoice'
): Promise<ValidationResult> {
  try {
    // Validate input schema
    const validatedData = InvoiceDataSchema.parse(invoiceData)
    
    // Get validation rules - first try from config service, then fallback to predefined
    let ruleSet = VALIDATION_RULE_SETS[ruleSetName]
    
    // Try to get from configuration service (future integration)
    /*try {
      const { getValidationConfig, configToRuleSet } = await import('./validation-config.service')
      const config = await getValidationConfig(ruleSetName)
      if (config) {
        ruleSet = configToRuleSet(config)
      }
    } catch (error) {
      // Fallback to predefined rule sets if config service is not available
      console.log('Using predefined validation rules')
    }
    
    if (!ruleSet) {
      throw new Error(`Unknown validation rule set: ${ruleSetName}`)
    }
    */

    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let passedRules = 0
    const totalRules = ruleSet.rules.length

    // Apply validation rules
    for (const rule of ruleSet.rules) {
      const fieldValue = validatedData[rule.field as keyof InvoiceData]
      
      if (rule.required) {
        // Check if field exists and passes validation
        if (rule.validator) {
          if (!rule.validator(fieldValue)) {
            errors.push({
              field: rule.field,
              message: rule.errorMessage,
              severity: 'critical'
            })
          } else {
            passedRules++
          }
        } else {
          // Basic null/undefined check for required fields
          if (fieldValue === null || fieldValue === undefined) {
            errors.push({
              field: rule.field,
              message: rule.errorMessage,
              severity: 'critical'
            })
          } else {
            passedRules++
          }
        }
      }
    }

    // Additional business logic validations
    const additionalValidations = await performAdditionalValidations(validatedData)
    errors.push(...additionalValidations.errors)
    warnings.push(...additionalValidations.warnings)

    // Calculate completeness score
    const score = Math.round((passedRules / totalRules) * 100)
    
    // Generate summary
    const isValid = errors.length === 0
    const summary = generateValidationSummary(isValid, errors.length, warnings.length, score, ruleSet.name)

    return {
      isValid,
      errors,
      warnings,
      score,
      summary
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: [{
          field: 'schema',
          message: `Invalid invoice data format: ${error.issues.map(e => e.message).join(', ')}`,
          severity: 'critical'
        }],
        warnings: [],
        score: 0,
        summary: 'Invoice data format validation failed'
      }
    }
    
    throw error
  }
}

/**
 * Performs additional business logic validations
 */
async function performAdditionalValidations(data: InvoiceData): Promise<{
  errors: ValidationError[]
  warnings: ValidationWarning[]
}> {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // VAT calculation validation
  if (data.vat_status === 'vatable' && data.vatable_sales && data.vat_amount) {
    const expectedVat = Math.round(data.vatable_sales * 0.12 * 100) / 100
    const actualVat = data.vat_amount
    const tolerance = 1.0 // ₱1 tolerance
    
    if (Math.abs(expectedVat - actualVat) > tolerance) {
      warnings.push({
        field: 'vat_amount',
        message: `VAT calculation mismatch. Expected: ₱${expectedVat}, Actual: ₱${actualVat}`,
        suggestion: 'Verify VAT calculation: vatable_sales × 12%'
      })
    }
  }

  // Line items validation
  if (data.line_items && data.line_items.length > 0) {
    const calculatedSubtotal = data.line_items.reduce((sum, item) => sum + item.line_total, 0)
    
    if (data.subtotal && Math.abs(calculatedSubtotal - data.subtotal) > 1) {
      warnings.push({
        field: 'subtotal',
        message: `Subtotal mismatch. Calculated: ₱${calculatedSubtotal}, Stated: ₱${data.subtotal}`,
        suggestion: 'Verify line item calculations'
      })
    }
  }

  // Date validation
  if (data.invoice_date) {
    const invoiceDate = new Date(data.invoice_date)
    const today = new Date()
    
    if (invoiceDate > today) {
      warnings.push({
        field: 'invoice_date',
        message: 'Invoice date is in the future',
        suggestion: 'Verify invoice date accuracy'
      })
    }
  }

  return { errors, warnings }
}

/**
 * Generates a human-readable validation summary
 */
function generateValidationSummary(
  isValid: boolean,
  errorCount: number,
  warningCount: number,
  score: number,
  ruleSetName: string
): string {
  if (isValid) {
    return `✅ Invoice validation passed (${score}% complete) using ${ruleSetName} rules. ${warningCount > 0 ? `${warningCount} warnings found.` : 'No issues detected.'}`
  } else {
    return `❌ Invoice validation failed with ${errorCount} critical errors and ${warningCount} warnings (${score}% complete) using ${ruleSetName} rules.`
  }
}

/**
 * Gets available validation rule sets
 */
export function getAvailableRuleSets(): ValidationRuleSet[] {
  return Object.values(VALIDATION_RULE_SETS)
}

/**
 * Adds or updates a validation rule set (for future configurability)
 */
export function addValidationRuleSet(name: string, ruleSet: ValidationRuleSet): void {
  VALIDATION_RULE_SETS[name] = ruleSet
}