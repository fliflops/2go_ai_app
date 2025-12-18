import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const api = () => axios.create({
    baseURL: process.env.PAPERLESS_URL,
    headers: {
        Authorization: `Token ${process.env.PAPERLESS_TOKEN}`
    }
})

export const postDocument = async(filePath: string, options?: {
    title?: string;
    created?: string;
    correspondent?:string; 
    documentType?:string;
    tags?:string
}) => {
    try{
       
        const form = new FormData();
        form.append('document', fs.createReadStream(filePath));
        if(options?.title) form.append('title', options?.title);
       
        const response = await api().post('/api/documents/post_document/',form,{
            headers:{
                ...form.getHeaders()
            }
        });

        return response.data;

    }
    catch(error: any){
        console.log(error)
        throw new Error(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
}

export const getDocument = async(id: string ) => {
    try{
        const response = await api().get(`/api/documents/${id}/`);
        
        return response.data;
    }
    catch(error: any){
        console.error(error.response?.data)
        throw new Error(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
}

export const getUploadTask = async(uploadId: string) => {
    try{
         const response = await api().get(`/api/tasks/`,{
            params: {
                task_id: uploadId
            }
         });
        
        return response.data;

    }
    catch(error: any){
        console.error(error.response?.data)
        throw new Error(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
}

export const getDocuments = async(filters:{
    page: number;
    limit: number;
    query?: string;
    ordering?: string;
}) => {

    try{
        const response = await api().get(`/api/documents/`,{
            params:{
                page_size: filters.limit,
                page: filters.page,
                ordering: '-created'
            }
        })

        const { results, count } = response.data;
        
        return {
            data: results.map((doc: any) => ({
                id: doc.id,
                title: doc.title,
                created: doc.created,
                modified: doc.modified,
                correspondent: doc.correspondent_name,
                documentType: doc.document_type_name,
                tags: doc.tags,
                archiveSerialNumber: doc.archive_serial_number,
                originalFileName: doc.original_file_name,
            })),
            total: count,
            page:filters.page,
            pageSize: filters.limit,
            pageCount: Math.ceil(count / filters.limit),
      }
    }
    catch(error: any){
        console.error(error.response?.data)
        throw new Error(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
}

export async function pollUntilCondition({
    uploadId,
    intervalMs = 3000, // Default is 3 seconds, but we will override it below
    maxAttempts = 20
}: {
    uploadId: string,
    intervalMs?: number, 
    maxAttempts?:number
})
     {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`Polling attempt: ${attempt} (Next poll in ${intervalMs / 1000} seconds)`);

    try {
        const data = await getUploadTask(uploadId)
        if(data.find((item:any) => !['PENDING','STARTED'].includes(item.status))) return data
      
        await new Promise(resolve => setTimeout(resolve, intervalMs));

    } catch (error) {
      console.error('Polling fetch failed:', error);
      await new Promise(resolve => setTimeout(resolve, intervalMs)); 
    }
  }

  throw new Error(`Polling failed after ${maxAttempts} attempts.`);
}

export const getPDF = async(doc_id: string) => {
    try{
        const response = await api().get(`/api/documents/${doc_id}/download/`,{
            responseType: 'arraybuffer'
        })

        return response.data

    }
    catch(error: any) {
        const errorMessage = axios.isAxiosError(error)  ? error.response?.data?.detail || error.message
        : 'Failed to fetch PDF';
        console.error(errorMessage)
        throw new Error(errorMessage)
    }
    
}