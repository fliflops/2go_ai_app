import { createFileRoute } from '@tanstack/react-router';
import { chatWithAgent, createClient, createSession } from '@/services/oracle.ai.service';
import {json} from '@tanstack/react-start';

export const Route = createFileRoute('/api/ai/')({
  server:{
    handlers:{
      POST: async({request}) => {
        try{
          const message = await request.json();

          const client = createClient();

          const sessionId = await createSession(client);

          const result = await chatWithAgent(
            client,
            sessionId,
            message
          )

          console.log(result)


          return json({
            data:message
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


 