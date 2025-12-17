import { contractValidationPrompt, sendMessage } from '@/services/paperlessai.service';
import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { formatTextToJson } from '@/utils/textFormatter';
import { getInvoice, updateInvoice, updateInvoiceById } from '@/services/invoice.service';
//import { getDocument } from '@/services/paperless.service';
import { invoice_tbl, InvoiceParams } from '@/db/ai_db_schema/schema';
import { eq } from 'drizzle-orm';
import { InvoiceData, validateInvoiceData } from '@/services/document-validation.service';
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
                    birValidationStatus: invoice.birValidationStatus,
                    contractValidationStatus: invoice.contractValidationStatus,
                    amountValidationStatus: invoice.amountValidationStatus   
                }

                if(statusForValidation.includes(invoice.attachmentValidationStatus as string) || statusForValidation.includes(invoice.birValidationStatus as string)){
                    const documentValidationResult = await validateInvoiceData(
                        invoice.parsedData,
                        'bir_invoice'
                    );

                    const documentValidationStatus = documentValidationResult.isValid ? 'success' : 'failed';

                    await updateInvoiceById({
                        id,
                        data: {
                            attachmentValidationStatus: documentValidationStatus
                        }
                    });

                    // if (!documentValidationResult.isValid){
                    //     return;
                    // }

                    const birComplianceResult = await validateBIRCompliance(
                        invoice.parsedData,
                        'official_bir_compliance'
                    );

                    const birComplianceStatus = birComplianceResult.isCompliant ? 'success' : 'failed';

                    await updateInvoiceById({
                        id,
                        data: {
                            birValidationStatus: birComplianceStatus
                        }
                    });

                    // if (!documentValidationResult.isValid){
                    //     return;
                    // }
                    
                //     const paperlessDoc = await getDocument(String(invoice.ocr_id));
                //     const openAiPrompt = invoiceExtractionPrompt(paperlessDoc.content);
                //     const openAiOutput = await chatResponse({
                //         instructions:'Philippine Invoice Data Extraction Specialist',
                //         input: openAiPrompt
                //     })
                //     const openAiOutputParse = formatTextToJson(openAiOutput.output_text)

                //     parsedData = {
                //         ...parsedData,
                //         ...openAiOutputParse
                //     }

                //     validationStatus={
                //         ...validationStatus,
                //         attachmentValidationStatus: 'pending',
                //         birValidationStatus: 'pending'  
                //     }
                }


                if(statusForValidation.includes(invoice.contractValidationStatus as string) || statusForValidation.includes(invoice.amountValidationStatus as string)){
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
                        contractValidationStatus: aiOutput.recommendations.action_required === 'APPROVED' ? 'success' : 'failed',
                        amountValidationStatus: aiOutput.overall_amount_validation === 'APPROVED' ? 'success': 'failed'
                    }

                    await updateInvoice({
                        data: {
                            parsedData,
                            contractValidationStatus: validationStatus.contractValidationStatus as string,
                            amountValidationStatus: validationStatus.amountValidationStatus as string
                        },
                        where:{
                            id
                        }
                    })
                }   

                return json({
                    success:true,
                    validationStatus,
                    parsedData
                });

                // const validationStatus = aiOutput.recommendations.action_required === 'APPROVED' ? 'Success' : 'Failed'
            
                // //check for response
                // await updateInvoiceTransaction({
                //     where:{
                //         id
                //     },
                //     data:{
                //         validationDetails: aiOutput,
                //         contractValidationStatus: validationStatus
                //     }
                // })

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

