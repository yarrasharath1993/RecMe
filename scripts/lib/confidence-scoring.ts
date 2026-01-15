/**
 * DATA CONFIDENCE SCORING SYSTEM
 * 
 * Calculates confidence scores (0.0 - 1.0) for each field in movie data
 * based on:
 * - Data source reliability
 * - Cross-source verification
 * - Data freshness
 * - Manual verification
 * - Consistency checks
 * 
 * Usage:
 * ```typescript
 * const score = calculateMovieConfidence(movie, fieldSources);
 * const fieldScore = calculateFieldConfidence('director', value, sources);
 * ```
 */

// Source reliability scores (from multi-source-orchestrator)
export const SOURCE_CONFIDENCE: Record<string, number> = {
  'tmdb': 0.95,
  'imdb': 0.90,
  'wikipedia': 0.85,
  'wikidata': 0.80,
  'letterboxd': 0.92,
  'idlebrain': 0.88,
  'telugu360': 0.80,
  'omdb': 0.75,
  'tupaki': 0.83,
  'gulte': 0.82,
  '123telugu': 0.81,
  'manual': 1.00, // Manual verification gets highest confidence
  'ai': 0.60,     // AI-generated needs review
  'community': 0.50 // Community contributions need verification
};

// Field importance weights (for overall score calculation)
export const FIELD_WEIGHTS: Record<string, number> = {
  // Critical fields (high weight)
  'title_en': 1.0,
  'release_year': 1.0,
  'director': 0.9,
  'genres': 0.9,
  
  // Important fields (medium weight)
  'hero': 0.8,
  'heroine': 0.8,
  'synopsis': 0.7,
  'poster_url': 0.7,
  'runtime_minutes': 0.6,
  
  // Nice-to-have fields (lower weight)
  'music_director': 0.5,
  'producer': 0.5,
  'cinematographer': 0.4,
  'tagline': 0.4,
  'trailer_url': 0.5,
  
  // Optional fields (low weight)
  'synopsis_te': 0.3,
  'certification': 0.3,
  'budget': 0.2,
  'box_office': 0.2
};

export interface FieldSource {
  field: string;
  value: any;
  source: string;
  confidence: number;
  verified_at?: Date;
  verified_by?: string;
}

export interface ConfidenceScore {
  overall: number;
  by_field: Record<string, number>;
  by_category: {
    basic_metadata: number;
    cast_crew: number;
    synopsis: number;
    visual_assets: number;
    ratings: number;
  };
  verification_status: 'unverified' | 'partial' | 'verified' | 'expert_verified';
  needs_review: boolean;
  low_confidence_fields: string[];
}

/**
 * Calculate confidence for a single field value
 */
export function calculateFieldConfidence(
  field: string,
  value: any,
  sources: FieldSource[]
): number {
  if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
    return 0.0; // Missing data has zero confidence
  }

  if (sources.length === 0) {
    return 0.3; // Unknown source, low confidence
  }

  // Find sources that provided this field
  const fieldSources = sources.filter(s => s.field === field);
  
  if (fieldSources.length === 0) {
    return 0.3; // No source info, assume low confidence
  }

  // Sort by confidence
  fieldSources.sort((a, b) => b.confidence - a.confidence);
  
  // Base confidence from best source
  let confidence = fieldSources[0].confidence;
  
  // Boost if manually verified
  const manualVerified = fieldSources.some(s => s.source === 'manual' && s.verified_by);
  if (manualVerified) {
    confidence = Math.min(1.0, confidence + 0.15);
  }
  
  // Boost if multiple sources agree
  if (fieldSources.length >= 2) {
    confidence = Math.min(1.0, confidence + 0.05);
  }
  if (fieldSources.length >= 3) {
    confidence = Math.min(1.0, confidence + 0.05);
  }
  
  // Penalize if AI-generated without review
  const aiGenerated = fieldSources.some(s => s.source === 'ai');
  const humanReviewed = fieldSources.some(s => s.verified_by);
  if (aiGenerated && !humanReviewed) {
    confidence = Math.max(0.4, confidence - 0.15);
  }
  
  // Penalize stale data (> 1 year old)
  const latestVerification = fieldSources
    .filter(s => s.verified_at)
    .map(s => s.verified_at!)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  
  if (latestVerification) {
    const ageInDays = (Date.now() - latestVerification.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 365) {
      confidence = Math.max(0.5, confidence - 0.1);
    }
  }
  
  return Math.max(0.0, Math.min(1.0, confidence));
}

/**
 * Calculate overall movie confidence score
 */
export function calculateMovieConfidence(
  movie: any,
  fieldSources: FieldSource[]
): ConfidenceScore {
  const byField: Record<string, number> = {};
  let weightedSum = 0;
  let totalWeight = 0;
  
  // Calculate confidence for each field
  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    if (movie[field] !== undefined && movie[field] !== null) {
      const fieldConf = calculateFieldConfidence(field, movie[field], fieldSources);
      byField[field] = fieldConf;
      weightedSum += fieldConf * weight;
      totalWeight += weight;
    }
  }
  
  // Overall confidence (weighted average)
  const overall = totalWeight > 0 ? weightedSum / totalWeight : 0.0;
  
  // Calculate by category
  const basicMetadataFields = ['title_en', 'release_year', 'runtime_minutes', 'certification'];
  const castCrewFields = ['director', 'hero', 'heroine', 'music_director', 'producer'];
  const synopsisFields = ['synopsis', 'synopsis_te', 'tagline'];
  const visualFields = ['poster_url', 'backdrop_url'];
  const ratingFields = ['our_rating', 'avg_rating', 'editorial_score'];
  
  const calculateCategoryConfidence = (fields: string[]) => {
    const scores = fields.map(f => byField[f] || 0).filter(s => s > 0);
    return scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0.0;
  };
  
  const byCategory = {
    basic_metadata: calculateCategoryConfidence(basicMetadataFields),
    cast_crew: calculateCategoryConfidence(castCrewFields),
    synopsis: calculateCategoryConfidence(synopsisFields),
    visual_assets: calculateCategoryConfidence(visualFields),
    ratings: calculateCategoryConfidence(ratingFields)
  };
  
  // Determine verification status
  let verificationStatus: 'unverified' | 'partial' | 'verified' | 'expert_verified' = 'unverified';
  
  if (overall >= 0.95) {
    verificationStatus = 'expert_verified';
  } else if (overall >= 0.85) {
    verificationStatus = 'verified';
  } else if (overall >= 0.60) {
    verificationStatus = 'partial';
  }
  
  // Identify low confidence fields that need review
  const lowConfidenceFields = Object.entries(byField)
    .filter(([_, conf]) => conf < 0.70)
    .map(([field, _]) => field);
  
  const needsReview = overall < 0.70 || lowConfidenceFields.length > 3;
  
  return {
    overall: Math.round(overall * 100) / 100,
    by_field: byField,
    by_category: byCategory,
    verification_status: verificationStatus,
    needs_review: needsReview,
    low_confidence_fields: lowConfidenceFields
  };
}

/**
 * Generate field sources from movie data
 * (Used when migrating existing data)
 */
export function inferFieldSources(movie: any): FieldSource[] {
  const sources: FieldSource[] = [];
  
  // If movie has TMDB ID, assume TMDB as source for basic fields
  if (movie.tmdb_id) {
    const tmdbFields = [
      'runtime_minutes', 'certification', 'synopsis', 'poster_url', 
      'backdrop_url', 'trailer_url', 'genres', 'tagline'
    ];
    
    tmdbFields.forEach(field => {
      if (movie[field]) {
        sources.push({
          field,
          value: movie[field],
          source: 'tmdb',
          confidence: SOURCE_CONFIDENCE['tmdb']
        });
      }
    });
  }
  
  // If manually reviewed, mark as manual source
  if (movie.last_reviewed_by) {
    const manualFields = [
      'director', 'hero', 'heroine', 'music_director', 
      'is_blockbuster', 'is_classic', 'is_underrated', 'is_featured'
    ];
    
    manualFields.forEach(field => {
      if (movie[field]) {
        sources.push({
          field,
          value: movie[field],
          source: 'manual',
          confidence: SOURCE_CONFIDENCE['manual'],
          verified_at: movie.last_reviewed_at ? new Date(movie.last_reviewed_at) : undefined,
          verified_by: movie.last_reviewed_by
        });
      }
    });
  }
  
  // If has IMDb ID, assume IMDb as source for ratings
  if (movie.imdb_id && movie.imdb_rating) {
    sources.push({
      field: 'imdb_rating',
      value: movie.imdb_rating,
      source: 'imdb',
      confidence: SOURCE_CONFIDENCE['imdb']
    });
  }
  
  return sources;
}

/**
 * Batch calculate confidence scores for multiple movies
 */
export async function batchCalculateConfidence(
  movies: any[]
): Promise<Map<string, ConfidenceScore>> {
  const results = new Map<string, ConfidenceScore>();
  
  for (const movie of movies) {
    const sources = movie.field_sources 
      ? JSON.parse(movie.field_sources) 
      : inferFieldSources(movie);
    
    const score = calculateMovieConfidence(movie, sources);
    results.set(movie.id, score);
  }
  
  return results;
}

/**
 * Update movie confidence score in database
 */
export async function updateMovieConfidenceScore(
  supabase: any,
  movieId: string,
  score: ConfidenceScore
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('movies')
      .update({
        data_confidence: score.overall,
        updated_at: new Date().toISOString()
      })
      .eq('id', movieId);
    
    return !error;
  } catch (error) {
    console.error(`Error updating confidence for movie ${movieId}:`, error);
    return false;
  }
}

/**
 * Get confidence badge for display
 */
export function getConfidenceBadge(confidence: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (confidence >= 0.95) {
    return {
      label: 'Expert Verified',
      color: 'emerald',
      icon: '✓✓'
    };
  } else if (confidence >= 0.85) {
    return {
      label: 'Verified',
      color: 'green',
      icon: '✓'
    };
  } else if (confidence >= 0.70) {
    return {
      label: 'Good Quality',
      color: 'blue',
      icon: '~'
    };
  } else if (confidence >= 0.50) {
    return {
      label: 'Needs Review',
      color: 'yellow',
      icon: '⚠'
    };
  } else {
    return {
      label: 'Low Quality',
      color: 'red',
      icon: '✗'
    };
  }
}
