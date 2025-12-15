import OpenAI from 'openai';

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY    
})

export const invoiceExtractionPrompt = (invoice: string) => {
    return ` Extract structured data from Philippine sales invoices (goods/products or services) into JSON format following BIR requirements.
			 
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
			 
			### BIR Compliance

			**signature_present**: \`true\` if handwritten/printed/digital signature exists; \`false\` if none

			**bir_atp**: \`true\` if BOTH "BIR Permit to Print No." AND "Date Issued" are present (usually at bottom); \`false\` otherwise
			 
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

			  "net_amount": number or null,

			  "vat_amount": number or null,

			  "currency": "string or null",

			  "invoice_type": "string or null",

			  "vat_status": "string or null",

			  "signature_present": boolean,

			  "bir_atp": boolean

			}
			 
			## Invoice Document

			${invoice}
			`
}

export const chatResponse = async({instructions, input}: {instructions:string, input:string} ) => {
    const response = await openai.responses.create({
        model: 'gpt-4o-mini',
        instructions,
        input,  
    })

    return response
}