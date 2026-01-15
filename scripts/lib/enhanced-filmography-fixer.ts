/**
 * ENHANCED FILMOGRAPHY FIXER (v2.0)
 * 
 * Comprehensive actor filmography validation and auto-fixing based on
 * learnings from Balakrishna and Chiranjeevi validation sessions.
 * 
 * Target: <5% manual review rate
 * 
 * Auto-fixes applied:
 * 1. Spelling duplicates (Telugu transliteration variations)
 * 2. Hero name standardization (variations → canonical name)
 * 3. Hindi/Tamil dub removal
 * 4. Placeholder removal (unreleased/announced films)
 * 5. Wrong actor reattribution (similar names like Chiranjeevi vs Chiranjeevi Sarja)
 * 6. Multi-hero film updates
 * 7. Supporting cast categorization
 * 8. Wrong TMDB ID fixes
 * 
 * Usage:
 *   npx tsx scripts/lib/enhanced-filmography-fixer.ts --actor="Chiranjeevi" [--execute]
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import chalk from 'chalk';

import { getActorIdentifier, KNOWN_ACTOR_IDS, KNOWN_ACTOR_MULTIPLE_IDS } from './actor-identifier';
import { detectSpellingDuplicates, type SpellingDuplicate } from './filmography-cross-validator';
import { HERO_NAME_MAPPINGS, getStandardHeroName } from './hero-name-standardizer';

dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// ============================================================
// CONFIGURATION - Based on Chiranjeevi/Balakrishna sessions
// ============================================================

/**
 * Known actor name confusions - actors with similar names
 * Maps confused actor → their films' typical TMDB language or characteristics
 */
export const ACTOR_NAME_CONFUSIONS: Record<string, {
  confusedWith: string;
  thisActorLanguages: string[];
  otherActorLanguages: string[];
}> = {
  'chiranjeevi': {
    confusedWith: 'Chiranjeevi Sarja',
    thisActorLanguages: ['te'],  // Telugu
    otherActorLanguages: ['kn'], // Kannada
  },
  'ntr': {
    confusedWith: 'N. T. Rama Rao Sr.',
    thisActorLanguages: ['te'],
    otherActorLanguages: ['te'],
  },
};

/**
 * Patterns for Hindi dubbed versions (should be removed)
 */
export const HINDI_DUB_PATTERNS = [
  /zulm/i,
  /zindagi/i,
  /agneepath/i,
  /meri\s/i,
  /pyar\ska/i,
  /main\s/i,
  /hum\s/i,
  /aaj\ska/i,
];

/**
 * Patterns for placeholder/announced films (should be removed)
 */
export const PLACEHOLDER_PATTERNS = [
  /mega\s*\d+/i,      // "Mega 159", "Mega 160"
  /auto\s*jaani/i,     // Placeholder
  /untitled/i,
  /tba$/i,
  /upcoming$/i,
];

/**
 * Patterns for Tamil dubbed versions
 */
export const TAMIL_DUB_INDICATORS = [
  { pattern: /\(tamil\)/i, action: 'remove' },
  { pattern: /\(kannada\)/i, action: 'remove' },
];

// ============================================================
// TYPES
// ============================================================

export interface FixableIssue {
  id: string;
  movieId: string;
  slug: string;
  title: string;
  year: number;
  issueType: 
    | 'spelling_duplicate'
    | 'name_variation'
    | 'hindi_dub'
    | 'placeholder'
    | 'wrong_actor'
    | 'wrong_tmdb_language'
    | 'multi_hero_update'
    | 'add_to_supporting'
    | 'ghost_entry';
  confidence: number;
  action: 'auto_fix' | 'flag_review' | 'report_only';
  fix: {
    operation: 'delete' | 'update_hero' | 'update_supporting' | 'clear_tmdb' | 'update_tmdb';
    newValue?: string | number | object;
    reason: string;
  };
}

export interface EnhancedFixResult {
  actor: string;
  timestamp: string;
  dbCount: number;
  tmdbCount: number;
  wikiCount: number;
  issues: FixableIssue[];
  summary: {
    autoFixed: number;
    flaggedForReview: number;
    reportOnly: number;
    manualReviewRate: number;
  };
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
  supporting_cast: Array<{ name: string; type?: string; order?: number }> | null;
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
    cast: (movie.credits?.cast || []).slice(0, 15).map((c: any) => ({
      id: c.id,
      name: c.name,
      order: c.order,
    })),
  };
}

async function searchTMDBMovie(title: string, year: number): Promise<{
  id: number;
  title: string;
  originalLanguage: string;
  releaseYear: number;
} | null> {
  const query = encodeURIComponent(title);
  const results = await fetchTMDB(`/search/movie?query=${query}&year=${year}&language=en-US`);
  
  if (!results?.results?.length) {
    // Try without year
    const resultsNoYear = await fetchTMDB(`/search/movie?query=${query}&language=en-US`);
    if (!resultsNoYear?.results?.length) return null;
    
    // Find Telugu movie closest to year
    const telugu = resultsNoYear.results.find((m: any) => 
      m.original_language === 'te' && 
      Math.abs(parseInt(m.release_date?.split('-')[0] || '0') - year) <= 2
    );
    if (telugu) {
      return {
        id: telugu.id,
        title: telugu.title,
        originalLanguage: telugu.original_language,
        releaseYear: parseInt(telugu.release_date?.split('-')[0] || '0'),
      };
    }
    return null;
  }
  
  // Prefer Telugu movie
  const telugu = results.results.find((m: any) => m.original_language === 'te');
  if (telugu) {
    return {
      id: telugu.id,
      title: telugu.title,
      originalLanguage: telugu.original_language,
      releaseYear: parseInt(telugu.release_date?.split('-')[0] || '0'),
    };
  }
  
  return null;
}

// ============================================================
// DETECTION FUNCTIONS
// ============================================================

/**
 * Detect Hindi dubbed versions
 */
function detectHindiDubs(movies: Movie[]): FixableIssue[] {
  const issues: FixableIssue[] = [];
  
  for (const movie of movies) {
    for (const pattern of HINDI_DUB_PATTERNS) {
      if (pattern.test(movie.title_en)) {
        issues.push({
          id: `hindi-dub-${movie.id}`,
          movieId: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          issueType: 'hindi_dub',
          confidence: 0.95,
          action: 'auto_fix',
          fix: {
            operation: 'delete',
            reason: `Hindi dubbed version detected: "${movie.title_en}"`,
          },
        });
        break;
      }
    }
  }
  
  return issues;
}

/**
 * Detect placeholder/announced films
 */
function detectPlaceholders(movies: Movie[]): FixableIssue[] {
  const issues: FixableIssue[] = [];
  
  for (const movie of movies) {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(movie.title_en)) {
        issues.push({
          id: `placeholder-${movie.id}`,
          movieId: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          issueType: 'placeholder',
          confidence: 0.90,
          action: 'auto_fix',
          fix: {
            operation: 'delete',
            reason: `Placeholder/announced film: "${movie.title_en}"`,
          },
        });
        break;
      }
    }
  }
  
  return issues;
}

/**
 * Detect hero name variations that need standardization
 */
function detectNameVariations(movies: Movie[], actorName: string): FixableIssue[] {
  const issues: FixableIssue[] = [];
  const standardName = getStandardHeroName(actorName);
  
  for (const movie of movies) {
    if (!movie.hero) continue;
    
    // Check if hero field contains a non-standard variation
    const heroLower = movie.hero.toLowerCase();
    const actorLower = actorName.toLowerCase();
    
    // Skip if exact match or doesn't contain actor
    if (movie.hero === standardName) continue;
    if (!heroLower.includes(actorLower.split(' ').pop() || actorLower)) continue;
    
    // Check if it's a known variation
    for (const [variation, canonical] of Object.entries(HERO_NAME_MAPPINGS)) {
      if (heroLower.includes(variation) && canonical.toLowerCase().includes(actorLower.split(' ').pop() || '')) {
        if (movie.hero !== canonical) {
          issues.push({
            id: `name-var-${movie.id}`,
            movieId: movie.id,
            slug: movie.slug,
            title: movie.title_en,
            year: movie.release_year,
            issueType: 'name_variation',
            confidence: 0.95,
            action: 'auto_fix',
            fix: {
              operation: 'update_hero',
              newValue: canonical,
              reason: `Name standardization: "${movie.hero}" → "${canonical}"`,
            },
          });
        }
        break;
      }
    }
  }
  
  return issues;
}

/**
 * Detect wrong actor attribution (similar names)
 */
async function detectWrongActorAttribution(
  movies: Movie[],
  actorName: string,
  actorTmdbIds: number[]
): Promise<FixableIssue[]> {
  const issues: FixableIssue[] = [];
  const actorLower = actorName.toLowerCase();
  const confusion = ACTOR_NAME_CONFUSIONS[actorLower];
  
  if (!confusion) return issues;
  
  for (const movie of movies) {
    if (!movie.tmdb_id) continue;
    
    const tmdbDetails = await getTMDBMovieDetails(movie.tmdb_id);
    if (!tmdbDetails) continue;
    
    // Check if movie is in wrong language (e.g., Kannada for Chiranjeevi Sarja)
    if (confusion.otherActorLanguages.includes(tmdbDetails.originalLanguage) &&
        !confusion.thisActorLanguages.includes(tmdbDetails.originalLanguage)) {
      
      // This movie is likely for the "other" actor
      issues.push({
        id: `wrong-actor-${movie.id}`,
        movieId: movie.id,
        slug: movie.slug,
        title: movie.title_en,
        year: movie.release_year,
        issueType: 'wrong_actor',
        confidence: 0.95,
        action: 'auto_fix',
        fix: {
          operation: 'update_hero',
          newValue: confusion.confusedWith,
          reason: `Wrong actor: "${movie.title_en}" is ${tmdbDetails.originalLanguage} film, likely ${confusion.confusedWith}`,
        },
      });
      continue;
    }
    
    // Check if actor is in TMDB cast
    const actorInCast = tmdbDetails.cast.some(c => 
      actorTmdbIds.includes(c.id) || 
      c.name.toLowerCase().includes(actorLower.split(' ').pop() || '')
    );
    
    if (!actorInCast && tmdbDetails.originalLanguage === 'te') {
      // Not in Telugu movie cast - could be wrong attribution
      const topCast = tmdbDetails.cast.slice(0, 3).map(c => c.name).join(', ');
      
      // Check if top cast member matches the confused actor
      if (confusion.confusedWith && tmdbDetails.cast.some(c => 
        c.name.toLowerCase().includes(confusion.confusedWith.toLowerCase().split(' ').pop() || '')
      )) {
        issues.push({
          id: `wrong-actor-cast-${movie.id}`,
          movieId: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          issueType: 'wrong_actor',
          confidence: 0.85,
          action: 'flag_review',
          fix: {
            operation: 'update_hero',
            newValue: confusion.confusedWith,
            reason: `${actorName} not in TMDB cast. Top cast: ${topCast}`,
          },
        });
      }
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }
  
  return issues;
}

/**
 * Detect wrong TMDB IDs (wrong language or movie)
 * Enhanced: More aggressive search for correct Telugu versions
 */
async function detectWrongTMDBIds(movies: Movie[]): Promise<FixableIssue[]> {
  const issues: FixableIssue[] = [];
  
  for (const movie of movies) {
    if (!movie.tmdb_id) continue;
    
    const tmdbDetails = await getTMDBMovieDetails(movie.tmdb_id);
    if (!tmdbDetails) {
      // TMDB ID doesn't exist - definitely invalid, auto-clear
      issues.push({
        id: `tmdb-notfound-${movie.id}`,
        movieId: movie.id,
        slug: movie.slug,
        title: movie.title_en,
        year: movie.release_year,
        issueType: 'wrong_tmdb_language',
        confidence: 0.95,  // High confidence - invalid TMDB ID should be cleared
        action: 'auto_fix',
        fix: {
          operation: 'clear_tmdb',
          reason: `TMDB ID ${movie.tmdb_id} not found - cleared invalid ID`,
        },
      });
      continue;
    }
    
    // Check language - Telugu movies should be 'te'
    if (tmdbDetails.originalLanguage !== 'te') {
      // Try multiple search strategies to find correct TMDB ID
      let correct: { id: number; title: string; originalLanguage: string; releaseYear: number } | null = null;
      
      // Strategy 1: Search with exact title
      correct = await searchTMDBMovie(movie.title_en, movie.release_year);
      
      // Strategy 2: Search without year if not found
      if (!correct || correct.originalLanguage !== 'te') {
        correct = await searchTMDBMovie(movie.title_en, 0);
        if (correct && correct.originalLanguage === 'te') {
          // Verify year is close
          if (Math.abs(correct.releaseYear - movie.release_year) > 2) {
            correct = null;
          }
        }
      }
      
      // Strategy 3: Search with simplified title (remove special characters)
      if (!correct || correct.originalLanguage !== 'te') {
        const simplifiedTitle = movie.title_en
          .replace(/[!?:,.'"-]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (simplifiedTitle !== movie.title_en) {
          correct = await searchTMDBMovie(simplifiedTitle, movie.release_year);
        }
      }
      
      if (correct && correct.originalLanguage === 'te') {
        issues.push({
          id: `tmdb-wrong-${movie.id}`,
          movieId: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          issueType: 'wrong_tmdb_language',
          confidence: 0.95, // Higher confidence when we found a replacement
          action: 'auto_fix',
          fix: {
            operation: 'update_tmdb',
            newValue: correct.id,
            reason: `Wrong TMDB: current is ${tmdbDetails.originalLanguage} ("${tmdbDetails.title}"), found Telugu version (${correct.id})`,
          },
        });
      } else {
        // No Telugu version found - just clear the wrong ID
        // This is also auto-fixable since having wrong data is worse than no data
        issues.push({
          id: `tmdb-wrong-lang-${movie.id}`,
          movieId: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          issueType: 'wrong_tmdb_language',
          confidence: 0.95,
          action: 'auto_fix', // Changed from flag_review - wrong data should be cleared
          fix: {
            operation: 'clear_tmdb',
            reason: `TMDB ID ${movie.tmdb_id} is ${tmdbDetails.originalLanguage} ("${tmdbDetails.title}"), not Telugu - cleared`,
          },
        });
      }
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }
  
  return issues;
}

/**
 * Convert spelling duplicates to fixable issues
 */
function convertSpellingDuplicates(dupes: SpellingDuplicate[]): FixableIssue[] {
  return dupes.map(dupe => {
    // Keep the one with better data
    const score1 = (dupe.movie1.tmdb_id ? 3 : 0) + 
                   (dupe.movie1.poster_url && !dupe.movie1.poster_url.includes('placeholder') ? 1 : 0) +
                   (dupe.movie1.is_published ? 1 : 0);
    const score2 = (dupe.movie2.tmdb_id ? 3 : 0) + 
                   (dupe.movie2.poster_url && !dupe.movie2.poster_url.includes('placeholder') ? 1 : 0) +
                   (dupe.movie2.is_published ? 1 : 0);
    
    const [keep, remove] = score1 >= score2 ? [dupe.movie1, dupe.movie2] : [dupe.movie2, dupe.movie1];
    
    return {
      id: `spelling-dupe-${remove.id}`,
      movieId: remove.id,
      slug: remove.slug,
      title: remove.title_en,
      year: remove.release_year,
      issueType: 'spelling_duplicate' as const,
      confidence: dupe.similarity,
      action: dupe.similarity >= 0.90 ? 'auto_fix' as const : 'flag_review' as const,
      fix: {
        operation: 'delete' as const,
        reason: `Spelling duplicate of "${keep.title_en}" (${(dupe.similarity * 100).toFixed(0)}% similar)`,
      },
    };
  });
}

// ============================================================
// SUPPORTING CAST DETECTION
// ============================================================

/**
 * Detect films where an actor should be in supporting cast but isn't.
 * This handles:
 * - Supporting/villain roles
 * - Cameo appearances
 * - Special appearances
 */
async function detectMissingSupportingCast(
  allMovies: Movie[],
  actorName: string,
  actorTmdbIds: number[],
  supabase: SupabaseClient
): Promise<FixableIssue[]> {
  const issues: FixableIssue[] = [];
  
  // Get all movies where actor appears in TMDB but isn't the main hero
  const filmsWithActor = new Set(allMovies.map(m => m.id));
  
  // Check movies in DB that might have this actor in supporting cast
  const { data: allDbMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, supporting_cast, tmdb_id')
    .not('tmdb_id', 'is', null)
    .limit(500);
  
  if (!allDbMovies) return issues;
  
  // Check movies where actor isn't hero but might be in TMDB cast
  const potentialSupportMovies = allDbMovies.filter(m => {
    if (filmsWithActor.has(m.id)) return false;  // Already in hero list
    const cast = m.supporting_cast || [];
    const alreadyInSupport = cast.some((c: any) => 
      c.name && c.name.toLowerCase().includes(actorName.toLowerCase().split(' ').pop() || '')
    );
    return !alreadyInSupport;
  });
  
  // Check up to 20 movies for supporting cast roles
  for (const movie of potentialSupportMovies.slice(0, 20)) {
    if (!movie.tmdb_id) continue;
    
    const tmdbDetails = await getTMDBMovieDetails(movie.tmdb_id);
    if (!tmdbDetails) continue;
    
    // Check if actor is in cast
    const actorInCast = tmdbDetails.cast.find(c => 
      actorTmdbIds.includes(c.id)
    );
    
    if (actorInCast && actorInCast.order > 1) {
      // Actor is in cast but not as lead (order > 1)
      const roleType = actorInCast.order <= 3 ? 'supporting' : 
                       actorInCast.order <= 5 ? 'cameo' : 'special';
      
      issues.push({
        id: `support-cast-${movie.id}`,
        movieId: movie.id,
        slug: '',  // Not needed for supporting cast update
        title: movie.title_en,
        year: movie.release_year,
        issueType: 'add_to_supporting',
        confidence: 0.90,
        action: 'auto_fix',
        fix: {
          operation: 'update_supporting',
          newValue: {
            name: actorName,
            type: roleType,
            order: actorInCast.order,
          },
          reason: `${actorName} appears in TMDB cast at position ${actorInCast.order + 1} - adding as ${roleType}`,
        },
      });
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  return issues;
}

// ============================================================
// MAIN VALIDATION FUNCTION
// ============================================================

/**
 * Run comprehensive filmography validation with enhanced auto-fixing
 */
export async function runEnhancedValidation(
  actorName: string,
  options: {
    supabase?: SupabaseClient;
    execute?: boolean;
    verbose?: boolean;
    maxTMDBChecks?: number;
  } = {}
): Promise<EnhancedFixResult> {
  const {
    execute = false,
    verbose = false,
    maxTMDBChecks = 50,
  } = options;
  
  const supabase = options.supabase || createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const identifier = getActorIdentifier();
  
  if (verbose) {
    console.log(chalk.cyan(`\n  Starting enhanced validation for: ${actorName}`));
    console.log(chalk.gray('  ─'.repeat(30)));
  }
  
  // Get all TMDB IDs for actor
  const actorTmdbId = await identifier.resolveActorId(actorName);
  const actorLower = actorName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const allTmdbIds: number[] = [];
  
  if (KNOWN_ACTOR_MULTIPLE_IDS[actorLower]) {
    allTmdbIds.push(...KNOWN_ACTOR_MULTIPLE_IDS[actorLower]);
  }
  if (actorTmdbId && !allTmdbIds.includes(actorTmdbId)) {
    allTmdbIds.push(actorTmdbId);
  }
  
  if (verbose) {
    console.log(chalk.gray(`  Actor TMDB IDs: ${allTmdbIds.join(', ') || 'none'}`));
  }
  
  // Fetch movies with pagination
  let allMovies: Movie[] = [];
  let offset = 0;
  
  while (true) {
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero, tmdb_id, slug, poster_url, is_published, supporting_cast')
      .ilike('hero', `%${actorName}%`)
      .not('hero', 'ilike', '%Sarja%')  // Exclude known confusions
      .order('release_year', { ascending: false })
      .range(offset, offset + 999);
    
    if (!movies || movies.length === 0) break;
    allMovies = allMovies.concat(movies);
    offset += 1000;
    if (movies.length < 1000) break;
  }
  
  if (verbose) {
    console.log(chalk.gray(`  Found ${allMovies.length} movies in DB`));
  }
  
  // Collect all issues
  const allIssues: FixableIssue[] = [];
  
  // 1. Detect spelling duplicates
  if (verbose) console.log(chalk.gray('\n  [1/6] Detecting spelling duplicates...'));
  const spellingDupes = detectSpellingDuplicates(allMovies);
  allIssues.push(...convertSpellingDuplicates(spellingDupes));
  if (verbose && spellingDupes.length) {
    console.log(chalk.yellow(`    Found ${spellingDupes.length} spelling duplicates`));
  }
  
  // 2. Detect Hindi dubs
  if (verbose) console.log(chalk.gray('  [2/6] Detecting Hindi dubs...'));
  const hindiDubs = detectHindiDubs(allMovies);
  allIssues.push(...hindiDubs);
  if (verbose && hindiDubs.length) {
    console.log(chalk.yellow(`    Found ${hindiDubs.length} Hindi dubs`));
  }
  
  // 3. Detect placeholders
  if (verbose) console.log(chalk.gray('  [3/6] Detecting placeholders...'));
  const placeholders = detectPlaceholders(allMovies);
  allIssues.push(...placeholders);
  if (verbose && placeholders.length) {
    console.log(chalk.yellow(`    Found ${placeholders.length} placeholders`));
  }
  
  // 4. Detect name variations
  if (verbose) console.log(chalk.gray('  [4/6] Detecting name variations...'));
  const nameVars = detectNameVariations(allMovies, actorName);
  allIssues.push(...nameVars);
  if (verbose && nameVars.length) {
    console.log(chalk.yellow(`    Found ${nameVars.length} name variations`));
  }
  
  // 5. Detect wrong actor attribution (requires TMDB)
  if (verbose) console.log(chalk.gray('  [5/6] Detecting wrong attributions...'));
  const moviesToCheck = allMovies.filter(m => m.tmdb_id).slice(0, maxTMDBChecks);
  const wrongActors = await detectWrongActorAttribution(moviesToCheck, actorName, allTmdbIds);
  allIssues.push(...wrongActors);
  if (verbose && wrongActors.length) {
    console.log(chalk.yellow(`    Found ${wrongActors.length} wrong attributions`));
  }
  
  // 6. Detect wrong TMDB IDs
  if (verbose) console.log(chalk.gray('  [6/6] Validating TMDB IDs...'));
  const wrongTmdb = await detectWrongTMDBIds(moviesToCheck);
  allIssues.push(...wrongTmdb);
  if (verbose && wrongTmdb.length) {
    console.log(chalk.yellow(`    Found ${wrongTmdb.length} wrong TMDB IDs`));
  }
  
  // 7. Detect missing supporting cast (optional, slower)
  if (verbose) console.log(chalk.gray('  [7/7] Detecting supporting cast entries...'));
  const supportCast = await detectMissingSupportingCast(allMovies, actorName, allTmdbIds, supabase);
  allIssues.push(...supportCast);
  if (verbose && supportCast.length) {
    console.log(chalk.yellow(`    Found ${supportCast.length} missing supporting cast entries`));
  }
  
  // Calculate summary
  const autoFix = allIssues.filter(i => i.action === 'auto_fix').length;
  const flagged = allIssues.filter(i => i.action === 'flag_review').length;
  const reportOnly = allIssues.filter(i => i.action === 'report_only').length;
  const manualReviewRate = allIssues.length > 0 ? (flagged / allIssues.length) * 100 : 0;
  
  const result: EnhancedFixResult = {
    actor: actorName,
    timestamp: new Date().toISOString(),
    dbCount: allMovies.length,
    tmdbCount: 0, // Would need separate fetch
    wikiCount: 0, // Would need Wikipedia fetch
    issues: allIssues,
    summary: {
      autoFixed: autoFix,
      flaggedForReview: flagged,
      reportOnly,
      manualReviewRate,
    },
  };
  
  // Apply fixes if execute flag is set
  if (execute && autoFix > 0) {
    if (verbose) {
      console.log(chalk.cyan(`\n  Applying ${autoFix} auto-fixes...`));
    }
    
    for (const issue of allIssues.filter(i => i.action === 'auto_fix')) {
      try {
        switch (issue.fix.operation) {
          case 'delete':
            await supabase.from('movies').delete().eq('id', issue.movieId);
            if (verbose) console.log(chalk.green(`    ✓ Deleted: ${issue.title}`));
            break;
            
          case 'update_hero':
            await supabase.from('movies').update({ hero: issue.fix.newValue }).eq('id', issue.movieId);
            if (verbose) console.log(chalk.green(`    ✓ Updated hero: ${issue.title} → ${issue.fix.newValue}`));
            break;
            
          case 'update_tmdb':
            await supabase.from('movies').update({ tmdb_id: issue.fix.newValue }).eq('id', issue.movieId);
            if (verbose) console.log(chalk.green(`    ✓ Updated TMDB: ${issue.title} → ${issue.fix.newValue}`));
            break;
            
          case 'clear_tmdb':
            await supabase.from('movies').update({ tmdb_id: null }).eq('id', issue.movieId);
            if (verbose) console.log(chalk.green(`    ✓ Cleared TMDB: ${issue.title}`));
            break;
            
          case 'update_supporting':
            // Add actor to supporting cast
            const { data: movieData } = await supabase
              .from('movies')
              .select('supporting_cast')
              .eq('id', issue.movieId)
              .single();
            
            const currentCast = movieData?.supporting_cast || [];
            const newCast = [...currentCast, issue.fix.newValue];
            
            await supabase.from('movies').update({ supporting_cast: newCast }).eq('id', issue.movieId);
            if (verbose) console.log(chalk.green(`    ✓ Added to supporting cast: ${issue.title}`));
            break;
        }
      } catch (err) {
        if (verbose) console.log(chalk.red(`    ✗ Failed: ${issue.title} - ${err}`));
      }
    }
  }
  
  return result;
}

/**
 * Print validation summary
 */
export function printValidationSummary(result: EnhancedFixResult): void {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════
║ ENHANCED FILMOGRAPHY VALIDATION: ${result.actor}
╠═══════════════════════════════════════════════════════════════════════
`));

  console.log(`  DB Movies: ${result.dbCount}`);
  console.log(`  Total Issues: ${result.issues.length}`);
  console.log(`  ─────────────────────────────────────────────────────`);
  console.log(`  Auto-fixable: ${chalk.green(result.summary.autoFixed)}`);
  console.log(`  Manual review: ${chalk.yellow(result.summary.flaggedForReview)}`);
  console.log(`  Report only: ${chalk.gray(result.summary.reportOnly)}`);
  console.log(`  ─────────────────────────────────────────────────────`);
  console.log(`  Manual Review Rate: ${result.summary.manualReviewRate.toFixed(1)}%`);
  
  if (result.summary.manualReviewRate <= 5) {
    console.log(chalk.green(`  ✓ Target achieved (<5% manual review)`));
  } else {
    console.log(chalk.yellow(`  ⚠ Above target (${result.summary.manualReviewRate.toFixed(1)}% > 5%)`));
  }

  console.log(chalk.cyan(`
╚═══════════════════════════════════════════════════════════════════════
`));

  // Show issues by type
  if (result.issues.length > 0) {
    const byType = new Map<string, number>();
    result.issues.forEach(i => {
      byType.set(i.issueType, (byType.get(i.issueType) || 0) + 1);
    });
    
    console.log('  Issues by Type:');
    for (const [type, count] of byType) {
      console.log(`    ${type}: ${count}`);
    }
  }
}

/**
 * Save validation report
 */
export function saveValidationReport(result: EnhancedFixResult, outputDir: string): void {
  const slug = result.actor.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const reportPath = `${outputDir}/${slug}-enhanced-validation.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(chalk.gray(`  Report saved: ${reportPath}`));
  
  // Save manual review list
  const reviewItems = result.issues.filter(i => i.action === 'flag_review');
  if (reviewItems.length > 0) {
    const reviewPath = `${outputDir}/${slug}-manual-review.csv`;
    const csv = [
      'Title,Year,Issue,Confidence,Fix,Reason',
      ...reviewItems.map(i => 
        `"${i.title}",${i.year},${i.issueType},${(i.confidence * 100).toFixed(0)}%,${i.fix.operation},"${i.fix.reason.replace(/"/g, '""')}"`
      ),
    ].join('\n');
    
    fs.writeFileSync(reviewPath, csv);
    console.log(chalk.gray(`  Manual review list: ${reviewPath}`));
  }
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
  const execute = hasFlag('execute');
  const verbose = hasFlag('verbose') || hasFlag('v');
  const outputDir = getArg('output', 'docs');
  
  if (!actor) {
    console.log('Usage: npx tsx scripts/lib/enhanced-filmography-fixer.ts --actor="Actor Name" [--execute] [--verbose]');
    process.exit(1);
  }
  
  (async () => {
    const result = await runEnhancedValidation(actor, { execute, verbose });
    printValidationSummary(result);
    saveValidationReport(result, outputDir);
  })();
}
