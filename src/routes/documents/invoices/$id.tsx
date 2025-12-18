import { createFileRoute, Link, useCanGoBack, useParams, useRouter } from '@tanstack/react-router'
import { Label } from '@/components/ui/label'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button';
import InvoiceLabel from '../-components/invoice.label';
import InvoiceDetailTable from '../-components/tables/invoice.details.table';
import { JsonViewer } from '@/components/JsonViewer';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import InvoicePDFViewer from '../-components/invoice.pdf';
import InvoiceAccordion from '../-components/invoice.accordion';

export const Route = createFileRoute('/documents/invoices/$id')({
  component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter();
	const canGoback = useCanGoBack();
	const queryClient = useQueryClient();

	const {id} = useParams({from:'/documents/invoices/$id'});
	const {data:invoiceState, isLoading, isError, refetch} = useQuery({
		queryKey:['invoice',id],
		queryFn: async() => {
			const response = await fetch('/api/ai/invoice/'+id,{
				method:'GET'
			})

			if(!response.ok) throw new Error('Something happened!')
			return response.json();
		},
	  	placeholderData: (previousData) => previousData,
		staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
	})

	const validateMutation = useMutation({
        mutationFn: async(params: {invoice_no: string, id: string;}) => {
            
            const response = await fetch(`/api/ai/invoice/${invoiceState.data.invoiceNumber}`,{
                method:'POST',
                body:JSON.stringify(params)
            })
           
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Upload failed: ${error.message}`)
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['invoices','invoice']
            })
			refetch()
        }
    })

    const onValidate = async () => {
        validateMutation.mutate({
            invoice_no: invoiceState?.data.invoiceNumber as string,
            id: invoiceState?.data.id as string
        })
    }
 
	if(isLoading && !isError) return <>Loading Data...</>

	if(isError) return <div className='flex flex-col'>
		<Label>Error Loading Page</Label>
		<Button variant={'link'} asChild>
			<Link to='/documents/invoices'>
				Go Back
			</Link>
		</Button>
	</div>

	return(
		<div className='container mx-auto py-10'>	
			{validateMutation.isPending ? 
				<div className={`h-full w-full absolute bg-white opacity-75 z-10`}>
				<div className='flex flex-col h-full justify-center items-center'>
					<span className='flex gap-2'> 
						<p>Validating</p>
						<Loader2 className="h-5 w-5 animate-spin" />
					</span>
					</div>
				</div> : null
			}	
			<div className='flex justify-between'>
				<div className='flex-1 flex-col'>
					<h1 className="text-3xl font-bold tracking-tight">Invoice Validation</h1>
					<Label className="text-muted-foreground mt-2">Validation Details</Label>
				</div>
				<div className='flex items-center gap-1'>
					{canGoback ? <Button disabled={validateMutation.isPending} variant={'outline'} onClick={() => router.history.back()} >Back</Button> : null}
					<Button disabled={validateMutation.isPending} onClick={onValidate}>Validate</Button>
				</div>
			</div>

			{validateMutation.isError && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
				<div className="flex items-center gap-3">
					<AlertCircle className="h-5 w-5 text-red-500" />
					<div>
					<p className="text-sm font-semibold text-red-800">
						Validation Failed
					</p>
					<p className="text-xs text-red-600 mt-0.5">
						{validateMutation.error.message}
					</p>
					</div>
				</div>
				</div>
			)}

			 {validateMutation.isSuccess && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
				<div className="flex items-center gap-3">
					<div className="bg-green-500 rounded-full p-1">
					<CheckCircle2 className="h-5 w-5 text-white" />
					</div>
					<div>
					<p className="text-sm font-semibold text-green-800">
						Validate Success
					</p>
					<p className="text-xs text-green-600 mt-0.5">
						The data is successfully validated.
					</p>
					</div>
				</div>
				</div>
			)}
					
			<div className='mt-5 flex flex-col gap-2'>
				<div className='mt-2 grid grid-cols-2 gap-5'>
					<Label className='text-md col-span-2'>Invoice Information</Label>
					<div className='flex flex-col gap-3'>
						<InvoiceLabel label='Invoice #' value={invoiceState.data.invoiceNumber}/>
						<InvoiceLabel label='Customer Name' value={invoiceState?.data?.parsedData.customer_name}/>
						<InvoiceLabel label='Vendor Name' value={invoiceState?.data?.parsedData.vendor_name}/>

						<InvoiceLabel label='Invoice Date' value={invoiceState?.data?.parsedData.invoice_date}/>
						<InvoiceLabel label='Total Amount' value={invoiceState?.data?.parsedData.total_amount}/>
					</div>
					<div className='flex flex-col gap-3'>
						<InvoiceLabel label='Sub Total' value={invoiceState?.data?.parsedData.subtotal}/>
						<InvoiceLabel label='Vatable Sales' value={invoiceState?.data?.parsedData.vatable_sales}/>

						<InvoiceLabel label='Vat Amount' value={invoiceState?.data?.parsedData.vat_amount}/>
						<InvoiceLabel label='Net Amount' value={invoiceState?.data?.parsedData.net_amount}/>
					</div>
				</div>
				<div className='mt-2'>
					<InvoiceAccordion 
						ocr_id={invoiceState.data.ocr_id}
						birComplianceStatus={invoiceState?.data?.birValidationStatus}
						birCompliance={invoiceState?.data?.parsedData?.bir_compliance}
						
						attachmentValidationStatus={invoiceState?.data?.attachmentValidationStatus}
						attachments={[
							{
								attachment: 'form_2307_attached',
								value: invoiceState?.data?.parsedData?.form_2307_attached? 'Yes' : 'No'
							},
							{
								attachment: 'form_2307_consistent',
								value: invoiceState?.data?.parsedData?.form_2307_consistent? 'Yes' : 'No' 
							}
						]}
						
						amountValidationStatus={invoiceState?.data?.amountValidationStatus}
						amountValidationData={invoiceState?.data?.parsedData?.rag_validation ? {
							contract_compliant:invoiceState?.data?.parsedData.rag_validation.contract_compliant,
							overall_status:invoiceState?.data?.parsedData.rag_validation.overall_status,
							overall_amount_validation:invoiceState?.data?.parsedData.rag_validation.overall_amount,
							confidence_score:invoiceState?.data?.parsedData.rag_validation.confidence_score,
							date_validation: invoiceState?.data?.parsedData.rag_validation.date_validation,
							vendor_validation: invoiceState?.data?.parsedData.rag_validation.vendor_validation,
							amount_validation: invoiceState?.data?.parsedData.rag_validation.amount_validation,
							line_items_validation: invoiceState?.data?.parsedData.rag_validation.line_items_validation
						} : null }
					/>
				</div>
				<JsonViewer
					isLoading={validateMutation.isPending}
					className='w-full'
					data={invoiceState.data.parsedData}
				/>
				
			</div>
		</div>
  	)
}