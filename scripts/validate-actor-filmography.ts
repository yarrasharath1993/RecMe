#!/usr/bin/env npx tsx
/**
 * UNIFIED ACTOR FILMOGRAPHY VALIDATOR (v3.0)
 * 
 * Enhanced orchestrator based on Venkatesh (76 films), Nani (31 films), and 
 * Balakrishna (111 films) validation sessions.
 * 
 * NEW in v3.0:
 *   - Phase 0: Pre-enrichment validation (count check, name standardization)
 *   - Multiple TMDB Person ID support (handles fragmented TMDB data)
 *   - Spelling-aware duplicate detection (Telugu transliteration variations)
 *   - Hero name standardization (fixes "N. Balakrishna" → "Nandamuri Balakrishna")
 * 
 * Phase 0: Pre-Enrichment (NEW)
 *   - Standardize hero name spellings
 *   - Get expected count from TMDB (using ALL Person IDs)
 *   - Get expected count from Wikipedia
 *   - Detect spelling duplicates
 *   - Report discrepancy BEFORE enrichment
 * 
 * Phase 1: Collect
 *   - Fetch movies from database
 *   - Fetch TMDB actor credits (Telugu only)
 *   - Fetch Wikipedia filmography count
 * 
 * Phase 2: Validate
 *   - Detect ghost entries (films wrongly attributed to actor)
 *   - Find missing films (in TMDB but not in database)
 *   - Detect duplicates (same TMDB ID or similar title)
 *   - Validate TMDB IDs (check for wrong language versions)
 *   - Find missing technical credits (cinematographer, editor, writer)
 * 
 * Phase 3: Score and Fix
 *   - Calculate confidence for each issue
 *   - Auto-fix high-confidence issues (>= 70%)
 *   - Generate 4-section review template
 * 
 * Phase 4: Export
 *   - Generate anomaly report (CSV + JSON)
 *   - Generate review template
 *   - Export final filmography
 * 
 * Usage:
 *   npx tsx scripts/validate-actor-filmography.ts --actor="Mahesh Babu" --report-only
 *   npx tsx scripts/validate-actor-filmography.ts --actor="Chiranjeevi" --auto-fix --execute
 *   npx tsx scripts/validate-actor-filmography.ts --actor="Nani" --execute
 *   npx tsx scripts/validate-actor-filmography.ts --actor="Venkatesh" --confidence=80 --execute
 *   npx tsx scripts/validate-actor-filmography.ts --actor="Balakrishna" --pre-check  # Only Phase 0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import chalk from 'chalk';

// Import existing validation modules
import { 
  auditActorFilmography, 
  KNOWN_DEBUT_YEARS,
  type FilmographyAudit,
  type AuditMovie,
} from './actor-filmography-audit';

import { 
  runActorValidation, 
  fetchTMDB,
  type ValidationResult,
  type ValidationIssue,
} from './validate-actor-movies';

import {
  type AutoFixIssue,
  type AutoFixResult,
  type FieldSources,
  calculateFieldConfidence,
  determineAction,
  applyAutoFixes,
  generateAnomalyReport,
  printAutoFixSummary,
} from './lib/autofix-engine';

// Import actor identifier for exact TMDB Person ID matching
import {
  ActorIdentifier,
  getActorIdentifier,
  KNOWN_ACTOR_MULTIPLE_IDS,
  hasMultipleTmdbIds,
} from './lib/actor-identifier';

// Import hero name standardizer
import {
  getStandardHeroName,
  findHeroNameVariations,
  standardizeHeroNames,
  getActorMovieCount,
} from './lib/hero-name-standardizer';

// Import spelling duplicate detection
import {
  detectSpellingDuplicates,
  type SpellingDuplicate,
} from './lib/filmography-cross-validator';

// Import enhanced filmography fixer (v2.0 - Chiranjeevi session learnings)
import {
  runEnhancedValidation,
  printValidationSummary,
  saveValidationReport,
  type EnhancedFixResult,
  HINDI_DUB_PATTERNS,
  PLACEHOLDER_PATTERNS,
  ACTOR_NAME_CONFUSIONS,
} from './lib/enhanced-filmography-fixer';

dotenv.config({ path: '.env.local' });

// ============================================================
// TYPES
// ============================================================

interface OrchestratorOptions {
  autoFix?: boolean;
  execute?: boolean;
  reportOnly?: boolean;
  confidence?: number;
  verbose?: boolean;
  outputDir?: string;
  batchSize?: number;
  preCheckOnly?: boolean;  // Only run Phase 0
  enhancedMode?: boolean;  // NEW: Use enhanced fixer (v2.0)
}

// Pre-enrichment validation result
interface PreEnrichmentResult {
  actor: string;
  standardName: string;
  dbCount: number;
  tmdbCount: number;
  wikiCount: number | null;
  expectedCount: number;
  discrepancy: number;
  nameVariationsFound: Array<{ original: string; count: number }>;
  spellingDuplicatesFound: number;
  hasMultipleTmdbIds: boolean;
  tmdbIds: number[];
  issues: string[];
  recommendations: string[];
}

interface TMDBActorCredits {
  id: number;
  name: string;
  cast: Array<{
    id: number;
    title: string;
    original_title: string;
    release_date: string;
    character: string;
    order: number;
    original_language: string;
  }>;
}

interface TMDBMovieDetails {
  id: number;
  title: string;
  original_language: string;
  release_date: string;
  credits?: {
    cast: Array<{ name: string; order: number }>;
    crew: Array<{ name: string; job: string; department: string }>;
  };
}

interface EnrichedMovie extends AuditMovie {
  tmdb_id?: number;
  heroine?: string | null;
  music_director?: string | null;
  producer?: string | null;
  cinematographer?: string | null;
  crew?: {
    editor?: string;
    writer?: string;
    cinematographer?: string;
  };
  genres?: string[];
  supporting_cast?: Array<{ name: string; type: string }>;
}

interface GhostEntry {
  movie: EnrichedMovie;
  tmdbCast: string[];
  suggestedHero: string | null;
  confidence: number;
}

interface MissingFilm {
  tmdbId: number;
  title: string;
  year: number;
  character: string;
  source: 'tmdb';
}

interface TMDBIdIssue {
  movie: EnrichedMovie;
  currentTmdbId: number;
  issue: 'wrong_language' | 'not_found' | 'cast_mismatch';
  details: string;
}

interface MissingField {
  movie: EnrichedMovie;
  field: string;
  currentValue: string | null;
}

// Validation rules based on Venkatesh + Nani sessions
const VALIDATION_RULES = {
  // Ghost entry detection threshold
  ghostThreshold: 0.3, // Actor must appear in at least 30% of checked entries
  
  // Duplicate detection
  duplicateTitleSimilarity: 0.85,
  duplicateYearTolerance: 1,
  
  // TMDB language check
  validLanguages: ['te', 'Telugu'],
  
  // Multi-starrer handling
  multiHeroFields: ['hero', 'supporting_cast'],
  
  // Technical credits to check
  technicalFields: ['cinematographer', 'editor', 'writer', 'producer', 'music_director'],
};

// ============================================================
// CLI PARSING
// ============================================================

function parseArgs(): { actor: string; options: OrchestratorOptions } {
  const args = process.argv.slice(2);
  
  const getArg = (name: string, defaultValue: string = ''): string => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };
  
  const hasFlag = (name: string): boolean => args.includes(`--${name}`);

  const actor = getArg('actor', '');
  
  if (!actor) {
    printHelp();
    process.exit(1);
  }

  return {
    actor,
    options: {
      autoFix: hasFlag('auto-fix'),
      execute: hasFlag('execute'),
      reportOnly: hasFlag('report-only'),
      confidence: parseInt(getArg('confidence', '70')),
      verbose: hasFlag('verbose') || hasFlag('v'),
      outputDir: getArg('output', 'docs'),
      preCheckOnly: hasFlag('pre-check'),
      enhancedMode: hasFlag('enhanced'),  // Use enhanced fixer (v2.0)
    },
  };
}

function printHelp(): void {
  console.log(`
${chalk.cyan.bold('UNIFIED ACTOR FILMOGRAPHY VALIDATOR v3.0')}

${chalk.yellow('Usage:')}
  npx tsx scripts/validate-actor-filmography.ts --actor="Actor Name" [options]

${chalk.yellow('Options:')}
  --actor=NAME         ${chalk.gray('Required: Actor name to validate')}
  --pre-check          ${chalk.gray('Only run Phase 0 (count validation, no fixes)')}
  --auto-fix           ${chalk.gray('Apply high-confidence fixes automatically')}
  --execute            ${chalk.gray('Actually update database (default is dry run)')}
  --report-only        ${chalk.gray('Only generate report, no fixes')}
  --confidence=N       ${chalk.gray('Minimum confidence for auto-fix (default: 70)')}
  --output=DIR         ${chalk.gray('Output directory for reports (default: docs)')}
  --verbose, -v        ${chalk.gray('Show detailed progress')}

${chalk.yellow('Examples:')}
  # Pre-check only (Phase 0 - count validation)
  npx tsx scripts/validate-actor-filmography.ts --actor="Balakrishna" --pre-check
  
  # Dry run validation
  npx tsx scripts/validate-actor-filmography.ts --actor="Mahesh Babu"
  
  # Auto-fix with execution
  npx tsx scripts/validate-actor-filmography.ts --actor="Chiranjeevi" --auto-fix --execute
  
  # Report only (no fixes)
  npx tsx scripts/validate-actor-filmography.ts --actor="Prabhas" --report-only
  
  # Custom confidence threshold
  npx tsx scripts/validate-actor-filmography.ts --actor="Venkatesh" --confidence=80 --execute

${chalk.yellow('Known Actors:')}
${Object.entries(KNOWN_DEBUT_YEARS).slice(0, 15).map(([name, year]) => `  ${name}: ${year}`).join('\n')}
  ... and more

${chalk.yellow('Output:')}
  - docs/{actor}-anomalies.csv    ${chalk.gray('Issues requiring manual review')}
  - docs/{actor}-anomalies.json   ${chalk.gray('Full JSON report')}
  - docs/{actor}-validation.json  ${chalk.gray('Complete validation results')}
  - docs/{actor}-pre-check.json   ${chalk.gray('Phase 0 pre-enrichment report')}
`);
}

// ============================================================
// PHASE 0: PRE-ENRICHMENT VALIDATION (NEW in v3.0)
// ============================================================

/**
 * Phase 0: Pre-enrichment validation
 * 
 * Runs BEFORE any enrichment to:
 * 1. Standardize hero name spellings
 * 2. Get expected count from TMDB (using ALL Person IDs)
 * 3. Get expected count from Wikipedia
 * 4. Detect spelling duplicates
 * 5. Report discrepancy BEFORE enrichment
 * 
 * Based on Balakrishna filmography fix session learnings.
 */
async function runPreEnrichmentValidation(
  actor: string,
  supabase: SupabaseClient,
  options: OrchestratorOptions
): Promise<PreEnrichmentResult> {
  const { verbose = false, execute = false } = options;
  
  if (verbose) {
    console.log(chalk.cyan('\n═══════════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('  PHASE 0: PRE-ENRICHMENT VALIDATION'));
    console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
  }
  
  const result: PreEnrichmentResult = {
    actor,
    standardName: getStandardHeroName(actor),
    dbCount: 0,
    tmdbCount: 0,
    wikiCount: null,
    expectedCount: 0,
    discrepancy: 0,
    nameVariationsFound: [],
    spellingDuplicatesFound: 0,
    hasMultipleTmdbIds: hasMultipleTmdbIds(actor),
    tmdbIds: [],
    issues: [],
    recommendations: [],
  };
  
  const identifier = getActorIdentifier();
  
  // Step 1: Find and report hero name variations
  if (verbose) console.log(chalk.gray('\n  📝 Checking hero name variations...'));
  
  const variations = await findHeroNameVariations(supabase);
  const actorVariations = variations.filter(v => 
    v.standardName.toLowerCase().includes(actor.toLowerCase()) ||
    v.hero.toLowerCase().includes(actor.toLowerCase())
  );
  
  result.nameVariationsFound = actorVariations.map(v => ({
    original: v.hero,
    count: v.count,
  }));
  
  if (actorVariations.length > 0) {
    if (verbose) {
      console.log(chalk.yellow(`     Found ${actorVariations.length} name variations:`));
      for (const v of actorVariations) {
        console.log(chalk.yellow(`       "${v.hero}" (${v.count} films) → "${v.standardName}"`));
      }
    }
    result.issues.push(`Found ${actorVariations.length} name variations that need standardization`);
    result.recommendations.push('Run with --execute to standardize hero names');
    
    // Auto-fix name variations if execute mode
    if (execute) {
      if (verbose) console.log(chalk.green('     Standardizing hero names...'));
      const standardizeResult = await standardizeHeroNames(supabase, {
        actorFilter: actor,
        verbose,
      });
      if (verbose) {
        console.log(chalk.green(`     Standardized ${standardizeResult.standardized} films`));
      }
    }
  } else {
    if (verbose) console.log(chalk.green('     No name variations found'));
  }
  
  // Step 2: Get database count (after standardization)
  if (verbose) console.log(chalk.gray('\n  📊 Getting film counts...'));
  
  const { count: dbCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .or(`hero.ilike.%${actor}%,hero.ilike.%${result.standardName}%`);
  
  result.dbCount = dbCount || 0;
  if (verbose) console.log(chalk.gray(`     Database count: ${result.dbCount}`));
  
  // Step 3: Get TMDB count (using ALL Person IDs)
  const allTmdbIds = identifier.getAllActorIds(actor);
  result.tmdbIds = allTmdbIds;
  
  if (allTmdbIds.length === 0) {
    const resolvedId = await identifier.resolveActorId(actor);
    if (resolvedId) {
      result.tmdbIds = [resolvedId];
    }
  }
  
  if (result.tmdbIds.length > 0) {
    const tmdbResult = await identifier.getExpectedFilmCount(actor);
    result.tmdbCount = tmdbResult.total;
    
    if (verbose) {
      console.log(chalk.gray(`     TMDB count: ${result.tmdbCount} (from ${result.tmdbIds.length} Person IDs)`));
      if (result.hasMultipleTmdbIds) {
        console.log(chalk.yellow(`     ⚠️  Actor has multiple TMDB Person IDs: ${result.tmdbIds.join(', ')}`));
        for (const { id, count } of tmdbResult.byId) {
          console.log(chalk.gray(`        ID ${id}: ${count} films`));
        }
      }
    }
  }
  
  // Step 4: Get Wikipedia count
  // Helper to extract film count from Wikipedia text (avoid false positives like years)
  const extractFilmCount = (text: string): number | null => {
    if (!text) return null;
    
    // Try specific patterns first
    const patterns = [
      /(?:acted|appeared|starred)\s+in\s+(?:over\s+)?(\d+)\s*films?/i,
      /filmography\s+(?:of\s+)?(?:over\s+)?(\d+)\s*films?/i,
      /(?:over|more\s+than|nearly)\s+(\d+)\s*(?:telugu\s+)?films?/i,
      /(\d+)\s*(?:telugu\s+)?films?\s+(?:to\s+date|in\s+total)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const count = parseInt(match[1]);
        // Sanity check: film count should be between 1 and 500
        if (count >= 1 && count <= 500) {
          return count;
        }
      }
    }
    
    // Fallback: simple pattern but with sanity check
    const simpleMatch = text.match(/(\d+)\s*films?/i);
    if (simpleMatch) {
      const count = parseInt(simpleMatch[1]);
      // Only accept if it's a reasonable film count (not a year)
      if (count >= 1 && count <= 500) {
        return count;
      }
    }
    
    return null;
  };
  
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actor.replace(/ /g, '_'))}_filmography`;
    const res = await fetch(wikiUrl, { headers: { 'User-Agent': 'TeluguPortal/1.0' } });
    if (res.ok) {
      const data = await res.json();
      result.wikiCount = extractFilmCount(data.extract);
    }
    
    // Fallback to main page
    if (!result.wikiCount) {
      const mainUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actor.replace(/ /g, '_'))}`;
      const mainRes = await fetch(mainUrl, { headers: { 'User-Agent': 'TeluguPortal/1.0' } });
      if (mainRes.ok) {
        const data = await mainRes.json();
        result.wikiCount = extractFilmCount(data.extract);
      }
    }
    
    if (verbose && result.wikiCount) {
      console.log(chalk.gray(`     Wikipedia count: ~${result.wikiCount}`));
    }
  } catch {
    if (verbose) console.log(chalk.yellow('     Could not fetch Wikipedia count'));
  }
  
  // Step 5: Detect spelling duplicates
  if (verbose) console.log(chalk.gray('\n  🔍 Checking for spelling duplicates...'));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, tmdb_id, slug, poster_url, is_published')
    .or(`hero.ilike.%${actor}%,hero.ilike.%${result.standardName}%`);
  
  if (movies && movies.length > 0) {
    const spellingDupes = detectSpellingDuplicates(movies as any);
    result.spellingDuplicatesFound = spellingDupes.length;
    
    if (spellingDupes.length > 0) {
      if (verbose) {
        console.log(chalk.yellow(`     Found ${spellingDupes.length} spelling duplicates:`));
        for (const dupe of spellingDupes.slice(0, 5)) {
          console.log(chalk.yellow(`       "${dupe.movie1.title_en}" ↔ "${dupe.movie2.title_en}" (${(dupe.similarity * 100).toFixed(0)}%)`));
        }
      }
      result.issues.push(`Found ${spellingDupes.length} spelling duplicates`);
      result.recommendations.push('Review and merge spelling duplicates');
    } else {
      if (verbose) console.log(chalk.green('     No spelling duplicates found'));
    }
  }
  
  // Step 6: Calculate expected count and discrepancy
  // Use TMDB as primary source, Wikipedia as supplementary
  // Note: DB may have more films than TMDB if it includes older films not on TMDB
  if (result.wikiCount && result.wikiCount > 0) {
    // Wikipedia count available - use the maximum for expected
    result.expectedCount = Math.max(result.tmdbCount, result.wikiCount);
  } else {
    // No Wikipedia count - use TMDB as reference
    result.expectedCount = result.tmdbCount;
  }
  
  // Calculate discrepancy relative to TMDB (our most reliable source)
  // Positive = DB has more, Negative = DB has fewer
  result.discrepancy = result.dbCount - result.tmdbCount;
  
  // Step 7: Generate summary
  if (verbose) {
    console.log(chalk.cyan('\n  ─────────────────────────────────────────────────────────────────'));
    console.log(chalk.cyan.bold('  PRE-ENRICHMENT SUMMARY'));
    console.log(chalk.cyan('  ─────────────────────────────────────────────────────────────────'));
    console.log(`  Actor: ${chalk.yellow(result.standardName)}`);
    console.log(`  Database count: ${chalk.yellow(result.dbCount)}`);
    console.log(`  TMDB count: ${chalk.yellow(result.tmdbCount)}`);
    if (result.wikiCount) {
      console.log(`  Wikipedia count: ${chalk.yellow(`~${result.wikiCount}`)}`);
    }
    console.log(`  Expected count: ${chalk.yellow(result.expectedCount)}`);
    
    // Show discrepancy relative to TMDB
    if (result.discrepancy > 0) {
      console.log(chalk.yellow(`  Discrepancy vs TMDB: +${result.discrepancy} (DB has ${result.discrepancy} more)`));
      if (result.discrepancy > 10) {
        result.issues.push(`Database has ${result.discrepancy} more films than TMDB - likely ghost entries or duplicates`);
        result.recommendations.push('Run full validation to identify ghost entries');
      }
    } else if (result.discrepancy < 0) {
      console.log(chalk.yellow(`  Discrepancy vs TMDB: ${result.discrepancy} (DB missing ${Math.abs(result.discrepancy)} films)`));
      result.issues.push(`Database is missing ${Math.abs(result.discrepancy)} films that are on TMDB`);
      result.recommendations.push('Run full validation to identify missing films');
    } else {
      console.log(chalk.green('  Discrepancy vs TMDB: 0 (counts match!)'));
    }
    
    if (result.hasMultipleTmdbIds) {
      console.log(chalk.yellow(`  ⚠️  Multiple TMDB IDs: ${result.tmdbIds.join(', ')}`));
    }
    
    if (result.issues.length > 0) {
      console.log(chalk.yellow('\n  Issues:'));
      for (const issue of result.issues) {
        console.log(chalk.yellow(`    • ${issue}`));
      }
    }
    
    if (result.recommendations.length > 0) {
      console.log(chalk.cyan('\n  Recommendations:'));
      for (const rec of result.recommendations) {
        console.log(chalk.cyan(`    → ${rec}`));
      }
    }
  }
  
  return result;
}

// ============================================================
// PHASE 1: COLLECT DATA
// ============================================================

async function collectData(
  actor: string,
  supabase: SupabaseClient,
  verbose: boolean
): Promise<{ 
  dbMovies: EnrichedMovie[]; 
  tmdbCredits: TMDBActorCredits | null;
  wikiFilmCount: number | null;
}> {
  if (verbose) {
    console.log(chalk.cyan('\n═══════════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('  PHASE 1: COLLECT DATA'));
    console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
  }

  // Fetch from database
  if (verbose) console.log(chalk.gray('\n  📂 Fetching movies from database...'));
  
  const { data: dbMovies, error } = await supabase
    .from('movies')
    .select(`
      id, title_en, release_year, hero, heroine, director,
      music_director, producer, cinematographer, tmdb_id, slug,
      our_rating, cast_members, crew, genres, supporting_cast
    `)
    .ilike('hero', `%${actor}%`)
    .order('release_year', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  if (verbose) console.log(chalk.green(`     Found ${dbMovies?.length || 0} movies in database`));

  // Try to fetch TMDB actor credits using ActorIdentifier for exact Person ID matching
  let tmdbCredits: TMDBActorCredits | null = null;
  const identifier = getActorIdentifier();
  
  if (verbose) console.log(chalk.gray('\n  🎬 Fetching TMDB actor credits...'));
  
  try {
    // Use ActorIdentifier to resolve exact TMDB Person ID
    const actorId = await identifier.resolveActorId(actor);
    
    if (actorId) {
      if (verbose) console.log(chalk.gray(`     Resolved to TMDB Person ID: ${actorId}`));
      
      // Get the actor's Telugu filmography
      const teluguFilms = await identifier.getActorTeluguFilmography(actor);
      
      // Get actor profile for the name
      const profile = await identifier.getActorProfile(actor);
      
      if (teluguFilms.length > 0) {
        tmdbCredits = {
          id: actorId,
          name: profile?.name || actor,
          cast: teluguFilms.map(film => ({
            id: film.tmdbId,
            title: film.title,
            original_title: film.title,
            release_date: film.year > 0 ? `${film.year}-01-01` : '',
            character: film.character,
            order: film.castOrder,
            original_language: 'te',
            })),
        };
        
        if (verbose) console.log(chalk.green(`     Found ${tmdbCredits.cast.length} Telugu films in TMDB for ${profile?.name || actor}`));
      }
    } else {
      if (verbose) console.log(chalk.yellow('     Could not resolve actor to TMDB Person ID'));
    }
  } catch (err) {
    if (verbose) console.log(chalk.yellow('     Could not fetch TMDB credits'));
  }

  // Try to fetch Wikipedia film count
  let wikiFilmCount: number | null = null;
  if (verbose) console.log(chalk.gray('\n  📖 Fetching Wikipedia filmography count...'));
  
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actor.replace(/ /g, '_'))}_filmography`;
    const res = await fetch(wikiUrl, { headers: { 'User-Agent': 'TeluguPortal/1.0' } });
    if (res.ok) {
      const data = await res.json();
      const match = data.extract?.match(/(\d+)\s*films?/i);
      if (match) {
        wikiFilmCount = parseInt(match[1]);
      }
    }
    
    // Fallback to main page
    if (!wikiFilmCount) {
      const mainUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actor.replace(/ /g, '_'))}`;
      const mainRes = await fetch(mainUrl, { headers: { 'User-Agent': 'TeluguPortal/1.0' } });
      if (mainRes.ok) {
        const data = await mainRes.json();
        const match = data.extract?.match(/(\d+)\s*films?/i);
        if (match) {
          wikiFilmCount = parseInt(match[1]);
        }
      }
    }
    
    if (verbose && wikiFilmCount) {
      console.log(chalk.green(`     Wikipedia: ~${wikiFilmCount} films`));
    }
  } catch (err) {
    if (verbose) console.log(chalk.yellow('     Could not fetch Wikipedia count'));
  }

  return { dbMovies: dbMovies || [], tmdbCredits, wikiFilmCount };
}

// ============================================================
// GHOST ENTRY DETECTION
// ============================================================

async function detectGhostEntries(
  dbMovies: EnrichedMovie[],
  actor: string,
  verbose: boolean
): Promise<GhostEntry[]> {
  const ghosts: GhostEntry[] = [];
  const identifier = getActorIdentifier();
  
  if (verbose) {
    console.log(chalk.gray('\n  👻 Detecting ghost entries (wrong attributions)...'));
  }
  
  // First, resolve the actor's TMDB Person ID for exact matching
  const actorTmdbId = await identifier.resolveActorId(actor);
  
  if (verbose && actorTmdbId) {
    console.log(chalk.gray(`     Resolved ${actor} to TMDB Person ID: ${actorTmdbId}`));
  }
  
  let checked = 0;
  for (const movie of dbMovies) {
    if (!movie.tmdb_id) continue;
    
    // Use exact TMDB Person ID matching instead of fuzzy name matching
    const verification = actorTmdbId 
      ? await identifier.isActorInMovieCast(actorTmdbId, movie.tmdb_id)
      : await identifier.verifyActorInMovie(actor, movie.tmdb_id);
    
    if (!verification.found) {
      // Get top cast for the ghost entry report
      const topCast = await identifier.getMovieCast(movie.tmdb_id, 5);
      const topCastNames = topCast.map(c => c.name);
      const suggestedHero = topCast[0]?.name || null;
      
      ghosts.push({
        movie,
        tmdbCast: topCastNames,
        suggestedHero,
        confidence: verification.confidence, // Use confidence from ActorIdentifier
      });
      
      if (verbose) {
        console.log(chalk.yellow(`     ⚠️  ${movie.title_en} (${movie.release_year}): ${actor} not in TMDB cast`));
      }
    }
    
    checked++;
    if (checked >= 100) break; // Limit API calls
    await new Promise(r => setTimeout(r, 100)); // Rate limit
  }
  
  if (verbose) {
    console.log(chalk.gray(`     Checked ${checked} movies, found ${ghosts.length} potential ghost entries`));
  }
  
  return ghosts;
}

// ============================================================
// MISSING FILM DETECTION
// ============================================================

function findMissingFilms(
  dbMovies: EnrichedMovie[],
  tmdbCredits: TMDBActorCredits | null,
  debutYear: number,
  verbose: boolean
): MissingFilm[] {
  const missing: MissingFilm[] = [];
  
  if (!tmdbCredits || tmdbCredits.cast.length === 0) {
    return missing;
  }
  
  if (verbose) {
    console.log(chalk.gray('\n  🔍 Finding missing films (in TMDB but not in DB)...'));
  }
  
  // Build set of TMDB IDs in database
  const dbTmdbIds = new Set(dbMovies.map(m => m.tmdb_id).filter(Boolean));
  
  // Build set of normalized titles+years for fuzzy matching
  const dbTitleYears = new Set(
    dbMovies.map(m => `${m.title_en.toLowerCase().replace(/[^a-z0-9]/g, '')}-${m.release_year}`)
  );
  
  for (const credit of tmdbCredits.cast) {
    const year = credit.release_date ? parseInt(credit.release_date.split('-')[0]) : 0;
    
    // Skip pre-debut films
    if (year < debutYear) continue;
    
    // Skip if TMDB ID matches
    if (dbTmdbIds.has(credit.id)) continue;
    
    // Skip if title+year matches
    const normalizedTitle = credit.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const titleYear = `${normalizedTitle}-${year}`;
    if (dbTitleYears.has(titleYear)) continue;
    
    // Also check original_title
    if (credit.original_title) {
      const normalizedOriginal = credit.original_title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (dbTitleYears.has(`${normalizedOriginal}-${year}`)) continue;
    }
    
    missing.push({
      tmdbId: credit.id,
      title: credit.title,
      year,
      character: credit.character,
      source: 'tmdb',
    });
  }
  
  if (verbose) {
    console.log(chalk.gray(`     Found ${missing.length} films in TMDB not in database`));
  }
  
  return missing;
}

// ============================================================
// TMDB ID VALIDATION
// ============================================================

async function validateTmdbIds(
  dbMovies: EnrichedMovie[],
  verbose: boolean
): Promise<TMDBIdIssue[]> {
  const issues: TMDBIdIssue[] = [];
  
  if (verbose) {
    console.log(chalk.gray('\n  🔗 Validating TMDB IDs...'));
  }
  
  let checked = 0;
  for (const movie of dbMovies) {
    if (!movie.tmdb_id) continue;
    
    const details = await fetchTMDB(`/movie/${movie.tmdb_id}`);
    if (!details) {
      issues.push({
        movie,
        currentTmdbId: movie.tmdb_id,
        issue: 'not_found',
        details: 'TMDB ID not found',
      });
      continue;
    }
    
    // Check language
    if (!VALIDATION_RULES.validLanguages.includes(details.original_language)) {
      issues.push({
        movie,
        currentTmdbId: movie.tmdb_id,
        issue: 'wrong_language',
        details: `TMDB movie is ${details.original_language}, not Telugu`,
      });
    }
    
    checked++;
    if (checked >= 50) break; // Limit API calls
    await new Promise(r => setTimeout(r, 100)); // Rate limit
  }
  
  if (verbose && issues.length > 0) {
    console.log(chalk.yellow(`     Found ${issues.length} TMDB ID issues`));
  }
  
  return issues;
}

// ============================================================
// MISSING FIELD DETECTION
// ============================================================

function findMissingFields(
  dbMovies: EnrichedMovie[],
  verbose: boolean
): MissingField[] {
  const missingFields: MissingField[] = [];
  
  if (verbose) {
    console.log(chalk.gray('\n  📋 Finding missing technical credits...'));
  }
  
  const fieldCounts: Record<string, number> = {};
  
  for (const movie of dbMovies) {
    // Check cinematographer
    if (!movie.cinematographer && !movie.crew?.cinematographer) {
      missingFields.push({ movie, field: 'cinematographer', currentValue: null });
      fieldCounts['cinematographer'] = (fieldCounts['cinematographer'] || 0) + 1;
    }
    
    // Check editor
    if (!movie.crew?.editor) {
      missingFields.push({ movie, field: 'editor', currentValue: null });
      fieldCounts['editor'] = (fieldCounts['editor'] || 0) + 1;
    }
    
    // Check writer
    if (!movie.crew?.writer) {
      missingFields.push({ movie, field: 'writer', currentValue: null });
      fieldCounts['writer'] = (fieldCounts['writer'] || 0) + 1;
    }
    
    // Check producer
    if (!movie.producer) {
      missingFields.push({ movie, field: 'producer', currentValue: null });
      fieldCounts['producer'] = (fieldCounts['producer'] || 0) + 1;
    }
    
    // Check TMDB ID
    if (!movie.tmdb_id) {
      missingFields.push({ movie, field: 'tmdb_id', currentValue: null });
      fieldCounts['tmdb_id'] = (fieldCounts['tmdb_id'] || 0) + 1;
    }
  }
  
  if (verbose) {
    console.log(chalk.gray(`     Missing fields breakdown:`));
    for (const [field, count] of Object.entries(fieldCounts).sort((a, b) => b[1] - a[1])) {
      console.log(chalk.gray(`       ${field}: ${count} films`));
    }
  }
  
  return missingFields;
}

// ============================================================
// PHASE 2: VALIDATE
// ============================================================

interface EnhancedValidationResult {
  audit: FilmographyAudit;
  validation: ValidationResult;
  ghostEntries: GhostEntry[];
  missingFilms: MissingFilm[];
  tmdbIdIssues: TMDBIdIssue[];
  missingFields: MissingField[];
}

async function validateFilmography(
  actor: string,
  dbMovies: EnrichedMovie[],
  tmdbCredits: TMDBActorCredits | null,
  wikiFilmCount: number | null,
  supabase: SupabaseClient,
  verbose: boolean
): Promise<EnhancedValidationResult> {
  if (verbose) {
    console.log(chalk.cyan('\n═══════════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('  PHASE 2: VALIDATE'));
    console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
  }

  // Run filmography audit (duplicates, pre-debut, invalid entries)
  if (verbose) console.log(chalk.gray('\n  🔍 Running filmography audit...'));
  
  const audit = await auditActorFilmography(actor, {
    validateTMDB: false, // We'll do TMDB validation separately
    validateWikipedia: false, // We already have the count
    limit: 500,
  });

  if (verbose) {
    console.log(chalk.green(`     Audit complete: ${audit.summary}`));
  }

  // Run TMDB cast validation
  if (verbose) console.log(chalk.gray('\n  🎯 Running TMDB cast validation...'));
  
  const validation = await runActorValidation(actor, {
    verbose: false,
    rateLimit: 100,
    supabase,
  });

  if (verbose) {
    console.log(chalk.green(`     Validation complete: ${validation.summary}`));
  }

  // Detect ghost entries (films wrongly attributed)
  const ghostEntries = await detectGhostEntries(dbMovies, actor, verbose);
  
  // Find missing films (in TMDB but not in DB)
  const missingFilms = findMissingFilms(dbMovies, tmdbCredits, audit.debutYear, verbose);
  
  // Validate TMDB IDs
  const tmdbIdIssues = await validateTmdbIds(dbMovies, verbose);
  
  // Find missing technical credits
  const missingFields = findMissingFields(dbMovies, verbose);

  return { 
    audit, 
    validation, 
    ghostEntries, 
    missingFilms, 
    tmdbIdIssues, 
    missingFields 
  };
}

// ============================================================
// PHASE 3: SCORE AND FIX
// ============================================================

function buildIssuesList(
  actor: string,
  validationResult: EnhancedValidationResult,
  dbMovies: EnrichedMovie[],
  options: OrchestratorOptions
): AutoFixIssue[] {
  const issues: AutoFixIssue[] = [];
  const confidenceThreshold = (options.confidence || 70) / 100;
  const { audit, validation, ghostEntries, tmdbIdIssues, missingFields } = validationResult;

  // Process duplicates from audit
  for (const dup of audit.duplicates) {
    issues.push({
      id: `dup-${dup.movie1.id}-${dup.movie2.id}`,
      type: 'duplicate',
      movieId: dup.movie2.id,
      movieSlug: dup.movie2.title.toLowerCase().replace(/\s+/g, '-'),
      movieTitle: dup.movie2.title,
      movieYear: dup.movie2.year,
      confidence: dup.similarity,
      sources: {},
      details: `Duplicate of "${dup.movie1.title}" (${dup.movie1.year}) - ${(dup.similarity * 100).toFixed(0)}% similar`,
      action: determineAction('duplicate', dup.similarity, { confidenceThreshold }),
    });
  }

  // Process duplicates from validation
  for (const issue of validation.duplicates) {
    // Skip if already processed from audit
    if (issues.some(i => i.movieId === issue.movie.id)) continue;
    
    issues.push({
      id: `dup-val-${issue.movie.id}`,
      type: 'duplicate',
      movieId: issue.movie.id,
      movieSlug: issue.movie.slug,
      movieTitle: issue.movie.title_en,
      movieYear: issue.movie.release_year,
      confidence: issue.confidence,
      sources: {},
      details: issue.details,
      action: determineAction('duplicate', issue.confidence, { confidenceThreshold }),
    });
  }

  // Process pre-debut films
  for (const movie of audit.preDebutFilms) {
    issues.push({
      id: `pre-debut-${movie.id}`,
      type: 'pre_debut',
      movieId: movie.id,
      movieSlug: movie.title_en.toLowerCase().replace(/\s+/g, '-'),
      movieTitle: movie.title_en,
      movieYear: movie.release_year,
      confidence: 0.85, // High confidence pre-debut detection is accurate
      sources: {},
      details: `Released ${audit.debutYear - movie.release_year} years before ${actor}'s debut (${audit.debutYear})`,
      action: determineAction('pre_debut', 0.85, { confidenceThreshold }),
    });
  }

  // Process invalid entries (from audit)
  for (const movie of audit.invalidEntries) {
    issues.push({
      id: `invalid-${movie.id}`,
      type: 'ghost_entry',
      movieId: movie.id,
      movieSlug: movie.title_en.toLowerCase().replace(/\s+/g, '-'),
      movieTitle: movie.title_en,
      movieYear: movie.release_year,
      confidence: 0.75,
      sources: {},
      details: 'Title appears to be invalid (person name, production house, etc.)',
      action: determineAction('ghost_entry', 0.75, { confidenceThreshold }),
    });
  }

  // Process ghost entries (wrong attributions from TMDB cross-reference)
  for (const ghost of ghostEntries) {
    // Skip if already flagged by validation
    if (issues.some(i => i.movieId === ghost.movie.id)) continue;
    
    issues.push({
      id: `ghost-${ghost.movie.id}`,
      type: 'ghost_entry',
      movieId: ghost.movie.id,
      movieSlug: ghost.movie.slug || ghost.movie.title_en.toLowerCase().replace(/\s+/g, '-'),
      movieTitle: ghost.movie.title_en,
      movieYear: ghost.movie.release_year,
      confidence: ghost.confidence,
      sources: {},
      details: `${actor} not in TMDB cast. Top cast: ${ghost.tmdbCast.join(', ')}`,
      suggestedValue: ghost.suggestedHero, // Suggest re-attribution to actual hero
      action: determineAction('ghost_entry', ghost.confidence, { confidenceThreshold }),
    });
  }

  // Process wrong attributions from validation
  for (const issue of validation.wrongAttributions) {
    // Skip if already processed as ghost entry
    if (issues.some(i => i.movieId === issue.movie.id)) continue;
    
    issues.push({
      id: `wrong-attr-${issue.movie.id}`,
      type: 'wrong_attribution',
      movieId: issue.movie.id,
      movieSlug: issue.movie.slug,
      movieTitle: issue.movie.title_en,
      movieYear: issue.movie.release_year,
      confidence: issue.confidence,
      sources: {},
      details: issue.details,
      suggestedValue: issue.tmdb_cast?.[0] || null, // Suggest top cast member as correct hero
      action: determineAction('wrong_attribution', issue.confidence, { confidenceThreshold }),
    });
  }

  // Process TMDB ID issues
  for (const tmdbIssue of tmdbIdIssues) {
    issues.push({
      id: `tmdb-${tmdbIssue.movie.id}`,
      type: 'conflicting_data',
      movieId: tmdbIssue.movie.id,
      movieSlug: tmdbIssue.movie.slug || tmdbIssue.movie.title_en.toLowerCase().replace(/\s+/g, '-'),
      movieTitle: tmdbIssue.movie.title_en,
      movieYear: tmdbIssue.movie.release_year,
      field: 'tmdb_id',
      currentValue: String(tmdbIssue.currentTmdbId),
      confidence: 0.80,
      sources: {},
      details: tmdbIssue.details,
      action: 'flag_review', // TMDB ID issues need manual verification
    });
  }

  // Process missing fields
  for (const missing of missingFields) {
    issues.push({
      id: `missing-${missing.movie.id}-${missing.field}`,
      type: 'missing_field',
      movieId: missing.movie.id,
      movieSlug: missing.movie.slug || missing.movie.title_en.toLowerCase().replace(/\s+/g, '-'),
      movieTitle: missing.movie.title_en,
      movieYear: missing.movie.release_year,
      field: missing.field,
      currentValue: null,
      confidence: 0.60, // Lower confidence - we don't have a suggested value yet
      sources: {},
      details: `Missing ${missing.field}`,
      action: 'report_only', // Missing fields without suggestions are report-only
    });
  }

  return issues;
}

async function scoreAndFix(
  actor: string,
  issues: AutoFixIssue[],
  options: OrchestratorOptions,
  supabase: SupabaseClient
): Promise<AutoFixResult> {
  const { autoFix = false, execute = false, verbose = false, confidence = 70 } = options;
  const confidenceThreshold = confidence / 100;

  if (verbose) {
    console.log(chalk.cyan('\n═══════════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('  PHASE 3: SCORE AND FIX'));
    console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
  }

  // Count by action type
  const autoFixable = issues.filter(i => i.action === 'auto_fix');
  const flagged = issues.filter(i => i.action === 'flag_review');
  const reportOnly = issues.filter(i => i.action === 'report_only');

  if (verbose) {
    console.log(chalk.gray(`\n  📊 Issue breakdown:`));
    console.log(chalk.green(`     Auto-fixable: ${autoFixable.length}`));
    console.log(chalk.yellow(`     Flagged for review: ${flagged.length}`));
    console.log(chalk.gray(`     Report only: ${reportOnly.length}`));
  }

  // Apply auto-fixes if requested
  let applied = 0;
  if (autoFix && autoFixable.length > 0) {
    if (verbose) {
      console.log(chalk.cyan(`\n  🔧 ${execute ? 'Applying' : 'Would apply'} ${autoFixable.length} auto-fixes...`));
    }

    const fixResult = await applyAutoFixes(issues, {
      execute,
      verbose,
      supabase,
      confidenceThreshold,
    });

    applied = fixResult.applied;

    if (verbose && fixResult.errors.length > 0) {
      console.log(chalk.red(`\n  ⚠️  ${fixResult.errors.length} errors during auto-fix`));
    }
  }

  // Build result
  const result: AutoFixResult = {
    actor,
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    autoFixed: applied,
    flaggedForReview: flagged.length,
    reportOnly: reportOnly.length,
    issues,
    anomalyReport: [...flagged, ...reportOnly],
  };

  return result;
}

// ============================================================
// REVIEW TEMPLATE GENERATION
// ============================================================

function generateReviewTemplate(
  actor: string,
  validationResult: EnhancedValidationResult,
  dbMovies: EnrichedMovie[],
  wikiFilmCount: number | null,
  outputPath: string
): void {
  const { ghostEntries, missingFilms, missingFields, tmdbIdIssues } = validationResult;
  
  const lines: string[] = [];
  lines.push(`# ${actor.toUpperCase()} Filmography Review Template`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total Films in DB: ${dbMovies.length}`);
  if (wikiFilmCount) lines.push(`Wikipedia Count: ~${wikiFilmCount}`);
  lines.push('');
  
  // SECTION 1: Ghost Entries
  lines.push('## SECTION 1: GHOST ENTRIES (Re-attribute, don\'t delete)');
  lines.push('');
  if (ghostEntries.length === 0) {
    lines.push('No ghost entries detected.');
  } else {
    lines.push('| # | Title | Year | Current Hero | Suggested Hero | TMDB Cast | Action |');
    lines.push('|---|-------|------|--------------|----------------|-----------|--------|');
    ghostEntries.forEach((g, i) => {
      lines.push(`| ${i + 1} | ${g.movie.title_en} | ${g.movie.release_year} | ${g.movie.hero || 'N/A'} | ${g.suggestedHero || '___'} | ${g.tmdbCast.slice(0, 3).join(', ')} | Re-attribute |`);
    });
  }
  lines.push('');
  
  // SECTION 2: Missing Films
  lines.push('## SECTION 2: MISSING FILMS (Add to database)');
  lines.push('');
  if (missingFilms.length === 0) {
    lines.push('No missing films detected.');
  } else {
    lines.push('| # | Title | Year | TMDB ID | Character | Action |');
    lines.push('|---|-------|------|---------|-----------|--------|');
    missingFilms.slice(0, 50).forEach((m, i) => {
      lines.push(`| ${i + 1} | ${m.title} | ${m.year} | ${m.tmdbId} | ${m.character || 'N/A'} | Add |`);
    });
    if (missingFilms.length > 50) {
      lines.push(`| ... | (${missingFilms.length - 50} more films) | | | | |`);
    }
  }
  lines.push('');
  
  // SECTION 3: Missing Technical Credits
  lines.push('## SECTION 3: MISSING TECHNICAL CREDITS');
  lines.push('');
  
  // Group by field
  const fieldGroups: Record<string, MissingField[]> = {};
  for (const mf of missingFields) {
    if (!fieldGroups[mf.field]) fieldGroups[mf.field] = [];
    fieldGroups[mf.field].push(mf);
  }
  
  for (const [field, items] of Object.entries(fieldGroups).sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`### ${field.charAt(0).toUpperCase() + field.slice(1)} (${items.length} films)`);
    lines.push('');
    lines.push('| # | Title | Year | Value |');
    lines.push('|---|-------|------|-------|');
    items.slice(0, 30).forEach((item, i) => {
      lines.push(`| ${i + 1} | ${item.movie.title_en} | ${item.movie.release_year} | _______________ |`);
    });
    if (items.length > 30) {
      lines.push(`| ... | (${items.length - 30} more) | | |`);
    }
    lines.push('');
  }
  
  // SECTION 4: TMDB ID Corrections
  lines.push('## SECTION 4: TMDB ID CORRECTIONS');
  lines.push('');
  if (tmdbIdIssues.length === 0) {
    lines.push('No TMDB ID issues detected.');
  } else {
    lines.push('| # | Title | Year | Current TMDB | Issue | Correct TMDB |');
    lines.push('|---|-------|------|--------------|-------|--------------|');
    tmdbIdIssues.forEach((issue, i) => {
      lines.push(`| ${i + 1} | ${issue.movie.title_en} | ${issue.movie.release_year} | ${issue.currentTmdbId} | ${issue.issue} | _______________ |`);
    });
  }
  
  // Save template
  fs.writeFileSync(`${outputPath}.md`, lines.join('\n'));
  
  // Also save as CSV for easier editing
  const csvLines: string[] = [
    'Section,Title,Year,Slug,Current Value,Suggested Value,Action'
  ];
  
  for (const g of ghostEntries) {
    csvLines.push(`Ghost Entry,"${g.movie.title_en}",${g.movie.release_year},${g.movie.slug || ''},${g.movie.hero || ''},"${g.suggestedHero || ''}",Re-attribute`);
  }
  
  for (const m of missingFilms.slice(0, 100)) {
    csvLines.push(`Missing Film,"${m.title}",${m.year},,${m.tmdbId},"${m.character || ''}",Add`);
  }
  
  for (const mf of missingFields) {
    csvLines.push(`Missing ${mf.field},"${mf.movie.title_en}",${mf.movie.release_year},${mf.movie.slug || ''},,,"Fill"`);
  }
  
  for (const ti of tmdbIdIssues) {
    csvLines.push(`TMDB Issue,"${ti.movie.title_en}",${ti.movie.release_year},${ti.movie.slug || ''},${ti.currentTmdbId},"${ti.issue}",Fix`);
  }
  
  fs.writeFileSync(`${outputPath}.csv`, csvLines.join('\n'));
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

async function main(): Promise<void> {
  const { actor, options } = parseArgs();

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           UNIFIED ACTOR FILMOGRAPHY VALIDATOR v3.0                   ║
║   Based on Venkatesh, Nani & Balakrishna validation sessions         ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Actor: ${chalk.yellow(actor)}`);
  console.log(`  Mode: ${options.preCheckOnly ? chalk.cyan('Pre-Check Only') : options.reportOnly ? chalk.gray('Report Only') : options.autoFix ? chalk.green('Auto-Fix') : chalk.yellow('Validate')}`);
  console.log(`  Execute: ${options.execute ? chalk.green('Yes') : chalk.gray('Dry Run')}`);
  console.log(`  Confidence Threshold: ${options.confidence}%`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Phase 0: Pre-enrichment validation (NEW in v3.0)
    const preCheckResult = await runPreEnrichmentValidation(actor, supabase, options);
    
    // Save pre-check report
    const actorSlug = actor.toLowerCase().replace(/\s+/g, '-');
    const outputDir = options.outputDir || 'docs';
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const preCheckPath = `${outputDir}/${actorSlug}-pre-check.json`;
    fs.writeFileSync(preCheckPath, JSON.stringify(preCheckResult, null, 2));
    
    if (options.verbose) {
      console.log(chalk.gray(`\n  📄 Pre-check report saved: ${preCheckPath}`));
    }
    
    // If pre-check only, stop here
    if (options.preCheckOnly) {
      console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════════
✓ PRE-CHECK COMPLETE
═══════════════════════════════════════════════════════════════════════
`));
      console.log(`  Database count: ${chalk.yellow(preCheckResult.dbCount)}`);
      console.log(`  TMDB count: ${chalk.yellow(preCheckResult.tmdbCount)}`);
      if (preCheckResult.wikiCount) {
        console.log(`  Wikipedia count: ${chalk.yellow(`~${preCheckResult.wikiCount}`)}`);
      }
      console.log(`  Discrepancy: ${preCheckResult.discrepancy === 0 ? chalk.green('0 (counts match)') : chalk.yellow(preCheckResult.discrepancy > 0 ? `+${preCheckResult.discrepancy}` : preCheckResult.discrepancy)}`);
      console.log(`  Name variations: ${preCheckResult.nameVariationsFound.length}`);
      console.log(`  Spelling duplicates: ${preCheckResult.spellingDuplicatesFound}`);
      
      if (preCheckResult.issues.length > 0) {
        console.log(chalk.yellow(`\n  Issues found: ${preCheckResult.issues.length}`));
        console.log(chalk.gray(`  Run full validation for details`));
      } else {
        console.log(chalk.green(`\n  No issues found - ready for enrichment`));
      }
      
      return;
    }

    // ENHANCED MODE (v2.0 - Based on Chiranjeevi session learnings)
    // Target: <5% manual review rate
    if (options.enhancedMode) {
      console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════════
ENHANCED VALIDATION MODE (v2.0)
Based on Balakrishna & Chiranjeevi validation sessions
Target: <5% manual review rate
═══════════════════════════════════════════════════════════════════════
`));
      
      const enhancedResult = await runEnhancedValidation(actor, {
        supabase,
        execute: options.execute,
        verbose: options.verbose,
        maxTMDBChecks: 100,
      });
      
      printValidationSummary(enhancedResult);
      saveValidationReport(enhancedResult, outputDir);
      
      // Show summary
      console.log(chalk.cyan(`
  ═══════════════════════════════════════════════════════════════════
  ENHANCED VALIDATION COMPLETE
  ═══════════════════════════════════════════════════════════════════
`));
      console.log(`  Total issues: ${enhancedResult.issues.length}`);
      console.log(`  Auto-fixed: ${chalk.green(enhancedResult.summary.autoFixed)}`);
      console.log(`  Manual review: ${chalk.yellow(enhancedResult.summary.flaggedForReview)}`);
      console.log(`  Manual review rate: ${enhancedResult.summary.manualReviewRate <= 5 
        ? chalk.green(`${enhancedResult.summary.manualReviewRate.toFixed(1)}% ✓`)
        : chalk.yellow(`${enhancedResult.summary.manualReviewRate.toFixed(1)}%`)}`);
      
      if (!options.execute) {
        console.log(chalk.gray(`\n  💡 Run with --execute to apply fixes`));
      }
      
      return;
    }
    
    // Phase 1: Collect
    const { dbMovies, tmdbCredits, wikiFilmCount } = await collectData(actor, supabase, options.verbose || false);

    if (dbMovies.length === 0) {
      console.log(chalk.yellow(`\n  ⚠️  No movies found for ${actor}`));
      return;
    }

    // Phase 2: Validate
    const validationResult = await validateFilmography(
      actor,
      dbMovies,
      tmdbCredits,
      wikiFilmCount,
      supabase,
      options.verbose || false
    );

    // Phase 3: Build issues and score
    const issues = buildIssuesList(actor, validationResult, dbMovies, options);

    // Phase 3: Apply fixes (unless report-only)
    const result = await scoreAndFix(actor, issues, options, supabase);

    // Generate reports (actorSlug and outputDir already declared in Phase 0)

    // Save anomaly report
    const anomalyPath = `${outputDir}/${actorSlug}-anomalies`;
    generateAnomalyReport(actor, result.issues, anomalyPath);

    // Generate review template
    const templatePath = `${outputDir}/${actorSlug}-review-template`;
    generateReviewTemplate(actor, validationResult, dbMovies, wikiFilmCount, templatePath);

    // Save full validation result
    const fullReportPath = `${outputDir}/${actorSlug}-validation.json`;
    const fullResult = {
      ...result,
      missingFilms: validationResult.missingFilms,
      ghostEntries: validationResult.ghostEntries.map(g => ({
        title: g.movie.title_en,
        year: g.movie.release_year,
        slug: g.movie.slug,
        tmdbCast: g.tmdbCast,
        suggestedHero: g.suggestedHero,
      })),
      tmdbIdIssues: validationResult.tmdbIdIssues.map(i => ({
        title: i.movie.title_en,
        year: i.movie.release_year,
        currentTmdbId: i.currentTmdbId,
        issue: i.issue,
      })),
      summary: {
        totalFilms: dbMovies.length,
        wikiFilmCount,
        ghostEntries: validationResult.ghostEntries.length,
        missingFilms: validationResult.missingFilms.length,
        tmdbIdIssues: validationResult.tmdbIdIssues.length,
        missingFields: Object.entries(
          validationResult.missingFields.reduce((acc, mf) => {
            acc[mf.field] = (acc[mf.field] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ),
      },
    };
    fs.writeFileSync(fullReportPath, JSON.stringify(fullResult, null, 2));

    // Print summary
    printAutoFixSummary(result);

    // Print enhanced summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════════
📊 ENHANCED VALIDATION SUMMARY
═══════════════════════════════════════════════════════════════════════
`));
    console.log(`  Total films in DB: ${chalk.yellow(dbMovies.length)}`);
    if (wikiFilmCount) {
      console.log(`  Wikipedia count: ${chalk.yellow(`~${wikiFilmCount}`)}`);
    }
    console.log(`  Ghost entries: ${chalk.red(validationResult.ghostEntries.length)}`);
    console.log(`  Missing films (in TMDB): ${chalk.yellow(validationResult.missingFilms.length)}`);
    console.log(`  TMDB ID issues: ${chalk.yellow(validationResult.tmdbIdIssues.length)}`);
    console.log(`  Missing fields: ${chalk.gray(validationResult.missingFields.length)}`);

    console.log(chalk.cyan(`\n  📄 Reports saved:`));
    console.log(chalk.gray(`     ${anomalyPath}.csv`));
    console.log(chalk.gray(`     ${anomalyPath}.json`));
    console.log(chalk.green(`     ${templatePath}.md  ← Review template`));
    console.log(chalk.green(`     ${templatePath}.csv ← Editable template`));
    console.log(chalk.gray(`     ${fullReportPath}`));

    if (result.anomalyReport.length > 0 && !options.execute) {
      console.log(chalk.yellow(`\n  💡 ${result.anomalyReport.length} items need manual review`));
      console.log(chalk.gray(`     Review ${templatePath}.md and apply corrections`));
    }

    if (result.autoFixed > 0 && !options.execute) {
      console.log(chalk.yellow(`\n  💡 Run with --execute to apply ${result.issues.filter(i => i.action === 'auto_fix').length} auto-fixes`));
    }

  } catch (error) {
    console.error(chalk.red('\n  ❌ Validation failed:'), error);
    process.exit(1);
  }
}

// Run if main module
if (require.main === module) {
  main().catch(console.error);
}

// Export for programmatic use
export {
  runPreEnrichmentValidation,
  collectData,
  validateFilmography,
  buildIssuesList,
  scoreAndFix,
  detectGhostEntries,
  findMissingFilms,
  validateTmdbIds,
  findMissingFields,
  generateReviewTemplate,
  VALIDATION_RULES,
  type PreEnrichmentResult,
  type EnhancedValidationResult,
  type GhostEntry,
  type MissingFilm,
  type TMDBIdIssue,
  type MissingField,
  type OrchestratorOptions,
};
