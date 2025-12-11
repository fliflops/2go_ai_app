import { JsonViewer } from '@/components/JsonViewer';
import ScrollContent from '@/components/ScrollContent';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router'
import React from 'react'


export const Route = createFileRoute('/document-upload2/_invoice/$doc_id')({
  component: RouteComponent,
})

const validateInvoice = async (message:string) => {
	const response = await fetch(`/api/ai`,{
		method: 'POST',
		body: message
	})

	return response.json();
}

const getInvoice = async(doc_id:string) => {
const response = await fetch(`/api/invoice/${doc_id}`)

    return response.json();
}


function RouteComponent() {
	const {doc_id} = useParams({
		from: '/document-upload/invoice/$doc_id'
	})

	const {data:document, isLoading} = useQuery({
		queryKey: ['document',doc_id],
		queryFn: async() => await getInvoice(doc_id),
	}) 

	const [jsonData, setJsonData] = React.useState<{} | null>(null)

	const {mutate, isPending} = useMutation({
		mutationFn: async(invoice: string) => {

			const prompt = `
			# Philippine Invoice Data Extraction Specialist
			 
			Extract structured data from Philippine sales invoices (goods/products or services) into JSON format following BIR requirements.
			 
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

			const res = await validateInvoice(prompt);
			if (!res.ok) {
        		throw new Error(`Upload failed: ${res.statusText}`)
      		}
		},
		onSuccess:(data) => {
			console.log(data)
			
		},
		onError: (error: Error) => {
			console.log(error)
    	}
	})

	if(isLoading) return <>
		Loading...
	</>

	return (
		<div className='container mx-auto py-10'>
			<div className='flex flex-col gap-2'>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Document Details</h1>
					<p className="text-slate-600 mt-2">
						{document.data.title}
					</p>
				</div>
				<div className='flex gap-1 justify-end'>
					<Button disabled={isPending} onClick={() => mutate(document.data.content)}>Validate Data</Button>
				</div>
				<div className='flex flex-col px-5 gap-5'>
					<div className='flex flex-col gap-1'>
						<p className='text-slate-600'>Validated Content</p>
						<JsonViewer isLoading={isPending} maxHeight='200px' data={!jsonData ? {
							message: 'No Data'
						} : jsonData}/>
					</div>
					
					<div className='flex flex-col gap-1'>
						<p className='text-slate-600'>OCR Content</p>
						<ScrollContent maxHeight='200px' showCopyButton copyText={document.data.content}>
							<div className='space-y-4'>
								<p className="text-sm text-slate-700">{document.data.content}</p>
							</div>
						</ScrollContent>
					</div>
				</div>
			</div>
		</div>
	)
}
 