/**
 * CONFIDENCE THRESHOLDS CONFIGURATION
 * 
 * Centralized configuration for all confidence-based auto-fix decisions.
 * Allows fine-tuning of automation aggressiveness vs. safety.
 * 
 * Usage:
 *   import { CONFIDENCE_THRESHOLDS, shouldAutoFix } from './confidence-config';
 *   
 *   if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX.reattribute) {
 *     // Auto-apply re-attribution
 *   }
 */

// ============================================================
// CONFIDENCE THRESHOLDS
// ============================================================

export interface ConfidenceThresholds {
  AUTO_FIX: {
    reattribute: number;
    add_missing: number;
    fix_tmdb_id: number;
    fill_tech_credits: number;
    fix_duplicates: number;
  };
  FLAG_FOR_REVIEW: {
    reattribute: number;
    add_missing: number;
    fix_tmdb_id: number;
    fill_tech_credits: number;
  };
  MANUAL_REQUIRED: {
    min_confidence: number;
  };
  SOURCES: {
    tmdb: number;
    letterboxd: number;
    rottentomatoes: number;
    imdb: number;
    idlebrain: number;
    bookmyshow: number;
    eenadu: number;
    sakshi: number;
    tupaki: number;
    gulte: number;
    '123telugu': number;
    telugu360: number;
    telugucinema: number;
    filmibeat: number;
    m9news: number;
    wikipedia: number;
    greatandhra: number;
    cinejosh: number;
    wikidata: number;
    omdb: number;
    archive_org: number;
  };
}

/**
 * Default confidence thresholds
 * 
 * AUTO_FIX: High confidence, apply automatically
 * FLAG_FOR_REVIEW: Medium confidence, flag for manual review
 * MANUAL_REQUIRED: Low confidence, skip auto-fix entirely
 */
export const CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  AUTO_FIX: {
    reattribute: 0.85, // Re-attribute ghost entries if 85%+ confident
    add_missing: 0.85, // Add missing films if 85%+ confident
    fix_tmdb_id: 0.80, // Fix wrong TMDB IDs if 80%+ confident
    fill_tech_credits: 0.75, // Fill technical credits if 75%+ confident
    fix_duplicates: 0.90, // Remove duplicates if 90%+ confident
  },
  FLAG_FOR_REVIEW: {
    reattribute: 0.60, // Flag re-attribution if 60-85% confident
    add_missing: 0.70, // Flag missing films if 70-85% confident
    fix_tmdb_id: 0.60, // Flag TMDB ID fixes if 60-80% confident
    fill_tech_credits: 0.50, // Flag tech credits if 50-75% confident
  },
  MANUAL_REQUIRED: {
    min_confidence: 0.50, // Below 50%, always require manual review
  },
  SOURCES: {
    tmdb: 0.95, // TMDB is highly reliable for Indian films
    letterboxd: 0.92, // Letterboxd has verified community data with editorial oversight
    rottentomatoes: 0.90, // RottenTomatoes has verified cast/crew by editorial team
    imdb: 0.90, // IMDb is comprehensive but sometimes has data issues
    idlebrain: 0.88, // IdleBrain is Telugu-specific with accurate transliterations
    bookmyshow: 0.88, // BookMyShow has official theater booking data
    eenadu: 0.86, // Eenadu is major Telugu news portal with structured reviews
    wikipedia: 0.85, // Wikipedia is good for Indian cinema
    greatandhra: 0.85, // GreatAndhra is Telugu-specific review source
    sakshi: 0.84, // Sakshi is major Telugu news portal with ratings
    tupaki: 0.83, // Tupaki has Telugu-specific structured reviews
    gulte: 0.82, // Gulte offers technical analysis with engaging reviews
    cinejosh: 0.82, // CineJosh has structured review metadata
    '123telugu': 0.81, // 123Telugu is popular Telugu film review site
    telugu360: 0.80, // Telugu360 has succinct reviews and OTT tracking
    wikidata: 0.80, // Wikidata is structured but may have gaps
    telugucinema: 0.79, // TeluguCinema dedicated Telugu cinema news
    filmibeat: 0.77, // FilmiBeat multi-language entertainment portal
    omdb: 0.75, // OMDB is convenient but limited detail
    m9news: 0.75, // M9News Telugu news portal with structured reviews
    archive_org: 0.70, // Archives are good for historical content
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if confidence is high enough for auto-fix
 */
export function shouldAutoFix(
  action: keyof ConfidenceThresholds['AUTO_FIX'],
  confidence: number
): boolean {
  return confidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX[action];
}

/**
 * Check if confidence warrants flagging for review
 */
export function shouldFlagForReview(
  action: keyof ConfidenceThresholds['FLAG_FOR_REVIEW'],
  confidence: number
): boolean {
  const autoFixThreshold = CONFIDENCE_THRESHOLDS.AUTO_FIX[action];
  const flagThreshold = CONFIDENCE_THRESHOLDS.FLAG_FOR_REVIEW[action];
  
  return confidence >= flagThreshold && confidence < autoFixThreshold;
}

/**
 * Check if confidence is too low (manual review required)
 */
export function requiresManualReview(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLDS.MANUAL_REQUIRED.min_confidence;
}

/**
 * Get action based on confidence level
 */
export function getActionForConfidence(
  action: keyof ConfidenceThresholds['AUTO_FIX'] & keyof ConfidenceThresholds['FLAG_FOR_REVIEW'],
  confidence: number
): 'auto_fix' | 'flag_review' | 'manual_required' {
  if (shouldAutoFix(action, confidence)) {
    return 'auto_fix';
  }
  
  if (shouldFlagForReview(action, confidence)) {
    return 'flag_review';
  }
  
  return 'manual_required';
}

/**
 * Override thresholds from CLI arguments
 * 
 * Example: --threshold-reattribute=0.90 --threshold-fill-tech-credits=0.80
 */
export function overrideThresholdsFromArgs(args: string[]): void {
  for (const arg of args) {
    if (arg.startsWith('--threshold-')) {
      const match = arg.match(/--threshold-([\w-]+)=([\d.]+)/);
      if (!match) continue;

      const [, key, value] = match;
      const normalizedKey = key.replace(/-/g, '_') as keyof ConfidenceThresholds['AUTO_FIX'];
      const numValue = parseFloat(value);

      if (normalizedKey in CONFIDENCE_THRESHOLDS.AUTO_FIX && !isNaN(numValue)) {
        CONFIDENCE_THRESHOLDS.AUTO_FIX[normalizedKey] = numValue;
        console.log(`  Confidence threshold override: ${normalizedKey} = ${numValue}`);
      }
    }
  }
}

// ============================================================
// CONFIDENCE CALCULATION HELPERS
// ============================================================

/**
 * Calculate weighted average confidence from multiple sources
 */
export function calculateWeightedConfidence(
  sources: Array<{ sourceId: keyof ConfidenceThresholds['SOURCES']; confidence: number }>
): number {
  if (sources.length === 0) return 0;

  const totalWeight = sources.reduce((sum, s) => sum + CONFIDENCE_THRESHOLDS.SOURCES[s.sourceId], 0);
  const weightedSum = sources.reduce((sum, s) => sum + s.confidence * CONFIDENCE_THRESHOLDS.SOURCES[s.sourceId], 0);

  return weightedSum / totalWeight;
}

/**
 * Boost confidence if multiple sources agree
 */
export function boostConfidenceForConsensus(
  baseConfidence: number,
  sourceCount: number
): number {
  // Perfect consensus (all sources agree): boost by 10%
  if (sourceCount >= 4) {
    return Math.min(0.98, baseConfidence * 1.1);
  }

  // Strong consensus (3 sources): boost by 5%
  if (sourceCount === 3) {
    return Math.min(0.95, baseConfidence * 1.05);
  }

  // Weak consensus (2 sources): no boost
  if (sourceCount === 2) {
    return baseConfidence;
  }

  // Single source: reduce by 25%
  return baseConfidence * 0.75;
}

/**
 * Reduce confidence for conflicts
 */
export function reduceConfidenceForConflict(
  baseConfidence: number,
  conflictCount: number
): number {
  // Each additional conflicting value reduces confidence by 20%
  const reductionFactor = Math.pow(0.8, conflictCount - 1);
  return baseConfidence * reductionFactor;
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validate that confidence is within valid range [0, 1]
 */
export function validateConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Get confidence tier label
 */
export function getConfidenceTier(confidence: number): 'high' | 'medium' | 'low' | 'very_low' {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.70) return 'medium';
  if (confidence >= 0.50) return 'low';
  return 'very_low';
}

/**
 * Get confidence tier description
 */
export function getConfidenceTierDescription(tier: 'high' | 'medium' | 'low' | 'very_low'): string {
  const descriptions = {
    high: 'High confidence: Safe for auto-apply',
    medium: 'Medium confidence: Flag for review',
    low: 'Low confidence: Manual review recommended',
    very_low: 'Very low confidence: Manual review required',
  };
  return descriptions[tier];
}

// ============================================================
// EXPORT FOR CLI
// ============================================================

/**
 * Print current threshold configuration
 */
export function printThresholds(): void {
  console.log('Current Confidence Thresholds:');
  console.log('');
  console.log('AUTO-FIX (apply automatically):');
  console.log(`  Re-attribute ghosts:     ${CONFIDENCE_THRESHOLDS.AUTO_FIX.reattribute * 100}%`);
  console.log(`  Add missing films:       ${CONFIDENCE_THRESHOLDS.AUTO_FIX.add_missing * 100}%`);
  console.log(`  Fix wrong TMDB IDs:      ${CONFIDENCE_THRESHOLDS.AUTO_FIX.fix_tmdb_id * 100}%`);
  console.log(`  Fill tech credits:       ${CONFIDENCE_THRESHOLDS.AUTO_FIX.fill_tech_credits * 100}%`);
  console.log(`  Remove duplicates:       ${CONFIDENCE_THRESHOLDS.AUTO_FIX.fix_duplicates * 100}%`);
  console.log('');
  console.log('FLAG FOR REVIEW (manual review recommended):');
  console.log(`  Re-attribute ghosts:     ${CONFIDENCE_THRESHOLDS.FLAG_FOR_REVIEW.reattribute * 100}%`);
  console.log(`  Add missing films:       ${CONFIDENCE_THRESHOLDS.FLAG_FOR_REVIEW.add_missing * 100}%`);
  console.log(`  Fix wrong TMDB IDs:      ${CONFIDENCE_THRESHOLDS.FLAG_FOR_REVIEW.fix_tmdb_id * 100}%`);
  console.log(`  Fill tech credits:       ${CONFIDENCE_THRESHOLDS.FLAG_FOR_REVIEW.fill_tech_credits * 100}%`);
  console.log('');
  console.log('SOURCE CONFIDENCE:');
  console.log(`  TMDB:                    ${CONFIDENCE_THRESHOLDS.SOURCES.tmdb * 100}%`);
  console.log(`  Letterboxd:              ${CONFIDENCE_THRESHOLDS.SOURCES.letterboxd * 100}%`);
  console.log(`  RottenTomatoes:          ${CONFIDENCE_THRESHOLDS.SOURCES.rottentomatoes * 100}%`);
  console.log(`  IMDb:                    ${CONFIDENCE_THRESHOLDS.SOURCES.imdb * 100}%`);
  console.log(`  IdleBrain (Telugu):      ${CONFIDENCE_THRESHOLDS.SOURCES.idlebrain * 100}%`);
  console.log(`  BookMyShow:              ${CONFIDENCE_THRESHOLDS.SOURCES.bookmyshow * 100}%`);
  console.log(`  Wikipedia:               ${CONFIDENCE_THRESHOLDS.SOURCES.wikipedia * 100}%`);
  console.log(`  GreatAndhra (Telugu):    ${CONFIDENCE_THRESHOLDS.SOURCES.greatandhra * 100}%`);
  console.log(`  CineJosh (Telugu):       ${CONFIDENCE_THRESHOLDS.SOURCES.cinejosh * 100}%`);
  console.log(`  Wikidata:                ${CONFIDENCE_THRESHOLDS.SOURCES.wikidata * 100}%`);
  console.log(`  OMDB:                    ${CONFIDENCE_THRESHOLDS.SOURCES.omdb * 100}%`);
  console.log('');
}
