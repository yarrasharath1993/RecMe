/**
 * SMART REVIEW DERIVATION ENGINE
 * 
 * Derives structured smart review fields from movie metadata and existing reviews.
 * This is designed to be additive - it does not modify existing review content.
 * 
 * Key Principles:
 * - Derive from existing data, don't invent
 * - Flag fields that need human verification
 * - Provide confidence scores for derived fields
 */

import { createClient } from '@supabase/supabase-js';
import type {
  SmartReviewFields,
  SmartReviewDerivationInput,
  LegacyStatus,
  BestOfTags,
  MoodType,
  DEFAULT_SMART_REVIEW_FIELDS,
  DEFAULT_BEST_OF_TAGS,
} from './smart-review.types';

// ============================================================
// SUPABASE CLIENT
// ============================================================

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// ============================================================
// GENRE-BASED DERIVATIONS
// ============================================================

/**
 * Map genres to content warnings
 */
const GENRE_CONTENT_WARNINGS: Record<string, string[]> = {
  Horror: ['frightening_scenes', 'violence'],
  Thriller: ['violence', 'mature_themes'],
  Action: ['violence'],
  Crime: ['violence', 'mature_themes'],
  War: ['violence', 'gore'],
  Drama: ['mature_themes'],
  Romance: [],
  Comedy: [],
  Family: [],
};

/**
 * Map genres to mood suitability
 */
const GENRE_MOODS: Record<string, MoodType[]> = {
  Action: ['action-packed', 'intense', 'thrilling'],
  Drama: ['emotional', 'thought-provoking'],
  Comedy: ['light-hearted', 'feel-good'],
  Romance: ['romantic', 'emotional'],
  Thriller: ['intense', 'thrilling'],
  Horror: ['dark', 'intense'],
  Family: ['family-friendly', 'feel-good'],
  Fantasy: ['feel-good', 'inspirational'],
  Crime: ['intense', 'thought-provoking'],
  Mystery: ['thought-provoking', 'thrilling'],
};

/**
 * Map genres to "why to watch" reasons
 */
const GENRE_WATCH_REASONS: Record<string, string[]> = {
  Action: ['Thrilling action sequences', 'High-octane entertainment'],
  Drama: ['Emotionally engaging story', 'Strong character development'],
  Comedy: ['Guaranteed laughs', 'Light-hearted entertainment'],
  Romance: ['Heartwarming love story', 'Great chemistry between leads'],
  Thriller: ['Edge-of-seat suspense', 'Gripping narrative'],
  Horror: ['Genuinely scary moments', 'Atmospheric tension'],
  Family: ['Fun for all ages', 'Wholesome entertainment'],
  Fantasy: ['Imaginative world-building', 'Visual spectacle'],
  Crime: ['Intriguing plot twists', 'Compelling characters'],
  Mystery: ['Engaging whodunit', 'Keeps you guessing'],
};

// ============================================================
// DERIVATION HELPERS
// ============================================================

/**
 * Derive content warnings from genres and certification
 */
function deriveContentWarnings(
  genres: string[] | null | undefined,
  certification: string | null | undefined
): string[] {
  const warnings = new Set<string>();

  // Genre-based warnings
  if (genres) {
    genres.forEach(genre => {
      const genreWarnings = GENRE_CONTENT_WARNINGS[genre];
      if (genreWarnings) {
        genreWarnings.forEach(w => warnings.add(w));
      }
    });
  }

  // Certification-based warnings
  if (certification === 'A') {
    warnings.add('mature_themes');
  }

  return Array.from(warnings);
}

/**
 * Derive mood suitability from genres and existing signals
 */
function deriveMoodSuitability(
  genres: string[] | null | undefined,
  existingSignals: any
): string[] {
  const moods = new Set<string>();

  // Use existing audience signals if available
  if (existingSignals?.mood && Array.isArray(existingSignals.mood)) {
    existingSignals.mood.forEach((m: string) => moods.add(m));
  }

  // Derive from genres
  if (genres) {
    genres.forEach(genre => {
      const genreMoods = GENRE_MOODS[genre];
      if (genreMoods) {
        genreMoods.forEach(m => moods.add(m));
      }
    });
  }

  return Array.from(moods);
}

/**
 * Derive "why to watch" reasons
 */
function deriveWhyToWatch(input: SmartReviewDerivationInput): string[] {
  const reasons: string[] = [];
  const { movie, review } = input;

  // From existing review strengths
  if (review?.strengths && Array.isArray(review.strengths)) {
    reasons.push(...review.strengths.slice(0, 3));
  }

  // From ratings
  if ((movie.avg_rating || 0) >= 8) {
    reasons.push('Highly rated by audiences');
  }

  // From tags
  if (movie.is_blockbuster) {
    reasons.push('Box office blockbuster');
  }
  if (movie.is_classic) {
    reasons.push('Acclaimed classic');
  }
  if (movie.is_underrated) {
    reasons.push('Hidden gem worth discovering');
  }

  // From genres
  if (movie.genres) {
    movie.genres.slice(0, 2).forEach(genre => {
      const genreReasons = GENRE_WATCH_REASONS[genre];
      if (genreReasons && genreReasons.length > 0) {
        reasons.push(genreReasons[0]);
      }
    });
  }

  // From best-of tags (if calculated)
  if (input.actorStats?.bestRatedFilmId === movie.id) {
    reasons.push(`${movie.hero}'s finest performance`);
  }
  if (input.directorStats?.bestRatedFilmId === movie.id) {
    reasons.push(`${movie.director}'s best work`);
  }

  // Deduplicate and limit
  return [...new Set(reasons)].slice(0, 5);
}

/**
 * Derive "why to skip" reasons
 */
function deriveWhyToSkip(input: SmartReviewDerivationInput): string[] {
  const reasons: string[] = [];
  const { movie, review } = input;

  // From existing review weaknesses
  if (review?.weaknesses && Array.isArray(review.weaknesses)) {
    reasons.push(...review.weaknesses.slice(0, 2));
  }

  // From certification
  if (movie.certification === 'A') {
    reasons.push('Not suitable for all audiences (Adult)');
  }

  // From genres (potential issues for some viewers)
  if (movie.genres) {
    if (movie.genres.includes('Horror')) {
      reasons.push('Contains frightening scenes');
    }
    if (movie.genres.includes('War')) {
      reasons.push('Contains war violence');
    }
  }

  // From ratings
  if ((movie.avg_rating || 0) < 5) {
    reasons.push('Below average ratings');
  }

  // From verdict
  if (movie.verdict === 'disaster' || movie.verdict === 'flop') {
    reasons.push('Poor critical reception');
  }

  return [...new Set(reasons)].slice(0, 3);
}

/**
 * Derive legacy status
 */
function deriveLegacyStatus(movie: SmartReviewDerivationInput['movie']): LegacyStatus {
  // Cult classic indicators
  if (movie.is_cult) {
    return 'cult_classic';
  }

  // Landmark indicators
  if (movie.is_classic && movie.is_blockbuster) {
    return 'landmark';
  }

  // Forgotten gem indicators
  if (movie.is_underrated && (movie.avg_rating || 0) >= 7) {
    return 'forgotten_gem';
  }

  // Mainstream indicators
  if (movie.is_blockbuster) {
    return 'mainstream';
  }

  // Classic but not blockbuster might be landmark or forgotten gem
  if (movie.is_classic) {
    if ((movie.avg_rating || 0) >= 8) {
      return 'landmark';
    }
    return 'forgotten_gem';
  }

  return null;
}

/**
 * Derive critics POV from review data
 */
function deriveCriticsPOV(review: SmartReviewDerivationInput['review']): string | null {
  if (!review) return null;

  // Use existing summary or verdict
  if (review.summary) {
    return review.summary;
  }

  if (review.verdict) {
    return review.verdict;
  }

  return null;
}

/**
 * Derive audience POV from review dimensions
 */
function deriveAudiencePOV(
  movie: SmartReviewDerivationInput['movie'],
  review: SmartReviewDerivationInput['review']
): string | null {
  const dimensions = review?.dimensions;
  if (!dimensions) {
    // Fallback to generic based on rating
    if ((movie.avg_rating || 0) >= 8) {
      return 'Audiences loved this film';
    } else if ((movie.avg_rating || 0) >= 6) {
      return 'Audiences found this film entertaining';
    } else if ((movie.avg_rating || 0) >= 4) {
      return 'Mixed audience reception';
    }
    return null;
  }

  // Derive from mass_vs_class dimensions
  const massAppeal = dimensions.mass_vs_class?.mass || 0;
  const classAppeal = dimensions.mass_vs_class?.class || 0;

  if (massAppeal >= 8) {
    return 'A crowd-pleaser with mass appeal';
  } else if (classAppeal >= 8) {
    return 'Appreciated by discerning viewers';
  } else if (massAppeal >= 6 && classAppeal >= 6) {
    return 'Balanced appeal for diverse audiences';
  }

  return null;
}

/**
 * Derive era significance
 */
function deriveEraSignificance(movie: SmartReviewDerivationInput['movie']): string | null {
  const year = movie.release_year;
  if (!year) return null;

  // Very old films
  if (year < 1960) {
    if (movie.is_classic) {
      return 'A foundational work of Telugu cinema';
    }
    return 'Part of Telugu cinema\'s early history';
  }

  // Golden era
  if (year >= 1960 && year < 1980) {
    if (movie.is_classic || movie.is_blockbuster) {
      return 'A defining film of the golden era';
    }
    return null;
  }

  // 80s-90s
  if (year >= 1980 && year < 2000) {
    if (movie.is_blockbuster) {
      return 'A blockbuster of the star-driven era';
    }
    return null;
  }

  // 2000s onwards
  if (year >= 2000) {
    if (movie.is_blockbuster && movie.verdict === 'all_time_blockbuster') {
      return 'A modern Telugu cinema milestone';
    }
    return null;
  }

  return null;
}

/**
 * Calculate best-of tags
 */
function deriveBestOfTags(input: SmartReviewDerivationInput): BestOfTags {
  const { movie, actorStats, directorStats, musicStats } = input;
  const movieRating = movie.avg_rating || 0;

  return {
    actor_best: actorStats?.bestRatedFilmId === movie.id ||
      (actorStats && movieRating > actorStats.avgRating + 1),
    director_best: directorStats?.bestRatedFilmId === movie.id ||
      (directorStats && movieRating > directorStats.avgRating + 1),
    music_best: musicStats?.bestRatedFilmId === movie.id ||
      (musicStats && movieRating > musicStats.avgRating + 1),
  };
}

/**
 * Calculate overall derivation confidence
 */
function calculateDerivationConfidence(
  input: SmartReviewDerivationInput,
  derived: Partial<SmartReviewFields>
): number {
  let confidence = 0;
  let factors = 0;

  // Has review data
  if (input.review) {
    confidence += 0.3;
    factors++;
  }

  // Has ratings
  if (input.movie.avg_rating) {
    confidence += 0.2;
    factors++;
  }

  // Has genres
  if (input.movie.genres && input.movie.genres.length > 0) {
    confidence += 0.15;
    factors++;
  }

  // Has classification tags
  if (input.movie.is_blockbuster || input.movie.is_classic || input.movie.is_cult) {
    confidence += 0.15;
    factors++;
  }

  // Has filmography stats for comparison
  if (input.actorStats || input.directorStats) {
    confidence += 0.1;
    factors++;
  }

  // Has derived content
  if ((derived.why_to_watch?.length || 0) > 0) {
    confidence += 0.05;
    factors++;
  }

  if ((derived.mood_suitability?.length || 0) > 0) {
    confidence += 0.05;
    factors++;
  }

  return factors > 0 ? Math.min(confidence, 1) : 0;
}

// ============================================================
// MAIN DERIVATION FUNCTION
// ============================================================

/**
 * Derive smart review fields from movie metadata
 * This function is ADDITIVE - it does not modify existing data
 */
export function deriveSmartReviewFields(
  input: SmartReviewDerivationInput
): SmartReviewFields {
  const { movie, review } = input;

  const derived: SmartReviewFields = {
    why_to_watch: deriveWhyToWatch(input),
    why_to_skip: deriveWhyToSkip(input),
    critics_pov: deriveCriticsPOV(review),
    audience_pov: deriveAudiencePOV(movie, review),
    legacy_status: deriveLegacyStatus(movie),
    mood_suitability: deriveMoodSuitability(movie.genres, review?.audience_signals),
    content_warnings: deriveContentWarnings(movie.genres, movie.certification),
    best_of_tags: deriveBestOfTags(input),
    era_significance: deriveEraSignificance(movie),
    derivation_confidence: 0, // Will be calculated below
  };

  // Calculate overall confidence
  derived.derivation_confidence = calculateDerivationConfidence(input, derived);

  return derived;
}

/**
 * Determine which fields need human review
 */
export function getFieldsNeedingReview(
  derived: SmartReviewFields
): string[] {
  const fieldsToReview: string[] = [];

  // Low-confidence derivations need review
  if (derived.derivation_confidence < 0.5) {
    fieldsToReview.push('derivation_confidence');
  }

  // Era significance is often speculative
  if (derived.era_significance) {
    fieldsToReview.push('era_significance');
  }

  // Legacy status needs verification
  if (derived.legacy_status) {
    fieldsToReview.push('legacy_status');
  }

  // Content warnings can be sensitive
  if (derived.content_warnings.length > 0) {
    fieldsToReview.push('content_warnings');
  }

  // Why to skip reasons can be controversial
  if (derived.why_to_skip.length > 0) {
    fieldsToReview.push('why_to_skip');
  }

  return fieldsToReview;
}

// ============================================================
// DATABASE INTEGRATION
// ============================================================

/**
 * Derive and store smart review for a movie
 * This is the main entry point for the derivation pipeline
 */
export async function deriveAndStoreSmartReview(
  movieId: string
): Promise<{ success: boolean; data?: SmartReviewFields; error?: string }> {
  const supabase = getSupabaseClient();

  try {
    // Fetch movie data
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single();

    if (movieError || !movie) {
      return { success: false, error: `Movie not found: ${movieId}` };
    }

    // Fetch review data if exists
    const { data: review } = await supabase
      .from('movie_reviews')
      .select('*')
      .eq('movie_id', movieId)
      .single();

    // Build derivation input
    const input: SmartReviewDerivationInput = {
      movie: {
        id: movie.id,
        title_en: movie.title_en,
        release_year: movie.release_year,
        genres: movie.genres,
        hero: movie.hero,
        heroine: movie.heroine,
        director: movie.director,
        music_director: movie.music_director,
        certification: movie.certification,
        era: movie.era,
        is_blockbuster: movie.is_blockbuster,
        is_classic: movie.is_classic,
        is_cult: movie.is_cult,
        is_underrated: movie.is_underrated,
        avg_rating: movie.avg_rating,
        verdict: movie.verdict,
        tags: movie.tags,
      },
      review: review ? {
        overall_rating: review.overall_rating,
        strengths: review.strengths,
        weaknesses: review.weaknesses,
        dimensions: review.dimensions_json || review.dimensions,
        audience_signals: review.audience_signals,
        summary: review.summary,
        verdict: review.verdict,
      } : null,
    };

    // Derive smart review fields
    const smartReview = deriveSmartReviewFields(input);
    const fieldsNeedingReview = getFieldsNeedingReview(smartReview);

    // Store in database (only if review exists)
    if (review) {
      const { error: updateError } = await supabase
        .from('movie_reviews')
        .update({
          smart_review: smartReview,
          smart_review_derived_at: new Date().toISOString(),
          needs_human_review: fieldsNeedingReview.length > 0,
        })
        .eq('id', review.id);

      if (updateError) {
        return { success: false, error: `Failed to update review: ${updateError.message}` };
      }
    }

    return { success: true, data: smartReview };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Batch derive smart reviews for multiple movies
 */
export async function batchDeriveSmartReviews(
  movieIds: string[],
  options?: { batchSize?: number }
): Promise<{ success: number; failed: number; errors: string[] }> {
  const batchSize = options?.batchSize || 10;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < movieIds.length; i += batchSize) {
    const batch = movieIds.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(id => deriveAndStoreSmartReview(id))
    );

    results.forEach((result, index) => {
      if (result.success) {
        success++;
      } else {
        failed++;
        errors.push(`${batch[index]}: ${result.error}`);
      }
    });

    console.log(`Processed ${Math.min(i + batchSize, movieIds.length)}/${movieIds.length} movies`);
  }

  return { success, failed, errors };
}

