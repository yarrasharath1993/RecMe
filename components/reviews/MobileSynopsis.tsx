'use client';

import { useState } from 'react';

interface MobileSynopsisProps {
  text: string;
  maxLength?: number;
}

export function MobileSynopsis({ text, maxLength = 150 }: MobileSynopsisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const needsTruncation = text.length > maxLength;
  const displayText = isExpanded || !needsTruncation 
    ? text 
    : text.slice(0, maxLength).trim() + '...';
  
  return (
    <div>
      <p className="text-sm text-gray-400 leading-relaxed">
        {displayText}
        {needsTruncation && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="ml-1 text-yellow-500 hover:text-yellow-400 font-medium"
          >
            more
          </button>
        )}
      </p>
      {isExpanded && needsTruncation && (
        <button
          onClick={() => setIsExpanded(false)}
          className="text-xs text-gray-500 hover:text-gray-400 mt-1"
        >
          Show less
        </button>
      )}
    </div>
  );
}

