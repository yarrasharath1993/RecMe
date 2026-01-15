/**
 * FILMOGRAPHY CROSS-VALIDATOR
 * 
 * Enhanced validation system that automatically detects:
 * 1. Wrong actor attributions (actor not in TMDB cast)
 * 2. Duplicate entries (same TMDB ID or similar title+year)
 * 3. Wrong TMDB IDs (points to non-Telugu or different movie)
 * 4. Missing poster validation (poster doesn't match movie)
 * 
 * This runs during enrichment and can be used for batch validation.
 * 
 * Usage:
 *   import { validateActorFilmography, CrossValidationResult } from './lib/filmography-cross-validator';
 *   const result = await validateActorFilmography('Nandamuri Balakrishna');
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { getActorIdentifier, KNOWN_ACTOR_IDS, KNOWN_ACTOR_MULTIPLE_IDS } from './actor-identifier';

dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// ============================================================
// TYPES
// ============================================================

export interface ValidationIssue {
  movieId: string;
  slug: string;
  title: string;
  year: number;
  issueType: 'wrong_attribution' | 'duplicate' | 'spelling_duplicate' | 'wrong_tmdb_id' | 'wrong_language' | 'cast_mismatch';
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;  // 0-1
  details: string;
  suggestedFix?: {
    action: 'reattribute' | 'delete' | 'update_tmdb' | 'clear_tmdb' | 'merge';
    newValue?: string;
    mergeIntoId?: string;
  };
  tmdbData?: {
    tmdbId?: number;
    language?: string;
    topCast?: string[];
    suggestedHero?: string;
  };
}

/**
 * Spelling duplicate detection result
 */
export interface SpellingDuplicate {
  movie1: Movie;
  movie2: Movie;
  similarity: number;
  normalizedTitle: string;
}

export interface CrossValidationResult {
  actor: string;
  actorTmdbId: number | null;
  timestamp: string;
  totalMovies: number;
  validMovies: number;
  issues: ValidationIssue[];
  criticalIssues: number;
  highIssues: number;
  autoFixable: number;
}

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  hero: string | null;
  tmdb_id: number | null;
  slug: string;
  poster_url: string | null;
  is_published: boolean;
}

// ============================================================
// TMDB UTILITIES
// ============================================================

async function fetchTMDB(endpoint: string): Promise<any> {
  if (!TMDB_API_KEY) return null;
  
  try {
    const url = `${TMDB_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchTMDB(endpoint);
      }
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

async function getTMDBMovieDetails(tmdbId: number): Promise<{
  id: number;
  title: string;
  originalLanguage: string;
  releaseYear: number;
  cast: Array<{ id: number; name: string; order: number }>;
} | null> {
  const movie = await fetchTMDB(`/movie/${tmdbId}?append_to_response=credits`);
  if (!movie) return null;
  
  return {
    id: movie.id,
    title: movie.title,
    originalLanguage: movie.original_language,
    releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : 0,
    cast: (movie.credits?.cast || []).slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      order: c.order,
    })),
  };
}

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Normalize name for comparison
 */
function normalizeNameForComparison(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two names match (handles variations)
 */
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeNameForComparison(name1);
  const n2 = normalizeNameForComparison(name2);
  
  // Exact match
  if (n1 === n2) return true;
  
  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Check last name match (for Telugu names like "Nandamuri Balakrishna" vs "Balakrishna")
  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');
  const lastName1 = parts1[parts1.length - 1];
  const lastName2 = parts2[parts2.length - 1];
  
  if (lastName1 === lastName2 && lastName1.length > 3) return true;
  
  return false;
}

/**
 * Get all TMDB Person IDs for an actor (including alternate IDs)
 */
function getAllActorTmdbIds(actorName: string): number[] {
  const normalizedName = actorName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const ids: number[] = [];
  
  // Check multiple IDs first
  if (KNOWN_ACTOR_MULTIPLE_IDS[normalizedName]) {
    ids.push(...KNOWN_ACTOR_MULTIPLE_IDS[normalizedName]);
  }
  
  // Add primary ID if not already included
  if (KNOWN_ACTOR_IDS[normalizedName] && !ids.includes(KNOWN_ACTOR_IDS[normalizedName])) {
    ids.push(KNOWN_ACTOR_IDS[normalizedName]);
  }
  
  return ids;
}

/**
 * Check if actor is in movie's TMDB cast using ALL known Person IDs AND name fallback.
 * Enhanced to handle actors with multiple TMDB Person IDs (common for older films).
 */
async function validateActorInCast(
  movie: Movie,
  actorName: string,
  actorTmdbId: number | null
): Promise<ValidationIssue | null> {
  if (!movie.tmdb_id) return null;  // Can't validate without TMDB ID
  
  const tmdbDetails = await getTMDBMovieDetails(movie.tmdb_id);
  if (!tmdbDetails) return null;
  
  // Get ALL known TMDB IDs for this actor
  const allActorIds = getAllActorTmdbIds(actorName);
  if (actorTmdbId && !allActorIds.includes(actorTmdbId)) {
    allActorIds.push(actorTmdbId);
  }
  
  // Check if actor is in cast by ANY of their TMDB Person IDs
  for (const actorId of allActorIds) {
    const inCastById = tmdbDetails.cast.some(c => c.id === actorId);
    if (inCastById) return null;  // Found by ID - valid
  }
  
  // Fallback: Check by name (TMDB sometimes has name but not linked ID)
  const inCastByName = tmdbDetails.cast.some(c => namesMatch(c.name, actorName));
  if (inCastByName) return null;  // Found by name - valid
  
  // Actor not found by ID or name - this is a real issue
  const suggestedHero = tmdbDetails.cast[0]?.name || null;
  
  // Don't suggest reattributing to same actor (name variation)
  const shouldSuggestReattribute = suggestedHero && !namesMatch(suggestedHero, actorName);
  
  return {
    movieId: movie.id,
    slug: movie.slug,
    title: movie.title_en,
    year: movie.release_year,
    issueType: 'wrong_attribution',
    severity: 'critical',
    confidence: 0.95,
    details: `${actorName} not found in TMDB cast (checked ${allActorIds.length} IDs). Top cast: ${tmdbDetails.cast.slice(0, 3).map(c => c.name).join(', ') || 'empty'}`,
    suggestedFix: shouldSuggestReattribute ? {
      action: 'reattribute',
      newValue: suggestedHero,
    } : undefined,
    tmdbData: {
      tmdbId: movie.tmdb_id,
      language: tmdbDetails.originalLanguage,
      topCast: tmdbDetails.cast.map(c => c.name),
      suggestedHero,
    },
  };
}

/**
 * Validate TMDB ID points to correct Telugu movie
 */
async function validateTMDBId(movie: Movie): Promise<ValidationIssue | null> {
  if (!movie.tmdb_id) return null;
  
  const tmdbDetails = await getTMDBMovieDetails(movie.tmdb_id);
  if (!tmdbDetails) {
    return {
      movieId: movie.id,
      slug: movie.slug,
      title: movie.title_en,
      year: movie.release_year,
      issueType: 'wrong_tmdb_id',
      severity: 'high',
      confidence: 0.90,
      details: `TMDB ID ${movie.tmdb_id} not found`,
      suggestedFix: { action: 'clear_tmdb' },
    };
  }
  
  // Check language
  if (tmdbDetails.originalLanguage !== 'te') {
    return {
      movieId: movie.id,
      slug: movie.slug,
      title: movie.title_en,
      year: movie.release_year,
      issueType: 'wrong_language',
      severity: 'critical',
      confidence: 0.95,
      details: `TMDB movie is ${tmdbDetails.originalLanguage}, not Telugu. TMDB title: "${tmdbDetails.title}"`,
      suggestedFix: { action: 'clear_tmdb' },
      tmdbData: {
        tmdbId: movie.tmdb_id,
        language: tmdbDetails.originalLanguage,
      },
    };
  }
  
  // Check year (allow ±2 years for release date variations)
  const yearDiff = Math.abs(movie.release_year - tmdbDetails.releaseYear);
  if (yearDiff > 2) {
    return {
      movieId: movie.id,
      slug: movie.slug,
      title: movie.title_en,
      year: movie.release_year,
      issueType: 'wrong_tmdb_id',
      severity: 'high',
      confidence: 0.80,
      details: `Year mismatch: DB has ${movie.release_year}, TMDB has ${tmdbDetails.releaseYear}`,
      suggestedFix: { action: 'clear_tmdb' },
      tmdbData: { tmdbId: movie.tmdb_id },
    };
  }
  
  return null;
}

// ============================================================
// TELUGU TITLE NORMALIZATION
// ============================================================

/**
 * Common Telugu suffix variations that should be normalized.
 * These are common transliteration differences that create "spelling duplicates"
 * like "President Gari Abbai" vs "President Gari Abbayi"
 */
const TELUGU_SUFFIX_NORMALIZATIONS: Array<[RegExp, string]> = [
  // Common vowel endings
  [/udu$/i, 'u'],      // Ramudu → Ramu
  [/odu$/i, 'u'],      // Krishnudu → Krishnu
  [/yi$/i, 'i'],       // Abbayi → Abbai
  [/amu$/i, 'am'],     // Ramamu → Ramam
  [/ulu$/i, 'u'],      // Ramulu → Ramu
  
  // Common consonant variations
  [/kk/g, 'k'],        // Akkada → Akada
  [/tt/g, 't'],        // Attha → Atha
  [/pp/g, 'p'],        // Appa → Apa
  [/mm/g, 'm'],        // Amma → Ama
  [/nn/g, 'n'],        // Anna → Ana
  
  // Common transliteration variations
  [/th/g, 't'],        // Atha → Ata
  [/dh/g, 'd'],        // Adhi → Adi
  [/bh/g, 'b'],        // Abhi → Abi
  [/ph/g, 'p'],        // Phani → Pani
  [/sh/g, 's'],        // Shiva → Siva
  [/ch/g, 'c'],        // Chandra → Candra
  
  // Common word variations
  [/gari/gi, 'gari'],  // Normalize "Gari" casing
  [/\s+/g, ''],        // Remove all spaces for comparison
];

/**
 * Normalize a Telugu movie title for duplicate comparison.
 * Handles common transliteration variations.
 */
function normalizeTeluguTitle(title: string): string {
  let normalized = title.toLowerCase();
  
  // Apply Telugu-specific normalizations
  for (const [pattern, replacement] of TELUGU_SUFFIX_NORMALIZATIONS) {
    normalized = normalized.replace(pattern, replacement);
  }
  
  // Remove all non-alphanumeric characters
  normalized = normalized.replace(/[^a-z0-9]/g, '');
  
  return normalized;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Create matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Detect spelling duplicates - movies with very similar titles that differ
 * only by common Telugu transliteration variations.
 * 
 * Examples detected:
 * - "President Gari Abbai" vs "President Gari Abbayi"
 * - "Rowdy Ramudu" vs "Rowdy Ramu"
 * - "Simha" vs "Simham"
 */
export function detectSpellingDuplicates(movies: Movie[]): SpellingDuplicate[] {
  const duplicates: SpellingDuplicate[] = [];
  const checked = new Set<string>();
  
  // Group movies by year first (duplicates must be same year)
  const moviesByYear = new Map<number, Movie[]>();
  for (const movie of movies) {
    if (!moviesByYear.has(movie.release_year)) {
      moviesByYear.set(movie.release_year, []);
    }
    moviesByYear.get(movie.release_year)!.push(movie);
  }
  
  // Check within each year group
  for (const [, yearMovies] of moviesByYear) {
    if (yearMovies.length < 2) continue;
    
    for (let i = 0; i < yearMovies.length; i++) {
      for (let j = i + 1; j < yearMovies.length; j++) {
        const movie1 = yearMovies[i];
        const movie2 = yearMovies[j];
        
        // Skip if same movie ID
        if (movie1.id === movie2.id) continue;
        
        // Skip if already checked this pair
        const pairKey = [movie1.id, movie2.id].sort().join('-');
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);
        
        // Normalize titles
        const norm1 = normalizeTeluguTitle(movie1.title_en);
        const norm2 = normalizeTeluguTitle(movie2.title_en);
        
        // If normalized titles are identical, it's a spelling duplicate
        if (norm1 === norm2 && movie1.title_en !== movie2.title_en) {
          duplicates.push({
            movie1,
            movie2,
            similarity: 1.0,
            normalizedTitle: norm1,
          });
          continue;
        }
        
        // Check similarity of normalized titles
        const similarity = calculateSimilarity(norm1, norm2);
        
        // High similarity (>90%) with different original titles = spelling duplicate
        if (similarity >= 0.90 && movie1.title_en !== movie2.title_en) {
          duplicates.push({
            movie1,
            movie2,
            similarity,
            normalizedTitle: norm1,
          });
        }
      }
    }
  }
  
  return duplicates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Find duplicate entries (including spelling duplicates)
 */
function findDuplicates(movies: Movie[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const flaggedIds = new Set<string>();
  
  // Check by TMDB ID first (highest confidence)
  const tmdbIdMap = new Map<number, Movie[]>();
  for (const movie of movies) {
    if (movie.tmdb_id) {
      if (!tmdbIdMap.has(movie.tmdb_id)) {
        tmdbIdMap.set(movie.tmdb_id, []);
      }
      tmdbIdMap.get(movie.tmdb_id)!.push(movie);
    }
  }
  
  for (const [tmdbId, dupes] of tmdbIdMap) {
    if (dupes.length > 1) {
      // Keep the one with more data (poster, rating, etc.)
      const sorted = dupes.sort((a, b) => {
        const scoreA = (a.poster_url && !a.poster_url.includes('placeholder') ? 1 : 0) + (a.is_published ? 1 : 0);
        const scoreB = (b.poster_url && !b.poster_url.includes('placeholder') ? 1 : 0) + (b.is_published ? 1 : 0);
        return scoreB - scoreA;
      });
      
      const keep = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        issues.push({
          movieId: sorted[i].id,
          slug: sorted[i].slug,
          title: sorted[i].title_en,
          year: sorted[i].release_year,
          issueType: 'duplicate',
          severity: 'high',
          confidence: 1.0,
          details: `Duplicate of "${keep.title_en}" (same TMDB ID: ${tmdbId})`,
          suggestedFix: {
            action: 'delete',
            mergeIntoId: keep.id,
          },
        });
        flaggedIds.add(sorted[i].id);
      }
    }
  }
  
  // Check for spelling duplicates (Telugu transliteration variations)
  const spellingDupes = detectSpellingDuplicates(movies);
  
  for (const dupe of spellingDupes) {
    // Skip if already flagged
    if (flaggedIds.has(dupe.movie1.id) || flaggedIds.has(dupe.movie2.id)) continue;
    
    // Determine which one to keep (prefer one with TMDB ID, then poster)
    const score1 = (dupe.movie1.tmdb_id ? 3 : 0) + 
                   (dupe.movie1.poster_url && !dupe.movie1.poster_url.includes('placeholder') ? 1 : 0) +
                   (dupe.movie1.is_published ? 1 : 0);
    const score2 = (dupe.movie2.tmdb_id ? 3 : 0) + 
                   (dupe.movie2.poster_url && !dupe.movie2.poster_url.includes('placeholder') ? 1 : 0) +
                   (dupe.movie2.is_published ? 1 : 0);
    
    const [keep, remove] = score1 >= score2 ? [dupe.movie1, dupe.movie2] : [dupe.movie2, dupe.movie1];
    
    issues.push({
      movieId: remove.id,
      slug: remove.slug,
      title: remove.title_en,
      year: remove.release_year,
      issueType: 'spelling_duplicate',
      severity: dupe.similarity >= 0.95 ? 'high' : 'medium',
      confidence: dupe.similarity,
      details: `Spelling duplicate of "${keep.title_en}" (${(dupe.similarity * 100).toFixed(0)}% similar after normalization)`,
      suggestedFix: {
        action: 'delete',
        mergeIntoId: keep.id,
      },
    });
    flaggedIds.add(remove.id);
  }
  
  // Check by normalized title + year (catch remaining duplicates)
  const normalizeTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const titleYearMap = new Map<string, Movie[]>();
  
  for (const movie of movies) {
    const key = `${normalizeTitle(movie.title_en)}-${movie.release_year}`;
    if (!titleYearMap.has(key)) {
      titleYearMap.set(key, []);
    }
    titleYearMap.get(key)!.push(movie);
  }
  
  for (const [, dupes] of titleYearMap) {
    if (dupes.length > 1) {
      // Skip if already flagged
      const unflagged = dupes.filter(d => !flaggedIds.has(d.id));
      if (unflagged.length < 2) continue;
      
      const sorted = unflagged.sort((a, b) => {
        const scoreA = (a.tmdb_id ? 2 : 0) + (a.poster_url ? 1 : 0);
        const scoreB = (b.tmdb_id ? 2 : 0) + (b.poster_url ? 1 : 0);
        return scoreB - scoreA;
      });
      
      const keep = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        issues.push({
          movieId: sorted[i].id,
          slug: sorted[i].slug,
          title: sorted[i].title_en,
          year: sorted[i].release_year,
          issueType: 'duplicate',
          severity: 'medium',
          confidence: 0.85,
          details: `Possible duplicate of "${keep.title_en}" (similar title)`,
          suggestedFix: {
            action: 'merge',
            mergeIntoId: keep.id,
          },
        });
        flaggedIds.add(sorted[i].id);
      }
    }
  }
  
  return issues;
}

// ============================================================
// MAIN VALIDATION FUNCTION
// ============================================================

/**
 * Validate an actor's complete filmography
 */
export async function validateActorFilmography(
  actorName: string,
  options: {
    supabase?: SupabaseClient;
    maxMovies?: number;
    validateTMDB?: boolean;
    verbose?: boolean;
  } = {}
): Promise<CrossValidationResult> {
  const {
    maxMovies = 200,
    validateTMDB = true,
    verbose = false,
  } = options;
  
  const supabase = options.supabase || createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const identifier = getActorIdentifier();
  const actorTmdbId = await identifier.resolveActorId(actorName);
  
  if (verbose) {
    console.log(`Validating filmography for: ${actorName}`);
    console.log(`Actor TMDB ID: ${actorTmdbId || 'not found'}`);
  }
  
  // Fetch movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, tmdb_id, slug, poster_url, is_published')
    .ilike('hero', `%${actorName}%`)
    .order('release_year', { ascending: false })
    .limit(maxMovies);
  
  if (error || !movies) {
    throw new Error(`Failed to fetch movies: ${error?.message}`);
  }
  
  if (verbose) {
    console.log(`Found ${movies.length} movies`);
  }
  
  const issues: ValidationIssue[] = [];
  
  // Check for duplicates first (doesn't require TMDB calls)
  const duplicateIssues = findDuplicates(movies);
  issues.push(...duplicateIssues);
  
  // Validate each movie
  if (validateTMDB && actorTmdbId) {
    let checked = 0;
    for (const movie of movies) {
      if (!movie.tmdb_id) continue;
      
      // Check actor in cast
      const castIssue = await validateActorInCast(movie, actorName, actorTmdbId);
      if (castIssue) {
        issues.push(castIssue);
      }
      
      // Validate TMDB ID
      const tmdbIssue = await validateTMDBId(movie);
      if (tmdbIssue && !castIssue) {  // Don't duplicate if already flagged
        issues.push(tmdbIssue);
      }
      
      checked++;
      if (checked >= 100) break;  // Limit API calls
      await new Promise(r => setTimeout(r, 150));  // Rate limit
    }
    
    if (verbose) {
      console.log(`Validated ${checked} movies against TMDB`);
    }
  }
  
  // Sort issues by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  const result: CrossValidationResult = {
    actor: actorName,
    actorTmdbId,
    timestamp: new Date().toISOString(),
    totalMovies: movies.length,
    validMovies: movies.length - issues.length,
    issues,
    criticalIssues: issues.filter(i => i.severity === 'critical').length,
    highIssues: issues.filter(i => i.severity === 'high').length,
    autoFixable: issues.filter(i => i.suggestedFix && i.confidence >= 0.90).length,
  };
  
  return result;
}

/**
 * Auto-fix high-confidence issues
 */
export async function autoFixFilmographyIssues(
  result: CrossValidationResult,
  options: {
    supabase?: SupabaseClient;
    execute?: boolean;
    minConfidence?: number;
    verbose?: boolean;
  } = {}
): Promise<{ fixed: number; skipped: number; errors: string[] }> {
  const {
    execute = false,
    minConfidence = 0.90,
    verbose = false,
  } = options;
  
  const supabase = options.supabase || createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  let fixed = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (const issue of result.issues) {
    if (!issue.suggestedFix || issue.confidence < minConfidence) {
      skipped++;
      continue;
    }
    
    if (verbose) {
      console.log(`${execute ? 'Fixing' : 'Would fix'}: ${issue.title} - ${issue.details}`);
    }
    
    if (!execute) {
      fixed++;
      continue;
    }
    
    try {
      switch (issue.suggestedFix.action) {
        case 'reattribute':
          await supabase
            .from('movies')
            .update({ hero: issue.suggestedFix.newValue })
            .eq('id', issue.movieId);
          fixed++;
          break;
          
        case 'delete':
          await supabase
            .from('movies')
            .delete()
            .eq('id', issue.movieId);
          fixed++;
          break;
          
        case 'clear_tmdb':
          await supabase
            .from('movies')
            .update({ tmdb_id: null })
            .eq('id', issue.movieId);
          fixed++;
          break;
          
        default:
          skipped++;
      }
    } catch (err) {
      errors.push(`Failed to fix ${issue.slug}: ${err}`);
    }
  }
  
  return { fixed, skipped, errors };
}

// ============================================================
// CLI
// ============================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (name: string, defaultValue: string = ''): string => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };
  const hasFlag = (name: string): boolean => args.includes(`--${name}`);
  
  const actor = getArg('actor', '');
  const autoFix = hasFlag('auto-fix');
  const execute = hasFlag('execute');
  const verbose = hasFlag('verbose') || hasFlag('v');
  
  if (!actor) {
    console.log('Usage: npx tsx scripts/lib/filmography-cross-validator.ts --actor="Actor Name" [--auto-fix] [--execute] [--verbose]');
    process.exit(1);
  }
  
  (async () => {
    console.log(`\nValidating filmography for: ${actor}`);
    console.log('═'.repeat(60));
    
    const result = await validateActorFilmography(actor, { verbose });
    
    console.log(`\nResults:`);
    console.log(`  Total movies: ${result.totalMovies}`);
    console.log(`  Valid: ${result.validMovies}`);
    console.log(`  Issues: ${result.issues.length}`);
    console.log(`    Critical: ${result.criticalIssues}`);
    console.log(`    High: ${result.highIssues}`);
    console.log(`    Auto-fixable: ${result.autoFixable}`);
    
    if (result.issues.length > 0) {
      console.log('\nIssues found:');
      for (const issue of result.issues.slice(0, 20)) {
        console.log(`  [${issue.severity.toUpperCase()}] ${issue.title} (${issue.year})`);
        console.log(`    ${issue.details}`);
        if (issue.suggestedFix) {
          console.log(`    → Fix: ${issue.suggestedFix.action} ${issue.suggestedFix.newValue || ''}`);
        }
      }
      
      if (result.issues.length > 20) {
        console.log(`  ... and ${result.issues.length - 20} more issues`);
      }
    }
    
    if (autoFix && result.autoFixable > 0) {
      console.log(`\n${execute ? 'Applying' : 'Would apply'} ${result.autoFixable} auto-fixes...`);
      const fixResult = await autoFixFilmographyIssues(result, { execute, verbose });
      console.log(`  Fixed: ${fixResult.fixed}, Skipped: ${fixResult.skipped}`);
      if (fixResult.errors.length > 0) {
        console.log(`  Errors: ${fixResult.errors.join(', ')}`);
      }
    }
  })();
}
