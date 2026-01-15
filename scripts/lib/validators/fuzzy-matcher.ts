/**
 * FUZZY MATCHER - Consolidated String Similarity Utilities
 * 
 * Provides fuzzy matching for movie titles, handling:
 * - Transliteration variants (Bahubali vs Baahubali)
 * - Typos and spelling variations
 * - Subtitle additions (RRR vs RRR: Rise Roar Revolt)
 * - Number format variations (2.0 vs 2, Part 1 vs Part I)
 * 
 * Consolidated from:
 * - scripts/lib/autofix-engine.ts
 * - scripts/actor-filmography-audit.ts
 * - scripts/lib/missing-film-detector.ts
 */

// ============================================================
// TITLE NORMALIZATION
// ============================================================

/**
 * Normalize title for comparison
 * Removes special characters, extra spaces, converts to lowercase
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Aggressive normalization for fuzzy matching
 * Removes all non-alphanumeric characters
 */
export function normalizeAggressively(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

// ============================================================
// LEVENSHTEIN DISTANCE
// ============================================================

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of edits (insertions, deletions, substitutions)
 * needed to transform s1 into s2
 */
export function calculateLevenshteinDistance(s1: string, s2: string): number {
  const matrix: number[][] = [];
  const n = s1.length;
  const m = s2.length;

  if (n === 0) return m;
  if (m === 0) return n;

  // Initialize matrix
  for (let i = 0; i <= n; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= m; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[n][m];
}

// ============================================================
// SIMILARITY SCORING
// ============================================================

/**
 * Calculate title similarity score (0-1)
 * 1.0 = identical, 0.0 = completely different
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  // Exact match
  if (norm1 === norm2) return 1.0;

  // One contains the other (subtitle case)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;

  // Levenshtein distance-based similarity
  const distance = calculateLevenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  const similarity = 1 - distance / maxLen;

  return Math.max(0, similarity);
}

/**
 * Calculate aggressive similarity (ignores all special chars)
 * Use for catching transliteration variants
 */
export function calculateAggressiveSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeAggressively(title1);
  const norm2 = normalizeAggressively(title2);

  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.95;

  const distance = calculateLevenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Calculate word-based similarity
 * Useful for catching word order changes or partial matches
 */
export function calculateWordSimilarity(title1: string, title2: string): number {
  const words1 = normalizeTitle(title1).split(' ').filter(w => w.length > 0);
  const words2 = normalizeTitle(title2).split(' ').filter(w => w.length > 0);

  if (words1.length === 0 || words2.length === 0) return 0;

  const matchingWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);

  return matchingWords / totalWords;
}

// ============================================================
// MOVIE DUPLICATE DETECTION
// ============================================================

export interface MovieForMatching {
  title_en: string;
  title_te?: string | null;
  release_year?: number | null;
  slug?: string;
}

export interface DuplicateMatchResult {
  isDuplicate: boolean;
  confidence: number;
  matchType: 'exact' | 'fuzzy_high' | 'fuzzy_medium' | 'fuzzy_low' | 'no_match';
  titleSimilarity: number;
  yearMatch: boolean;
  yearDiff: number;
  reason?: string;
}

/**
 * Comprehensive duplicate detection for movies
 * Considers title similarity, year proximity, and transliteration variants
 */
export function areMoviesDuplicates(
  movie1: MovieForMatching,
  movie2: MovieForMatching,
  options: {
    minTitleSimilarity?: number;
    allowYearDiff?: number;
    checkTeluguTitle?: boolean;
  } = {}
): DuplicateMatchResult {
  const {
    minTitleSimilarity = 0.85,
    allowYearDiff = 1,
    checkTeluguTitle = true,
  } = options;

  // Calculate similarities
  const titleSim = calculateTitleSimilarity(movie1.title_en, movie2.title_en);
  const aggressiveSim = calculateAggressiveSimilarity(movie1.title_en, movie2.title_en);
  const wordSim = calculateWordSimilarity(movie1.title_en, movie2.title_en);

  // Best similarity score
  const bestSimilarity = Math.max(titleSim, aggressiveSim, wordSim);

  // Year comparison
  const year1 = movie1.release_year || 0;
  const year2 = movie2.release_year || 0;
  const yearDiff = Math.abs(year1 - year2);
  const yearMatch = yearDiff <= allowYearDiff;

  // Telugu title check (if both have Telugu titles)
  let teluguSim = 0;
  if (checkTeluguTitle && movie1.title_te && movie2.title_te) {
    teluguSim = calculateTitleSimilarity(movie1.title_te, movie2.title_te);
  }

  // Decision logic
  if (bestSimilarity >= 0.95 && yearMatch) {
    return {
      isDuplicate: true,
      confidence: 0.95,
      matchType: 'exact',
      titleSimilarity: bestSimilarity,
      yearMatch,
      yearDiff,
      reason: 'Near-identical title with matching year',
    };
  }

  if (bestSimilarity >= 0.90 && yearDiff === 0) {
    return {
      isDuplicate: true,
      confidence: 0.90,
      matchType: 'fuzzy_high',
      titleSimilarity: bestSimilarity,
      yearMatch,
      yearDiff,
      reason: 'High similarity with exact year match',
    };
  }

  if (bestSimilarity >= minTitleSimilarity && yearMatch) {
    return {
      isDuplicate: true,
      confidence: 0.80,
      matchType: 'fuzzy_medium',
      titleSimilarity: bestSimilarity,
      yearMatch,
      yearDiff,
      reason: 'Similar title with close year',
    };
  }

  if (teluguSim >= 0.90 && yearMatch) {
    return {
      isDuplicate: true,
      confidence: 0.85,
      matchType: 'fuzzy_high',
      titleSimilarity: teluguSim,
      yearMatch,
      yearDiff,
      reason: 'Telugu title match with year match',
    };
  }

  if (bestSimilarity >= 0.75 && yearDiff === 0) {
    return {
      isDuplicate: false, // Flag for manual review but don't auto-mark as duplicate
      confidence: 0.60,
      matchType: 'fuzzy_low',
      titleSimilarity: bestSimilarity,
      yearMatch,
      yearDiff,
      reason: 'Moderate similarity - manual review recommended',
    };
  }

  return {
    isDuplicate: false,
    confidence: 0,
    matchType: 'no_match',
    titleSimilarity: bestSimilarity,
    yearMatch,
    yearDiff,
  };
}

/**
 * Check if two titles match (simple threshold-based check)
 */
export function titlesMatch(title1: string, title2: string, threshold: number = 0.85): boolean {
  return calculateTitleSimilarity(title1, title2) >= threshold;
}

/**
 * Identify likely reason for title variation
 */
export function identifyVariationReason(title1: string, title2: string): string {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  // Substring (likely subtitle addition)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 'subtitle_variant';
  }

  // Check for common patterns
  const patterns = [
    { regex: /part\s*[0-9]+|part\s*[ivx]+/i, reason: 'sequel_numbering' },
    { regex: /\d\.\d/, reason: 'version_number' },
    { regex: /the\s+/, reason: 'article_difference' },
    { regex: /[aeiou]{2,}/, reason: 'transliteration_variant' },
  ];

  for (const { regex, reason } of patterns) {
    if (regex.test(title1) || regex.test(title2)) {
      return reason;
    }
  }

  // Character-level difference
  const distance = calculateLevenshteinDistance(norm1, norm2);
  if (distance <= 3) {
    return 'typo_or_spelling';
  }

  return 'unknown_variation';
}
