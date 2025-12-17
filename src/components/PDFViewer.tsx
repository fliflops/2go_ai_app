import React, { useState, useEffect, useRef } from 'react';
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

// Type definitions
interface PDFViewerProps {
  /** The PDF data as an ArrayBuffer */
  pdfData: ArrayBuffer | null;
  /** Optional title to display above the viewer */
  title?: string;
  /** Callback function when an error occurs */
  onError?: (error: string) => void;
  /** Initial zoom scale (default: 1.5) */
  initialScale?: number;
  /** Maximum zoom scale (default: 3) */
  maxScale?: number;
  /** Minimum zoom scale (default: 0.5) */
  minScale?: number;
  /** Zoom increment/decrement step (default: 0.25) */
  zoomStep?: number;
  /** Maximum height of the canvas container (default: '70vh') */
  maxHeight?: string;
}

interface PDFDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPage>;
}

interface PDFPage {
  getViewport: (params: { scale: number }) => PDFViewport;
  render: (params: PDFRenderParams) => { promise: Promise<void> };
}

interface PDFViewport {
  width: number;
  height: number;
}

interface PDFRenderParams {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFViewport;
}

declare global {
  interface Window {
    'pdfjs-dist/build/pdf': {
      GlobalWorkerOptions: {
        workerSrc: string;
      };
      getDocument: (params: { data: ArrayBuffer }) => {
        promise: Promise<PDFDocument>;
      };
    };
  }
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfData,
  title,
  onError,
  initialScale = 1.5,
  maxScale = 3,
  minScale = 0.5,
  zoomStep = 0.25,
  maxHeight = '70vh',
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(initialScale);
  const [loading, setLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocument | null>(null);

  // Load PDF document
  useEffect(() => {
    if (!pdfData) {
      pdfDocRef.current = null;
      setTotalPages(0);
      setCurrentPage(1);
      return;
    }

    const loadPDF = async (): Promise<void> => {
      setLoading(true);
      try {
        // Wait for PDF.js to load if not already loaded
        let pdfjsLib = window['pdfjs-dist/build/pdf'];
        
        if (!pdfjsLib) {
          // Wait for script to load
          await new Promise<void>((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (window['pdfjs-dist/build/pdf']) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              reject(new Error('PDF.js failed to load'));
            }, 10000);
          });
          
          pdfjsLib = window['pdfjs-dist/build/pdf'];
        }
        
        if (!pdfjsLib) {
          throw new Error('PDF.js library not available');
        }
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        
        // Render the first page immediately after loading
        await renderPage(1, pdf);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        onError?.('Failed to load PDF: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfData, onError]);

  // Render PDF page to canvas
  const renderPage = async (pageNum: number, pdf?: PDFDocument): Promise<void> => {
    const pdfDoc = pdf || pdfDocRef.current;
    if (!pdfDoc || !canvasRef.current) return;
    
    setLoading(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext: PDFRenderParams = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      onError?.('Failed to render page: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Re-render when page or scale changes
  useEffect(() => {
    if (pdfDocRef.current && currentPage) {
      void renderPage(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, scale]);

  const handlePrevPage = (): void => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = (): void => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleZoomIn = (): void => {
    setScale((prevScale) => Math.min(prevScale + zoomStep, maxScale));
  };

  const handleZoomOut = (): void => {
    setScale((prevScale) => Math.max(prevScale - zoomStep, minScale));
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // const goToPage = (page: number): void => {
  //   if (pdfDocRef.current && page >= 1 && page <= totalPages) {
  //     setCurrentPage(page);
  //     void renderPage(page);
  //   }
  // };

  if (!pdfData) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Select a document to view</p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      )}
      
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1 || loading}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={currentPage}
              onChange={handlePageInput}
              min={1}
              max={totalPages}
              disabled={loading}
              className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Current page"
            />
            <span className="text-sm">of {totalPages}</span>
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || loading}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={loading || scale <= minScale}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            disabled={loading || scale >= maxScale}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="overflow-auto border border-gray-300 rounded bg-gray-100" 
        style={{ maxHeight }}
      >
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Rendering...</p>
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className="mx-auto" 
          style={{ display: loading ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
};

export default PDFViewer;
export type { PDFViewerProps };