/**
 * Governance UI Components
 * 
 * This module exports all UI components related to content governance,
 * trust signals, and data quality indicators.
 */

// Trust indicators
export { TrustBadge, TrustBadgeWithTooltip } from '../TrustBadge';
export type { TrustBadgeProps } from '../TrustBadge';

// Confidence tooltips
export { ConfidenceTooltip } from '../ConfidenceTooltip';
export type { ConfidenceTooltipProps } from '../ConfidenceTooltip';

// Speculative labels
export { SpeculativeLabel, SpeculativeSection } from '../SpeculativeLabel';
export type { SpeculativeLabelProps } from '../SpeculativeLabel';

// Freshness indicators
export { FreshnessIndicator } from '../FreshnessIndicator';

// Disputed data banners
export { DisputedDataBanner, DisputedBadge } from '../DisputedDataBanner';

// Family safe toggle
export { FamilySafeToggle, FamilySafeBadge } from '../FamilySafeToggle';

// Re-export governance types for convenience
export type {
  GovernanceContentType,
  ConfidenceTier,
  TrustExplanation,
  FreshnessStatus,
  TrustLevel,
} from '@/lib/governance/types';
