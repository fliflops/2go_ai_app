import { createFileRoute } from '@tanstack/react-router'
import {json} from '@tanstack/react-start';
import { writeFile } from 'node:fs/promises';
import {getDocuments, postDocument} from '@/services/paperless.service';
import path from 'path';

export const Route = createFileRoute('/api/invoice/')({
  server:{
    handlers: {
        POST: async ({request}) => {
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

				const postedDocument = await postDocument(pathFile);
	
				return json({ 
					success: true, 
					documentId: postedDocument
				})

          	}
			catch(error:any){
				return json({
					success: false,
					error: error.message,
				}, 
				{ status: 500 });
          	}
        },
		GET: async({request}) => {
			try{
				const url = new URL(request.url);
				const page = parseInt(url.searchParams.get('page') || '1');
				const limit = parseInt(url.searchParams.get('limit') || '10');
				const query = url.searchParams.get('query') || '';
				const ordering = url.searchParams.get('ordering') || '-created';

				const response = await getDocuments({
					page,
					limit,
					query,
					ordering
				})

				return json({...response})
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
