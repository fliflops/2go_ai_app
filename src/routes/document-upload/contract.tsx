import { DropzoneUpload } from '@/components/DropzoneUpload'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/document-upload/contract')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='container mx-auto py-10'>
        <h1 className="text-3xl font-bold tracking-tight">Contract Upload</h1>
        <p className="text-slate-600 mt-2">
          Upload your Contracts here
        </p>
        <div>
            <DropzoneUpload
              apiEndpoint='/api/invoice'
            />
        </div>
    </div>
  )
}
