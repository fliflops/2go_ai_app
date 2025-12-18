import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Label } from '@radix-ui/react-label';
import InvoiceLabel from './invoice.label';
import BIRComplianceTable from './tables/invoice.bir-compliance.table';
import InvoicePDFViewer from './invoice.pdf';
import InvoiceDetailTable from './tables/invoice.details.table';


interface AccordionDataTypes {
    ocr_id: string;
    birComplianceStatus: string;
    birCompliance: {
        field: string;
        value: string;
    }[];
    attachmentValidationStatus: string;
    attachments: {
        attachment: string;
        value: string;
    }[];
    amountValidationStatus: string;
    amountValidationData: any
}

const InvoiceAccordion = (props:AccordionDataTypes) => {

    const showRagValidations = () => {
		const data = props.amountValidationData
		return (<div className='grid grid-cols-2 gap-3'>

			<Label className='text-md col-span-2'>Validation Results</Label>
			<div className='flex flex-col gap-3'>
				<InvoiceLabel label='Contract Reference' value={data.vendor_validation.contract_reference}/>
				<InvoiceLabel label='Contract Compliant?' value={data.contract_compliant ? 'Yes' : 'No'}/>
				<InvoiceLabel label='Overall Status' value={data.overall_status}/>
				<InvoiceLabel label='Overall Amount Validation' value={data.overall_amount_validation}/>
				<InvoiceLabel label='Confidence Score' value={data.confidence_score}/>
			</div>
			<div className='flex flex-col gap-3'>
				{/* <InvoiceLabel label='Vendor Authorized?' value={data.vendor_validation.vendor_authorized ? 'Yes': 'No'}/>
				<InvoiceLabel label='Contract Active?' value={data.vendor_validation.contract_active ? 'Yes' : 'No'}/>
				<InvoiceLabel label='Within Contract Period?' value={data.date_validation.within_contract_period ? 'Yes': 'No'}/>
				<InvoiceLabel label='Due Date Compliant?' value={data.date_validation.due_date_compliant ? 'Yes' : 'No'}/> */}
			</div>
			<div className='col-span-2 flex flex-col gap-2'>
				<Label className='text-md'>Validated Item Information</Label>
				<InvoiceDetailTable data={data.line_items_validation || []}/>
			</div>
		</div>)
	}
  return (
    <Accordion 
        type='single'
        collapsible
        className='w-full'
    >
        <AccordionItem value='birCompliance'>
            <AccordionTrigger>
                <div className='flex gap-3'>
                    <Label>BIR Compliance Validation: </Label>
                    <Label className={`${props.birComplianceStatus === 'pending' ? 'text-muted-foreground' : 'text-green-800 font-semibold'}`}>{props.birComplianceStatus}</Label>
                </div>
            </AccordionTrigger>
            <AccordionContent className='flex flex-col p-5'>
                <BIRComplianceTable data={props.birCompliance}/>
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value='documents'>
            <AccordionTrigger>
                <div className='flex gap-3'>
                    <Label>Documents Validation: </Label>
                    <Label className={`${props.attachmentValidationStatus === 'pending' ? 'text-muted-foreground' : 'text-green-800 font-semibold'}`}>{props.attachmentValidationStatus}</Label>
                </div>
            </AccordionTrigger>
            <AccordionContent className='flex flex-col gap-2 p-5'>
                {
                    props.attachments.map((item, index) => (
                        <div key={index}>
                            <InvoiceLabel label={item.attachment} value={item.value}/>
                        </div>
                    ))
                }
            </AccordionContent>
        </AccordionItem>
         <AccordionItem value='amount'>
            <AccordionTrigger>
                <div className='flex gap-3'>
                    <Label>Amount Validation: </Label>
                    <Label className={`${props.amountValidationStatus === 'pending' ? 'text-muted-foreground' : 'text-green-800 font-semibold'}`}>{props.amountValidationStatus}</Label>
                </div>
            </AccordionTrigger>
            <AccordionContent className='flex flex-col gap-2 p-5'>
                {
                    props.amountValidationStatus === 'pending' ? <Label  className='text-muted-foreground font-semibold'>Validation Pending</Label>: showRagValidations()
                }
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value='pdf'>
            <AccordionTrigger>
                <div className='flex gap-3'>
                    <Label>View PDF</Label>
                </div>
            </AccordionTrigger>
            <AccordionContent className='flex flex-col gap-2 p-5'>
                <InvoicePDFViewer ocrId={props.ocr_id}/>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
  )
}

export default InvoiceAccordion