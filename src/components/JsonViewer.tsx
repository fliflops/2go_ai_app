import React, { JSX, useState } from 'react';
import ScrollContent from './ScrollContent';
import { Loader2 } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  className?: string;
  maxHeight?: string;
  showCopyButton?: boolean;
  collapsed?: boolean;
  isLoading?: boolean;
}

export function JsonViewer({
  data,
  className = '',
  maxHeight = '400px',
  showCopyButton = true,
  collapsed = false,
  isLoading = false
}: JsonViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  
  const jsonString = JSON.stringify(data, null, 2);

  const formatJson = (obj: any, indent = 0): JSX.Element => {
    const indentStr = '  '.repeat(indent);
    
    if (obj === null) {
      return <span className="text-gray-500">null</span>;
    }
    
    if (typeof obj === 'string') {
      return <span className="text-green-600">"{obj}"</span>;
    }
    
    if (typeof obj === 'number') {
      return <span className="text-blue-600">{obj}</span>;
    }
    
    if (typeof obj === 'boolean') {
      return <span className="text-purple-600">{obj.toString()}</span>;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return <span>[]</span>;
      }
      
      return (
        <span>
          [<br />
          {obj.map((item, index) => (
            <span key={index}>
              {indentStr}  {formatJson(item, indent + 1)}
              {index < obj.length - 1 && ','}
              <br />
            </span>
          ))}
          {indentStr}]
        </span>
      );
    }
    
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return <span>{'{}'}</span>;
      }
      
      return (
        <span>
          {'{'}<br />
          {keys.map((key, index) => (
            <span key={key}>
              {indentStr}  <span className="text-red-600">"{key}"</span>: {formatJson(obj[key], indent + 1)}
              {index < keys.length - 1 && ','}
              <br />
            </span>
          ))}
          {indentStr}{'}'}
        </span>
      );
    }
    
    return <span>{String(obj)}</span>;
  };

  return (
    <div className={`rounded-md border border-slate-200 bg-slate-50 ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-3 w-3 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            JSON
          </button>
          <span className="text-xs text-slate-500">
            {Array.isArray(data) ? `${data.length} items` : `${Object.keys(data || {}).length} properties`}
          </span>
        </div>
        
        {showCopyButton && (
          <button
            onClick={() => navigator.clipboard.writeText(jsonString)}
            className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
          >
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
          </button>
        )}
      </div>
      
      {!isCollapsed && (
        <ScrollContent maxHeight={maxHeight} className="border-0">
          {
            isLoading ? 
            <div className='flex justify-center'>
              <Loader2 className="h-5 w-5 animate-spin" />
              Validating...
            </div>
            :
             <pre className="text-sm font-mono p-4 bg-white">
               <code>{formatJson(data)}</code>
              </pre>
          }
         
        </ScrollContent>
      )}
    </div>
  );
}