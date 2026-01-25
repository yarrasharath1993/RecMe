#!/usr/bin/env npx tsx
/**
 * VALIDATE ACTOR MOVIES - Cross-reference with multiple sources
 * 
 * Detects:
 * 1. Duplicate entries (same TMDB ID or similar title+year)
 * 2. Wrong attributions (actor not in TMDB cast)
 * 3. Missing verification (no TMDB ID)
 * 
 * Usage:
 *   npx tsx scripts/validate-actor-movies.ts --actor="Daggubati Venkatesh"
 *   npx tsx scripts/validate-actor-movies.ts --actor="Daggubati Venkatesh" --fix-duplicates
 *   npx tsx scripts/validate-actor-movies.ts --actor="Daggubati Venkatesh" --remove-wrong
 * 
 * Programmatic Usage:
 *   import { runActorValidation } from './validate-actor-movies';
 *   const result = await runActorValidation('Mahesh Babu', { fixDuplicates: true });
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import chalk from 'chalk';

import { 
  ActorIdentifier, 
  getActorIdentifier,
  type ActorVerificationResult,
} from './lib/actor-identifier';

dotenv.config({ path: '.env.local' });

// ============================================================
// TYPES (Exported for programmatic use)
// ============================================================

export interface ValidatorMovie {
  id: string;
  title_en: string;
  release_year: number;
  hero: string | null;
  tmdb_id: number | null;
  slug: string;
  poster_url: string | null;
  avg_rating: number | null;
}

export interface ValidationIssue {
  type: 'duplicate' | 'wrong_attribution' | 'no_verification' | 'tmdb_mismatch';
  movie: ValidatorMovie;
  details: string;
  suggested_action: string;
  confidence: number; // 0-1 confidence in the issue
  duplicate_of?: ValidatorMovie;
  tmdb_cast?: string[]; // Top cast from TMDB for wrong_attribution
}

export interface ValidationResult {
  actor: string;
  timestamp: string;
  totalMovies: number;
  issues: ValidationIssue[];
  duplicates: ValidationIssue[];
  wrongAttributions: ValidationIssue[];
  noVerification: ValidationIssue[];
  summary: string;
}

export interface ValidationOptions {
  fixDuplicates?: boolean;
  removeWrong?: boolean;
  verbose?: boolean;
  rateLimit?: number; // ms between TMDB calls
  supabase?: SupabaseClient;
}

// ============================================================
// INITIALIZATION
// ============================================================

function getSupabaseClient(options?: ValidationOptions): SupabaseClient {
  if (options?.supabase) return options.supabase;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// ============================================================
// UTILITY FUNCTIONS (Exported for programmatic use)
// ============================================================

export async function fetchTMDB(endpoint: string): Promise<any> {
  try {
    const url = `${TMDB_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export function normalizeValidatorTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/the|a|an/g, '');
}

/**
 * Cross-reference actor with TMDB credits for a specific movie
 * Uses ActorIdentifier for exact TMDB Person ID matching
 */
export async function crossReferenceWithTMDB(
  movie: ValidatorMovie,
  actorName: string
): Promise<{ inCast: boolean; topCast: string[]; confidence: number; actorTmdbId?: number; castOrder?: number }> {
  if (!movie.tmdb_id || !TMDB_API_KEY) {
    return { inCast: false, topCast: [], confidence: 0 };
  }

  const identifier = getActorIdentifier();
  
  // Use exact TMDB Person ID matching
  const verification = await identifier.verifyActorInMovie(actorName, movie.tmdb_id);
  
  // Get top cast for reporting
  const topCast = await identifier.getMovieCast(movie.tmdb_id, 10);
  const topCastNames = topCast.map(c => c.name);
  
  return {
    inCast: verification.found,
    topCast: topCastNames,
    confidence: verification.confidence,
    actorTmdbId: verification.actorTmdbId,
    castOrder: verification.castOrder,
  };
}

// ============================================================
// MAIN VALIDATION FUNCTION (Exported for programmatic use)
// ============================================================

/**
 * Run validation for an actor's filmography
 * Returns a structured result with all issues found
 */
export async function runActorValidation(
  actorName: string,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const { fixDuplicates = false, removeWrong = false, verbose = false, rateLimit = 100 } = options;
  const supabase = getSupabaseClient(options);

  if (verbose) {
    console.log(chalk.cyan.bold(`\n  Validating: ${actorName}`));
  }

  // Fetch movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, tmdb_id, slug, poster_url, avg_rating')
    .ilike('hero', `%${actorName}%`)
    .order('release_year', { ascending: false });

  if (error || !movies) {
    throw new Error(`Failed to fetch movies: ${error?.message}`);
  }

  const issues: ValidationIssue[] = [];

  // CHECK 1: Duplicates by TMDB ID
  const tmdbIdMap = new Map<number, ValidatorMovie[]>();
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
      const sorted = dupes.sort((a, b) => {
        const scoreA = (a.avg_rating ? 1 : 0) + (a.poster_url && !a.poster_url.includes('placeholder') ? 1 : 0);
        const scoreB = (b.avg_rating ? 1 : 0) + (b.poster_url && !b.poster_url.includes('placeholder') ? 1 : 0);
        return scoreB - scoreA;
      });
      
      const keep = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        issues.push({
          type: 'duplicate',
          movie: sorted[i],
          details: `Same TMDB ID (${tmdbId}) as "${keep.title_en}"`,
          suggested_action: `Delete "${sorted[i].slug}" and keep "${keep.slug}"`,
          confidence: 1.0, // 100% confident same TMDB ID = duplicate
          duplicate_of: keep,
        });
      }
    }
  }

  // CHECK 2: Duplicates by normalized title + year
  const titleYearMap = new Map<string, ValidatorMovie[]>();
  for (const movie of movies) {
    const key = normalizeValidatorTitle(movie.title_en) + movie.release_year;
    if (!titleYearMap.has(key)) {
      titleYearMap.set(key, []);
    }
    titleYearMap.get(key)!.push(movie);
  }

  for (const [, dupes] of titleYearMap) {
    if (dupes.length > 1) {
      const alreadyFlagged = dupes.some(d => 
        issues.some(i => i.movie.id === d.id && i.type === 'duplicate')
      );
      if (alreadyFlagged) continue;

      const sorted = dupes.sort((a, b) => {
        const scoreA = (a.tmdb_id ? 2 : 0) + (a.avg_rating ? 1 : 0);
        const scoreB = (b.tmdb_id ? 2 : 0) + (b.avg_rating ? 1 : 0);
        return scoreB - scoreA;
      });
      
      const keep = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        issues.push({
          type: 'duplicate',
          movie: sorted[i],
          details: `Similar title to "${keep.title_en}" (${keep.release_year})`,
          suggested_action: `Merge "${sorted[i].slug}" into "${keep.slug}"`,
          confidence: 0.85, // High but not 100% - could be different films
          duplicate_of: keep,
        });
      }
    }
  }

  // CHECK 3: Cross-reference with TMDB cast
  for (const movie of movies) {
    if (!movie.tmdb_id) {
      issues.push({
        type: 'no_verification',
        movie,
        details: 'No TMDB ID - cannot verify cast',
        suggested_action: 'Find TMDB ID or manually verify',
        confidence: 0.5, // Medium confidence - could be valid but unverifiable
      });
      continue;
    }

    const { inCast, topCast, confidence } = await crossReferenceWithTMDB(movie, actorName);

    if (!inCast) {
      issues.push({
        type: 'wrong_attribution',
        movie,
        details: `${actorName} not found in TMDB cast. Top cast: ${topCast.join(', ')}`,
        suggested_action: 'Verify hero attribution or re-attribute to correct actor',
        confidence,
        tmdb_cast: topCast,
      });
    }

    await sleep(rateLimit);
  }

  // Categorize issues
  const duplicates = issues.filter(i => i.type === 'duplicate');
  const wrongAttributions = issues.filter(i => i.type === 'wrong_attribution');
  const noVerification = issues.filter(i => i.type === 'no_verification');

  // Generate summary
  const summaryParts: string[] = [];
  if (duplicates.length > 0) summaryParts.push(`${duplicates.length} duplicates`);
  if (wrongAttributions.length > 0) summaryParts.push(`${wrongAttributions.length} wrong attributions`);
  if (noVerification.length > 0) summaryParts.push(`${noVerification.length} unverifiable`);

  const result: ValidationResult = {
    actor: actorName,
    timestamp: new Date().toISOString(),
    totalMovies: movies.length,
    issues,
    duplicates,
    wrongAttributions,
    noVerification,
    summary: summaryParts.length > 0 ? summaryParts.join(', ') : 'No issues found',
  };

  // Auto-fix if requested
  if (fixDuplicates && duplicates.length > 0) {
    for (const issue of duplicates) {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', issue.movie.id);
      
      if (verbose && error) {
        console.log(chalk.red(`   ✗ Failed to delete ${issue.movie.slug}: ${error.message}`));
      } else if (verbose) {
        console.log(chalk.green(`   ✓ Deleted duplicate ${issue.movie.slug}`));
      }
    }
  }

  if (removeWrong && wrongAttributions.length > 0) {
    for (const issue of wrongAttributions) {
      const { error } = await supabase
        .from('movies')
        .update({ hero: null })
        .eq('id', issue.movie.id);
      
      if (verbose && error) {
        console.log(chalk.red(`   ✗ Failed to update ${issue.movie.slug}: ${error.message}`));
      } else if (verbose) {
        console.log(chalk.green(`   ✓ Cleared hero for ${issue.movie.slug}`));
      }
    }
  }

  return result;
}

// ============================================================
// CLI WRAPPER
// ============================================================

async function validateActorMoviesCLI() {
  const args = process.argv.slice(2);
  const getArg = (name: string, defaultValue: string = ''): string => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };
  const hasFlag = (name: string): boolean => args.includes(`--${name}`);

  const ACTOR = getArg('actor', '');
  const FIX_DUPLICATES = hasFlag('fix-duplicates');
  const REMOVE_WRONG = hasFlag('remove-wrong');
  const VERBOSE = hasFlag('verbose') || hasFlag('v');

  if (!ACTOR) {
    console.error(chalk.red('Error: --actor is required'));
    process.exit(1);
  }
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           VALIDATE ACTOR MOVIES - Cross-Reference Check              ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Actor: ${chalk.yellow(ACTOR)}`);
  console.log(`  Fix duplicates: ${FIX_DUPLICATES ? chalk.green('Yes') : chalk.gray('No')}`);
  console.log(`  Remove wrong: ${REMOVE_WRONG ? chalk.red('Yes') : chalk.gray('No')}`);

  try {
    console.log(chalk.cyan('\n📂 Running validation...'));
    
    const result = await runActorValidation(ACTOR, {
      fixDuplicates: FIX_DUPLICATES,
      removeWrong: REMOVE_WRONG,
      verbose: VERBOSE,
    });

    // Print report
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════════
📊 VALIDATION REPORT
═══════════════════════════════════════════════════════════════════════
`));

    console.log(`  Total movies: ${result.totalMovies}`);
    console.log(`  Issues found: ${chalk.red(result.issues.length)}`);
    console.log(`    - Duplicates: ${chalk.yellow(result.duplicates.length)}`);
    console.log(`    - Wrong attribution: ${chalk.red(result.wrongAttributions.length)}`);
    console.log(`    - No verification: ${chalk.gray(result.noVerification.length)}`);

    // List issues
    if (result.duplicates.length > 0) {
      console.log(chalk.yellow('\n🔄 DUPLICATES:'));
      for (const issue of result.duplicates) {
        console.log(`   ${chalk.red('DELETE:')} ${issue.movie.slug}`);
        console.log(`   ${chalk.green('KEEP:')}   ${issue.duplicate_of?.slug}`);
        console.log(`   ${chalk.gray(issue.details)} [confidence: ${(issue.confidence * 100).toFixed(0)}%]\n`);
      }
    }

    if (result.wrongAttributions.length > 0) {
      console.log(chalk.red('\n❌ WRONG ATTRIBUTION (actor not in TMDB cast):'));
      for (const issue of result.wrongAttributions) {
        console.log(`   ${issue.movie.title_en} (${issue.movie.release_year})`);
        console.log(`   ${chalk.gray(issue.details)} [confidence: ${(issue.confidence * 100).toFixed(0)}%]\n`);
      }
    }

    if (result.noVerification.length > 0) {
      console.log(chalk.gray('\n⚠️  NO VERIFICATION (no TMDB ID):'));
      for (const issue of result.noVerification) {
        console.log(`   ${issue.movie.title_en} (${issue.movie.release_year}) - ${issue.movie.slug}`);
      }
    }

    // Export report
    const reportPath = `docs/validation-report-${ACTOR.toLowerCase().replace(/\s+/g, '-')}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    console.log(chalk.cyan(`\n📄 Report saved to ${reportPath}`));

    if (!FIX_DUPLICATES && result.duplicates.length > 0) {
      console.log(chalk.yellow(`\n💡 Run with --fix-duplicates to auto-delete duplicates`));
    }
    if (!REMOVE_WRONG && result.wrongAttributions.length > 0) {
      console.log(chalk.yellow(`💡 Run with --remove-wrong to clear wrong attributions`));
    }
  } catch (error) {
    console.error(chalk.red('Validation failed:'), error);
    process.exit(1);
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  validateActorMoviesCLI().catch(console.error);
}
