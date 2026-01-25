/**
 * Feature Flags Configuration
 * 
 * Controls gradual rollout of new features:
 * - Movie Impact Analysis
 * - Confidence Scoring
 * - Auto-fill Data Gaps
 * - Counterfactual Analysis
 * - Inference Review (Admin)
 * 
 * Usage:
 *   import { FEATURES } from '@/lib/config/feature-flags';
 *   
 *   if (FEATURES.MOVIE_IMPACT_ANALYSIS) {
 *     // Show movie impact section
 *   }
 */

// ============================================================
// FEATURE FLAGS
// ============================================================

export const FEATURES = {
  /**
   * Movie Impact Analysis
   * Shows "Why This Movie Matters", "Career Impact", and counterfactual sections
   * Rollout: Week 1 (Top 100) → Week 2 (Rating > 7) → Week 3 (All)
   */
  MOVIE_IMPACT_ANALYSIS: process.env.NEXT_PUBLIC_FEATURE_MOVIE_IMPACT === 'true' || false,
  
  /**
   * Confidence Scoring Display
   * Shows confidence scores and data quality indicators
   * Rollout: Week 3 (Admin only) → Week 4 (Public)
   */
  CONFIDENCE_SCORING: process.env.NEXT_PUBLIC_FEATURE_CONFIDENCE === 'true' || false,
  
  /**
   * Auto-fill Data Gaps
   * Enables pattern-based inference for missing data
   * Rollout: Week 4 (Admin only) → Week 5 (Background jobs)
   */
  AUTO_FILL_GAPS: process.env.NEXT_PUBLIC_FEATURE_AUTO_FILL === 'true' || false,
  
  /**
   * Counterfactual "What If" Analysis
   * Shows counterfactual scenarios for significant movies
   * Rollout: Week 2 (Top 50) → Week 3 (Rating > 7.5) → Week 4 (All)
   */
  COUNTERFACTUAL_ANALYSIS: process.env.NEXT_PUBLIC_FEATURE_COUNTERFACTUAL === 'true' || false,
  
  /**
   * Inference Review Interface (Admin)
   * Admin panel for reviewing and approving auto-inferred data
   * Rollout: Week 4 (Admin only)
   */
  INFERENCE_REVIEW: process.env.NEXT_PUBLIC_FEATURE_INFERENCE_REVIEW === 'true' || false,
  
  /**
   * Entity Relations Queries
   * Use entity_relations table for filmography and collaboration queries
   * Rollout: Week 5 (After data population)
   */
  ENTITY_RELATIONS: process.env.NEXT_PUBLIC_FEATURE_ENTITY_RELATIONS === 'true' || false,
};

/**
 * Check if movie qualifies for impact analysis based on rollout phase
 */
export function shouldShowImpactAnalysis(movie: {
  our_rating?: number;
  avg_rating?: number;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  release_year?: number;
}): boolean {
  if (!FEATURES.MOVIE_IMPACT_ANALYSIS) return false;
  
  // Phase 1: Top movies only (rating > 7.5 OR blockbuster OR classic)
  const isTopMovie = 
    (movie.our_rating && movie.our_rating >= 7.5) ||
    (movie.avg_rating && movie.avg_rating >= 7.5) ||
    movie.is_blockbuster ||
    movie.is_classic;
  
  // Phase 2: All rated movies (rating > 6.5)
  const isRatedMovie = 
    (movie.our_rating && movie.our_rating >= 6.5) ||
    (movie.avg_rating && movie.avg_rating >= 6.5);
  
  // For gradual rollout, check environment variable for phase
  const rolloutPhase = process.env.NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE || '1';
  
  if (rolloutPhase === '1') return isTopMovie;
  if (rolloutPhase === '2') return isRatedMovie;
  return true; // Phase 3: All movies
}

/**
 * Check if counterfactual analysis should be shown
 */
export function shouldShowCounterfactual(movie: {
  our_rating?: number;
  avg_rating?: number;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  impact_analysis?: any;
}): boolean {
  if (!FEATURES.COUNTERFACTUAL_ANALYSIS) return false;
  
  // Only show for movies with calculated impact analysis
  if (!movie.impact_analysis) return false;
  
  // Must be significant movie
  const isSignificant = 
    movie.impact_analysis.significance_tier === 'landmark' ||
    movie.impact_analysis.significance_tier === 'influential' ||
    movie.is_blockbuster ||
    movie.is_classic;
  
  return isSignificant;
}

/**
 * Check if confidence score should be displayed
 */
export function shouldShowConfidence(isAdmin: boolean = false): boolean {
  if (!FEATURES.CONFIDENCE_SCORING) return false;
  
  // Phase 1: Admin only
  const adminOnlyPhase = process.env.NEXT_PUBLIC_CONFIDENCE_ADMIN_ONLY === 'true';
  
  if (adminOnlyPhase) return isAdmin;
  return true; // Phase 2: Public
}

/**
 * Check if auto-fill can be triggered
 */
export function canAutoFill(isAdmin: boolean = false): boolean {
  if (!FEATURES.AUTO_FILL_GAPS) return false;
  
  // Admin-only feature
  return isAdmin;
}

/**
 * Check if inference review interface is accessible
 */
export function canAccessInferenceReview(isAdmin: boolean = false): boolean {
  if (!FEATURES.INFERENCE_REVIEW) return false;
  
  // Admin-only feature
  return isAdmin;
}

/**
 * Check if entity relations should be used for queries
 */
export function useEntityRelations(): boolean {
  return FEATURES.ENTITY_RELATIONS;
}

// ============================================================
// ROLLOUT TRACKING
// ============================================================

export interface RolloutStatus {
  feature: string;
  enabled: boolean;
  phase: string;
  description: string;
  rollout_date?: string;
}

/**
 * Get rollout status for all features
 */
export function getRolloutStatus(): RolloutStatus[] {
  return [
    {
      feature: 'Movie Impact Analysis',
      enabled: FEATURES.MOVIE_IMPACT_ANALYSIS,
      phase: process.env.NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE || '1',
      description: 'Career impact, industry influence, and counterfactual analysis',
      rollout_date: '2026-01-22',
    },
    {
      feature: 'Confidence Scoring',
      enabled: FEATURES.CONFIDENCE_SCORING,
      phase: process.env.NEXT_PUBLIC_CONFIDENCE_ADMIN_ONLY === 'true' ? '1 (Admin)' : '2 (Public)',
      description: 'Data quality indicators and confidence scores',
      rollout_date: '2026-01-29',
    },
    {
      feature: 'Auto-fill Data Gaps',
      enabled: FEATURES.AUTO_FILL_GAPS,
      phase: '1 (Admin)',
      description: 'Pattern-based inference for missing music directors, producers',
      rollout_date: '2026-02-05',
    },
    {
      feature: 'Counterfactual Analysis',
      enabled: FEATURES.COUNTERFACTUAL_ANALYSIS,
      phase: process.env.NEXT_PUBLIC_COUNTERFACTUAL_PHASE || '1',
      description: '"What if this movie didn\'t exist?" scenarios',
      rollout_date: '2026-01-22',
    },
    {
      feature: 'Inference Review',
      enabled: FEATURES.INFERENCE_REVIEW,
      phase: '1 (Admin)',
      description: 'Admin panel for reviewing auto-inferred data',
      rollout_date: '2026-02-05',
    },
    {
      feature: 'Entity Relations',
      enabled: FEATURES.ENTITY_RELATIONS,
      phase: process.env.NEXT_PUBLIC_ENTITY_RELATIONS_PHASE || '1',
      description: 'Normalized relationship queries for filmography and collaborations',
      rollout_date: '2026-02-12',
    },
  ];
}

/**
 * Log feature usage for analytics
 */
export function logFeatureUsage(
  feature: keyof typeof FEATURES,
  context?: Record<string, any>
) {
  if (typeof window === 'undefined') return; // Server-side
  
  // In production, this would send to analytics service
  console.log('[Feature Usage]', feature, context);
  
  // Example: Send to analytics
  // analytics.track('feature_used', {
  //   feature,
  //   enabled: FEATURES[feature],
  //   ...context,
  // });
}

// ============================================================
// ENVIRONMENT SETUP HELPER
// ============================================================

/**
 * Generate .env.local template with all feature flags
 */
export function generateEnvTemplate(): string {
  return `# Feature Flags for Movie Impact & Intelligence System

# Movie Impact Analysis (Week 1-3 rollout)
NEXT_PUBLIC_FEATURE_MOVIE_IMPACT=false
NEXT_PUBLIC_IMPACT_ROLLOUT_PHASE=1  # 1=Top100, 2=Rated>6.5, 3=All

# Confidence Scoring (Week 3-4 rollout)
NEXT_PUBLIC_FEATURE_CONFIDENCE=false
NEXT_PUBLIC_CONFIDENCE_ADMIN_ONLY=true  # Phase 1: Admin only

# Auto-fill Data Gaps (Week 4+, Admin only)
NEXT_PUBLIC_FEATURE_AUTO_FILL=false

# Counterfactual Analysis (Week 2-4 rollout)
NEXT_PUBLIC_FEATURE_COUNTERFACTUAL=false
NEXT_PUBLIC_COUNTERFACTUAL_PHASE=1  # 1=Top50, 2=Rated>7.5, 3=All

# Inference Review (Week 4+, Admin only)
NEXT_PUBLIC_FEATURE_INFERENCE_REVIEW=false

# Entity Relations (Week 5+)
NEXT_PUBLIC_FEATURE_ENTITY_RELATIONS=false
NEXT_PUBLIC_ENTITY_RELATIONS_PHASE=1  # 1=Beta, 2=Full rollout
`;
}

// ============================================================
// EXPORTS
// ============================================================

export default FEATURES;
