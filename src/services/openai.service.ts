import OpenAI from 'openai';

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY    
})

export const invoiceExtractionPrompt = (invoice: string) => {
   return `Extract structured data from Philippine sales invoices into JSON format following BIR requirements.

## Context
- **Tax**: VAT at 12%, VAT-exempt, zero-rated, or non-VAT
- **Currency**: PHP (₱) default. ISO codes: PHP, USD, EUR
- **TIN Format**: XXX-XXX-XXX-XXX or XXXXXXXXX
- **Date Format**: Convert to YYYY-MM-DD

## Field Extraction Rules

### Vendor (Seller)
**vendor_name**: Legal/business name with suffixes (Inc., Corp., OPC, etc.)
**vendor_address**: "Unit/Floor/Building, Street, Barangay, City, Province ZIP"
**vendor_tin**: Tax ID with/without dashes
**vendor_business_style**: Line of business (e.g., "Retail & Services")

### Customer (Buyer)
**customer_name**: From "Sold to:", "Billed to:", "Customer:"
**customer_address**: Same format as vendor
**customer_tin**: Buyer's tax ID

### Invoice Details
**invoice_number**: From "Invoice No.:", "SI No.:", "OR No.:"
**invoice_date**: Issue date in YYYY-MM-DD
**due_date**: From "Due Date:" or calculate from terms (Net 30 = +30 days, Upon receipt = invoice_date)

### Financial Fields
**total_amount**: Final payable amount (numeric, no symbols/commas)
**subtotal**: Sum of line_items before tax
**vatable_sales**: Amount subject to 12% VAT (= subtotal for VATable)
**vat_amount**: 12% VAT (= vatable_sales × 0.12). Use 0 for exempt/zero-rated
**vat_exempt_sales**: Amount for VAT-exempt transactions
**zero_rated_sales**: Amount for zero-rated transactions
**percentage_tax_sales**: Amount subject to percentage tax (non-VAT)
**net_amount**: If shown separately; otherwise null
**currency**: "PHP", "USD", "EUR", etc.

### Line Items
Extract all products/services as:
\`\`\`json
{
  "description": "Product/service name with details",
  "quantity": number (default 1 if missing),
  "unit_price": number (per unit price),
  "line_total": number (quantity × unit_price)
}
\`\`\`

**Goods**: Include specs, model, SKU. Quantity in pcs, kg, liters, etc.
**Services**: Include period/scope. Quantity in hours, days, months, or 1 for fixed-price.
**Discounts**: Use negative line_total

### Classification
**invoice_type**: "goods", "services", or "mixed"
**vat_status**: "vatable", "vat_exempt", "zero_rated", or "non_vat"

### BIR Compliance Fields
**has_invoice_word**: \`true\` if "Invoice" or "Billing Invoice" appears on document
**has_serial_number**: \`true\` if invoice has unique serial/reference number
**serial_number**: Serial number if present
**has_qty_unit_desc**: \`true\` if line items show quantity, unit price, and description
**has_vat_label**: \`true\` if "VAT" or "Non-VAT" label appears near vendor TIN
**has_exempt_label**: \`true\` if "EXEMPT" is printed on invoice face (for exempt transactions)
**has_sales_breakdown**: \`true\` if VAT/exempt/zero-rated sales shown separately when applicable
**document_control_type**: "ATP" (Authority to Print), "PTU" (Permit to Use), "OCN" (Official Control Number), "ACCN" (Accounting Control Number/BIR Acknowledgement Certificate Number), or null
**document_control_number**: Certificate/Control number if present
**document_control_date**: Effectivity date/Date issued (YYYY-MM-DD) if shown
**signature_present**: \`true\` if handwritten/printed/digital signature exists

### Attachment Validation
**form_2307_attached**: \`true\` if BIR Form 2307 (Certificate of Creditable Tax Withheld at Source) is present in the document text
**form_2307_consistent**: \`true\` if Form 2307 data matches invoice (vendor TIN, amounts, date within range); \`false\` if mismatched; \`null\` if form not present

## VAT Calculation
- **VAT-Inclusive**: vatable_sales = total_amount / 1.12, vat_amount = vatable_sales × 0.12
- **VAT-Exclusive**: vatable_sales = subtotal, total_amount = vatable_sales + vat_amount
- **Exempt/Zero-rated**: vat_amount = 0

## Missing Data
- Use \`null\` for missing fields (not "", not 0 unless explicitly zero)
- Booleans: only \`true\` or \`false\`

## Validation
- ✓ vatable_sales × 1.12 ≈ total_amount (±1)
- ✓ vatable_sales × 0.12 ≈ vat_amount (±0.5)
- ✓ Sum of line_items ≈ subtotal (±1)
- ✓ Dates in YYYY-MM-DD
- ✓ Numbers without symbols/commas
- ✓ Valid JSON syntax

## Output Format
Return ONLY this JSON (no markdown, no explanations):

{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "vendor_name": "string or null",
  "vendor_address": "string or null",
  "vendor_tin": "string or null",
  "vendor_business_style": "string or null",
  "customer_name": "string or null",
  "customer_address": "string or null",
  "customer_tin": "string or null",
  "total_amount": number or null,
  "due_date": "YYYY-MM-DD or null",
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "line_total": number
    }
  ],
  "subtotal": number or null,
  "vatable_sales": number or null,
  "vat_exempt_sales": number or null,
  "zero_rated_sales": number or null,
  "percentage_tax_sales": number or null,
  "net_amount": number or null,
  "vat_amount": number or null,
  "currency": "string or null",
  "invoice_type": "string or null",
  "vat_status": "string or null",
  "has_invoice_word": boolean,
  "has_serial_number": boolean,
  "serial_number": "string or null",
  "has_qty_unit_desc": boolean,
  "has_vat_label": boolean,
  "has_exempt_label": boolean,
  "has_sales_breakdown": boolean,
  "document_control_type": "string or null",
  "document_control_number": "string or null",
  "document_control_date": "YYYY-MM-DD or null",
  "signature_present": boolean,
  "form_2307_attached": boolean,
  "form_2307_consistent": boolean or null,
  "bir_compliance": [
    {
      "field": "vendor_name",
      "value": "string or null"
    },
    {
      "field": "vendor_tin",
      "value": "string or null"
    },
    {
      "field": "vendor_address",
      "value": "string or null"
    },
    {
      "field": "has_invoice_word",
      "value": boolean
    },
    {
      "field": "invoice_date",
      "value": "YYYY-MM-DD or null"
    },
    {
      "field": "customer_name",
      "value": "string or null"
    },
    {
      "field": "customer_address",
      "value": "string or null"
    },
    {
      "field": "customer_tin",
      "value": "string or null"
    },
    {
      "field": "has_serial_number",
      "value": boolean
    },
    {
      "field": "serial_number",
      "value": "string or null"
    },
    {
      "field": "subtotal",
      "value": number or null
    },
    {
      "field": "document_control_type",
      "value": "string or null"
    },
    {
      "field": "document_control_number",
      "value": "string or null"
    },
    {
      "field": "has_vat_label",
      "value": boolean
    }
  ]
}

**Important**: The \`bir_compliance\` array must contain copies of the specified fields with their exact values from the main JSON object. Each compliance field should have the same value as its corresponding field in the root level.

## Invoice Document

[PASTE INVOICE TEXT HERE]

${invoice}`;
}

export const chatResponse = async({instructions, input}: {instructions:string, input:string} ) => {
    const response = await openai.responses.create({
        model: 'gpt-4o-mini',
        instructions,
        input,  
    })

    return response
}