import Table from "@/components/table/Table"
import { ColumnDef } from "@tanstack/react-table"


type tableTypes = {
    field: string;
    value: string;
}

interface InvoiceDetailTableType {
    data:tableTypes[]
}

const BIRComplianceTable = ({
    data=[]
}:InvoiceDetailTableType) => {
    //const invoiceState = useInvoiceStore((state) => state.selectedInvoice);
    const columns: ColumnDef<tableTypes>[] = [
        {
            accessorKey:'field',
            header: 'Description'
        },
        {
            accessorKey:'value',
            header:'Value'
        } 
    ]
    return (
        <Table columns={columns} data={data}/>
    )
}

export default BIRComplianceTable