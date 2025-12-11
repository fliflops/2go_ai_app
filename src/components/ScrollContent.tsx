import React from 'react'


interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  showCopyButton?: boolean;
  copyText?: string;
}


const ScrollContent = ({
  children,
  className = '',
  maxHeight = '400px',
  showCopyButton = false,
  copyText = '',
}: ScrollAreaProps) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
    try {
        await navigator.clipboard.writeText(copyText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } 
    catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
    <div className={`relative rounded-md border border-slate-200 ${className}`}>
      {showCopyButton && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      )}
      
      <div
        className="overflow-auto p-4"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>
  );
}

export default ScrollContent