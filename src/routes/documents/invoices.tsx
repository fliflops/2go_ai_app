import { createFileRoute } from '@tanstack/react-router'
import InvoiceTable from './-components/invoice.table'

export const Route = createFileRoute('/documents/invoices')({
  component: RouteComponent,
})


function RouteComponent() {
  return <div className='container mx-auto py-10'>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-slate-600 mt-2">Invoice List</p>

        <InvoiceTable/>
  </div>
}
