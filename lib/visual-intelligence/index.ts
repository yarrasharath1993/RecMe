/**
 * VISUAL INTELLIGENCE MODULE
 * 
 * Provides archival-grade poster handling with a 3-tier visual system:
 * 
 * Tier 1 (Confidence 0.9-1.0): Original posters from TMDB, IMDB, verified sources
 * Tier 2 (Confidence 0.6-0.8): Archival materials (stills, magazine ads, etc.)
 * Tier 3 (Confidence 0.3-0.5): Archive reference cards or placeholders
 * 
 * Key Principles:
 * - Never generate AI/fake posters
 * - Never overwrite existing valid poster data
 * - Transparent visual provenance
 * - Additive, non-destructive operations
 */

// Types
export * from './types';

// Visual Confidence Calculator
export {
  isPlaceholderUrl,
  isTMDBUrl,
  isVerifiedSource,
  isArchivalSource,
  detectVisualType,
  calculateConfidenceScore,
  getTierFromVisualType,
  getSourceFromUrl,
  calculateVisualConfidence,
  batchCalculateVisualConfidence,
  determineArchiveReason,
  needsArchiveCard,
} from './visual-confidence';

// Archive Card Generator
export {
  generateArchiveCardData,
  batchGenerateArchiveCards,
  validateArchiveCardData,
  serializeArchiveCardData,
  deserializeArchiveCardData,
  getArchiveReasonDisplay,
  getArchiveCardSubtitle,
  getVerificationStatus,
} from './archive-card-generator';

// Archival Sources Library
export {
  KNOWN_SOURCES,
  getKnownSource,
  getSourcesByType,
  getSourcesByTier,
  calculateArchivalConfidence,
  getTierFromSourceType,
  generateAttributionText,
  getVisualDisplayLabel,
  getSuggestedLicense,
  requiresAttribution,
  getSourceBadgeColor,
  getVisualTypeBadgeColor,
  generateNFAIRequestEmail,
  generateFamilyOutreachTemplate,
  validateArchivalSource,
  isTrustedSourceUrl,
} from './archival-sources';

export type { KnownArchivalSource } from './archival-sources';

