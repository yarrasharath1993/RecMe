#!/usr/bin/env npx tsx
/**
 * OMDb Enrichment Script
 * 
 * Enriches movies with OMDb data (ratings, awards, plot) WITHOUT overwriting existing data.
 * Only adds missing fields - never overwrites AI-generated reviews.
 * 
 * Data enriched:
 * - IMDb rating (imdb_rating)
 * - Rotten Tomatoes score (rotten_tomatoes_score)
 * - Metacritic score (metacritic_score)
 * - Awards text (awards_text from OMDb)
 * - Plot (only if overview is missing AND no AI review exists)
 * - Runtime (if missing)
 * - Box office (if missing)
 * 
 * Usage:
 *   npx tsx scripts/enrich-from-omdb.ts                  # Dry run
 *   npx tsx scripts/enrich-from-omdb.ts --apply          # Apply changes
 *   npx tsx scripts/enrich-from-omdb.ts --apply --limit=50
 *   npx tsx scripts/enrich-from-omdb.ts --apply --force  # Re-enrich even with existing data
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIG
// ============================================================

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = 'https://www.omdbapi.com';
const RATE_LIMIT_MS = 200; // 5 requests per second (conservative)

interface OMDbResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  BoxOffice: string;
  Response: string;
  Error?: string;
}

interface Movie {
  id: string;
  title_en: string;
  release_year: number | null;
  imdb_id: string | null;
  imdb_rating: number | null;
  rotten_tomatoes_score: number | null;
  metacritic_score: number | null;
  awards_text: string | null;
  overview: string | null;
  ai_review: string | null;
  runtime_minutes: number | null;
  box_office: number | null;
}

interface EnrichmentResult {
  movie: string;
  success: boolean;
  changes: string[];
  error?: string;
}

// ============================================================
// SUPABASE
// ============================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// OMDB API
// ============================================================

async function fetchFromOMDb(imdbId: string): Promise<OMDbResponse | null> {
  if (!OMDB_API_KEY) {
    throw new Error('OMDB_API_KEY not set');
  }

  try {
    const url = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=full`;
    const response = await fetch(url);
    const data: OMDbResponse = await response.json();

    if (data.Response === 'False') {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`OMDb fetch error for ${imdbId}:`, error);
    return null;
  }
}

async function fetchByTitle(title: string, year?: number): Promise<OMDbResponse | null> {
  if (!OMDB_API_KEY) {
    throw new Error('OMDB_API_KEY not set');
  }

  try {
    let url = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&plot=full`;
    if (year) {
      url += `&y=${year}`;
    }

    const response = await fetch(url);
    const data: OMDbResponse = await response.json();

    if (data.Response === 'False') {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`OMDb fetch error for "${title}":`, error);
    return null;
  }
}

// ============================================================
// PARSING
// ============================================================

function parseRuntime(runtime: string): number | null {
  if (!runtime || runtime === 'N/A') return null;
  const match = runtime.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function parseRating(rating: string): number | null {
  if (!rating || rating === 'N/A') return null;
  const num = parseFloat(rating);
  return isNaN(num) ? null : num;
}

function parseRottenTomatoes(ratings: Array<{ Source: string; Value: string }>): number | null {
  const rt = ratings?.find(r => r.Source === 'Rotten Tomatoes');
  if (!rt) return null;
  const match = rt.Value.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function parseMetacritic(metascore: string): number | null {
  if (!metascore || metascore === 'N/A') return null;
  const num = parseInt(metascore);
  return isNaN(num) ? null : num;
}

function parseBoxOffice(boxOffice: string): number | null {
  if (!boxOffice || boxOffice === 'N/A') return null;
  const cleaned = boxOffice.replace(/[$,]/g, '');
  const num = parseInt(cleaned);
  return isNaN(num) ? null : num;
}

// ============================================================
// ENRICHMENT
// ============================================================

async function enrichMovie(
  movie: Movie,
  omdbData: OMDbResponse,
  force: boolean
): Promise<{ updates: Record<string, any>; changes: string[] }> {
  const updates: Record<string, any> = {};
  const changes: string[] = [];

  // IMDb Rating - only if missing or force
  const imdbRating = parseRating(omdbData.imdbRating);
  if (imdbRating !== null && (force || movie.imdb_rating === null)) {
    updates.imdb_rating = imdbRating;
    changes.push(`imdb_rating: ${imdbRating}`);
  }

  // Rotten Tomatoes - only if missing or force
  const rtScore = parseRottenTomatoes(omdbData.Ratings);
  if (rtScore !== null && (force || movie.rotten_tomatoes_score === null)) {
    updates.rotten_tomatoes_score = rtScore;
    changes.push(`rotten_tomatoes: ${rtScore}%`);
  }

  // Metacritic - only if missing or force
  const metaScore = parseMetacritic(omdbData.Metascore);
  if (metaScore !== null && (force || movie.metacritic_score === null)) {
    updates.metacritic_score = metaScore;
    changes.push(`metacritic: ${metaScore}`);
  }

  // Awards text - only if missing or force
  if (omdbData.Awards && omdbData.Awards !== 'N/A' && (force || !movie.awards_text)) {
    updates.awards_text = omdbData.Awards;
    changes.push(`awards: "${omdbData.Awards.substring(0, 40)}..."`);
  }

  // Runtime - only if missing
  const runtime = parseRuntime(omdbData.Runtime);
  if (runtime !== null && movie.runtime_minutes === null) {
    updates.runtime_minutes = runtime;
    changes.push(`runtime: ${runtime}min`);
  }

  // Box office - only if missing
  const boxOffice = parseBoxOffice(omdbData.BoxOffice);
  if (boxOffice !== null && movie.box_office === null) {
    updates.box_office = boxOffice;
    changes.push(`box_office: $${boxOffice.toLocaleString()}`);
  }

  // Plot/Overview - ONLY if there's no existing overview AND no AI review
  // This ensures we NEVER overwrite AI-generated content
  if (
    omdbData.Plot && 
    omdbData.Plot !== 'N/A' && 
    !movie.overview && 
    !movie.ai_review
  ) {
    updates.overview = omdbData.Plot;
    changes.push('overview (no AI review present)');
  }

  // Store IMDB ID if not present
  if (!movie.imdb_id && omdbData.imdbID) {
    updates.imdb_id = omdbData.imdbID;
    changes.push(`imdb_id: ${omdbData.imdbID}`);
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
  }

  return { updates, changes };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const force = args.includes('--force');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║              OMDb ENRICHMENT (SAFE - NO OVERWRITES)              ║
╚══════════════════════════════════════════════════════════════════╝
`));

  if (!OMDB_API_KEY) {
    console.error(chalk.red('❌ OMDB_API_KEY not set in .env.local'));
    process.exit(1);
  }

  console.log(chalk.gray(`  API Key: ${OMDB_API_KEY.substring(0, 4)}...`));
  console.log(chalk.gray(`  Limit: ${limit} movies`));
  console.log(chalk.gray(`  Force overwrite: ${force ? 'Yes' : 'No'}`));
  console.log('');

  if (dryRun) {
    console.log(chalk.yellow.bold('🔍 DRY RUN MODE - No changes will be made'));
    console.log(chalk.gray('   Add --apply to save changes to database\n'));
  } else {
    console.log(chalk.green.bold('⚡ APPLY MODE - Will update database\n'));
  }

  const supabase = getSupabase();

  // Get movies with IMDB IDs that might need enrichment
  let query = supabase
    .from('movies')
    .select(`
      id, title_en, release_year, imdb_id,
      imdb_rating, rotten_tomatoes_score, metacritic_score,
      awards_text, overview, ai_review, runtime_minutes, box_office
    `)
    .eq('is_published', true)
    .order('release_year', { ascending: false });

  if (!force) {
    // Only get movies missing ratings data
    query = query.or('imdb_rating.is.null,rotten_tomatoes_score.is.null,metacritic_score.is.null');
  }

  query = query.limit(limit);

  const { data: movies, error } = await query;

  if (error) {
    console.error(chalk.red('Error fetching movies:'), error.message);
    process.exit(1);
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.green('✅ No movies need OMDb enrichment!'));
    return;
  }

  console.log(chalk.cyan(`📋 Processing ${movies.length} movies...\n`));

  const results: EnrichmentResult[] = [];
  let enriched = 0;
  let skipped = 0;
  let failed = 0;
  let noMatch = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i] as Movie;
    
    process.stdout.write(`\r  [${i + 1}/${movies.length}] ${movie.title_en?.substring(0, 35).padEnd(35)}...`);

    // Fetch from OMDb (prefer IMDB ID, fallback to title)
    let omdbData: OMDbResponse | null = null;
    
    if (movie.imdb_id) {
      omdbData = await fetchFromOMDb(movie.imdb_id);
    }
    
    if (!omdbData) {
      omdbData = await fetchByTitle(movie.title_en, movie.release_year || undefined);
    }

    if (!omdbData) {
      noMatch++;
      results.push({ movie: movie.title_en, success: false, error: 'No OMDb match' });
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      continue;
    }

    // Enrich with only missing data
    const { updates, changes } = await enrichMovie(movie, omdbData, force);

    if (changes.length === 0) {
      skipped++;
      results.push({ movie: movie.title_en, success: true, changes: ['already_complete'] });
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      continue;
    }

    if (dryRun) {
      enriched++;
      results.push({ movie: movie.title_en, success: true, changes });
      console.log(chalk.green(`\n    ✓ Would update: ${changes.join(', ')}`));
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      continue;
    }

    // Apply updates
    const { error: updateError } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movie.id);

    if (updateError) {
      failed++;
      results.push({ movie: movie.title_en, success: false, error: updateError.message, changes });
    } else {
      enriched++;
      results.push({ movie: movie.title_en, success: true, changes });
    }

    await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
  }

  // Summary
  console.log('\n');
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════'));
  console.log(chalk.bold('📊 ENRICHMENT SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  console.log(`  Total Processed:    ${movies.length}`);
  console.log(`  ${chalk.green('Enriched:')}          ${enriched}`);
  console.log(`  ${chalk.gray('Already Complete:')} ${skipped}`);
  console.log(`  ${chalk.yellow('No OMDb Match:')}    ${noMatch}`);
  console.log(`  ${chalk.red('Failed:')}            ${failed}`);

  // Show sample changes
  const changedMovies = results.filter(r => r.success && r.changes.length > 0 && !r.changes.includes('already_complete'));
  if (changedMovies.length > 0) {
    console.log(chalk.cyan('\n📝 Sample Changes:'));
    changedMovies.slice(0, 5).forEach(r => {
      console.log(`   ${r.movie}: ${r.changes.join(', ')}`);
    });
  }

  // Show failures
  const failures = results.filter(r => !r.success && r.error !== 'No OMDb match');
  if (failures.length > 0) {
    console.log(chalk.yellow('\n⚠️ Errors:'));
    failures.slice(0, 5).forEach(r => {
      console.log(chalk.yellow(`   ${r.movie}: ${r.error}`));
    });
  }

  if (dryRun && enriched > 0) {
    console.log(chalk.yellow('\n⚠️  This was a DRY RUN. Run with --apply to save changes.'));
  } else if (!dryRun && enriched > 0) {
    console.log(chalk.green('\n✅ Changes saved to database!'));
  }

  console.log('');
}

main().catch(console.error);

