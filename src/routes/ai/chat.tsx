import { createFileRoute } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

import { Send } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/ai/chat')({
  component: RouteComponent,
  notFoundComponent:() => (<>Not Found</>)
})

// const getOCIConfig = createServerFn().handler(() => {
  

// })

function RouteComponent() {
  
  
  return  <div className='flex flex-col border h-9/12 mx-5 mb-5'>
    <div className='flex p-4 justify-center'>
      <span>AI Assistant</span>
    </div>
      <ScrollArea className='flex-1 border-y'>
        <div className='  max-w-4xl mx-auto space-y-4 p-4'>

        </div>
      </ScrollArea>

      <div className='backdrop-blur-sm'>
            <div className='max-w-4xl mx-auto p-4'>
                <div className='flex gap-2'>
                    <Input
                        placeholder='Please type your message...'
                    />
                    <Button>
                        <Send  className="w-4 h-4"/>
                    </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center"> Press Enter to send </p>
            </div>
        </div>
  </div>
}
