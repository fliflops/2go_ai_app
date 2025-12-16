import React from 'react';
import type {InvoiceParams} from '@/db/ai_db_schema/schema'
import type {ColumnDef, PaginationState} from '@tanstack/react-table';
import { DataTable } from '@/components/table/DataTable';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';
import InvoiceDialog from './dialogs/dialog.invoice';
import useInvoiceStore from '@/lib/stores/invoice.store';

const InvoiceTable = () => {
    const setSelectedInvoice = useInvoiceStore((state) => state.setSelectedInvoice);
    const invoiceDialog = useDisclosure(false);
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [globalFilter, setGlobalFilter] = React.useState<string>('') 
    const debouncedSearchTerm = useDebounce(globalFilter, 500)

    const {data:queryData, isLoading, isError,isFetching, error} = useQuery({
        queryKey:['invoices', pagination.pageIndex, pagination.pageSize, debouncedSearchTerm],
        queryFn: async () => {
            const response = await fetch(`/api/invoice?
                page=${pagination.pageIndex+1}
                &limit=${pagination.pageSize}
                &sortBy=createdAt
                &sortOrder=desc
                &search=${debouncedSearchTerm}
                `,{
                method:'GET'
            })

            if (!response.ok) throw new Error('Failed to fetch documents');
            return response.json();

        },
        placeholderData: (previousData) => previousData,
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
    })

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setGlobalFilter(value)
    }

    const columns: ColumnDef<InvoiceParams>[] = [
        {
            accessorKey: 'ocr_id',
            header:'OCR ID',
        },
        {
            accessorKey: 'customerName',
            header:'Customer'
        },
        {
            accessorKey: 'invoiceNumber',
            header: 'Invoice'
        },
        {
            accessorKey: 'invoiceDate',
            header:'Invoice Date'
        },
        {
            accessorKey: 'attachmentValidationStatus',
            header:'Documents'
        },
        {
            accessorKey:'birValidationStatus',
            header:'BIR Compliance'
        },
        {
            accessorKey:'amountValidationStatus',
            header:'Amount Validation'
        },
        {
            accessorKey:'contractValidationStatus',
            header:'Contract Validation'
        },
        {
            header:'Action',
            cell:props => {
                const row = props.row.original as InvoiceParams & {id: string};
                const onClick = () => {
                    setSelectedInvoice({
                        invoice_no: row.invoiceNumber as string,
                        contractValidationStatus: row.contractValidationStatus as string,
                        amountValidationStatus: row.attachmentValidationStatus as string,
                        birValidationStatus: row.birValidationStatus as string,
                        parseData: row.parsedData,
                        id: row.id as string
                    })

                    invoiceDialog.onOpen()
                }

                return <div className='grid grid-cols-2 items-center'>
                    <Button onClick={onClick} variant={'outline'} size={'sm'}>Validate</Button>
                </div>
            }
        }
    ]   

    return (<div className='flex flex-col gap-1 mt-10'>
        {isError && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Error loading documents: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}
        <div className='flex'>
            <div className='flex'>
                <Input 
                    onChange={handleSearchInputChange} 
                    placeholder='Search...' 
                    disabled={isFetching}
                />
            </div>
           
        </div>
         <DataTable
            columns={columns}
            data={queryData?.data ?? []}
            pageCount={queryData?.pagination?.totalPages ?? 0}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
        />

        <InvoiceDialog isOpen={invoiceDialog.isOpen} onClose={invoiceDialog.onClose}/>
    </div>
      
    )
}

export default InvoiceTable