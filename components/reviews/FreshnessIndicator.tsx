'use client';

/**
 * FreshnessIndicator Component
 * 
 * Displays the freshness/staleness of data with visual feedback.
 * Part of the governance UI system.
 */

import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

type FreshnessStatus = 'fresh' | 'stale' | 'outdated' | 'expired';

interface FreshnessIndicatorProps {
  /** Freshness score 0-100 */
  score?: number;
  /** Last verification date */
  lastVerified?: string | Date | null;
  /** Override status */
  status?: FreshnessStatus;
  /** Show label text */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

const statusConfig: Record<FreshnessStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}> = {
  fresh: {
    label: 'Fresh',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Data verified recently',
  },
  stale: {
    label: 'Stale',
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    description: 'Data may need updating',
  },
  outdated: {
    label: 'Outdated',
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'Data needs verification',
  },
  expired: {
    label: 'Expired',
    icon: RefreshCw,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    description: 'Data requires revalidation',
  },
};

function getStatusFromScore(score: number): FreshnessStatus {
  if (score >= 75) return 'fresh';
  if (score >= 50) return 'stale';
  if (score >= 25) return 'outdated';
  return 'expired';
}

function getStatusFromDate(lastVerified: Date): FreshnessStatus {
  const now = new Date();
  const daysSinceVerification = Math.floor(
    (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceVerification <= 30) return 'fresh';
  if (daysSinceVerification <= 90) return 'stale';
  if (daysSinceVerification <= 180) return 'outdated';
  return 'expired';
}

function formatDate(date: Date): string {
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Yesterday';
  if (daysDiff < 7) return `${daysDiff} days ago`;
  if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
  if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} months ago`;
  return `${Math.floor(daysDiff / 365)} years ago`;
}

export function FreshnessIndicator({
  score,
  lastVerified,
  status: overrideStatus,
  showLabel = true,
  size = 'sm',
  className = '',
}: FreshnessIndicatorProps) {
  // Determine status
  let status: FreshnessStatus = 'stale';
  
  if (overrideStatus) {
    status = overrideStatus;
  } else if (score !== undefined) {
    status = getStatusFromScore(score);
  } else if (lastVerified) {
    const date = typeof lastVerified === 'string' ? new Date(lastVerified) : lastVerified;
    status = getStatusFromDate(date);
  }

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  const lastVerifiedDate = lastVerified
    ? (typeof lastVerified === 'string' ? new Date(lastVerified) : lastVerified)
    : null;

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} ${config.bgColor} ${config.color} px-2 py-0.5 rounded-full ${className}`}
      title={`${config.description}${lastVerifiedDate ? ` (${formatDate(lastVerifiedDate)})` : ''}`}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && (
        <span className="font-medium">{config.label}</span>
      )}
      {lastVerifiedDate && size === 'md' && (
        <span className="opacity-70">• {formatDate(lastVerifiedDate)}</span>
      )}
    </div>
  );
}

// Compact version for inline use
export function FreshnessDot({
  score,
  lastVerified,
  status: overrideStatus,
  className = '',
}: Omit<FreshnessIndicatorProps, 'showLabel' | 'size'>) {
  let status: FreshnessStatus = 'stale';
  
  if (overrideStatus) {
    status = overrideStatus;
  } else if (score !== undefined) {
    status = getStatusFromScore(score);
  } else if (lastVerified) {
    const date = typeof lastVerified === 'string' ? new Date(lastVerified) : lastVerified;
    status = getStatusFromDate(date);
  }

  const config = statusConfig[status];

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} ${className}`}
      title={config.description}
    />
  );
}

export default FreshnessIndicator;
