import { createFileRoute } from '@tanstack/react-router'
import {json} from '@tanstack/react-start';
import { writeFile } from 'node:fs/promises';
import { getDocument, pollUntilCondition, postDocument} from '@/services/paperless.service';
import path from 'path';
import { chatResponse, invoiceExtractionPrompt } from '@/services/openai.service';
import { convertToJsonFormat } from '@/utils/textFormatter';
import {createInvoice } from '@/services/invoice.service';

export const Route = createFileRoute('/api/document-upload/invoice')({
    server:{
        handlers:{
            POST: async({request}) => {
                try{

                    const formData = await request.formData();
                    const file = formData.get('file') as File |null;
                    
                    if (!file) {
                    return new Response('No file uploaded', { status: 400 })
                    }
    
                    const buffer = Buffer.from(await file.arrayBuffer())
                    const filename = `${Date.now()}-${file.name}`
                    const pathFile = path.join(process.cwd(), 'temp/uploads', filename)
                            
                    await writeFile(pathFile, buffer);
    
                    const uploadId = await postDocument(pathFile,{
                        title: `INVOICE_${filename}`
                    });

                    //poll the upload data
                    const uploadInfo = await pollUntilCondition({uploadId, maxAttempts: 50})

                    if(uploadInfo[0]?.status === 'FAILURE'){
                        throw new Error(uploadInfo[0]?.result)
                    }

                    //fetch the document after the polling of document upload
                    const data = await getDocument(uploadInfo[0].related_document)

                    //start LLM Data extraction
                    const aiResponse = await chatResponse({
                        instructions: 'Philippine Invoice Data Extraction Specialist',
                        input: invoiceExtractionPrompt(data.content)
                    })

                    const aiOutput = convertToJsonFormat(aiResponse.output_text)

                    //save to database
                    await createInvoice({
                        ocr_id: Number(uploadInfo[0].related_document) as number,
                        invoiceType: aiOutput.parsed.invoice_type as string,
                        invoiceNumber: aiOutput.parsed.invoice_number as string,
                        invoiceDate: aiOutput.parsed.invoice_date as string,
                        vendorName: aiOutput.parsed.vendor_name as string,
                        vendorTin: aiOutput.parsed.vendor_tin as string,
                        customerName: aiOutput.parsed.customer_name as string,
                        customerTin: aiOutput.parsed.customer_tin as string,
                        totalAmount: aiOutput.parsed.total_amount as string,
                        currency: aiOutput.parsed.currency as string,
                        vatAmount: aiOutput.parsed.vat_amount as string,
                        parsedData: aiOutput.parsed,
                        signaturePresent: aiOutput.parsed.signature_present,
                        birAtp: aiOutput.parsed.bir_atp,
                        attachmentValidationStatus: 'pending',
                        birValidationStatus: 'pending',
                        amountValidationStatus: 'pending'
                    })
                    
                    return json({
                        success:true,
                        status: uploadInfo[0]?.status,
                        result: uploadInfo[0]?.result,
                        ai_output: aiOutput,
                        data
                    })

                }
                catch(error:any){
                    return json({
					success: false,
					message: error.message,
				}, 
				{ status: 500 });
                }
            }
        }
    }
})


