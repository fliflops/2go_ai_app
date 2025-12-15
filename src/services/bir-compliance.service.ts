import { z } from 'zod'

// BIR Compliance validation rule types
export interface BIRComplianceRule {
  field: string
  required: boolean
  validator?: (value: any) => boolean
  errorMessage: string
  weight: number // Weight for scoring (1-10)
}

export interface BIRComplianceRuleSet {
  name: string
  description: string
  rules: BIRComplianceRule[]
  minimumScore: number // Minimum score to be considered compliant (0-100)
}

// BIR Compliance validation result types
export interface BIRComplianceResult {
  isCompliant: boolean
  errors: BIRComplianceError[]
  warnings: BIRComplianceWarning[]
  score: number // 0-100 compliance score
  summary: string
  fieldCompleteness: FieldCompletenessReport
}

export interface BIRComplianceError {
  field: string
  message: string
  severity: 'critical' | 'major' | 'minor'
  birRequirement: string // BIR regulation reference
}

export interface BIRComplianceWarning {
  field: string
  message: string
  suggestion?: string
  birGuideline?: string
}

export interface FieldCompletenessReport {
  requiredFields: {
    field: string
    present: boolean
    value?: any
  }[]
  lineItemsCompleteness: {
    totalItems: number
    completeItems: number
    incompleteItems: {
      index: number
      missingFields: string[]
    }[]
  }
  overallCompleteness: number // Percentage
}

// Invoice data schema for BIR compliance validation
const BIRInvoiceDataSchema = z.object({
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
  })).optional(),
  // Optional fields for additional validation
  due_date: z.string().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  vatable_sales: z.number().nullable().optional(),
  vat_amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  invoice_type: z.string().nullable().optional(),
  vat_status: z.string().nullable().optional(),
  signature_present: z.boolean().optional(),
  bir_atp: z.boolean().optional()
})

export type BIRInvoiceData = z.infer<typeof BIRInvoiceDataSchema>

// Predefined BIR compliance rule sets
export const BIR_COMPLIANCE_RULE_SETS: Record<string, BIRComplianceRuleSet> = {
  'standard_bir_compliance': {
    name: 'Standard BIR Compliance',
    description: 'Basic BIR compliance validation for Philippine invoices',
    minimumScore: 85, // 85% minimum for compliance
    rules: [
      {
        field: 'invoice_number',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Invoice number is required for BIR compliance',
        weight: 10
      },
      {
        field: 'invoice_date',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          // Check if it's a valid date format (YYYY-MM-DD or similar)
          const date = new Date(value)
          return !isNaN(date.getTime())
        },
        errorMessage: 'Valid invoice date is required for BIR compliance',
        weight: 8
      },
      {
        field: 'vendor_name',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Vendor name is required for BIR compliance',
        weight: 9
      },
      {
        field: 'vendor_address',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Vendor address is required for BIR compliance',
        weight: 7
      },
      {
        field: 'vendor_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          // Philippine TIN format validation
          const tinPattern = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{9,12})$/
          return tinPattern.test(value.replace(/\s/g, ''))
        },
        errorMessage: 'Valid vendor TIN is required for BIR compliance (format: XXX-XXX-XXX-XXX)',
        weight: 10
      },
      {
        field: 'customer_name',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Customer name is required for BIR compliance',
        weight: 8
      },
      {
        field: 'customer_address',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Customer address is required for BIR compliance',
        weight: 6
      },
      {
        field: 'customer_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          // Philippine TIN format validation
          const tinPattern = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{9,12})$/
          return tinPattern.test(value.replace(/\s/g, ''))
        },
        errorMessage: 'Valid customer TIN is required for BIR compliance (format: XXX-XXX-XXX-XXX)',
        weight: 9
      },
      {
        field: 'total_amount',
        required: true,
        validator: (value: number | null) => value !== null && value > 0,
        errorMessage: 'Total amount must be greater than zero for BIR compliance',
        weight: 10
      }
    ]
  },
  'enhanced_bir_compliance': {
    name: 'Enhanced BIR Compliance',
    description: 'Comprehensive BIR compliance validation with line item details',
    minimumScore: 90, // Higher standard for enhanced compliance
    rules: [
      // All standard rules plus additional requirements
      {
        field: 'invoice_number',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Invoice number is required for BIR compliance',
        weight: 10
      },
      {
        field: 'invoice_date',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          const date = new Date(value)
          return !isNaN(date.getTime())
        },
        errorMessage: 'Valid invoice date is required for BIR compliance',
        weight: 8
      },
      {
        field: 'vendor_name',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Vendor name is required for BIR compliance',
        weight: 9
      },
      {
        field: 'vendor_address',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Vendor address is required for BIR compliance',
        weight: 7
      },
      {
        field: 'vendor_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          const tinPattern = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{9,12})$/
          return tinPattern.test(value.replace(/\s/g, ''))
        },
        errorMessage: 'Valid vendor TIN is required for BIR compliance',
        weight: 10
      },
      {
        field: 'customer_name',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Customer name is required for BIR compliance',
        weight: 8
      },
      {
        field: 'customer_address',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Customer address is required for BIR compliance',
        weight: 6
      },
      {
        field: 'customer_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          const tinPattern = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{9,12})$/
          return tinPattern.test(value.replace(/\s/g, ''))
        },
        errorMessage: 'Valid customer TIN is required for BIR compliance',
        weight: 9
      },
      {
        field: 'total_amount',
        required: true,
        validator: (value: number | null) => value !== null && value > 0,
        errorMessage: 'Total amount must be greater than zero for BIR compliance',
        weight: 10
      },
      // Additional enhanced requirements
      {
        field: 'vat_status',
        required: true,
        validator: (value: string | null) => {
          const validStatuses = ['vatable', 'vat_exempt', 'zero_rated', 'non_vat']
          return value !== null && validStatuses.includes(value)
        },
        errorMessage: 'Valid VAT status is required for enhanced BIR compliance',
        weight: 7
      }
    ]
  },
  'government_bir_compliance': {
    name: 'Government BIR Compliance',
    description: 'Strict BIR compliance for government transactions',
    minimumScore: 95, // Highest standard for government
    rules: [
      // All enhanced rules with stricter validation
      {
        field: 'invoice_number',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          // Government invoices should have specific format
          return value.trim().length >= 5
        },
        errorMessage: 'Government invoice number must be at least 5 characters',
        weight: 10
      },
      {
        field: 'invoice_date',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          const date = new Date(value)
          const today = new Date()
          // Invoice date should not be in the future
          return !isNaN(date.getTime()) && date <= today
        },
        errorMessage: 'Valid invoice date (not in future) is required for government transactions',
        weight: 8
      },
      // ... (other fields with similar strict validation)
    ]
  }
}

/**
 * Validates invoice data for BIR compliance
 */
export async function validateBIRCompliance(
  invoiceData: any,
  ruleSetName: string = 'standard_bir_compliance'
): Promise<BIRComplianceResult> {
  try {
    // Validate input schema
    const validatedData = BIRInvoiceDataSchema.parse(invoiceData)
    
    // Get BIR compliance rules
    const ruleSet = BIR_COMPLIANCE_RULE_SETS[ruleSetName]
    if (!ruleSet) {
      throw new Error(`Unknown BIR compliance rule set: ${ruleSetName}`)
    }

    const errors: BIRComplianceError[] = []
    const warnings: BIRComplianceWarning[] = []
    let totalWeight = 0
    let achievedWeight = 0

    // Track field completeness
    const requiredFields: { field: string; present: boolean; value?: any }[] = []

    // Apply BIR compliance rules
    for (const rule of ruleSet.rules) {
      const fieldValue = validatedData[rule.field as keyof BIRInvoiceData]
      totalWeight += rule.weight
      
      const isFieldPresent = rule.validator ? rule.validator(fieldValue) : (fieldValue !== null && fieldValue !== undefined)
      
      requiredFields.push({
        field: rule.field,
        present: isFieldPresent,
        value: fieldValue
      })

      if (rule.required) {
        if (!isFieldPresent) {
          errors.push({
            field: rule.field,
            message: rule.errorMessage,
            severity: 'critical',
            birRequirement: `BIR requires ${rule.field} for valid invoice documentation`
          })
        } else {
          achievedWeight += rule.weight
        }
      }
    }

    // Validate line items completeness
    const lineItemsCompleteness = validateLineItemsCompleteness(validatedData.line_items || [])
    
    // Add line items weight to scoring
    const lineItemsWeight = 15 // 15% of total score
    totalWeight += lineItemsWeight
    
    if (lineItemsCompleteness.completeItems === lineItemsCompleteness.totalItems && lineItemsCompleteness.totalItems > 0) {
      achievedWeight += lineItemsWeight
    } else if (lineItemsCompleteness.totalItems === 0) {
      errors.push({
        field: 'line_items',
        message: 'Line items are required for BIR compliance',
        severity: 'critical',
        birRequirement: 'BIR requires detailed line items for invoice validation'
      })
    } else {
      // Partial credit for incomplete line items
      const partialCredit = (lineItemsCompleteness.completeItems / lineItemsCompleteness.totalItems) * lineItemsWeight
      achievedWeight += partialCredit
      
      warnings.push({
        field: 'line_items',
        message: `${lineItemsCompleteness.incompleteItems.length} line items are incomplete`,
        suggestion: 'Ensure all line items have description, quantity, unit_price, and line_total',
        birGuideline: 'Complete line item details improve BIR compliance'
      })
    }

    // Additional BIR-specific validations
    const additionalValidations = await performBIRSpecificValidations(validatedData)
    errors.push(...additionalValidations.errors)
    warnings.push(...additionalValidations.warnings)

    // Calculate compliance score
    const score = Math.round((achievedWeight / totalWeight) * 100)
    
    // Determine compliance status
    const isCompliant = score >= ruleSet.minimumScore && errors.length === 0
    
    // Generate field completeness report
    const fieldCompleteness: FieldCompletenessReport = {
      requiredFields,
      lineItemsCompleteness,
      overallCompleteness: score
    }

    // Generate summary
    const summary = generateBIRComplianceSummary(isCompliant, errors.length, warnings.length, score, ruleSet.name, ruleSet.minimumScore)

    return {
      isCompliant,
      errors,
      warnings,
      score,
      summary,
      fieldCompleteness
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isCompliant: false,
        errors: [{
          field: 'schema',
          message: `Invalid invoice data format: ${error.issues.map(e => e.message).join(', ')}`,
          severity: 'critical',
          birRequirement: 'Valid data format is required for BIR processing'
        }],
        warnings: [],
        score: 0,
        summary: 'Invoice data format validation failed',
        fieldCompleteness: {
          requiredFields: [],
          lineItemsCompleteness: { totalItems: 0, completeItems: 0, incompleteItems: [] },
          overallCompleteness: 0
        }
      }
    }
    
    throw error
  }
}

/**
 * Validates line items completeness
 */
function validateLineItemsCompleteness(lineItems: any[]): {
  totalItems: number
  completeItems: number
  incompleteItems: { index: number; missingFields: string[] }[]
} {
  const requiredFields = ['description', 'quantity', 'unit_price', 'line_total']
  let completeItems = 0
  const incompleteItems: { index: number; missingFields: string[] }[] = []

  lineItems.forEach((item, index) => {
    const missingFields: string[] = []
    
    for (const field of requiredFields) {
      if (!item[field] || (typeof item[field] === 'string' && item[field].trim().length === 0)) {
        missingFields.push(field)
      }
    }

    if (missingFields.length === 0) {
      completeItems++
    } else {
      incompleteItems.push({ index, missingFields })
    }
  })

  return {
    totalItems: lineItems.length,
    completeItems,
    incompleteItems
  }
}

/**
 * Performs additional BIR-specific validations
 */
async function performBIRSpecificValidations(data: BIRInvoiceData): Promise<{
  errors: BIRComplianceError[]
  warnings: BIRComplianceWarning[]
}> {
  const errors: BIRComplianceError[] = []
  const warnings: BIRComplianceWarning[] = []

  // TIN format validation (more detailed)
  if (data.vendor_tin) {
    const cleanTin = data.vendor_tin.replace(/\s|-/g, '')
    if (cleanTin.length < 9 || cleanTin.length > 12) {
      warnings.push({
        field: 'vendor_tin',
        message: 'Vendor TIN length may not comply with BIR standards',
        suggestion: 'Verify TIN format with BIR guidelines',
        birGuideline: 'TIN should be 9-12 digits in XXX-XXX-XXX-XXX format'
      })
    }
  }

  if (data.customer_tin) {
    const cleanTin = data.customer_tin.replace(/\s|-/g, '')
    if (cleanTin.length < 9 || cleanTin.length > 12) {
      warnings.push({
        field: 'customer_tin',
        message: 'Customer TIN length may not comply with BIR standards',
        suggestion: 'Verify TIN format with BIR guidelines',
        birGuideline: 'TIN should be 9-12 digits in XXX-XXX-XXX-XXX format'
      })
    }
  }

  // Date validation
  if (data.invoice_date) {
    const invoiceDate = new Date(data.invoice_date)
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    
    if (invoiceDate > today) {
      errors.push({
        field: 'invoice_date',
        message: 'Invoice date cannot be in the future',
        severity: 'critical',
        birRequirement: 'BIR requires valid historical invoice dates'
      })
    } else if (invoiceDate < oneYearAgo) {
      warnings.push({
        field: 'invoice_date',
        message: 'Invoice date is more than one year old',
        suggestion: 'Verify if this is a current transaction',
        birGuideline: 'Old invoices may require additional BIR documentation'
      })
    }
  }

  // Amount validation
  if (data.total_amount && data.total_amount > 1000000) {
    warnings.push({
      field: 'total_amount',
      message: 'High-value transaction detected',
      suggestion: 'Ensure proper documentation for large transactions',
      birGuideline: 'Large transactions may require additional BIR reporting'
    })
  }

  return { errors, warnings }
}

/**
 * Generates a human-readable BIR compliance summary
 */
function generateBIRComplianceSummary(
  isCompliant: boolean,
  errorCount: number,
  warningCount: number,
  score: number,
  ruleSetName: string,
  minimumScore: number
): string {
  if (isCompliant) {
    return `✅ BIR Compliance PASSED (${score}% complete) using ${ruleSetName} standards. ${warningCount > 0 ? `${warningCount} recommendations for improvement.` : 'Fully compliant with BIR requirements.'}`
  } else {
    return `❌ BIR Compliance FAILED with ${errorCount} critical issues and ${warningCount} warnings (${score}% complete, minimum required: ${minimumScore}%) using ${ruleSetName} standards.`
  }
}

/**
 * Gets available BIR compliance rule sets
 */
export function getAvailableBIRRuleSets(): BIRComplianceRuleSet[] {
  return Object.values(BIR_COMPLIANCE_RULE_SETS)
}

/**
 * Adds or updates a BIR compliance rule set (for future configurability)
 */
export function addBIRComplianceRuleSet(name: string, ruleSet: BIRComplianceRuleSet): void {
  BIR_COMPLIANCE_RULE_SETS[name] = ruleSet
}