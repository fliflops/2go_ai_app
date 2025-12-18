import PDFViewer from '@/components/PDFViewer'
import { useQuery } from '@tanstack/react-query'
import React from 'react'


interface pdfViewer {
    ocrId: string
}

const InvoicePDFViewer = (props:pdfViewer) => {
   
    const {data: pdfData, isLoading, isError} = useQuery({
        queryKey:[props.ocrId],
        queryFn: async() => {
            const response = await fetch('/api/invoice/pdf/'+props.ocrId,{
                method: 'GET'
            })

            if(!response.ok) throw new Error('Failed loading pdf file.')

            return response.arrayBuffer()
        },
        // staleTime: 1000 * 60 * 2, // 2 minutes
        // gcTime: 1000 * 60 * 5, // 5 minutes

    })

    React.useEffect(() => {
        if (!window['pdfjs-dist/build/pdf']) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
  }, []);

    return (
        <div className='border p-2'>
            <PDFViewer 
                    pdfData={pdfData || null} 
                    initialScale={1}
                    title='Invoice Document'
                    //onError={(error) => console.error(error)}
                />
        </div>
        
    )
}

export default InvoicePDFViewer