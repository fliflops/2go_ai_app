import Table from "@/components/table/Table"
import { ColumnDef } from "@tanstack/react-table"


type tableTypes = {
    description:string;
    quantity_invoice: number;
    unit_price_invoice: number;
    line_total_invoice: number;
    contract_unit_price: number;
    item_status: string;
    contract_rate_compliant: boolean;
    cited_from: string;
    remarks: string;
}

interface InvoiceDetailTableType {
    data:tableTypes[]
}

const InvoiceDetailTable = ({
    data=[]
}:InvoiceDetailTableType) => {
    //const invoiceState = useInvoiceStore((state) => state.selectedInvoice);
    const columns: ColumnDef<tableTypes>[] = [
        {
            accessorKey:'description',
            header: 'Description'
        },
        {
            accessorKey:'quantity_invoice',
            header:'Quantity'
        },
        {
            accessorKey: 'unit_price_invoice',
            header:'Unit Price'
        },
        {
            accessorKey:'contract_unit_price',
            header:'Contract Unit Price'
        },
        {
            accessorKey: 'line_total_invoice',
            header:'Line Total'
        },
        {
            accessorKey:'contract_rate_compliant',
            header:'Is Contract Rate Compliant?',
            cell: props => props.getValue() ? 'Yes' : 'No'
        },
        {
            accessorKey: 'item_status',
            header:'Item Status'
        },
        {
            accessorKey: 'cited_from',
            header:'Cited From'
        },
        {
            accessorKey:'remarks',
            header:'Remarks'
        }
      
    ]
    return (
        <Table columns={columns} data={data}/>
    )
}

export default InvoiceDetailTable