/**
 * CLAIM CLASSIFIER
 * 
 * Classifies data fields as FACTS, OPINIONS, or DERIVED values.
 * Facts are verifiable from external sources.
 * Opinions are subjective assessments.
 * Derived values are calculated from other data.
 */

import { z } from 'zod';

// ============================================================
// TYPES
// ============================================================

export type ClaimType = 'fact' | 'opinion' | 'derived' | 'unknown';

export interface ClassifiedClaim {
  field: string;
  value: unknown;
  claimType: ClaimType;
  confidence: number;
  sources?: string[];
  derivedFrom?: string[];
  justification: string;
}

export interface ClaimClassificationResult {
  claims: ClassifiedClaim[];
  factCount: number;
  opinionCount: number;
  derivedCount: number;
  unknownCount: number;
  overallReliability: number;
}

// ============================================================
// CLAIM TYPE DEFINITIONS
// ============================================================

/**
 * Fields that are FACTS - verifiable from external sources
 */
export const FACT_FIELDS = new Set([
  // Core identity
  'title', 'original_title', 'title_en',
  'tmdb_id', 'imdb_id',
  
  // Release info
  'release_date', 'release_year',
  
  // Production facts
  'director', 'producer', 'music_director',
  'hero', 'heroine', 'cast', 'crew',
  'runtime', 'budget', 'revenue', 'box_office',
  
  // Classification
  'language', 'original_language', 'country',
  'genres', 'certification',
  
  // External ratings
  'imdb_rating', 'imdb_votes', 'rotten_tomatoes_score',
  
  // Media
  'poster_path', 'backdrop_path', 'poster_url',
  
  // Celebrity facts
  'date_of_birth', 'date_of_death', 'place_of_birth',
  'nationality', 'filmography_count',
]);

/**
 * Fields that are OPINIONS - subjective assessments
 */
export const OPINION_FIELDS = new Set([
  // Editorial ratings
  'avg_rating', 'editorial_rating', 'our_rating',
  'performance_rating', 'direction_rating', 'music_rating',
  'story_rating', 'technical_rating',
  
  // Reviews
  'review_text', 'verdict', 'one_liner',
  'pros', 'cons', 'summary',
  
  // Recommendations
  'watch_status', 'recommendation', 'audience_fit',
  
  // Subjective tags
  'mood_tags', 'content_flags', 'trigger_warnings',
  
  // Editorial content
  'cultural_significance', 'legacy_status',
  'critical_acclaim', 'fan_reception',
]);

/**
 * Fields that are DERIVED - calculated from other data
 */
export const DERIVED_FIELDS = new Set([
  // Calculated ratings
  'weighted_rating', 'normalized_rating', 'combined_score',
  
  // Aggregations
  'total_movies', 'career_span', 'average_rating',
  'hits_count', 'flops_count', 'success_rate',
  
  // Computed flags
  'is_classic', 'is_blockbuster', 'is_cult',
  
  // Derived dates
  'decade', 'era',
  
  // Computed relationships
  'similar_movies', 'collaborations',
  
  // Stats
  'confidence_score', 'data_completeness',
]);

// ============================================================
// CLASSIFICATION LOGIC
// ============================================================

/**
 * Classify a single claim/field
 */
export function classifyClaim(field: string, value: unknown): ClassifiedClaim {
  // Check known classifications
  if (FACT_FIELDS.has(field)) {
    return {
      field,
      value,
      claimType: 'fact',
      confidence: 0.95,
      justification: 'Field is verifiable from external sources',
    };
  }

  if (OPINION_FIELDS.has(field)) {
    return {
      field,
      value,
      claimType: 'opinion',
      confidence: 0.90,
      justification: 'Field represents subjective assessment',
    };
  }

  if (DERIVED_FIELDS.has(field)) {
    return {
      field,
      value,
      claimType: 'derived',
      confidence: 0.85,
      justification: 'Field is calculated from other data',
    };
  }

  // Heuristic classification for unknown fields
  return classifyByHeuristics(field, value);
}

/**
 * Heuristic classification for unknown fields
 */
function classifyByHeuristics(field: string, value: unknown): ClassifiedClaim {
  const lowerField = field.toLowerCase();
  
  // Rating-like fields are opinions
  if (lowerField.includes('rating') || lowerField.includes('score')) {
    return {
      field,
      value,
      claimType: 'opinion',
      confidence: 0.7,
      justification: 'Field name suggests subjective rating',
    };
  }

  // Count/total fields are often derived
  if (lowerField.includes('count') || lowerField.includes('total') || lowerField.includes('average')) {
    return {
      field,
      value,
      claimType: 'derived',
      confidence: 0.7,
      justification: 'Field name suggests calculated value',
    };
  }

  // ID fields are facts
  if (lowerField.endsWith('_id') || lowerField.endsWith('Id')) {
    return {
      field,
      value,
      claimType: 'fact',
      confidence: 0.8,
      justification: 'Field is an identifier reference',
    };
  }

  // Date fields are facts
  if (lowerField.includes('date') || lowerField.includes('_at')) {
    return {
      field,
      value,
      claimType: 'fact',
      confidence: 0.75,
      justification: 'Field represents a date/time',
    };
  }

  // Description/text fields could be opinions
  if (typeof value === 'string' && (value as string).length > 100) {
    return {
      field,
      value,
      claimType: 'opinion',
      confidence: 0.6,
      justification: 'Long text field likely contains subjective content',
    };
  }

  // Unknown
  return {
    field,
    value,
    claimType: 'unknown',
    confidence: 0.5,
    justification: 'Cannot determine claim type from field name or value',
  };
}

/**
 * Classify all fields in an object
 */
export function classifyAllClaims(data: Record<string, unknown>): ClaimClassificationResult {
  const claims: ClassifiedClaim[] = [];
  let factCount = 0;
  let opinionCount = 0;
  let derivedCount = 0;
  let unknownCount = 0;

  for (const [field, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    
    const claim = classifyClaim(field, value);
    claims.push(claim);

    switch (claim.claimType) {
      case 'fact': factCount++; break;
      case 'opinion': opinionCount++; break;
      case 'derived': derivedCount++; break;
      case 'unknown': unknownCount++; break;
    }
  }

  // Calculate reliability (more facts = more reliable)
  const total = claims.length || 1;
  const overallReliability = (factCount * 1.0 + derivedCount * 0.8 + opinionCount * 0.5 + unknownCount * 0.3) / total;

  return {
    claims,
    factCount,
    opinionCount,
    derivedCount,
    unknownCount,
    overallReliability: Math.min(1, overallReliability),
  };
}

/**
 * Get only facts from data
 */
export function extractFacts(data: Record<string, unknown>): Record<string, unknown> {
  const facts: Record<string, unknown> = {};
  
  for (const [field, value] of Object.entries(data)) {
    if (FACT_FIELDS.has(field)) {
      facts[field] = value;
    }
  }
  
  return facts;
}

/**
 * Get only opinions from data
 */
export function extractOpinions(data: Record<string, unknown>): Record<string, unknown> {
  const opinions: Record<string, unknown> = {};
  
  for (const [field, value] of Object.entries(data)) {
    if (OPINION_FIELDS.has(field)) {
      opinions[field] = value;
    }
  }
  
  return opinions;
}

/**
 * Validate that opinions are clearly labeled
 */
export function validateOpinionLabeling(
  data: Record<string, unknown>
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const [field, value] of Object.entries(data)) {
    const claim = classifyClaim(field, value);
    
    // Check if opinions might be mistaken for facts
    if (claim.claimType === 'opinion') {
      // Flag if opinion field has a "factual" name
      if (field.includes('_is') || field.includes('official')) {
        issues.push(`Opinion field "${field}" has factual-sounding name`);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// ============================================================
// ZOD SCHEMA FOR CLASSIFIED DATA
// ============================================================

export const ClassifiedClaimSchema = z.object({
  field: z.string(),
  value: z.unknown(),
  claimType: z.enum(['fact', 'opinion', 'derived', 'unknown']),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()).optional(),
  derivedFrom: z.array(z.string()).optional(),
  justification: z.string(),
});

export const ClaimClassificationResultSchema = z.object({
  claims: z.array(ClassifiedClaimSchema),
  factCount: z.number(),
  opinionCount: z.number(),
  derivedCount: z.number(),
  unknownCount: z.number(),
  overallReliability: z.number().min(0).max(1),
});

