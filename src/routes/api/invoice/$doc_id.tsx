import { createFileRoute } from '@tanstack/react-router'
import {json} from '@tanstack/react-start';
import { getDocument } from '@/services/paperless.service';

export const Route = createFileRoute('/api/invoice/$doc_id')({
    server: {
      handlers: {
        GET: async({ params}) => {
          try{
			      const doc_id = params.doc_id;
            const document = await getDocument(doc_id);

            return json({
              data:document
            })
            
          }
          catch(error:any){
            return json(
				{
					success: false,
					error: error.message,
                }, 
                { status: 500 }
            )
          }
        }
      }
    }
})


