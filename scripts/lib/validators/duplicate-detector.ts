/**
 * DUPLICATE DETECTOR
 * 
 * Comprehensive duplicate detection for movies:
 * - Exact duplicates (same title + year, slug, or external IDs)
 * - Fuzzy duplicates (similar titles, transliteration variants, typos)
 * - Potential duplicates (manual review required)
 */

import {
  areMoviesDuplicates,
  identifyVariationReason,
  type DuplicateMatchResult,
} from './fuzzy-matcher';

// ============================================================
// TYPES
// ============================================================

export interface MovieSummary {
  id: string;
  title_en: string;
  title_te?: string | null;
  release_year?: number | null;
  slug?: string;
  tmdb_id?: number | null;
  imdb_id?: string | null;
  director?: string | null;
  hero?: string | null;
  heroine?: string | null;
}

export interface ExactDuplicate {
  movie1: MovieSummary;
  movie2: MovieSummary;
  matchType: 'exact_title_year' | 'exact_slug' | 'same_tmdb_id' | 'same_imdb_id' | 'exact_telugu_title_year';
  confidence: number;
  action: 'merge_recommended' | 'investigate';
}

export interface FuzzyDuplicate {
  movie1: MovieSummary;
  movie2: MovieSummary;
  titleSimilarity: number;
  yearDiff: number;
  confidence: number;
  likelyReason: string;
  matchType: 'fuzzy_high' | 'fuzzy_medium' | 'fuzzy_low';
  requiresManualReview: boolean;
}

export interface DuplicateDetectionResult {
  exactDuplicates: ExactDuplicate[];
  fuzzyDuplicates: FuzzyDuplicate[];
  totalMoviesChecked: number;
  duplicatePairsFound: number;
}

// ============================================================
// EXACT DUPLICATE DETECTION
// ============================================================

/**
 * Find exact duplicates by title + year
 */
export function findExactTitleYearDuplicates(movies: MovieSummary[]): ExactDuplicate[] {
  const duplicates: ExactDuplicate[] = [];
  const seen = new Map<string, MovieSummary>();

  for (const movie of movies) {
    const key = `${movie.title_en.toLowerCase().trim()}|${movie.release_year || 'unknown'}`;
    
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      // Only add if IDs are different (same ID = same movie)
      if (existing.id !== movie.id) {
        duplicates.push({
          movie1: existing,
          movie2: movie,
          matchType: 'exact_title_year',
          confidence: 1.0,
          action: 'merge_recommended',
        });
      }
    } else {
      seen.set(key, movie);
    }
  }

  return duplicates;
}

/**
 * Find exact duplicates by Telugu title + year
 */
export function findExactTeluguTitleDuplicates(movies: MovieSummary[]): ExactDuplicate[] {
  const duplicates: ExactDuplicate[] = [];
  const seen = new Map<string, MovieSummary>();

  for (const movie of movies) {
    if (!movie.title_te) continue;

    const key = `${movie.title_te.toLowerCase().trim()}|${movie.release_year || 'unknown'}`;
    
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (existing.id !== movie.id) {
        duplicates.push({
          movie1: existing,
          movie2: movie,
          matchType: 'exact_telugu_title_year',
          confidence: 0.95,
          action: 'merge_recommended',
        });
      }
    } else {
      seen.set(key, movie);
    }
  }

  return duplicates;
}

/**
 * Find duplicates with same slug (but different IDs)
 */
export function findDuplicateSlugMovies(movies: MovieSummary[]): ExactDuplicate[] {
  const duplicates: ExactDuplicate[] = [];
  const seen = new Map<string, MovieSummary>();

  for (const movie of movies) {
    if (!movie.slug) continue;

    const key = movie.slug.toLowerCase().trim();
    
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (existing.id !== movie.id) {
        duplicates.push({
          movie1: existing,
          movie2: movie,
          matchType: 'exact_slug',
          confidence: 1.0,
          action: 'merge_recommended',
        });
      }
    } else {
      seen.set(key, movie);
    }
  }

  return duplicates;
}

/**
 * Find movies with same TMDB ID
 */
export function findSameTmdbIdMovies(movies: MovieSummary[]): ExactDuplicate[] {
  const duplicates: ExactDuplicate[] = [];
  const seen = new Map<number, MovieSummary>();

  for (const movie of movies) {
    if (!movie.tmdb_id) continue;

    if (seen.has(movie.tmdb_id)) {
      const existing = seen.get(movie.tmdb_id)!;
      if (existing.id !== movie.id) {
        duplicates.push({
          movie1: existing,
          movie2: movie,
          matchType: 'same_tmdb_id',
          confidence: 0.98,
          action: 'merge_recommended',
        });
      }
    } else {
      seen.set(movie.tmdb_id, movie);
    }
  }

  return duplicates;
}

/**
 * Find movies with same IMDb ID
 */
export function findSameImdbIdMovies(movies: MovieSummary[]): ExactDuplicate[] {
  const duplicates: ExactDuplicate[] = [];
  const seen = new Map<string, MovieSummary>();

  for (const movie of movies) {
    if (!movie.imdb_id) continue;

    const key = movie.imdb_id.toLowerCase().trim();
    
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (existing.id !== movie.id) {
        duplicates.push({
          movie1: existing,
          movie2: movie,
          matchType: 'same_imdb_id',
          confidence: 0.98,
          action: 'merge_recommended',
        });
      }
    } else {
      seen.set(key, movie);
    }
  }

  return duplicates;
}

// ============================================================
// FUZZY DUPLICATE DETECTION
// ============================================================

/**
 * Find fuzzy duplicates using similarity matching
 * This is O(n²) so should be used carefully on large datasets
 */
export function findFuzzyDuplicates(
  movies: MovieSummary[],
  options: {
    minSimilarity?: number;
    maxYearDiff?: number;
    batchSize?: number;
  } = {}
): FuzzyDuplicate[] {
  const {
    minSimilarity = 0.85,
    maxYearDiff = 1,
    batchSize = 500,
  } = options;

  const duplicates: FuzzyDuplicate[] = [];
  const checked = new Set<string>();

  // Process in batches to avoid memory issues
  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, Math.min(i + batchSize, movies.length));

    for (let j = 0; j < batch.length; j++) {
      const movie1 = batch[j];

      // Compare with all subsequent movies (avoid duplicate pairs)
      for (let k = j + 1; k < movies.length; k++) {
        const movie2 = movies[k];

        // Skip if same movie
        if (movie1.id === movie2.id) continue;

        // Skip if already checked this pair
        const pairKey = [movie1.id, movie2.id].sort().join('|');
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        // Check for fuzzy match
        const matchResult = areMoviesDuplicates(movie1, movie2, {
          minTitleSimilarity: minSimilarity,
          allowYearDiff: maxYearDiff,
          checkTeluguTitle: true,
        });

        // Add to results if duplicate
        if (matchResult.isDuplicate && matchResult.matchType !== 'exact') {
          const reason = identifyVariationReason(movie1.title_en, movie2.title_en);

          duplicates.push({
            movie1,
            movie2,
            titleSimilarity: matchResult.titleSimilarity,
            yearDiff: matchResult.yearDiff,
            confidence: matchResult.confidence,
            likelyReason: reason,
            matchType: matchResult.matchType as 'fuzzy_high' | 'fuzzy_medium' | 'fuzzy_low',
            requiresManualReview: matchResult.matchType === 'fuzzy_low' || matchResult.confidence < 0.85,
          });
        }
      }
    }
  }

  return duplicates;
}

/**
 * Optimized fuzzy duplicate detection using year-based bucketing
 * Much faster for large datasets
 */
export function findFuzzyDuplicatesOptimized(
  movies: MovieSummary[],
  options: {
    minSimilarity?: number;
    maxYearDiff?: number;
  } = {}
): FuzzyDuplicate[] {
  const {
    minSimilarity = 0.85,
    maxYearDiff = 1,
  } = options;

  const duplicates: FuzzyDuplicate[] = [];
  
  // Group movies by year (and adjacent years)
  const yearBuckets = new Map<number, MovieSummary[]>();

  for (const movie of movies) {
    const year = movie.release_year || 0;
    
    // Add to multiple buckets (year ± maxYearDiff)
    for (let y = year - maxYearDiff; y <= year + maxYearDiff; y++) {
      if (!yearBuckets.has(y)) {
        yearBuckets.set(y, []);
      }
      yearBuckets.get(y)!.push(movie);
    }
  }

  // Check for duplicates within each bucket
  const checked = new Set<string>();

  for (const bucket of yearBuckets.values()) {
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        const movie1 = bucket[i];
        const movie2 = bucket[j];

        // Skip if same movie
        if (movie1.id === movie2.id) continue;

        // Skip if already checked
        const pairKey = [movie1.id, movie2.id].sort().join('|');
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        // Check for fuzzy match
        const matchResult = areMoviesDuplicates(movie1, movie2, {
          minTitleSimilarity: minSimilarity,
          allowYearDiff: maxYearDiff,
          checkTeluguTitle: true,
        });

        if (matchResult.isDuplicate && matchResult.matchType !== 'exact') {
          const reason = identifyVariationReason(movie1.title_en, movie2.title_en);

          duplicates.push({
            movie1,
            movie2,
            titleSimilarity: matchResult.titleSimilarity,
            yearDiff: matchResult.yearDiff,
            confidence: matchResult.confidence,
            likelyReason: reason,
            matchType: matchResult.matchType as 'fuzzy_high' | 'fuzzy_medium' | 'fuzzy_low',
            requiresManualReview: matchResult.matchType === 'fuzzy_low' || matchResult.confidence < 0.85,
          });
        }
      }
    }
  }

  return duplicates;
}

// ============================================================
// COMPREHENSIVE DUPLICATE DETECTION
// ============================================================

/**
 * Run all duplicate detection checks
 */
export function detectAllDuplicates(
  movies: MovieSummary[],
  options: {
    includeFuzzyMatching?: boolean;
    fuzzyOptions?: {
      minSimilarity?: number;
      maxYearDiff?: number;
    };
  } = {}
): DuplicateDetectionResult {
  const {
    includeFuzzyMatching = true,
    fuzzyOptions = {},
  } = options;

  console.log(`Checking ${movies.length} movies for duplicates...`);

  // Exact duplicates
  console.log('  Finding exact title+year duplicates...');
  const titleYearDups = findExactTitleYearDuplicates(movies);

  console.log('  Finding exact Telugu title duplicates...');
  const teluguDups = findExactTeluguTitleDuplicates(movies);

  console.log('  Finding duplicate slugs...');
  const slugDups = findDuplicateSlugMovies(movies);

  console.log('  Finding same TMDB ID movies...');
  const tmdbDups = findSameTmdbIdMovies(movies);

  console.log('  Finding same IMDb ID movies...');
  const imdbDups = findSameImdbIdMovies(movies);

  const exactDuplicates = [
    ...titleYearDups,
    ...teluguDups,
    ...slugDups,
    ...tmdbDups,
    ...imdbDups,
  ];

  // Remove duplicate pairs (same movies might be flagged by multiple checks)
  const uniqueExactDups = deduplicateExactDuplicates(exactDuplicates);

  // Fuzzy duplicates (optional, can be slow)
  let fuzzyDuplicates: FuzzyDuplicate[] = [];
  if (includeFuzzyMatching) {
    console.log('  Finding fuzzy duplicates (this may take a while)...');
    fuzzyDuplicates = findFuzzyDuplicatesOptimized(movies, fuzzyOptions);
  }

  return {
    exactDuplicates: uniqueExactDups,
    fuzzyDuplicates,
    totalMoviesChecked: movies.length,
    duplicatePairsFound: uniqueExactDups.length + fuzzyDuplicates.length,
  };
}

/**
 * Deduplicate exact duplicate pairs
 * (Same pair might be found by multiple detection methods)
 */
function deduplicateExactDuplicates(duplicates: ExactDuplicate[]): ExactDuplicate[] {
  const seen = new Set<string>();
  const unique: ExactDuplicate[] = [];

  for (const dup of duplicates) {
    const key = [dup.movie1.id, dup.movie2.id].sort().join('|');
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(dup);
    }
  }

  return unique;
}
