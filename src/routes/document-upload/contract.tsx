import React from 'react';
import { DropzoneUpload } from '@/components/DropzoneUpload'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/document-upload/contract')({
  component: RouteComponent,
})

function RouteComponent() {
  const [result, setResult] = React.useState<string | null>(null);
  
  return (
    <div className='container mx-auto py-10'>
        <h1 className="text-3xl font-bold tracking-tight">Contract Upload</h1>
        <p className="text-slate-600 mt-2">
          Upload your Contracts here
        </p>
        <div className='flex flex-col gap-2'>
			<div className='w-full max-w-2xl mx-auto space-y-4 border p-5 rounded-md'>
				<div className='flex flex-col gap-2'>
				<p className="text-slate-600">
					Upload Result:
				</p>
				<p>
					{result}
				</p>
				</div>
				
			</div>
			<DropzoneUpload
				apiEndpoint='/api/document-upload/contract'
				onSuccess={(data) => {
					setResult(data.result)
				}}
				onReset={() => {setResult(null)}}
			/>
		</div>          
    </div>
  )
}
