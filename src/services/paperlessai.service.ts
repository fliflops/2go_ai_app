import axios from "axios";
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

// 1. Create the Cookie Jar
const jar = new CookieJar();

// // 2. Create and wrap the Axios instance
// // The wrapper adds logic to handle the jar automatically
// const client = wrapper(axios.create({
//     baseURL: process.env.PAPERLESSAI_URL,
//     // Pass the jar instance to the Axios config
//     jar: jar, 
    
//     // IMPORTANT: You must set withCredentials to true to enable cookie sending
//     withCredentials: true, 
// }));

// export const getCookies = async() => {

//     await client.post('/login',{
//         username:process.env.PAPERLESSAI_USER,
//         password:process.env.PAPERLESSAI_PASSWORD
//     })

//     const cookie = await jar.getCookies(`${process.env.PAPERLESSAI_URL}/api/rag/status`)   
//     return cookie.map(c => c.toString())
  
// }


export const sendMessage = async({
    message=''
}: {message:string}) => {
    // 2. Create and wrap the Axios instance
    // The wrapper adds logic to handle the jar automatically
    const client = wrapper(axios.create({
        baseURL: process.env.PAPERLESSAI_URL,
        // Pass the jar instance to the Axios config
        jar: jar, 
        
        // IMPORTANT: You must set withCredentials to true to enable cookie sending
        withCredentials: true, 
    }));

    await client.post('/login', {
        username:process.env.PAPERLESSAI_USER,
        password:process.env.PAPERLESSAI_PASSWORD
    })

    const response = await client.post('/api/rag/ask',{
        question: message,
        useAI: true
    },
    {
        headers:{
            'Content-Type': 'application/json'
        }
       
    })

    return response.data
}


export const contractValidationPrompt = (invoice:string) => {
    const message = `# Invoice Validation Prompt
Validate invoice ${invoice} details against vendor contract retrieved from RAG system.

## Input
Provide one or more of the following:
- \`ocr_id\`: Paperless-ngx document ID (will fetch invoice_data automatically)
- \`invoice_data\`: Structured JSON from OCR (optional if ocr_id provided)
- \`contract_context\`: Contract excerpts from RAG (optional, will be retrieved if not provided)

## Tasks
1. Verify vendor authorization and contract period
2. Validate pricing against contract rates
3. Check line item quantities and calculations
4. Recalculate subtotal, VAT, and total amounts

## Output JSON
\`\`\`json
{
    "ocr_id": "string",
    "validation_timestamp": "ISO 8601",
    "contract_compliant": boolean,
    "overall_status": "APPROVED" | "REJECTED" | "REQUIRES_REVIEW",
    "overall_amount_validation": "APPROVED" | "REJECTED",
    "confidence_score": number,
    "vendor_validation": {
        "vendor_authorized": boolean,
        "contract_active": boolean,
        "contract_reference": "string or null"
    },
    "date_validation": {
        "within_contract_period": boolean,
        "due_date_compliant": boolean
    },
    "amount_validation": {
        "subtotal_correct": boolean,
        "subtotal_invoice": number or null,
        "subtotal_calculated": number or null,
        "subtotal_variance": number or null,
        "vat_correct": boolean,
        "vat_calculated": number or null,
        "vat_variance": number or null,
        "total_correct": boolean,
        "total_invoice": number or null,
        "total_calculated": number or null,
        "total_variance": number or null
    },
    "line_items_validation": [
        {
            "line_number": number,
            "description": "string",
            "quantity_invoice": number,
            "unit_price_invoice": number,
            "line_total_invoice": number,
            "contract_unit_price": number or null,
            "contract_rate_compliant": boolean,
            "price_variance_percentage": number or null,
            "quantity_within_limits": boolean,
            "line_total_correct": boolean,
            "line_total_calculated": number,
            "item_authorized": boolean,
            "item_status": "APPROVED" | "REJECTED" | "REQUIRES_REVIEW",
            "issues": ["string"]
        }
    ],
    "compliance_issues": [
        {
            "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
            "category": "PRICING" | "QUANTITY" | "AUTHORIZATION" | "CALCULATION" | "DATE" | "OTHER",
            "description": "string",
            "expected_value": "string or null",
            "actual_value": "string or null"
        }
    ],
    "financial_summary": {
        "compliant_items_count": number,
        "non_compliant_items_count": number,
        "total_variance_amount": number,
        "approved_amount": number or null,
        "disputed_amount": number or null
    },
    "recommendations": {
        "action_required": "APPROVED" | "REJECT" | "REQUEST_CLARIFICATION" | "ADJUST_AMOUNT",
        "suggested_adjustment": number or null,
        "next_steps": ["string"]
    }
}
\`\`\`

## Validation Rules
- Unit price tolerance: ±2%
- Quantity limit: ≤110% of contract
- VAT rate: 12% (Philippine standard) or contract-specified
- Round to 2 decimal places

## Status Logic
- **overall_amount_validation**: "APPROVED" if all amount_validation fields are correct AND all line_items have line_total_correct = true and contract_rate_compliant = true; otherwise "REJECTED"
- **overall_status**: 
  - "APPROVED" if all validations pass
  - "REJECTED" if any CRITICAL issues exist
  - "REQUIRES_REVIEW" if MEDIUM/LOW issues or confidence < 0.7

Calculate confidence_score (0-1) based on contract match quality and data completeness.`;

        return message
}