import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';

interface TableProps<TData,TValue> {
    columns: ColumnDef<TData,TValue>[];
    data: TData[];
}

const Table = <TData,TValue>({
    columns,
    data,
}: TableProps<TData,TValue>) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    })

    return (
       <div className='w-full'>
            <div className='rounded-md border border-gray-200'>
                <table className='w-full'>
                    <thead className="bg-gray-50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                key={header.id}
                                className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                                >
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </th>
                            ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                        <tr
                            key={row.id}
                            className="hover:bg-gray-50 transition-colors"
                        >
                            {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3 text-xs text-gray-900">
                                {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                                )}
                            </td>
                            ))}
                        </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500">
                                No results.
                            </td>
                        </tr>
                    )}
                    </tbody>   
                </table>
            </div>
       </div>
    )
}

export default Table