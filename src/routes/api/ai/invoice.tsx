import { createFileRoute } from '@tanstack/react-router'
import {invoiceExtractionPrompt, openai} from '@/services/openai.service';
import {json} from '@tanstack/react-start';


export const Route = createFileRoute('/api/ai/invoice')({
    server:{
        handlers:{
            POST: async({request})=> {
                try{
                    const { message } = await request.json();

                    const getExtractPrompt = invoiceExtractionPrompt(message) as string;

                    const response = await openai.responses.create({
                        model: 'gpt-4o-mini',
                        instructions: 'Philippine Invoice Data Extraction Specialist',
                        input: getExtractPrompt,
                    })

                    return json({
                        data:response.output
                    })
                }
                catch(error:any){
                    return json({
                        success: false,
                        error: error.message,
                    },
                    {
                        status: 500
                    })
                }
            }
        }
    }
})
