import { getPDF } from '@/services/paperless.service';
import { createFileRoute } from '@tanstack/react-router';
import {json} from '@tanstack/react-start';

export const Route = createFileRoute('/api/invoice/pdf/$docId')({
  server:{
    handlers:{
      GET: async({params}) => {
        try{
			const doc_id = params.docId;
			const data = await getPDF(doc_id);

			return new Response(data,{
				status: 200,
				headers: {
					"Content-Type": "application/octet-stream", // or another specific binary MIME type
				}
			})

        }
        catch(error:any){
          return json({
            success: false,
            error: error.message,
          }, 
          { status: 500 });
        }
      }
    }
  }
})

