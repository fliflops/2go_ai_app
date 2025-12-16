import React from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import useInvoiceStore, { selectedInvoiceType } from '@/lib/stores/invoice.store'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { JsonViewer } from '@/components/JsonViewer'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'


interface invoiceDialog {
    isOpen: boolean;
    onClose: () => void; 
}

const InvoiceDialog = (props:invoiceDialog) => {
    const invoiceState = useInvoiceStore((state) => state.selectedInvoice) as selectedInvoiceType;
    const setSelected = useInvoiceStore((state)=> state.setSelectedInvoice);
    const queryClient = useQueryClient();
    const {mutate, isPending,isError,error} = useMutation({
        mutationFn: async(params: {invoice_no: string, id: string;}) => {
            
            const response = await fetch(`/api/ai/invoice/${invoiceState?.invoice_no}`,{
                method:'POST',
                body:JSON.stringify(params)
            })
           
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Upload failed: ${error.message}`)
            }

            return response.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['invoices']
            })
            
            setSelected({
                ...invoiceState,
                contractValidationStatus: data.validationStatus.contractValidationStatus as string,
                amountValidationStatus: data.validationStatus.amountValidationStatus as string,
                parseData: data.parsedData
            })
        }
    })

    const onValidate = async () => {
        mutate({
            invoice_no: invoiceState?.invoice_no as string,
            id: invoiceState?.id as string
        })
    }
    
    return (
        <Dialog open={props.isOpen}>

            <DialogContent showCloseButton={false} className="min-w-full" >
                <DialogHeader>
                    <DialogTitle>Invoice Validation</DialogTitle>
                    <DialogDescription>Validation Details</DialogDescription>
                </DialogHeader>
                {/* {isPending ? <>Loading...</> : null} */}
                <ScrollArea>
                    {isError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <div>
                            <p className="text-sm font-semibold text-red-800">
                                Upload failed
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">
                                {error.message}
                            </p>
                            </div>
                        </div>
                        </div>
                    )}
                    <div className='grid grid-cols-5'>
                        
                        <Label>{invoiceState?.invoice_no}</Label>
                        <Label>Documents: <p className='text-muted-foreground'>{invoiceState?.amountValidationStatus}</p></Label>
                        <Label>BIR Compliance: <p className='text-muted-foreground'>{invoiceState?.birValidationStatus}</p></Label>
                        <Label>Amount Validation: <p className='text-muted-foreground'>{invoiceState?.amountValidationStatus}</p></Label>
                        <Label>Contract Validation: <p className='text-muted-foreground'>{invoiceState?.contractValidationStatus}</p></Label>
                    </div>
                    <div className='mt-10 flex'>
                        <JsonViewer
                            isLoading={isPending}
                            className='w-full'
                            data={invoiceState?.parseData}
                        />
                    </div>
                </ScrollArea>
                
                <DialogFooter>
                    <Button disabled={isPending} variant={'destructive'} onClick={props.onClose}>Close</Button>
                    <Button disabled={isPending} onClick={onValidate}>Validate</Button>
                </DialogFooter>
            </DialogContent>
        
        </Dialog>
    )
}

export default InvoiceDialog