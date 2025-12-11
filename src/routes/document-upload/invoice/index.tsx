import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { useState } from 'react';

export const Route = createFileRoute('/document-upload/invoice/')({
  component: RouteComponent,
})

type Document = {
    id: string;
    title: string;
    created: string;
    status:string  //'pending' | 'processed' | 'failed';
};

// Fetch function for documents
const fetchDocuments = async (page: number, pageSize: number) => {
  const response = await fetch(
    `/api/invoice?page=${page}&limit=${pageSize}&ordering=-created`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  
  return response.json();
};

function RouteComponent() {
    const navigate = useNavigate();
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    
      // Use TanStack Query for data fetching
    const { data: queryData, isLoading, isError, error } = useQuery({
        queryKey: ['documents', pagination.pageIndex, pagination.pageSize],
        queryFn: () => fetchDocuments(pagination.pageIndex + 1, pagination.pageSize),
        placeholderData: (previousData) => previousData
    });

   const data = queryData?.data ?? [];
    const pageCount = queryData?.pageCount ?? 0;


    // Define columns
    const columns: ColumnDef<Document>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("id")}</div>,
    },
    {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
        accessorKey: 'created',
        header: 'Created',
        cell: ({ row }) => {
        const date = new Date(row.getValue('created'));
        return <div className="text-slate-600">{date.toLocaleDateString()}</div>;
        },
    },
    {
      header:'Action',
      cell:({row}) => {
        const handleClick = () => {
          const doc_id = row.original.id as string
            navigate({
              to:'/document-upload/invoice/$doc_id',
              params: {
                doc_id
              }
            })
        }
        return <div><Button size={'sm'} onClick={handleClick}>Contents</Button></div>
      
      }
      
    }
    // {
    //     accessorKey: 'status',
    //     header: 'Status',
    //     cell: ({ row }) => {
    //     const status = row.getValue('status') as string;
    //     const statusStyles = {
    //         pending: 'bg-yellow-100 text-yellow-800',
    //         processed: 'bg-green-100 text-green-800',
    //         failed: 'bg-red-100 text-red-800',
    //     };
    //     return (
    //         <span
    //         className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    //             statusStyles[status as keyof typeof statusStyles]
    //         }`}
    //         >
    //         {status}
    //         </span>
    //     );
    //     },
    // },
    ];
    return <div className='container mx-auto py-10'>
        <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-slate-600 mt-2">
          Manage and view your uploaded documents
        </p>
        {isError && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Error loading documents: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}
      </div>
        <DataTable
            columns={columns}
            data={data}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
        />
  </div>
}
