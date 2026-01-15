/**
 * SUSPICIOUS ENTRY DETECTOR
 * 
 * Detects suspicious or invalid movie entries:
 * - Missing critical fields
 * - Unusual patterns (award ceremonies, TV shows, documentaries)
 * - Data inconsistencies
 * - Statistical outliers
 */

// ============================================================
// TYPES
// ============================================================

export interface MovieForValidation {
  id: string;
  title_en: string;
  title_te?: string | null;
  slug?: string;
  release_year?: number | null;
  language?: string | null;
  director?: string | null;
  hero?: string | null;
  heroine?: string | null;
  supporting_cast?: any[];
  genres?: string[] | null;
  runtime_minutes?: number | null;
  poster_url?: string | null;
  synopsis_te?: string | null;
  tmdb_id?: number | null;
  mood_tags?: string[] | null;
  avg_rating?: number | null;
  total_reviews?: number | null;
  [key: string]: any;
}

export interface MissingFieldIssue {
  movieId: string;
  title: string;
  year: number | null;
  missingFields: string[];
  severity: 'critical' | 'high' | 'medium';
  impact: string;
}

export interface UnusualPatternIssue {
  movieId: string;
  title: string;
  year: number | null;
  patternType: 'award_ceremony' | 'tv_show' | 'documentary' | 'non_movie' | 'making_of';
  pattern: string;
  confidence: number;
  recommendation: 'delete' | 'investigate' | 'reclassify';
}

export interface InconsistencyIssue {
  movieId: string;
  title: string;
  year: number | null;
  field: string;
  issue: string;
  currentValue: any;
  expectedPattern: string;
  severity: 'high' | 'medium' | 'low';
}

export interface OutlierIssue {
  movieId: string;
  title: string;
  year: number | null;
  metric: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  category: 'extreme_outlier' | 'moderate_outlier';
}

export interface SuspiciousDetectionResult {
  missingFieldIssues: MissingFieldIssue[];
  unusualPatterns: UnusualPatternIssue[];
  inconsistencies: InconsistencyIssue[];
  outliers: OutlierIssue[];
  totalMoviesChecked: number;
  totalIssuesFound: number;
}

// ============================================================
// MISSING FIELD DETECTION
// ============================================================

const CRITICAL_FIELDS = ['director', 'release_year', 'language'];
const HIGH_PRIORITY_FIELDS = ['hero', 'heroine', 'genres'];
const MEDIUM_PRIORITY_FIELDS = ['poster_url', 'runtime_minutes'];
const TELUGU_REQUIRED_FIELDS = ['synopsis_te', 'title_te'];

/**
 * Check for missing critical fields
 */
export function detectMissingFields(movie: MovieForValidation): MissingFieldIssue | null {
  const missing: string[] = [];

  // Check critical fields
  for (const field of CRITICAL_FIELDS) {
    if (!movie[field]) {
      missing.push(field);
    }
  }

  // Check high priority (at least one cast member required)
  const hasCast = movie.hero || movie.heroine || (movie.supporting_cast && movie.supporting_cast.length > 0);
  if (!hasCast) {
    missing.push('cast (hero/heroine/supporting)');
  }

  // Check genres
  if (!movie.genres || movie.genres.length === 0) {
    missing.push('genres');
  }

  // Check Telugu-specific fields
  if (movie.language === 'Telugu') {
    for (const field of TELUGU_REQUIRED_FIELDS) {
      if (!movie[field]) {
        missing.push(field);
      }
    }
  }

  if (missing.length === 0) {
    return null;
  }

  // Determine severity
  const hasCriticalMissing = CRITICAL_FIELDS.some(f => missing.includes(f));
  const hasHighPriorityMissing = [...HIGH_PRIORITY_FIELDS, 'cast (hero/heroine/supporting)'].some(f => missing.includes(f));

  let severity: 'critical' | 'high' | 'medium';
  let impact: string;

  if (hasCriticalMissing) {
    severity = 'critical';
    impact = 'Movie cannot be properly displayed or searched';
  } else if (hasHighPriorityMissing) {
    severity = 'high';
    impact = 'Movie information is incomplete';
  } else {
    severity = 'medium';
    impact = 'Movie could be enriched with additional data';
  }

  return {
    movieId: movie.id,
    title: movie.title_en,
    year: movie.release_year,
    missingFields: missing,
    severity,
    impact,
  };
}

// ============================================================
// UNUSUAL PATTERN DETECTION
// ============================================================

const AWARD_PATTERNS = [
  'filmfare awards',
  'nandi awards',
  'santosham film awards',
  'cinemaa awards',
  'zee cine awards',
  'iifa awards',
  'screen awards',
  'awards ceremony',
  'raghupathi venkaiah award',
  'lifetime achievement',
  'film festival',
  'awards south',
];

const TV_SHOW_PATTERNS = [
  'season',
  'episode',
  'series',
  's01', 's02', 's03',
  'episode',
];

const DOCUMENTARY_PATTERNS = [
  'documentary on',
  'making of',
  'behind the scenes',
  'the making',
  'a documentary',
];

const NON_MOVIE_PATTERNS = [
  'music album',
  'soundtrack',
  'compilation',
  'best of',
];

/**
 * Detect unusual patterns in movie titles
 */
export function detectUnusualPatterns(movie: MovieForValidation): UnusualPatternIssue | null {
  const titleLower = movie.title_en.toLowerCase();
  const slugLower = movie.slug?.toLowerCase() || '';

  // Check for award ceremonies
  for (const pattern of AWARD_PATTERNS) {
    if (titleLower.includes(pattern) || slugLower.includes(pattern.replace(/\s+/g, '-'))) {
      return {
        movieId: movie.id,
        title: movie.title_en,
        year: movie.release_year,
        patternType: 'award_ceremony',
        pattern,
        confidence: 0.95,
        recommendation: 'delete',
      };
    }
  }

  // Check for TV shows
  for (const pattern of TV_SHOW_PATTERNS) {
    if (titleLower.includes(pattern)) {
      return {
        movieId: movie.id,
        title: movie.title_en,
        year: movie.release_year,
        patternType: 'tv_show',
        pattern,
        confidence: 0.85,
        recommendation: 'reclassify',
      };
    }
  }

  // Check for documentaries
  for (const pattern of DOCUMENTARY_PATTERNS) {
    if (titleLower.includes(pattern)) {
      return {
        movieId: movie.id,
        title: movie.title_en,
        year: movie.release_year,
        patternType: 'documentary',
        pattern,
        confidence: 0.80,
        recommendation: 'investigate',
      };
    }
  }

  // Check for non-movies
  for (const pattern of NON_MOVIE_PATTERNS) {
    if (titleLower.includes(pattern)) {
      return {
        movieId: movie.id,
        title: movie.title_en,
        year: movie.release_year,
        patternType: 'non_movie',
        pattern,
        confidence: 0.75,
        recommendation: 'investigate',
      };
    }
  }

  return null;
}

// ============================================================
// DATA INCONSISTENCY DETECTION
// ============================================================

/**
 * Detect data inconsistencies
 */
export function detectInconsistencies(movie: MovieForValidation): InconsistencyIssue[] {
  const inconsistencies: InconsistencyIssue[] = [];

  // Telugu movie without Telugu title
  if (movie.language === 'Telugu' && !movie.title_te) {
    inconsistencies.push({
      movieId: movie.id,
      title: movie.title_en,
      year: movie.release_year,
      field: 'title_te',
      issue: 'Telugu movie without Telugu title',
      currentValue: null,
      expectedPattern: 'Should have Telugu title',
      severity: 'high',
    });
  }

  // Future release year (suspicious - might be data entry error)
  const currentYear = new Date().getFullYear();
  if (movie.release_year && movie.release_year > currentYear + 2) {
    inconsistencies.push({
      movieId: movie.id,
      title: movie.title_en,
      year: movie.release_year,
      field: 'release_year',
      issue: 'Future release year (far future)',
      currentValue: movie.release_year,
      expectedPattern: `Year <= ${currentYear + 2}`,
      severity: 'medium',
    });
  }

  // Very old release year (before 1910 - earliest Indian cinema)
  if (movie.release_year && movie.release_year < 1910) {
    inconsistencies.push({
      movieId: movie.id,
      title: movie.title_en,
      year: movie.release_year,
      field: 'release_year',
      issue: 'Release year before earliest Indian cinema (1910)',
      currentValue: movie.release_year,
      expectedPattern: 'Year >= 1910',
      severity: 'high',
    });
  }

  // Empty genres but has mood tags
  if ((!movie.genres || movie.genres.length === 0) && movie.mood_tags && movie.mood_tags.length > 0) {
    inconsistencies.push({
      movieId: movie.id,
      title: movie.title_en,
      year: movie.release_year,
      field: 'genres',
      issue: 'Has mood tags but no genres',
      currentValue: movie.genres,
      expectedPattern: 'Should have at least one genre if mood tags exist',
      severity: 'medium',
    });
  }

  // TMDB ID but no runtime (TMDB always has runtime)
  if (movie.tmdb_id && !movie.runtime_minutes) {
    inconsistencies.push({
      movieId: movie.id,
      title: movie.title_en,
      year: movie.release_year,
      field: 'runtime_minutes',
      issue: 'Has TMDB ID but no runtime',
      currentValue: null,
      expectedPattern: 'Should have runtime if TMDB ID exists',
      severity: 'low',
    });
  }

  return inconsistencies;
}

// ============================================================
// STATISTICAL OUTLIER DETECTION
// ============================================================

interface Statistics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Calculate statistics for a numeric field
 */
export function calculateStatistics(values: number[]): Statistics {
  const filtered = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  
  if (filtered.length === 0) {
    return { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 };
  }

  const mean = filtered.reduce((sum, v) => sum + v, 0) / filtered.length;
  const variance = filtered.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / filtered.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...filtered);
  const max = Math.max(...filtered);

  return { mean, stdDev, min, max, count: filtered.length };
}

/**
 * Detect statistical outliers
 */
export function detectOutliers(
  movies: MovieForValidation[],
  metrics: string[] = ['runtime_minutes']
): OutlierIssue[] {
  const outliers: OutlierIssue[] = [];

  for (const metric of metrics) {
    // Extract values
    const values = movies
      .map(m => m[metric] as number)
      .filter(v => v !== null && v !== undefined && !isNaN(v));

    if (values.length < 10) continue; // Need enough data for statistics

    const stats = calculateStatistics(values);

    // Check each movie
    for (const movie of movies) {
      const value = movie[metric] as number;
      if (value === null || value === undefined || isNaN(value)) continue;

      const zScore = Math.abs((value - stats.mean) / stats.stdDev);

      // Flag as outlier if z-score > 3 (extreme) or > 2 (moderate)
      if (zScore > 3) {
        outliers.push({
          movieId: movie.id,
          title: movie.title_en,
          year: movie.release_year,
          metric,
          value,
          mean: stats.mean,
          stdDev: stats.stdDev,
          zScore,
          category: 'extreme_outlier',
        });
      } else if (zScore > 2) {
        outliers.push({
          movieId: movie.id,
          title: movie.title_en,
          year: movie.release_year,
          metric,
          value,
          mean: stats.mean,
          stdDev: stats.stdDev,
          zScore,
          category: 'moderate_outlier',
        });
      }
    }
  }

  return outliers;
}

// ============================================================
// COMPREHENSIVE SUSPICIOUS ENTRY DETECTION
// ============================================================

/**
 * Run all suspicious entry detection checks
 */
export function detectSuspiciousEntries(
  movies: MovieForValidation[],
  options: {
    checkMissingFields?: boolean;
    checkUnusualPatterns?: boolean;
    checkInconsistencies?: boolean;
    checkOutliers?: boolean;
    outlierMetrics?: string[];
  } = {}
): SuspiciousDetectionResult {
  const {
    checkMissingFields = true,
    checkUnusualPatterns = true,
    checkInconsistencies = true,
    checkOutliers = true,
    outlierMetrics = ['runtime_minutes'],
  } = options;

  console.log(`Checking ${movies.length} movies for suspicious entries...`);

  const missingFieldIssues: MissingFieldIssue[] = [];
  const unusualPatterns: UnusualPatternIssue[] = [];
  const inconsistencies: InconsistencyIssue[] = [];

  // Process each movie
  for (const movie of movies) {
    // Missing fields
    if (checkMissingFields) {
      const missing = detectMissingFields(movie);
      if (missing) {
        missingFieldIssues.push(missing);
      }
    }

    // Unusual patterns
    if (checkUnusualPatterns) {
      const pattern = detectUnusualPatterns(movie);
      if (pattern) {
        unusualPatterns.push(pattern);
      }
    }

    // Inconsistencies
    if (checkInconsistencies) {
      const issues = detectInconsistencies(movie);
      inconsistencies.push(...issues);
    }
  }

  // Statistical outliers (need full dataset)
  let outliers: OutlierIssue[] = [];
  if (checkOutliers) {
    console.log('  Detecting statistical outliers...');
    outliers = detectOutliers(movies, outlierMetrics);
  }

  const totalIssuesFound =
    missingFieldIssues.length +
    unusualPatterns.length +
    inconsistencies.length +
    outliers.length;

  return {
    missingFieldIssues,
    unusualPatterns,
    inconsistencies,
    outliers,
    totalMoviesChecked: movies.length,
    totalIssuesFound,
  };
}
