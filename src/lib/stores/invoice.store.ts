import {create} from 'zustand';

export type selectedInvoiceType = {
    id: string;
    invoice_no:string;
    contractValidationStatus: string;
    birValidationStatus: string;
    amountValidationStatus: string;
    parseData: any;
}

interface invoiceStoreType {
    selectedInvoice:selectedInvoiceType | null,
    setSelectedInvoice: (selected:selectedInvoiceType) => void
}

const useInvoiceStore = create<invoiceStoreType>()((set) =>({
    selectedInvoice: null,
    setSelectedInvoice:(invoice) => set({selectedInvoice:invoice})
}));

export default useInvoiceStore