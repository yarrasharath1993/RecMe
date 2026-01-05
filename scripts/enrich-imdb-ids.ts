#!/usr/bin/env npx tsx
/**
 * SAFE IMDB ID Enrichment Script
 * 
 * Enriches movies with TMDB/IMDB IDs WITHOUT deleting any data.
 * Only updates movies that are missing tmdb_id.
 * 
 * Usage:
 *   pnpm tsx scripts/enrich-imdb-ids.ts              # Enrich all (dry run)
 *   pnpm tsx scripts/enrich-imdb-ids.ts --apply      # Actually apply changes
 *   pnpm tsx scripts/enrich-imdb-ids.ts --limit=100  # Limit to 100 movies
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIG
// ============================================================

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface Movie {
  id: string;
  title_en: string;
  title_te: string | null;
  release_year: number | null;
  tmdb_id: number | null;
  imdb_id: string | null;
  poster_url: string | null;
}

interface TMDBSearchResult {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
}

interface TMDBMovieDetails {
  id: number;
  imdb_id?: string;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  release_date?: string;
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
// TMDB API
// ============================================================

async function searchTMDB(title: string, year?: number): Promise<TMDBSearchResult | null> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not set');
  }

  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query: title,
    language: 'en-US',
  });

  if (year) {
    params.set('year', year.toString());
  }

  try {
    const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Return best match (first result usually is best)
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`  TMDB search error for "${title}":`, error);
    return null;
  }
}

async function getTMDBDetails(tmdbId: number): Promise<TMDBMovieDetails | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    return await response.json();
  } catch (error) {
    console.error(`  TMDB details error for ID ${tmdbId}:`, error);
    return null;
  }
}

// ============================================================
// ENRICHMENT LOGIC
// ============================================================

async function enrichMovie(
  movie: Movie,
  dryRun: boolean
): Promise<{ success: boolean; tmdbId?: number; imdbId?: string; error?: string }> {
  // Search TMDB
  let result = await searchTMDB(movie.title_en, movie.release_year || undefined);

  // If no result with year, try without
  if (!result && movie.release_year) {
    result = await searchTMDB(movie.title_en);
  }

  // Try Telugu title if English didn't work
  if (!result && movie.title_te) {
    result = await searchTMDB(movie.title_te, movie.release_year || undefined);
  }

  if (!result) {
    return { success: false, error: 'No TMDB match found' };
  }

  // Get full details to get IMDB ID
  const details = await getTMDBDetails(result.id);
  const imdbId = details?.imdb_id || null;

  // Build update data
  const updateData: Record<string, unknown> = {
    tmdb_id: result.id,
    updated_at: new Date().toISOString(),
  };

  if (imdbId) {
    updateData.imdb_id = imdbId;
  }

  // Add poster if missing
  if (!movie.poster_url && result.poster_path) {
    updateData.poster_url = `https://image.tmdb.org/t/p/w500${result.poster_path}`;
  }

  // Add backdrop if available
  if (result.backdrop_path) {
    updateData.backdrop_url = `https://image.tmdb.org/t/p/w1280${result.backdrop_path}`;
  }

  if (!dryRun) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', movie.id);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true, tmdbId: result.id, imdbId: imdbId || undefined };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 500;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          SAFE IMDB ID ENRICHMENT (NO DELETIONS)              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('   Add --apply to actually update the database\n');
  } else {
    console.log('⚡ APPLY MODE - Will update database\n');
  }

  const supabase = getSupabase();

  // Find movies without TMDB ID
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, tmdb_id, imdb_id, poster_url')
    .is('tmdb_id', null)
    .eq('is_published', true)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching movies:', error.message);
    process.exit(1);
  }

  console.log(`Found ${movies?.length || 0} movies without TMDB ID\n`);

  if (!movies || movies.length === 0) {
    console.log('✅ All movies already have TMDB IDs!\n');
    return;
  }

  let enriched = 0;
  let failed = 0;
  let withImdb = 0;

  for (const movie of movies) {
    process.stdout.write(`  ${movie.title_en} (${movie.release_year || 'N/A'})...`);

    const result = await enrichMovie(movie, dryRun);

    if (result.success) {
      enriched++;
      if (result.imdbId) {
        withImdb++;
        console.log(` ✓ TMDB:${result.tmdbId} IMDB:${result.imdbId}`);
      } else {
        console.log(` ✓ TMDB:${result.tmdbId} (no IMDB)`);
      }
    } else {
      failed++;
      console.log(` ✗ ${result.error}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  Total Processed:  ${movies.length}`);
  console.log(`  Enriched:         ${enriched}`);
  console.log(`    - With IMDB:    ${withImdb}`);
  console.log(`  Failed:           ${failed}`);

  if (dryRun && enriched > 0) {
    console.log('\n⚠️  This was a DRY RUN. Run with --apply to save changes.');
  } else if (!dryRun && enriched > 0) {
    console.log('\n✅ Changes saved to database!');
    console.log('   OMDb API can now fetch ratings for movies with IMDB IDs.');
  }

  console.log('');
}

main().catch(console.error);

