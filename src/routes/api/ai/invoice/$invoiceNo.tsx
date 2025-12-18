import { contractValidationPrompt, sendMessage } from '@/services/paperlessai.service';
import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { formatTextToJson } from '@/utils/textFormatter';
import { getInvoice, updateInvoice, updateInvoiceById } from '@/services/invoice.service';
//import { getDocument } from '@/services/paperless.service';
import { invoice_tbl, InvoiceParams } from '@/db/ai_db_schema/schema';
import { eq } from 'drizzle-orm';
import { validateInvoiceData } from '@/services/document-validation.service';
import { validateBIRCompliance } from '@/services/bir-compliance.service';
//import { chatResponse, invoiceExtractionPrompt } from '@/services/openai.service';

export const Route = createFileRoute('/api/ai/invoice/$invoiceNo')({
  server:{
    handlers:{
        GET: async({params}) => {
            try{
                const id = params.invoiceNo
                const data = await getInvoice([
                    eq(invoice_tbl.id, id)
                ])

                if(!data) return json({
                    success:false,
                    message: 'Invoice not foud!'
                },
                {
                    status: 400
                });

                return json({
                    success:true,
                    data
                })


            }
            catch(error:any){
                console.log(error)
                return json({
                    success:false,
                    message: error.message
                },
                {
                    status:500
                })
            }
        },
        POST: async ({request})=>{
            try{
                
                const {invoice_no,id} = await request.json();
                const statusForValidation = ['pending','failed']

                const invoice = await getInvoice(
                    [eq(invoice_tbl.id, id)]
                ) as InvoiceParams


                if(!invoice) return json({
                    success:false,
                    message: 'Invalid Invoice'
                },  {
                    status: 400
                })

                let parsedData:any = invoice.parsedData;

                let validationStatus = {
                    attachmentValidationStatus: invoice.attachmentValidationStatus,
                    birValidationStatus:        invoice.birValidationStatus,
                    contractValidationStatus: invoice.contractValidationStatus,
                    amountValidationStatus: invoice.amountValidationStatus   
                }


                if(statusForValidation.includes(invoice.attachmentValidationStatus as string)){
                    const documentValidationResult = await validateInvoiceData(
                        invoice.parsedData,
                        'bir_invoice'
                    );

                    const documentValidationStatus = documentValidationResult.isValid ? 'success' : 'failed';

                     validationStatus = {
                        ...validationStatus,
                        attachmentValidationStatus: documentValidationStatus,
                    }
                }

                if(statusForValidation.includes(invoice.birValidationStatus as string)){
                    const birComplianceResult = await validateBIRCompliance(
                        invoice.parsedData,
                        'official_bir_compliance'
                    );

                    const birComplianceStatus = birComplianceResult.isCompliant ? 'success' : 'failed';

                    validationStatus = {
                        ...validationStatus,
                        birValidationStatus: birComplianceStatus
                    }
                }

                if(statusForValidation.includes(invoice.amountValidationStatus as string)){
                     const generatePrompt = contractValidationPrompt(invoice_no);
                    const chatResponse = await sendMessage({
                        message: generatePrompt
                    })

                    const aiOutput = formatTextToJson(chatResponse.answer)
                    if(!aiOutput) return json({
                            success:false,
                            message: 'AI Process Failed'
                        },
                        {
                            status: 400
                        });

                    parsedData = {
                        ...parsedData,
                        rag_validation:aiOutput
                    }

                    validationStatus = {
                        ...validationStatus,
                        amountValidationStatus: aiOutput.overall_amount_validation === 'APPROVED' ? 'success': 'failed'
                    }
                }

                await updateInvoice({
                    data: {
                        parsedData,
                        amountValidationStatus: validationStatus.amountValidationStatus as string,
                        attachmentValidationStatus: validationStatus.attachmentValidationStatus as string,
                        birValidationStatus: validationStatus.birValidationStatus as string
                    },
                    where:{
                        id
                    }
                })

                return json({
                    success:true,
                    validationStatus,
                    parsedData
                });

            }
            catch(error: any){
                console.log(error)
                return json({
                    success:false,
                    message: error.message
                },
                {
                    status:500
                })
            }
        }
    }
  }
})

