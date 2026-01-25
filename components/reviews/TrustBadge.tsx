'use client';

/**
 * TrustBadge Component
 * 
 * Visual indicator of content trustworthiness based on
 * data verification and source reliability.
 */

import { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, CheckCircle, Info } from 'lucide-react';
import type { ConfidenceTier, TrustExplanation } from '@/lib/governance/types';

export interface TrustBadgeProps {
  /** Trust score (0-100) */
  score?: number;
  /** Confidence tier */
  tier?: ConfidenceTier;
  /** Whether content is verified */
  isVerified?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the score number */
  showScore?: boolean;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Additional class names */
  className?: string;
}

// Determine tier from score if not provided
function getTierFromScore(score: number): ConfidenceTier {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

const tierConfig: Record<ConfidenceTier, {
  icon: typeof ShieldCheck;
  color: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
  label: string;
}> = {
  high: {
    icon: ShieldCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    ringColor: 'ring-green-500/30',
    label: 'Verified',
  },
  medium: {
    icon: ShieldAlert,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    ringColor: 'ring-yellow-500/30',
    label: 'Partially Verified',
  },
  low: {
    icon: ShieldX,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    ringColor: 'ring-red-500/30',
    label: 'Low Confidence',
  },
  unverified: {
    icon: Shield,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    ringColor: 'ring-gray-500/30',
    label: 'Unverified',
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-1.5 py-0.5 text-[10px] gap-1',
    icon: 'w-3 h-3',
    score: 'text-[10px]',
  },
  md: {
    badge: 'px-2 py-1 text-xs gap-1.5',
    icon: 'w-4 h-4',
    score: 'text-xs',
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm gap-2',
    icon: 'w-5 h-5',
    score: 'text-sm',
  },
};

export function TrustBadge({
  score,
  tier: propTier,
  isVerified,
  size = 'md',
  showScore = false,
  showLabel = true,
  label: customLabel,
  className = '',
}: TrustBadgeProps) {
  // Determine tier
  const tier = propTier || (score !== undefined ? getTierFromScore(score) : 'medium');
  const config = tierConfig[tier];
  const sizes = sizeConfig[size];
  const TierIcon = config.icon;

  // Use verified checkmark if explicitly verified
  const Icon = isVerified ? CheckCircle : TierIcon;
  const displayLabel = customLabel || config.label;

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${sizes.badge}
        ${config.bgColor}
        ${config.color}
        ${className}
      `}
      title={`Trust Score: ${score !== undefined ? score + '%' : tier}`}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span>{displayLabel}</span>}
      {showScore && score !== undefined && (
        <span className={`font-mono font-bold ${sizes.score}`}>
          {score}%
        </span>
      )}
    </span>
  );
}

// Extended TrustBadge with tooltip
interface TrustBadgeWithTooltipProps extends TrustBadgeProps {
  /** Trust explanation for tooltip */
  explanation?: TrustExplanation;
  /** Last verified date */
  lastVerified?: string;
  /** Sources list */
  sources?: string[];
}

export function TrustBadgeWithTooltip({
  score,
  tier: propTier,
  isVerified,
  size = 'md',
  showScore = true,
  showLabel = true,
  label: customLabel,
  explanation,
  lastVerified,
  sources,
  className = '',
}: TrustBadgeWithTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine tier
  const tier = propTier || (score !== undefined ? getTierFromScore(score) : 'medium');
  const config = tierConfig[tier];
  const sizes = sizeConfig[size];
  const TierIcon = config.icon;

  const Icon = isVerified ? CheckCircle : TierIcon;
  const displayLabel = customLabel || config.label;

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className={`
          inline-flex items-center font-medium rounded-full cursor-pointer
          transition-all duration-200
          ${sizes.badge}
          ${config.bgColor}
          ${config.color}
          hover:ring-2 ${config.ringColor}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={`Trust Score: ${score !== undefined ? score + '%' : tier}`}
      >
        <Icon className={sizes.icon} />
        {showLabel && <span>{displayLabel}</span>}
        {showScore && score !== undefined && (
          <span className={`font-mono font-bold ${sizes.score}`}>
            {score}%
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg shadow-xl border bg-white"
          style={{
            borderColor: 'var(--border-primary, #e5e7eb)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--border-primary)]">
            <div className="flex items-center gap-2">
              <TierIcon className={`w-5 h-5 ${config.color}`} />
              <span className={`text-sm font-semibold ${config.color}`}>
                {displayLabel}
              </span>
            </div>
            {score !== undefined && (
              <span className={`text-lg font-mono font-bold ${config.color}`}>
                {score}%
              </span>
            )}
          </div>

          {/* Explanation */}
          {explanation?.summary && (
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              {explanation.summary}
            </p>
          )}

          {/* Key factors */}
          {explanation?.key_factors && explanation.key_factors.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {explanation.key_factors.slice(0, 3).map((factor, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className={factor.impact === 'positive' ? 'text-green-500' : factor.impact === 'negative' ? 'text-red-500' : 'text-gray-400'}>
                    {factor.impact === 'positive' ? '✓' : factor.impact === 'negative' ? '✗' : '•'}
                  </span>
                  <span className="text-[var(--text-tertiary)]">
                    {factor.description}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Sources */}
          {sources && sources.length > 0 && (
            <div className="text-[10px] text-[var(--text-tertiary)]">
              <span className="font-medium">Sources: </span>
              {sources.join(', ')}
            </div>
          )}

          {/* Last verified */}
          {lastVerified && (
            <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
              <span className="font-medium">Last verified: </span>
              {new Date(lastVerified).toLocaleDateString()}
            </div>
          )}

          {/* Arrow */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white',
            }}
          />
        </div>
      )}
    </div>
  );
}

// Simple verified checkmark
export function VerifiedBadge({
  size = 'sm',
  className = '',
}: {
  size?: 'sm' | 'md';
  className?: string;
}) {
  const sizeConfig = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  return (
    <CheckCircle
      className={`${sizeConfig[size]} text-blue-500 ${className}`}
      aria-label="Verified"
    />
  );
}

export default TrustBadge;
