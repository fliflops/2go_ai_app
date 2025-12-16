import { createFileRoute, Link, useCanGoBack, useParams, useRouter } from '@tanstack/react-router'
import { Label } from '@/components/ui/label'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button';
import InvoiceLabel from '../-components/invoice.label';
import InvoiceDetailTable from '../-components/tables/invoice.details.table';
import { JsonViewer } from '@/components/JsonViewer';

export const Route = createFileRoute('/documents/invoices/$id')({
  component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter();
	const canGoback = useCanGoBack();
	const queryClient = useQueryClient();

	const {id} = useParams({from:'/documents/invoices/$id'});
	const {data:invoiceState, isLoading, isError} = useQuery({
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
        }
    })

    const onValidate = async () => {
        validateMutation.mutate({
            invoice_no: invoiceState?.invoice_no as string,
            id: invoiceState?.id as string
        })
    }

	const showRagValidations = () => {
		const data = invoiceState.data.parsedData.rag_validation
		return (<div className='grid grid-cols-2 gap-3'>

			<Label className='text-md col-span-2'>Validation Results</Label>
			<div className='flex flex-col gap-3'>
				<InvoiceLabel label='Contract Reference' value={data.vendor_validation.contract_reference}/>
				<InvoiceLabel label='Contract Compliant?' value={data.contract_compliant ? 'Yes' : 'No'}/>
				<InvoiceLabel label='Overall Status' value={data.overall_status}/>
				<InvoiceLabel label='Overall Amount Validation' value={data.overall_amount_validation}/>
				<InvoiceLabel label='Confidence Score' value={data.confidence_score}/>
			</div>
			<div className='flex flex-col gap-3'>
				<InvoiceLabel label='Vendor Authorized?' value={data.vendor_validation.vendor_authorized ? 'Yes': 'No'}/>
				<InvoiceLabel label='Contract Active?' value={data.vendor_validation.contract_active ? 'Yes' : 'No'}/>
				<InvoiceLabel label='Within Contract Period?' value={data.date_validation.within_contract_period ? 'Yes': 'No'}/>
				<InvoiceLabel label='Due Date Compliant?' value={data.date_validation.due_date_compliant ? 'Yes' : 'No'}/>
			</div>
			<div className='col-span-2 flex flex-col gap-2'>
				<Label className='text-md'>Validated Item Information</Label>
				<InvoiceDetailTable data={invoiceState.data.parsedData?.rag_validation?.line_items_validation || []}/>
			</div>
		</div>)
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
			
			<div className='mt-5 flex flex-col gap-2'>
				<div className='grid grid-cols-5'>
					<Label>{invoiceState.data.invoiceNumber}</Label>
					<Label>Documents: <p className='text-muted-foreground'>{invoiceState?.data.amountValidationStatus}</p></Label>
					<Label>BIR Compliance: <p className='text-muted-foreground'>{invoiceState?.data.birValidationStatus}</p></Label>
					<Label>Amount Validation: <p className='text-muted-foreground'>{invoiceState?.data.amountValidationStatus}</p></Label>
					<Label>Contract Validation: <p className='text-muted-foreground'>{invoiceState?.data.contractValidationStatus}</p></Label>
				</div>
				<div className='mt-2 grid grid-cols-2 gap-5'>
					<Label className='text-md col-span-2'>Invoice Information</Label>
					<div className='flex flex-col gap-3'>
						
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
					{
						invoiceState?.data?.parsedData?.rag_validation ? showRagValidations() : 
						<div className='flex h-16 items-center justify-center border rounded-md'>
							No Contract Validations Yet
						</div>
					}
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