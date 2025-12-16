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

// Invoice data schema for BIR compliance validation (Official BIR Requirements)
const BIRInvoiceDataSchema = z.object({
  // General Requirements (Mandatory)
  seller_registered_name: z.string().nullable(), // As per BIR Certificate of Registration
  seller_tin: z.string().nullable(), // TIN with Branch Code
  seller_address: z.string().nullable(), // Registered Business Address
  invoice_word_present: z.boolean().optional(), // "Invoice" or "Billing Invoice" clearly printed
  transaction_date: z.string().nullable(), // Date of Transaction
  buyer_registered_name: z.string().nullable(), // Buyer's Registered Name
  buyer_address: z.string().nullable(), // Buyer's Address
  buyer_tin: z.string().nullable(), // Buyer's TIN
  serial_number: z.string().nullable(), // Unique, sequential, printed clearly
  total_amount: z.number().nullable(), // Total Amount of Sale (gross amount)
  
  // Line Items (Mandatory)
  line_items: z.array(z.object({
    quantity: z.number(), // Quantity of goods/services
    unit_cost: z.number(), // Unit Cost
    description: z.string(), // Description/Nature of Goods or Services
    line_total: z.number() // Calculated total
  })).nullable(),
  
  // Document Control Info (Mandatory - either manual or system-generated)
  document_control_type: z.enum(['manual', 'system']).nullable(), // ATP/OCN or PTU/ACCN
  atp_ocn_number: z.string().nullable().optional(), // For manual invoices
  ptu_accn_number: z.string().nullable().optional(), // For system-generated invoices
  
  // VAT Registration Status (Must be one or the other, never both)
  vat_registration_status: z.enum(['vat_registered', 'non_vat_registered']).nullable(),
  
  // VAT-Registered Invoice Fields (only if vat_registered)
  vat_exempt_statement: z.boolean().optional(), // Must state "EXEMPT" on face
  sales_subject_to_percentage_tax: z.number().nullable().optional(), // SSPT
  exempt_sales: z.number().nullable().optional(), // Exempt Sales
  
  // Non-VAT Registered Invoice Fields (only if non_vat_registered)
  vatable_sales: z.number().nullable().optional(), // VATable Sales
  vat_amount: z.number().nullable().optional(), // VAT Amount as separate line item
  zero_rated_sales: z.number().nullable().optional(), // Zero-Rated Sales
  vat_exempt_sales: z.number().nullable().optional(), // VAT-Exempt Sales
  vat_exempt_indicator: z.boolean().optional(), // "VAT-Exempt Sale" indicator
  zero_rated_indicator: z.boolean().optional(), // "Zero-Rated Sale" indicator
  
  // Legacy fields for backward compatibility
  invoice_number: z.string().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  vendor_address: z.string().nullable().optional(),
  vendor_tin: z.string().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  customer_address: z.string().nullable().optional(),
  customer_tin: z.string().nullable().optional()
})

export type BIRInvoiceData = z.infer<typeof BIRInvoiceDataSchema>

// Predefined BIR compliance rule sets (Official BIR Requirements)
export const BIR_COMPLIANCE_RULE_SETS: Record<string, BIRComplianceRuleSet> = {
  'official_bir_compliance': {
    name: 'Official BIR Compliance',
    description: 'Official BIR compliance validation based on BIR regulations',
    minimumScore: 90, // 90% minimum for official compliance
    rules: [
      // General Requirements (Mandatory)
      {
        field: 'seller_registered_name',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Seller\'s Registered Name (as per BIR Certificate of Registration) is required',
        weight: 10
      },
      {
        field: 'seller_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          // TIN with Branch Code format validation (allow VAT/Non-VAT labels)
          const cleanTin = value.replace(/\s*\(.*?\)\s*/g, '').replace(/\s/g, '') // Remove labels and spaces
          const tinPattern = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{9,12})$/
          return tinPattern.test(cleanTin)
        },
        errorMessage: 'Seller\'s TIN with Branch Code is required for BIR compliance',
        weight: 10
      },
      {
        field: 'seller_address',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Registered Business Address (seller) is required',
        weight: 8
      },
      {
        field: 'invoice_word_present',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'Word "Invoice" or "Billing Invoice" must be printed/stamped clearly',
        weight: 7
      },
      {
        field: 'transaction_date',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          const date = new Date(value)
          return !isNaN(date.getTime())
        },
        errorMessage: 'Date of Transaction is required',
        weight: 9
      },
      {
        field: 'buyer_registered_name',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Buyer\'s Registered Name is required',
        weight: 8
      },
      {
        field: 'buyer_address',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Buyer\'s Address is required',
        weight: 6
      },
      {
        field: 'buyer_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          // TIN format validation (allow labels)
          const cleanTin = value.replace(/\s*\(.*?\)\s*/g, '').replace(/\s/g, '') // Remove labels and spaces
          const tinPattern = /^(\d{3}-\d{3}-\d{3}-\d{3}|\d{9,12})$/
          return tinPattern.test(cleanTin)
        },
        errorMessage: 'Buyer\'s TIN is required',
        weight: 8
      },
      {
        field: 'serial_number',
        required: true,
        validator: (value: string | null) => value !== null && value.trim().length > 0,
        errorMessage: 'Serial Number (unique, sequential, and printed clearly) is required',
        weight: 9
      },
      {
        field: 'total_amount',
        required: true,
        validator: (value: number | null) => value !== null && value > 0,
        errorMessage: 'Total Amount of Sale (gross amount) is required',
        weight: 10
      },
      // Document Control Info (Mandatory)
      {
        field: 'document_control_type',
        required: true,
        validator: (value: string | null) => value === 'manual' || value === 'system',
        errorMessage: 'Document Control Info (ATP/OCN for manual, PTU/ACCN for system-generated) is required',
        weight: 10
      },
      // VAT Registration Status (Must be specified)
      {
        field: 'vat_registration_status',
        required: true,
        validator: (value: string | null) => value === 'vat_registered' || value === 'non_vat_registered',
        errorMessage: 'VAT Registration Status must be specified (VAT-registered or Non-VAT registered)',
        weight: 10
      }
    ]
  },
  'vat_registered_bir_compliance': {
    name: 'VAT-Registered BIR Compliance',
    description: 'BIR compliance for VAT-registered businesses',
    minimumScore: 90,
    rules: [
      // All general requirements plus VAT-specific requirements
      {
        field: 'vat_registration_status',
        required: true,
        validator: (value: string | null) => value === 'vat_registered',
        errorMessage: 'Must be VAT-registered for this validation',
        weight: 10
      },
      {
        field: 'vat_exempt_statement',
        required: true,
        validator: (value: boolean) => value === true,
        errorMessage: 'Must state "EXEMPT" on the face of the invoice for VAT-registered businesses',
        weight: 9
      },
      {
        field: 'sales_subject_to_percentage_tax',
        required: false, // Only if subject to Percentage Tax
        validator: (value: number | null) => value === null || value >= 0,
        errorMessage: 'Sales Subject to Percentage Tax (SSPT) must be valid if applicable',
        weight: 6
      },
      {
        field: 'exempt_sales',
        required: false, // Only if applicable
        validator: (value: number | null) => value === null || value >= 0,
        errorMessage: 'Exempt Sales must be valid if applicable',
        weight: 6
      }
    ]
  },
  'non_vat_registered_bir_compliance': {
    name: 'Non-VAT Registered BIR Compliance',
    description: 'BIR compliance for Non-VAT registered businesses',
    minimumScore: 90,
    rules: [
      // All general requirements plus Non-VAT specific requirements
      {
        field: 'vat_registration_status',
        required: true,
        validator: (value: string | null) => value === 'non_vat_registered',
        errorMessage: 'Must be Non-VAT registered for this validation',
        weight: 10
      },
      {
        field: 'vat_amount',
        required: true,
        validator: (value: number | null) => value !== null && value >= 0,
        errorMessage: 'VAT amount must be shown as a separate line item for Non-VAT registered businesses',
        weight: 9
      },
      {
        field: 'vatable_sales',
        required: false, // Only if applicable
        validator: (value: number | null) => value === null || value >= 0,
        errorMessage: 'VATable Sales must be valid if applicable',
        weight: 7
      },
      {
        field: 'zero_rated_sales',
        required: false, // Only if applicable
        validator: (value: number | null) => value === null || value >= 0,
        errorMessage: 'Zero-Rated Sales must be valid if applicable',
        weight: 6
      },
      {
        field: 'vat_exempt_sales',
        required: false, // Only if applicable
        validator: (value: number | null) => value === null || value >= 0,
        errorMessage: 'VAT-Exempt Sales must be valid if applicable',
        weight: 6
      }
    ]
  },
  'government_bir_compliance': {
    name: 'Government BIR Compliance',
    description: 'Strict BIR compliance for government transactions',
    minimumScore: 95, // Highest standard for government
    rules: [
      // All official BIR requirements with stricter validation for government
      {
        field: 'serial_number',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          // Government invoices should have specific serial number format
          return value.trim().length >= 8 && /^[A-Z0-9-]+$/.test(value)
        },
        errorMessage: 'Government invoice serial number must be at least 8 characters with proper format',
        weight: 10
      },
      {
        field: 'document_control_type',
        required: true,
        validator: (value: string | null) => value === 'system', // Government prefers system-generated
        errorMessage: 'Government transactions should use system-generated invoices (PTU/ACCN)',
        weight: 10
      },
      {
        field: 'buyer_tin',
        required: true,
        validator: (value: string | null) => {
          if (!value) return false
          // Government TIN validation (stricter)
          const tinPattern = /^\d{3}-\d{3}-\d{3}-\d{3}$/
          return tinPattern.test(value.replace(/\s/g, ''))
        },
        errorMessage: 'Government buyer TIN must be in exact XXX-XXX-XXX-XXX format',
        weight: 10
      }
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

    // BIR Business Rules Validation
    const businessRuleValidations = await performBIRBusinessRuleValidations(validatedData)
    errors.push(...businessRuleValidations.errors)
    warnings.push(...businessRuleValidations.warnings)

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
 * Validates line items completeness (BIR Official Requirements)
 */
function validateLineItemsCompleteness(lineItems: any[]): {
  totalItems: number
  completeItems: number
  incompleteItems: { index: number; missingFields: string[] }[]
} {
  // BIR Official Required Fields for Line Items
  const requiredFields = ['quantity', 'unit_cost', 'description', 'line_total']
  let completeItems = 0
  const incompleteItems: { index: number; missingFields: string[] }[] = []

  lineItems.forEach((item, index) => {
    const missingFields: string[] = []
    
    for (const field of requiredFields) {
      if (field === 'quantity' || field === 'unit_cost' || field === 'line_total') {
        // Numeric fields must be present and greater than 0
        if (!item[field] || item[field] <= 0) {
          missingFields.push(field)
        }
      } else if (field === 'description') {
        // Description must be present and non-empty
        if (!item[field] || (typeof item[field] === 'string' && item[field].trim().length === 0)) {
          missingFields.push(field)
        }
      }
    }

    // Validate calculation accuracy
    if (item.quantity && item.unit_cost && item.line_total) {
      const expectedTotal = item.quantity * item.unit_cost
      if (Math.abs(item.line_total - expectedTotal) > 0.01) {
        missingFields.push('accurate_calculation')
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
 * Performs BIR Business Rules Validation
 */
async function performBIRBusinessRuleValidations(data: BIRInvoiceData): Promise<{
  errors: BIRComplianceError[]
  warnings: BIRComplianceWarning[]
}> {
  const errors: BIRComplianceError[] = []
  const warnings: BIRComplianceWarning[] = []

  // Business Rule: Invoice must have General Requirements + VAT fields OR General Requirements + Non-VAT fields
  if (data.vat_registration_status) {
    if (data.vat_registration_status === 'vat_registered') {
      // VAT-registered business validation
      if (!data.vat_exempt_statement) {
        errors.push({
          field: 'vat_exempt_statement',
          message: 'VAT-registered invoices must state "EXEMPT" on the face of the invoice',
          severity: 'critical',
          birRequirement: 'BIR requires EXEMPT statement for VAT-registered businesses'
        })
      }
      
      // Check for Non-VAT fields (should not be present)
      if (data.vat_amount && data.vat_amount > 0) {
        errors.push({
          field: 'vat_amount',
          message: 'VAT-registered invoices cannot show VAT amount as separate line item',
          severity: 'critical',
          birRequirement: 'Invoice cannot have both VAT & Non-VAT fields'
        })
      }
    } else if (data.vat_registration_status === 'non_vat_registered') {
      // Non-VAT registered business validation
      if (!data.vat_amount && data.vat_amount !== 0) {
        errors.push({
          field: 'vat_amount',
          message: 'Non-VAT registered invoices must show VAT amount as a separate line item',
          severity: 'critical',
          birRequirement: 'BIR requires VAT amount breakdown for Non-VAT registered businesses'
        })
      }
      
      // Check for VAT-registered fields (should not be present)
      if (data.vat_exempt_statement) {
        errors.push({
          field: 'vat_exempt_statement',
          message: 'Non-VAT registered invoices should not have EXEMPT statement',
          severity: 'critical',
          birRequirement: 'Invoice cannot have both VAT & Non-VAT fields'
        })
      }
    }
  }

  // Business Rule: Document Control is always required
  if (data.document_control_type === 'manual') {
    if (!data.atp_ocn_number) {
      errors.push({
        field: 'atp_ocn_number',
        message: 'Manual invoices must have ATP/OCN number',
        severity: 'critical',
        birRequirement: 'Document Control Info (ATP/OCN) is mandatory for manual invoices'
      })
    }
  } else if (data.document_control_type === 'system') {
    if (!data.ptu_accn_number) {
      errors.push({
        field: 'ptu_accn_number',
        message: 'System-generated invoices must have PTU/ACCN number',
        severity: 'critical',
        birRequirement: 'Document Control Info (PTU/ACCN) is mandatory for system-generated invoices'
      })
    }
  }

  // Business Rule: Line items must have all required fields
  if (data.line_items && data.line_items.length > 0) {
    data.line_items.forEach((item, index) => {
      if (!item.quantity || item.quantity <= 0) {
        errors.push({
          field: `line_items[${index}].quantity`,
          message: `Line item ${index + 1}: Quantity of goods/services is required and must be greater than 0`,
          severity: 'critical',
          birRequirement: 'BIR requires quantity for all line items'
        })
      }
      
      if (!item.unit_cost || item.unit_cost <= 0) {
        errors.push({
          field: `line_items[${index}].unit_cost`,
          message: `Line item ${index + 1}: Unit Cost is required and must be greater than 0`,
          severity: 'critical',
          birRequirement: 'BIR requires unit cost for all line items'
        })
      }
      
      if (!item.description || item.description.trim().length === 0) {
        errors.push({
          field: `line_items[${index}].description`,
          message: `Line item ${index + 1}: Description/Nature of Goods or Services is required`,
          severity: 'critical',
          birRequirement: 'BIR requires description for all line items'
        })
      }
      
      // Validate calculation
      const expectedTotal = item.quantity * item.unit_cost
      if (Math.abs(item.line_total - expectedTotal) > 0.01) {
        warnings.push({
          field: `line_items[${index}].line_total`,
          message: `Line item ${index + 1}: Line total calculation mismatch (Expected: ${expectedTotal}, Actual: ${item.line_total})`,
          suggestion: 'Verify line total calculation: quantity × unit_cost',
          birGuideline: 'Accurate calculations are required for BIR compliance'
        })
      }
    })
  } else {
    errors.push({
      field: 'line_items',
      message: 'At least one line item with quantity, unit cost, and description is required',
      severity: 'critical',
      birRequirement: 'BIR requires detailed line items for all invoices'
    })
  }

  return { errors, warnings }
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

  // TIN format validation (Seller)
  if (data.seller_tin) {
    const cleanTin = data.seller_tin.replace(/\s|-/g, '')
    if (cleanTin.length < 9 || cleanTin.length > 12) {
      warnings.push({
        field: 'seller_tin',
        message: 'Seller TIN length may not comply with BIR standards',
        suggestion: 'Verify TIN format with BIR guidelines',
        birGuideline: 'TIN should be 9-12 digits in XXX-XXX-XXX-XXX format with Branch Code'
      })
    }
    
    // Check for VAT/Non-VAT label requirement
    if (data.vat_registration_status === 'vat_registered' && !data.seller_tin.includes('VAT')) {
      warnings.push({
        field: 'seller_tin',
        message: 'VAT-registered seller should have VAT label with TIN',
        suggestion: 'Include VAT registration indicator with TIN',
        birGuideline: 'TIN should include VAT or Non-VAT label as applicable'
      })
    } else if (data.vat_registration_status === 'non_vat_registered' && !data.seller_tin.includes('Non-VAT')) {
      warnings.push({
        field: 'seller_tin',
        message: 'Non-VAT registered seller should have Non-VAT label with TIN',
        suggestion: 'Include Non-VAT registration indicator with TIN',
        birGuideline: 'TIN should include VAT or Non-VAT label as applicable'
      })
    }
  }

  // TIN format validation (Buyer)
  if (data.buyer_tin) {
    const cleanTin = data.buyer_tin.replace(/\s|-/g, '')
    if (cleanTin.length < 9 || cleanTin.length > 12) {
      warnings.push({
        field: 'buyer_tin',
        message: 'Buyer TIN length may not comply with BIR standards',
        suggestion: 'Verify TIN format with BIR guidelines',
        birGuideline: 'TIN should be 9-12 digits in XXX-XXX-XXX-XXX format'
      })
    }
  }

  // Date validation (Transaction Date)
  if (data.transaction_date) {
    const transactionDate = new Date(data.transaction_date)
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    
    if (transactionDate > today) {
      errors.push({
        field: 'transaction_date',
        message: 'Transaction date cannot be in the future',
        severity: 'critical',
        birRequirement: 'BIR requires valid historical transaction dates'
      })
    } else if (transactionDate < oneYearAgo) {
      warnings.push({
        field: 'transaction_date',
        message: 'Transaction date is more than one year old',
        suggestion: 'Verify if this is a current transaction',
        birGuideline: 'Old invoices may require additional BIR documentation'
      })
    }
  }

  // Amount validation
  if (data.total_amount && data.total_amount > 1000000) {
    warnings.push({
      field: 'total_amount',
      message: 'High-value transaction detected (over ₱1M)',
      suggestion: 'Ensure proper documentation for large transactions',
      birGuideline: 'Large transactions may require additional BIR reporting and documentation'
    })
  }

  // Serial Number validation
  if (data.serial_number) {
    // Check for sequential pattern (basic validation)
    if (!/\d/.test(data.serial_number)) {
      warnings.push({
        field: 'serial_number',
        message: 'Serial number should contain numeric sequence',
        suggestion: 'Ensure serial number follows sequential numbering system',
        birGuideline: 'Serial numbers must be unique and sequential'
      })
    }
  }

  // VAT calculation validation for Non-VAT registered
  if (data.vat_registration_status === 'non_vat_registered' && data.vatable_sales && data.vat_amount) {
    const expectedVat = Math.round(data.vatable_sales * 0.12 * 100) / 100
    const actualVat = data.vat_amount
    const tolerance = 1.0 // ₱1 tolerance
    
    if (Math.abs(expectedVat - actualVat) > tolerance) {
      warnings.push({
        field: 'vat_amount',
        message: `VAT calculation mismatch. Expected: ₱${expectedVat}, Actual: ₱${actualVat}`,
        suggestion: 'Verify VAT calculation: vatable_sales × 12%',
        birGuideline: 'Accurate VAT calculations are required for BIR compliance'
      })
    }
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
    return `✅ BIR COMPLIANT (${score}% complete) - Meets official BIR requirements using ${ruleSetName} standards. ${warningCount > 0 ? `${warningCount} recommendations for optimization.` : 'Fully compliant with all BIR regulations.'}`
  } else {
    const complianceLevel = score >= 80 ? 'Nearly Compliant' : score >= 60 ? 'Partially Compliant' : 'Non-Compliant'
    return `❌ BIR ${complianceLevel.toUpperCase()} - ${errorCount} critical violations and ${warningCount} warnings (${score}% complete, minimum required: ${minimumScore}%) using ${ruleSetName} standards. Review General Requirements, Document Control, and VAT/Non-VAT compliance.`
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