#!/usr/bin/env npx tsx
/**
 * Enrich Genres from TMDB
 * 
 * Fetches genre data from TMDB for movies with:
 * 1. TMDB IDs but only generic single genres
 * 2. Recent movies (2020+) with poor genre data
 * 
 * Features:
 * - Parallel processing (5 at a time)
 * - Rate limiting (1500ms between batches)
 * - Progress tracking
 * - Error handling
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  genres: string[];
  tmdb_id: number;
  slug: string;
}

async function fetchTmdbGenres(tmdbId: number): Promise<string[] | null> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.genres && data.genres.length > 0) {
      return data.genres.slice(0, 3).map((g: any) => g.name);
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function getMoviesForEnrichment(focusRecent: boolean = false): Promise<Movie[]> {
  let query = supabase
    .from('movies')
    .select('id, title_en, release_year, genres, tmdb_id, slug')
    .not('tmdb_id', 'is', null);

  if (focusRecent) {
    // Recent movies (2020+) with only generic single genre
    query = query
      .gte('release_year', 2020)
      .or('genres.eq.{Drama},genres.eq.{Action}');
  } else {
    // All movies with TMDB but only single generic genre
    query = query
      .or('genres.eq.{Drama},genres.eq.{Action}');
  }

  const { data, error } = await query.order('release_year', { ascending: false });

  if (error) {
    console.error('Error fetching movies:', error);
    return [];
  }

  return data as Movie[];
}

async function enrichMovies(movies: Movie[]): Promise<{
  enriched: number;
  failed: number;
  noChange: number;
}> {
  let enriched = 0;
  let failed = 0;
  let noChange = 0;

  console.log(chalk.white(`\n  Processing ${movies.length} movies in batches of ${BATCH_SIZE}...\n`));

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(movies.length / BATCH_SIZE);
    
    console.log(chalk.cyan(`  Batch ${batchNum}/${totalBatches}`));

    await Promise.all(batch.map(async (movie) => {
      console.log(chalk.white(`    ${movie.title_en} (${movie.release_year})`));
      console.log(chalk.gray(`      Current: [${movie.genres.join(', ')}]`));

      const tmdbGenres = await fetchTmdbGenres(movie.tmdb_id);

      if (!tmdbGenres || tmdbGenres.length === 0) {
        console.log(chalk.yellow(`      ⚠ No genres from TMDB`));
        failed++;
        return;
      }

      // Check if genres actually changed
      const currentSet = new Set(movie.genres);
      const newSet = new Set(tmdbGenres);
      const same = currentSet.size === newSet.size && 
                   [...currentSet].every(g => newSet.has(g));

      if (same) {
        console.log(chalk.gray(`      ⊘ No change needed`));
        noChange++;
        return;
      }

      const { error } = await supabase
        .from('movies')
        .update({ genres: tmdbGenres })
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`      ✗ Update failed: ${error.message}`));
        failed++;
      } else {
        console.log(chalk.green(`      ✓ Updated: [${tmdbGenres.join(', ')}]`));
        enriched++;
      }
    }));

    // Rate limiting between batches
    if (i + BATCH_SIZE < movies.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return { enriched, failed, noChange };
}

async function runEnrichment() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              ENRICH GENRES FROM TMDB                                  ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  if (!TMDB_API_KEY) {
    console.log(chalk.red('  ✗ TMDB_API_KEY not found in environment\n'));
    return;
  }

  console.log(chalk.white('  Phase 1: Recent Movies (2020+)...\n'));
  const recentMovies = await getMoviesForEnrichment(true);
  console.log(chalk.green(`  ✓ Found ${recentMovies.length} recent movies to enrich`));

  const recentResults = await enrichMovies(recentMovies);

  console.log(chalk.white('\n  Phase 2: All Movies with TMDB...\n'));
  const allMovies = await getMoviesForEnrichment(false);
  // Filter out already processed recent movies
  const recentIds = new Set(recentMovies.map(m => m.id));
  const remainingMovies = allMovies.filter(m => !recentIds.has(m.id));
  console.log(chalk.green(`  ✓ Found ${remainingMovies.length} additional movies to enrich`));

  const bulkResults = await enrichMovies(remainingMovies);

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   ENRICHMENT COMPLETE                                 ║
╚═══════════════════════════════════════════════════════════════════════╝

  Recent Movies (2020+):
    ✓ Enriched:           ${recentResults.enriched}
    ⊘ No change:          ${recentResults.noChange}
    ✗ Failed:             ${recentResults.failed}

  Bulk Enrichment:
    ✓ Enriched:           ${bulkResults.enriched}
    ⊘ No change:          ${bulkResults.noChange}
    ✗ Failed:             ${bulkResults.failed}

  TOTAL:
    ✓ Enriched:           ${recentResults.enriched + bulkResults.enriched}
    ⊘ No change:          ${recentResults.noChange + bulkResults.noChange}
    ✗ Failed:             ${recentResults.failed + bulkResults.failed}

  Success Rate:         ${(((recentResults.enriched + bulkResults.enriched) / (recentMovies.length + remainingMovies.length)) * 100).toFixed(1)}%

  ✅ TMDB enrichment complete!

  Run audit again to verify:
  npx tsx scripts/audit-genre-quality-complete.ts

`));
}

runEnrichment();
