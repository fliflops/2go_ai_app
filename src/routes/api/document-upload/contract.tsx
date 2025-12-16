import { createFileRoute } from '@tanstack/react-router'
import {json} from '@tanstack/react-start';
import { writeFile } from 'node:fs/promises';
import {getDocument, pollUntilCondition, postDocument} from '@/services/paperless.service';
import path from 'path';

export const Route = createFileRoute('/api/document-upload/contract')({
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
                        title: `CONTRACT_${filename}`
                    });

                    const uploadInfo = await pollUntilCondition({uploadId,  maxAttempts: 50})
                    const data = await getDocument(uploadInfo[0].related_document)
                    
                    if(uploadInfo[0]?.status === 'FAILURE'){
                        throw new Error(uploadInfo[0]?.result)
                    }

                     return json({
                        success:true,
                        status: uploadInfo[0]?.status,
                        result: uploadInfo[0]?.result,
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


