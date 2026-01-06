/**
 * EDITORIAL SCORE ENGINE
 * 
 * Derives editorial scores for movies without external ratings (IMDB, TMDB, RT).
 * Uses weighted combination of:
 * - Genre + Era baseline (30%)
 * - Comparable movies - director/hero average ratings (40%)
 * - Metadata signals - awards, classic status, popularity (30%)
 * 
 * Usage:
 *   import { calculateEditorialScore } from '@/lib/reviews/editorial-score-engine';
 *   const result = await calculateEditorialScore(movie);
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

export interface Movie {
  id: string;
  title_en: string;
  release_year?: number;
  genres?: string[];
  director?: string;
  hero?: string;
  heroine?: string;
  our_rating?: number;
  avg_rating?: number;
  is_classic?: boolean;
  is_blockbuster?: boolean;
  is_underrated?: boolean;
  awards?: unknown[];
  tmdb_popularity?: number;
  has_wikipedia?: boolean;
}

export interface EditorialScoreFactors {
  // Component 1: Genre + Era Baseline (30%)
  genre_baseline: number;
  era_adjustment: number;
  
  // Component 2: Comparable Movies (40%)
  director_average: number;
  hero_average: number;
  heroine_average: number;
  comparable_confidence: number;
  
  // Component 3: Metadata Signals (30%)
  awards_bonus: number;
  classic_bonus: number;
  popularity_bonus: number;
  metadata_total: number;
}

export interface EditorialScoreResult {
  score: number;
  confidence: number;
  breakdown: EditorialScoreFactors;
  source: 'editorial_derived';
  needs_review: boolean;
  reasoning: string;
}

// ============================================================
// CONSTANTS
// ============================================================

// Genre baseline scores (out of 10)
const GENRE_BASELINES: Record<string, number> = {
  'Action': 6.5,
  'Drama': 7.0,
  'Comedy': 6.3,
  'Romance': 6.5,
  'Thriller': 6.8,
  'Horror': 6.0,
  'Family': 6.5,
  'Fantasy': 6.5,
  'Crime': 6.8,
  'Mystery': 6.7,
  'Adventure': 6.5,
  'Animation': 7.0,
  'Musical': 6.5,
  'Historical': 7.0,
  'Biographical': 7.2,
  'War': 6.8,
  'Sports': 6.5,
  'Documentary': 7.5,
};

// Era adjustments
const ERA_ADJUSTMENTS: Record<string, number> = {
  '1940s': 0.8,  // Very old classics get bonus
  '1950s': 0.7,
  '1960s': 0.6,
  '1970s': 0.5,
  '1980s': 0.4,
  '1990s': 0.3,
  '2000s': 0.1,
  '2010s': 0.0,
  '2020s': 0.0,
};

// Weight configuration
const WEIGHTS = {
  genre: 0.30,
  comparable: 0.40,
  metadata: 0.30,
};

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
// COMPONENT 1: Genre + Era Baseline
// ============================================================

function getGenreBaseline(genres: string[] | undefined): number {
  if (!genres || genres.length === 0) {
    return 6.5; // Default baseline
  }
  
  // Average of all genre baselines
  let total = 0;
  let count = 0;
  
  for (const genre of genres) {
    const baseline = GENRE_BASELINES[genre];
    if (baseline) {
      total += baseline;
      count++;
    }
  }
  
  return count > 0 ? total / count : 6.5;
}

function getEraAdjustment(year: number | undefined): number {
  if (!year) return 0;
  
  const decade = `${Math.floor(year / 10) * 10}s`;
  return ERA_ADJUSTMENTS[decade] || 0;
}

// ============================================================
// COMPONENT 2: Comparable Movies (Director/Cast Average)
// ============================================================

async function getDirectorAverageRating(director: string | undefined): Promise<{ avg: number; count: number }> {
  if (!director || director === 'Unknown') {
    return { avg: 0, count: 0 };
  }
  
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('movies')
    .select('our_rating, avg_rating')
    .eq('director', director)
    .or('our_rating.not.is.null,avg_rating.not.is.null');
  
  if (error || !data || data.length === 0) {
    return { avg: 0, count: 0 };
  }
  
  // Calculate average from available ratings
  const ratings = data
    .map(m => m.our_rating || m.avg_rating)
    .filter((r): r is number => r !== null && r > 0);
  
  if (ratings.length === 0) {
    return { avg: 0, count: 0 };
  }
  
  const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return { avg, count: ratings.length };
}

async function getCastAverageRating(
  hero: string | undefined,
  heroine: string | undefined
): Promise<{ heroAvg: number; heroineAvg: number; heroCount: number; heroineCount: number }> {
  const supabase = getSupabaseClient();
  
  let heroAvg = 0, heroineAvg = 0, heroCount = 0, heroineCount = 0;
  
  // Get hero's average
  if (hero && hero !== 'Unknown') {
    const { data } = await supabase
      .from('movies')
      .select('our_rating, avg_rating')
      .eq('hero', hero)
      .or('our_rating.not.is.null,avg_rating.not.is.null');
    
    if (data && data.length > 0) {
      const ratings = data
        .map(m => m.our_rating || m.avg_rating)
        .filter((r): r is number => r !== null && r > 0);
      
      if (ratings.length > 0) {
        heroAvg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        heroCount = ratings.length;
      }
    }
  }
  
  // Get heroine's average
  if (heroine && heroine !== 'Unknown' && heroine !== 'N/A') {
    const { data } = await supabase
      .from('movies')
      .select('our_rating, avg_rating')
      .eq('heroine', heroine)
      .or('our_rating.not.is.null,avg_rating.not.is.null');
    
    if (data && data.length > 0) {
      const ratings = data
        .map(m => m.our_rating || m.avg_rating)
        .filter((r): r is number => r !== null && r > 0);
      
      if (ratings.length > 0) {
        heroineAvg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        heroineCount = ratings.length;
      }
    }
  }
  
  return { heroAvg, heroineAvg, heroCount, heroineCount };
}

// ============================================================
// COMPONENT 3: Metadata Signals
// ============================================================

function calculateMetadataBonus(movie: Movie): {
  awards_bonus: number;
  classic_bonus: number;
  popularity_bonus: number;
  total: number;
} {
  let awards_bonus = 0;
  let classic_bonus = 0;
  let popularity_bonus = 0;
  
  // Awards bonus (up to 1.0)
  if (movie.awards && Array.isArray(movie.awards) && movie.awards.length > 0) {
    awards_bonus = Math.min(1.0, movie.awards.length * 0.2);
  }
  
  // Classic/Blockbuster bonus
  if (movie.is_classic) {
    classic_bonus += 0.5;
  }
  if (movie.is_blockbuster) {
    classic_bonus += 0.3;
  }
  if (movie.is_underrated) {
    classic_bonus += 0.2; // Hidden gems
  }
  
  // Popularity bonus (normalized from TMDB popularity)
  if (movie.tmdb_popularity) {
    // TMDB popularity typically ranges from 0-100+
    // Normalize to 0-0.5
    popularity_bonus = Math.min(0.5, movie.tmdb_popularity / 200);
  }
  
  // Wikipedia presence bonus
  if (movie.has_wikipedia) {
    popularity_bonus += 0.2;
  }
  
  const total = awards_bonus + classic_bonus + popularity_bonus;
  
  return {
    awards_bonus,
    classic_bonus,
    popularity_bonus,
    total: Math.min(2.0, total), // Cap at 2.0
  };
}

// ============================================================
// MAIN SCORE CALCULATION
// ============================================================

export async function calculateEditorialScore(movie: Movie): Promise<EditorialScoreResult> {
  // Component 1: Genre + Era baseline
  const genre_baseline = getGenreBaseline(movie.genres);
  const era_adjustment = getEraAdjustment(movie.release_year);
  const genreScore = genre_baseline + era_adjustment;
  
  // Component 2: Comparable movies
  const directorResult = await getDirectorAverageRating(movie.director);
  const castResult = await getCastAverageRating(movie.hero, movie.heroine);
  
  // Use the best available comparable score
  const comparableScores = [
    directorResult.avg,
    castResult.heroAvg,
    castResult.heroineAvg,
  ].filter(s => s > 0);
  
  const comparableAvg = comparableScores.length > 0
    ? comparableScores.reduce((sum, s) => sum + s, 0) / comparableScores.length
    : 0;
  
  const comparableConfidence = Math.min(1.0, 
    (directorResult.count + castResult.heroCount + castResult.heroineCount) / 20
  );
  
  // Component 3: Metadata signals
  const metadata = calculateMetadataBonus(movie);
  
  // Weighted combination
  let finalScore: number;
  let reasoning: string;
  
  if (comparableAvg > 0) {
    // We have comparable data - use full formula
    finalScore = 
      (genreScore * WEIGHTS.genre) +
      (comparableAvg * WEIGHTS.comparable) +
      ((genre_baseline + metadata.total) * WEIGHTS.metadata);
    
    reasoning = `Based on ${movie.director}'s filmography and ${movie.hero}'s track record`;
  } else {
    // No comparable data - rely more on genre/era and metadata
    finalScore = genreScore + (metadata.total * 0.5);
    reasoning = `Based on genre baseline and era significance (limited comparable data)`;
  }
  
  // Clamp to valid range
  finalScore = Math.min(10, Math.max(1, finalScore));
  
  // Round to 1 decimal
  finalScore = Math.round(finalScore * 10) / 10;
  
  // Calculate overall confidence
  const confidence = comparableAvg > 0
    ? Math.min(0.9, 0.5 + (comparableConfidence * 0.4))
    : 0.4; // Low confidence without comparable data
  
  // Determine if needs review
  const needs_review = confidence < 0.6 || comparableScores.length < 2;
  
  return {
    score: finalScore,
    confidence,
    breakdown: {
      genre_baseline,
      era_adjustment,
      director_average: directorResult.avg,
      hero_average: castResult.heroAvg,
      heroine_average: castResult.heroineAvg,
      comparable_confidence: comparableConfidence,
      awards_bonus: metadata.awards_bonus,
      classic_bonus: metadata.classic_bonus,
      popularity_bonus: metadata.popularity_bonus,
      metadata_total: metadata.total,
    },
    source: 'editorial_derived',
    needs_review,
    reasoning,
  };
}

// ============================================================
// BATCH PROCESSING
// ============================================================

export async function calculateEditorialScoresForUnrated(
  limit: number = 100
): Promise<{ movieId: string; result: EditorialScoreResult }[]> {
  const supabase = getSupabaseClient();
  
  // Get movies without any ratings
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, genres, director, hero, heroine, is_classic, is_blockbuster, is_underrated, tmdb_popularity')
    .eq('language', 'Telugu')
    .is('our_rating', null)
    .order('release_year', { ascending: false })
    .limit(limit);
  
  if (error || !movies) {
    console.error('Error fetching unrated movies:', error);
    return [];
  }
  
  const results: { movieId: string; result: EditorialScoreResult }[] = [];
  
  for (const movie of movies) {
    const result = await calculateEditorialScore(movie);
    results.push({ movieId: movie.id, result });
  }
  
  return results;
}

// ============================================================
// EXPORTS
// ============================================================

export {
  GENRE_BASELINES,
  ERA_ADJUSTMENTS,
  WEIGHTS,
};

