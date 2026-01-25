'use client';

/**
 * DisputedDataBanner Component
 * 
 * Displays a warning when data is disputed between sources.
 * Part of the governance UI system.
 */

import { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface DisputeDetail {
  field: string;
  sources: Array<{ name: string; value: string | number | null }>;
  severity: 'low' | 'medium' | 'high';
}

interface DisputedDataBannerProps {
  /** Is the data disputed */
  isDisputed?: boolean;
  /** Dispute reason (simple string) */
  disputeReason?: string;
  /** Detailed dispute information */
  disputeDetails?: DisputeDetail[];
  /** Whether banner can be dismissed */
  dismissible?: boolean;
  /** Size variant */
  variant?: 'inline' | 'banner';
  /** Additional class names */
  className?: string;
}

const severityConfig = {
  low: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    darkBgColor: 'bg-yellow-900/20',
    darkBorderColor: 'border-yellow-800/30',
  },
  medium: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    darkBgColor: 'bg-orange-900/20',
    darkBorderColor: 'border-orange-800/30',
  },
  high: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    darkBgColor: 'bg-red-900/20',
    darkBorderColor: 'border-red-800/30',
  },
};

export function DisputedDataBanner({
  isDisputed,
  disputeReason,
  disputeDetails,
  dismissible = true,
  variant = 'banner',
  className = '',
}: DisputedDataBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isDisputed || isDismissed) {
    return null;
  }

  // Determine highest severity
  const highestSeverity = disputeDetails?.reduce((highest, detail) => {
    const order = { low: 0, medium: 1, high: 2 };
    return order[detail.severity] > order[highest] ? detail.severity : highest;
  }, 'low' as 'low' | 'medium' | 'high') || 'medium';

  const config = severityConfig[highestSeverity];

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs ${config.color} ${className}`}
        title={disputeReason || 'Data is disputed'}
      >
        <AlertTriangle className="w-3 h-3" />
        <span>Disputed</span>
      </span>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 ${className}`}
      style={{
        backgroundColor: 'var(--bg-warning, #fef3c7)',
        borderColor: 'var(--border-warning, #fcd34d)',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${config.color}`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-sm font-semibold ${config.color}`}>
              Data Dispute
            </h4>
            
            <div className="flex items-center gap-1">
              {disputeDetails && disputeDetails.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`p-1 rounded hover:bg-black/5 ${config.color}`}
                  aria-label={isExpanded ? 'Show less' : 'Show more'}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
              
              {dismissible && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className={`p-1 rounded hover:bg-black/5 ${config.color}`}
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {disputeReason || 'Some data points are disputed between multiple sources.'}
          </p>

          {/* Expanded Details */}
          {isExpanded && disputeDetails && disputeDetails.length > 0 && (
            <div className="mt-3 space-y-2">
              {disputeDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-black/5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {detail.field}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        detail.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : detail.severity === 'medium'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {detail.severity}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {detail.sources.map((source, sidx) => (
                      <div
                        key={sidx}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-[var(--text-tertiary)]">
                          {source.name}:
                        </span>
                        <span className="text-[var(--text-secondary)] font-mono">
                          {source.value?.toString() || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info note */}
          <div className="flex items-start gap-1.5 mt-2 text-xs text-[var(--text-tertiary)]">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              Disputed data is excluded from AI summaries and trust calculations.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact inline badge for lists
export function DisputedBadge({
  className = '',
}: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 ${className}`}
      title="Data is disputed"
    >
      <AlertTriangle className="w-2.5 h-2.5" />
      Disputed
    </span>
  );
}

export default DisputedDataBanner;
