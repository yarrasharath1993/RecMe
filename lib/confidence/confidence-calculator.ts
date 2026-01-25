/**
 * Confidence Score Calculator
 * 
 * Calculates data confidence scores by aggregating existing signals:
 * - Source count and quality (TMDB, Wikipedia, Wikidata, etc.)
 * - External ID presence (tmdb_id, imdb_id, wikidata_id)
 * - Data completeness
 * - Manual verification status
 * - Validation consensus
 * 
 * REUSES existing confidence signals scattered throughout the system
 * and aggregates them into a single 0-1 confidence score with breakdown.
 */

export interface ConfidenceInputs {
  // External IDs
  tmdb_id?: number | null;
  imdb_id?: string | null;
  wikidata_id?: string | null;
  
  // Source tracking
  data_sources?: string[];
  
  // Existing confidence signals
  poster_confidence?: number; // 0-1 from image enrichment
  completeness_score?: number; // 0-1 from data completeness
  data_confidence?: number; // 0-1 existing field (may not be populated)
  
  // Verification status
  is_verified?: boolean;
  is_published?: boolean;
  
  // Quality indicators
  has_poster?: boolean;
  has_hero?: boolean;
  has_director?: boolean;
  has_heroine?: boolean;
  has_music_director?: boolean;
  has_producer?: boolean;
  has_synopsis?: boolean;
  has_release_year?: boolean;
  has_genres?: boolean;
  
  // Supporting cast completeness
  supporting_cast_count?: number;
  crew_fields_count?: number; // How many crew fields are filled
  
  // Validation results (from multi-source validator)
  validation_source_count?: number;
  consensus_score?: number; // 0-1 from validation
  
  // Manual interventions
  manual_overrides?: number; // Count of manual edits
  
  // Review and rating quality
  has_our_rating?: boolean;
  has_reviews?: boolean;
  review_count?: number;
}

export interface ConfidenceResult {
  confidence_score: number; // Overall 0.00-1.00
  confidence_breakdown: {
    cast_confidence: number; // 0-1
    metadata_confidence: number; // 0-1
    image_confidence: number; // 0-1
    review_confidence: number; // 0-1
    validation_confidence: number; // 0-1
    sources: string[];
    source_count: number;
    external_ids: number;
    manual_overrides: number;
    completeness: number;
  };
  tier: 'excellent' | 'high' | 'good' | 'medium' | 'low' | 'very_low';
  flags: string[]; // Quality flags
}

/**
 * Calculate confidence score for a movie
 */
export function calculateConfidence(inputs: ConfidenceInputs): ConfidenceResult {
  // Individual confidence components
  const castConfidence = calculateCastConfidence(inputs);
  const metadataConfidence = calculateMetadataConfidence(inputs);
  const imageConfidence = inputs.poster_confidence || (inputs.has_poster ? 0.70 : 0.0);
  const reviewConfidence = calculateReviewConfidence(inputs);
  const validationConfidence = calculateValidationConfidence(inputs);
  
  // Count external IDs
  const external_ids = [
    inputs.tmdb_id,
    inputs.imdb_id,
    inputs.wikidata_id,
  ].filter(id => id != null).length;
  
  // Count data sources
  const source_count = inputs.data_sources?.length || 0;
  
  // Calculate weighted average confidence
  const weights = {
    cast: 0.25,
    metadata: 0.20,
    image: 0.15,
    review: 0.15,
    validation: 0.15,
    sources: 0.05,
    external_ids: 0.05,
  };
  
  let confidence_score = 
    castConfidence * weights.cast +
    metadataConfidence * weights.metadata +
    imageConfidence * weights.image +
    reviewConfidence * weights.review +
    validationConfidence * weights.validation +
    (source_count / 5) * weights.sources + // Max 5 sources expected
    (external_ids / 3) * weights.external_ids; // Max 3 external IDs
  
  // Boost for verification
  if (inputs.is_verified) {
    confidence_score = Math.min(confidence_score + 0.10, 1.0);
  }
  
  // Penalty for manual overrides (suggests data issues)
  if (inputs.manual_overrides && inputs.manual_overrides > 3) {
    confidence_score = Math.max(confidence_score - 0.05, 0.0);
  }
  
  // Use existing data_confidence if available and higher
  if (inputs.data_confidence && inputs.data_confidence > confidence_score) {
    confidence_score = inputs.data_confidence;
  }
  
  // Determine tier
  const tier = getConfidenceTier(confidence_score);
  
  // Generate flags
  const flags = generateFlags(confidence_score, inputs);
  
  return {
    confidence_score: Math.round(confidence_score * 100) / 100, // Round to 2 decimals
    confidence_breakdown: {
      cast_confidence: Math.round(castConfidence * 100) / 100,
      metadata_confidence: Math.round(metadataConfidence * 100) / 100,
      image_confidence: Math.round(imageConfidence * 100) / 100,
      review_confidence: Math.round(reviewConfidence * 100) / 100,
      validation_confidence: Math.round(validationConfidence * 100) / 100,
      sources: inputs.data_sources || [],
      source_count,
      external_ids,
      manual_overrides: inputs.manual_overrides || 0,
      completeness: inputs.completeness_score || 0,
    },
    tier,
    flags,
  };
}

/**
 * Calculate cast confidence (hero, heroine, director, crew)
 */
function calculateCastConfidence(inputs: ConfidenceInputs): number {
  let score = 0;
  let max = 0;
  
  // Core cast (most important)
  if (inputs.has_hero) { score += 0.30; max += 0.30; }
  if (inputs.has_director) { score += 0.30; max += 0.30; }
  if (inputs.has_heroine) { score += 0.20; max += 0.20; }
  
  // Extended cast
  if (inputs.has_music_director) { score += 0.10; max += 0.10; }
  if (inputs.has_producer) { score += 0.05; max += 0.05; }
  
  // Supporting cast and crew
  if (inputs.supporting_cast_count && inputs.supporting_cast_count >= 3) {
    score += 0.05; max += 0.05;
  }
  
  return max > 0 ? score / max : 0;
}

/**
 * Calculate metadata confidence (release info, genres, synopsis)
 */
function calculateMetadataConfidence(inputs: ConfidenceInputs): number {
  let score = 0;
  let max = 0;
  
  // Essential metadata
  if (inputs.has_release_year) { score += 0.30; max += 0.30; }
  if (inputs.has_genres) { score += 0.25; max += 0.25; }
  if (inputs.has_synopsis) { score += 0.20; max += 0.20; }
  
  // Completeness score (if available)
  if (inputs.completeness_score) {
    score += inputs.completeness_score * 0.25;
    max += 0.25;
  }
  
  return max > 0 ? score / max : 0;
}

/**
 * Calculate review confidence (ratings, reviews)
 */
function calculateReviewConfidence(inputs: ConfidenceInputs): number {
  let score = 0;
  
  if (inputs.has_our_rating) score += 0.50;
  if (inputs.has_reviews) score += 0.30;
  if (inputs.review_count && inputs.review_count >= 2) score += 0.20;
  
  return Math.min(score, 1.0);
}

/**
 * Calculate validation confidence (multi-source consensus)
 */
function calculateValidationConfidence(inputs: ConfidenceInputs): number {
  let score = 0;
  
  // Source count
  if (inputs.validation_source_count) {
    if (inputs.validation_source_count >= 3) score += 0.40;
    else if (inputs.validation_source_count >= 2) score += 0.25;
    else score += 0.10;
  }
  
  // Consensus score
  if (inputs.consensus_score) {
    score += inputs.consensus_score * 0.60;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Get confidence tier label
 */
function getConfidenceTier(score: number): 'excellent' | 'high' | 'good' | 'medium' | 'low' | 'very_low' {
  if (score >= 0.90) return 'excellent';
  if (score >= 0.80) return 'high';
  if (score >= 0.70) return 'good';
  if (score >= 0.60) return 'medium';
  if (score >= 0.50) return 'low';
  return 'very_low';
}

/**
 * Generate quality flags
 */
function generateFlags(score: number, inputs: ConfidenceInputs): string[] {
  const flags: string[] = [];
  
  if (score >= 0.90) flags.push('high_quality');
  if (score >= 0.85 && inputs.is_verified) flags.push('verified');
  if (score < 0.60) flags.push('low_confidence');
  if (score < 0.50) flags.push('needs_review');
  
  // Data quality flags
  if (!inputs.has_hero && !inputs.has_director) flags.push('missing_core_cast');
  if (!inputs.has_synopsis) flags.push('missing_synopsis');
  if (!inputs.has_poster) flags.push('missing_poster');
  if (!inputs.has_release_year) flags.push('missing_release_year');
  
  // Source flags
  if (!inputs.tmdb_id && !inputs.imdb_id) flags.push('no_external_ids');
  if (inputs.data_sources && inputs.data_sources.length === 0) flags.push('single_source');
  
  // Manual intervention flags
  if (inputs.manual_overrides && inputs.manual_overrides > 5) {
    flags.push('heavily_edited');
  }
  
  // Validation flags
  if (inputs.validation_source_count && inputs.validation_source_count < 2) {
    flags.push('low_validation');
  }
  
  return flags;
}

/**
 * Batch calculate confidence for multiple movies
 */
export function calculateBatchConfidence(moviesData: ConfidenceInputs[]): ConfidenceResult[] {
  return moviesData.map(movie => calculateConfidence(movie));
}

/**
 * Get confidence score summary statistics
 */
export function getConfidenceStatistics(scores: number[]): {
  mean: number;
  median: number;
  min: number;
  max: number;
  excellent_count: number;
  high_count: number;
  good_count: number;
  medium_count: number;
  low_count: number;
  very_low_count: number;
} {
  if (scores.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      excellent_count: 0,
      high_count: 0,
      good_count: 0,
      medium_count: 0,
      low_count: 0,
      very_low_count: 0,
    };
  }
  
  const sorted = [...scores].sort((a, b) => a - b);
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  
  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: Math.min(...scores),
    max: Math.max(...scores),
    excellent_count: scores.filter(s => s >= 0.90).length,
    high_count: scores.filter(s => s >= 0.80 && s < 0.90).length,
    good_count: scores.filter(s => s >= 0.70 && s < 0.80).length,
    medium_count: scores.filter(s => s >= 0.60 && s < 0.70).length,
    low_count: scores.filter(s => s >= 0.50 && s < 0.60).length,
    very_low_count: scores.filter(s => s < 0.50).length,
  };
}

/**
 * Determine if movie needs confidence recalculation
 */
export function needsConfidenceRecalc(movie: {
  last_confidence_calc?: Date | string | null;
  updated_at?: Date | string | null;
  confidence_score?: number | null;
}): boolean {
  // Always recalc if never calculated
  if (!movie.last_confidence_calc || !movie.confidence_score) {
    return true;
  }
  
  // Recalc if movie updated after last calculation
  if (movie.updated_at) {
    const lastCalc = new Date(movie.last_confidence_calc);
    const updated = new Date(movie.updated_at);
    if (updated > lastCalc) {
      return true;
    }
  }
  
  // Recalc if calculation is older than 7 days
  const lastCalc = new Date(movie.last_confidence_calc);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (lastCalc < sevenDaysAgo) {
    return true;
  }
  
  return false;
}

/**
 * Extract confidence inputs from movie row
 */
export function extractConfidenceInputs(movie: any): ConfidenceInputs {
  // Count data sources from array or derive from presence of IDs
  const dataSources = movie.data_sources || [];
  const derivedSourceCount = dataSources.length > 0 ? dataSources.length : 
    [movie.tmdb_id, movie.imdb_id, movie.wikidata_id].filter(Boolean).length;
  
  return {
    tmdb_id: movie.tmdb_id,
    imdb_id: movie.imdb_id,
    wikidata_id: movie.wikidata_id,
    data_sources: dataSources,
    poster_confidence: movie.poster_confidence || (movie.poster_url ? 0.7 : 0),
    completeness_score: movie.completeness_score || null,
    data_confidence: movie.data_confidence || null,
    is_verified: movie.is_verified || false,
    is_published: movie.is_published || false,
    has_poster: !!movie.poster_url,
    has_hero: !!movie.hero,
    has_director: !!movie.director,
    has_heroine: !!movie.heroine,
    has_music_director: !!movie.music_director,
    has_producer: !!movie.producer,
    has_synopsis: !!movie.synopsis,
    has_release_year: !!movie.release_year,
    has_genres: Array.isArray(movie.genres) && movie.genres.length > 0,
    supporting_cast_count: Array.isArray(movie.supporting_cast) ? movie.supporting_cast.length : 0,
    crew_fields_count: countCrewFields(movie.crew),
    validation_source_count: derivedSourceCount,
    consensus_score: movie.consensus_score || null,
    manual_overrides: 0, // Would need to track in enrichment_changes table
    has_our_rating: !!movie.our_rating,
    has_reviews: (movie.total_reviews || 0) > 0,
    review_count: movie.total_reviews || 0,
  };
}

/**
 * Count filled crew fields
 */
function countCrewFields(crew: any): number {
  if (!crew || typeof crew !== 'object') return 0;
  
  let count = 0;
  const fields = ['cinematographer', 'editor', 'writer', 'choreographer', 'lyricist'];
  
  for (const field of fields) {
    if (crew[field]) count++;
  }
  
  return count;
}
