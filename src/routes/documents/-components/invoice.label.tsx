import { Label } from '@/components/ui/label'

interface InvoiceLabelType {
  label: string;
  value: string;
}

const InvoiceLabel = ({label,value}:InvoiceLabelType) => {
  return (
    <Label>{label}: <span className='text-muted-foreground'>{value}</span></Label>
  )
}

export default InvoiceLabel