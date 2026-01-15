/**
 * TMDB ID VALIDATOR
 * 
 * Validates TMDB IDs for Telugu films and finds correct IDs when wrong.
 * Performs multi-step validation:
 * 1. Language check (must be Telugu)
 * 2. Title match (allowing for transliteration)
 * 3. Year match (within ±1 year)
 * 4. Cast verification (if actor provided)
 * 5. Cross-reference search for correct ID
 * 
 * Auto-Fix Logic:
 * - Wrong language + correct Telugu film found: Replace (95% confidence)
 * - Wrong title/year + correct film found: Replace (85% confidence)
 * - Actor not in cast + alternative found: Replace (80% confidence)
 * - Invalid but no alternative: Clear (70% confidence)
 * - Else: Flag for manual review
 */

import { CONFIDENCE_THRESHOLDS } from './confidence-config';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// ============================================================
// TYPES
// ============================================================

export interface TMDBValidationResult {
  currentId: number;
  isValid: boolean;
  issues: Array<'wrong_language' | 'wrong_title' | 'wrong_year' | 'actor_not_in_cast' | 'not_found'>;
  suggestedId?: number;
  confidence: number;
  action: 'keep' | 'replace' | 'clear' | 'manual_review';
  reason: string;
}

export interface MovieToValidate {
  title_en: string;
  release_year: number;
  hero?: string;
  currentTmdbId: number;
}

// ============================================================
// TMDB API
// ============================================================

/**
 * Fetch TMDB movie details
 */
async function fetchTMDBMovie(tmdbId: number): Promise<any> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not configured');
  }

  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`TMDB fetch error for ID ${tmdbId}:`, error);
    return null;
  }
}

/**
 * Fetch TMDB movie credits
 */
async function fetchTMDBCredits(tmdbId: number): Promise<any> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not configured');
  }

  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`TMDB credits fetch error for ID ${tmdbId}:`, error);
    return null;
  }
}

/**
 * Search TMDB for Telugu films
 */
async function searchTMDBTeluguFilm(
  title: string,
  year: number
): Promise<Array<{ id: number; title: string; year: number; language: string }>> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not configured');
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Map to our format
    const results = data.results.map((m: any) => ({
      id: m.id,
      title: m.title,
      year: m.release_date ? parseInt(m.release_date.split('-')[0]) : 0,
      language: m.original_language,
    }));

    // Filter Telugu films
    const teluguResults = results.filter((r: any) => r.language === 'te');

    // If no Telugu results, return all results (might be transliteration issue)
    return teluguResults.length > 0 ? teluguResults : results.slice(0, 5);

  } catch (error) {
    console.error(`TMDB search error for ${title} (${year}):`, error);
    return [];
  }
}

// ============================================================
// TITLE SIMILARITY
// ============================================================

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate title similarity (0-1)
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  // Exact match
  if (norm1 === norm2) return 1.0;

  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;

  // Levenshtein distance (simplified)
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  
  const maxDistance = Math.floor(longer.length * 0.3); // Allow 30% difference
  
  let distance = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer[i] !== shorter[i]) distance++;
  }
  distance += longer.length - shorter.length;

  if (distance > maxDistance) return 0;

  return 1 - (distance / longer.length);
}

// ============================================================
// VALIDATION LOGIC
// ============================================================

/**
 * Check if actor is in TMDB cast
 */
function isActorInCast(credits: any, actorName: string): boolean {
  if (!credits || !credits.cast) return false;

  const normalizedName = actorName.toLowerCase().trim();

  return credits.cast.some((c: any) => 
    c.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(c.name.toLowerCase())
  );
}

/**
 * Validate TMDB ID
 */
export async function validateTMDBId(
  movie: MovieToValidate
): Promise<TMDBValidationResult> {
  const issues: TMDBValidationResult['issues'] = [];

  // Fetch current TMDB movie
  const tmdbMovie = await fetchTMDBMovie(movie.currentTmdbId);

  if (!tmdbMovie) {
    return {
      currentId: movie.currentTmdbId,
      isValid: false,
      issues: ['not_found'],
      confidence: 0.70,
      action: 'clear',
      reason: 'TMDB ID not found - ID should be cleared',
    };
  }

  // Check language
  const isTeluguFilm = tmdbMovie.original_language === 'te';
  if (!isTeluguFilm) {
    issues.push('wrong_language');
  }

  // Check title match
  const titleSimilarity = calculateTitleSimilarity(movie.title_en, tmdbMovie.title);
  if (titleSimilarity < 0.7) {
    issues.push('wrong_title');
  }

  // Check year match (allow ±1 year)
  const tmdbYear = tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.split('-')[0]) : 0;
  const yearDiff = Math.abs(movie.release_year - tmdbYear);
  if (yearDiff > 1) {
    issues.push('wrong_year');
  }

  // Check actor if provided
  if (movie.hero) {
    const credits = await fetchTMDBCredits(movie.currentTmdbId);
    const actorFound = isActorInCast(credits, movie.hero);
    
    if (!actorFound) {
      issues.push('actor_not_in_cast');
    }
  }

  // If no issues, TMDB ID is valid
  if (issues.length === 0) {
    return {
      currentId: movie.currentTmdbId,
      isValid: true,
      issues: [],
      confidence: 1.0,
      action: 'keep',
      reason: 'TMDB ID is correct',
    };
  }

  // Search for correct TMDB ID
  const searchResults = await searchTMDBTeluguFilm(movie.title_en, movie.release_year);

  // Find best match
  let bestMatch: { id: number; confidence: number } | null = null;

  for (const result of searchResults) {
    // Skip current ID
    if (result.id === movie.currentTmdbId) continue;

    // Calculate match score
    const titleMatch = calculateTitleSimilarity(movie.title_en, result.title);
    const yearMatch = Math.abs(movie.release_year - result.year) <= 1 ? 1.0 : 0.5;
    const languageMatch = result.language === 'te' ? 1.0 : 0.7;

    let matchScore = (titleMatch * 0.5) + (yearMatch * 0.3) + (languageMatch * 0.2);

    // Check actor if provided
    if (movie.hero) {
      const credits = await fetchTMDBCredits(result.id);
      const actorFound = isActorInCast(credits, movie.hero);
      
      if (actorFound) {
        matchScore *= 1.2; // Boost score if actor found
      } else {
        matchScore *= 0.7; // Reduce score if actor not found
      }
    }

    if (!bestMatch || matchScore > bestMatch.confidence) {
      bestMatch = { id: result.id, confidence: matchScore };
    }
  }

  // Determine action based on best match
  if (bestMatch && bestMatch.confidence >= 0.85) {
    // High confidence replacement
    return {
      currentId: movie.currentTmdbId,
      isValid: false,
      issues,
      suggestedId: bestMatch.id,
      confidence: Math.min(0.95, bestMatch.confidence),
      action: 'replace',
      reason: `Found better match (confidence: ${(bestMatch.confidence * 100).toFixed(0)}%)`,
    };
  }

  if (bestMatch && bestMatch.confidence >= 0.70) {
    // Medium confidence replacement
    return {
      currentId: movie.currentTmdbId,
      isValid: false,
      issues,
      suggestedId: bestMatch.id,
      confidence: bestMatch.confidence,
      action: 'replace',
      reason: `Found possible match (confidence: ${(bestMatch.confidence * 100).toFixed(0)}%)`,
    };
  }

  if (issues.includes('wrong_language') || issues.includes('not_found')) {
    // Wrong language or not found, no alternative: Clear
    return {
      currentId: movie.currentTmdbId,
      isValid: false,
      issues,
      confidence: 0.70,
      action: 'clear',
      reason: 'Invalid TMDB ID, no alternative found - should be cleared',
    };
  }

  // Other issues but no clear alternative: Manual review
  return {
    currentId: movie.currentTmdbId,
    isValid: false,
    issues,
    confidence: 0.50,
    action: 'manual_review',
    reason: `Issues detected but no clear alternative: ${issues.join(', ')}`,
  };
}

/**
 * Batch validate multiple TMDB IDs
 */
export async function batchValidateTMDBIds(
  movies: MovieToValidate[]
): Promise<TMDBValidationResult[]> {
  const results: TMDBValidationResult[] = [];

  for (const movie of movies) {
    console.log(`Validating: ${movie.title_en} (${movie.release_year}) - TMDB ID: ${movie.currentTmdbId}...`);
    
    const result = await validateTMDBId(movie);
    results.push(result);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return results;
}

/**
 * Generate report for TMDB ID validation
 */
export function generateTMDBValidationReport(results: TMDBValidationResult[]): string {
  const lines: string[] = [];

  const validIds = results.filter(r => r.isValid);
  const invalidIds = results.filter(r => !r.isValid);
  const autoReplace = invalidIds.filter(r => 
    r.action === 'replace' && r.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX.fix_tmdb_id
  );
  const manualReview = invalidIds.filter(r => !autoReplace.includes(r));

  lines.push(`# TMDB ID Validation Report`);
  lines.push('');
  lines.push(`Total Validated: ${results.length}`);
  lines.push(`Valid IDs: ${validIds.length}`);
  lines.push(`Invalid IDs: ${invalidIds.length}`);
  lines.push('');

  if (autoReplace.length > 0) {
    lines.push(`## Auto-Replace (${autoReplace.length})`);
    lines.push('');
    lines.push('| Current ID | Suggested ID | Issues | Confidence | Reason |');
    lines.push('|------------|--------------|--------|------------|--------|');

    for (const result of autoReplace) {
      lines.push(`| ${result.currentId} | ${result.suggestedId || 'N/A'} | ${result.issues.join(', ')} | ${(result.confidence * 100).toFixed(0)}% | ${result.reason} |`);
    }

    lines.push('');
  }

  if (manualReview.length > 0) {
    lines.push(`## Manual Review Required (${manualReview.length})`);
    lines.push('');
    lines.push('| Current ID | Suggested ID | Issues | Action | Reason |');
    lines.push('|------------|--------------|--------|--------|--------|');

    for (const result of manualReview) {
      lines.push(`| ${result.currentId} | ${result.suggestedId || 'N/A'} | ${result.issues.join(', ')} | ${result.action} | ${result.reason} |`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Check if validation result should be auto-applied
 */
export function shouldAutoFixTMDBId(result: TMDBValidationResult): boolean {
  return (
    (result.action === 'replace' || result.action === 'clear') &&
    result.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX.fix_tmdb_id
  );
}
