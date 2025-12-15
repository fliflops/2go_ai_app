import React from 'react';
import type {InvoiceParams} from '@/db/ai_db_schema/schema'
import type {ColumnDef, PaginationState} from '@tanstack/react-table';
import { DataTable } from '@/components/table/DataTable';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/use-debounce';


const InvoiceTable = () => {
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
            header:'Action'
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
                    //disabled={isSearching||isFetching}
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
    
    </div>
      
    )
}

export default InvoiceTable