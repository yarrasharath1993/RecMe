'use client';

/**
 * ConfidenceTooltip Component
 * 
 * Displays an interactive tooltip explaining why a particular
 * confidence score was assigned to content.
 */

import { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import type { TrustExplanation, ConfidenceTier } from '@/lib/governance/types';

export interface ConfidenceTooltipProps {
  /** The confidence tier */
  tier: ConfidenceTier;
  /** Numeric score (0-100) */
  score?: number;
  /** Detailed explanation */
  explanation?: TrustExplanation;
  /** Breakdown of scoring factors */
  breakdown?: Record<string, number>;
  /** Position of tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Trigger element (defaults to info icon) */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

const tierConfig: Record<ConfidenceTier, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  description: string;
}> = {
  high: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'High Confidence',
    description: 'Data is well-verified from multiple reliable sources.',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Medium Confidence',
    description: 'Data is partially verified. Some sources may be incomplete.',
  },
  low: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Low Confidence',
    description: 'Data verification is limited. Use with caution.',
  },
  unverified: {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Unverified',
    description: 'Data has not been verified. May contain errors.',
  },
};

export function ConfidenceTooltip({
  tier,
  score,
  explanation,
  breakdown,
  position = 'top',
  children,
  className = '',
}: ConfidenceTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const config = tierConfig[tier];
  const TierIcon = config.icon;

  // Calculate tooltip position
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = 8;

      let style: React.CSSProperties = {};

      switch (position) {
        case 'top':
          style = {
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: padding,
          };
          break;
        case 'bottom':
          style = {
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: padding,
          };
          break;
        case 'left':
          style = {
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginRight: padding,
          };
          break;
        case 'right':
          style = {
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: padding,
          };
          break;
      }

      setTooltipStyle(style);
    }
  }, [isVisible, position]);

  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex items-center justify-center p-1 rounded-full hover:bg-black/5 transition-colors ${config.color}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label={`${config.label}: ${score !== undefined ? score + '%' : ''}`}
        aria-describedby={isVisible ? 'confidence-tooltip' : undefined}
      >
        {children || <HelpCircle className="w-4 h-4" />}
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id="confidence-tooltip"
          role="tooltip"
          className="absolute z-50 w-72 p-3 rounded-lg shadow-xl border bg-white"
          style={{
            ...tooltipStyle,
            borderColor: 'var(--border-primary, #e5e7eb)',
          }}
        >
          {/* Header */}
          <div className={`flex items-center gap-2 pb-2 mb-2 border-b ${config.borderColor}`}>
            <TierIcon className={`w-5 h-5 ${config.color}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${config.color}`}>
                  {config.label}
                </span>
                {score !== undefined && (
                  <span className={`text-sm font-mono font-bold ${config.color}`}>
                    {score}%
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {config.description}
              </p>
            </div>
          </div>

          {/* Explanation */}
          {explanation?.summary && (
            <div className="mb-3">
              <p className="text-xs text-[var(--text-secondary)]">
                {explanation.summary}
              </p>
            </div>
          )}

          {/* Breakdown */}
          {breakdown && Object.keys(breakdown).length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-[var(--text-primary)] uppercase tracking-wide">
                Score Breakdown
              </h5>
              {Object.entries(breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)] capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-[var(--text-primary)]">
                        {value}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          value >= 80
                            ? 'bg-green-500'
                            : value >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Key Factors */}
          {explanation?.key_factors && explanation.key_factors.length > 0 && (
            <div className="mt-3 pt-2 border-t border-[var(--border-primary)]">
              <h5 className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                Key Factors
              </h5>
              <div className="space-y-1">
                {explanation.key_factors.slice(0, 3).map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 text-[10px]"
                  >
                    <span className={factor.impact === 'positive' ? 'text-green-500' : factor.impact === 'negative' ? 'text-red-500' : 'text-gray-400'}>
                      {factor.impact === 'positive' ? '✓' : factor.impact === 'negative' ? '✗' : '•'}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {factor.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Arrow - pointing based on position */}
          <div
            className="absolute w-0 h-0"
            style={{
              ...(position === 'top' && {
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid white',
              }),
              ...(position === 'bottom' && {
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '6px solid white',
              }),
              ...(position === 'left' && {
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderLeft: '6px solid white',
              }),
              ...(position === 'right' && {
                right: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: '6px solid white',
              }),
            }}
          />
        </div>
      )}
    </div>
  );
}

// Simple inline confidence indicator
export function ConfidenceIndicator({
  tier,
  score,
  size = 'sm',
  className = '',
}: {
  tier: ConfidenceTier;
  score?: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const config = tierConfig[tier];
  const TierIcon = config.icon;

  const sizeConfig = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeConfig[size]} ${config.bgColor} ${config.color} ${className}`}
      title={`${config.label}${score !== undefined ? `: ${score}%` : ''}`}
    >
      <TierIcon className={iconSize[size]} />
      {score !== undefined && <span>{score}%</span>}
    </span>
  );
}

export default ConfidenceTooltip;
