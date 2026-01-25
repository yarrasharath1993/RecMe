#!/usr/bin/env npx tsx
/**
 * Enrich Incomplete Movies TURBO
 * 
 * Fast enrichment for movies with TMDB IDs but missing critical data
 * Reuses existing fast enrichment infrastructure
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const BATCH_SIZE = 5; // Process 5 movies at once
const BATCH_DELAY = 1000; // 1 second between batches

async function fetchTMDBData(tmdbId: number) {
  if (!TMDB_API_KEY) return null;

  try {
    // Fetch movie details and credits in parallel
    const [movieRes, creditsRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`)
    ]);

    if (!movieRes.ok || !creditsRes.ok) return null;

    const [movie, credits] = await Promise.all([
      movieRes.json(),
      creditsRes.json()
    ]);

    return { movie, credits };
  } catch (error) {
    return null;
  }
}

async function enrichMoviesBatch(movies: any[]) {
  const results = await Promise.all(
    movies.map(async (movie) => {
      const title = movie.title_en || movie.title_te || 'Untitled';
      
      console.log(chalk.gray(`    Processing: ${title} (${movie.release_year})`));

      const tmdbData = await fetchTMDBData(movie.tmdb_id);
      
      if (!tmdbData) {
        console.log(chalk.red(`      ❌ TMDB fetch failed`));
        return { success: false, movie };
      }

      const updates: any = {};

      // Poster
      if (!movie.poster_url && tmdbData.movie.poster_path) {
        updates.poster_url = `https://image.tmdb.org/t/p/w500${tmdbData.movie.poster_path}`;
        console.log(chalk.green(`      ✓ Poster`));
      }

      // Backdrop
      if (!movie.backdrop_url && tmdbData.movie.backdrop_path) {
        updates.backdrop_url = `https://image.tmdb.org/t/p/original${tmdbData.movie.backdrop_path}`;
        console.log(chalk.green(`      ✓ Backdrop`));
      }

      // Director
      if (!movie.director) {
        const director = tmdbData.credits.crew.find((c: any) => c.job === 'Director');
        if (director) {
          updates.director = director.name;
          console.log(chalk.green(`      ✓ Director: ${director.name}`));
        }
      }

      // Hero (first male actor)
      if (!movie.hero) {
        const hero = tmdbData.credits.cast.find((c: any) => c.gender === 2);
        if (hero) {
          updates.hero = hero.name;
          console.log(chalk.green(`      ✓ Hero: ${hero.name}`));
        }
      }

      // Heroine (first female actor)
      if (!movie.heroine) {
        const heroine = tmdbData.credits.cast.find((c: any) => c.gender === 1);
        if (heroine) {
          updates.heroine = heroine.name;
          console.log(chalk.green(`      ✓ Heroine: ${heroine.name}`));
        }
      }

      // Runtime
      if (!movie.runtime && tmdbData.movie.runtime) {
        updates.runtime = tmdbData.movie.runtime;
        console.log(chalk.green(`      ✓ Runtime: ${tmdbData.movie.runtime}min`));
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`      ❌ Update failed: ${error.message}`));
          return { success: false, movie, updates };
        }

        console.log(chalk.green(`      ✅ Updated ${Object.keys(updates).length} fields`));
        return { success: true, movie, updates };
      }

      console.log(chalk.gray(`      ℹ️  Already complete`));
      return { success: true, movie, updates: {} };
    })
  );

  return results;
}

async function main() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           ENRICH INCOMPLETE MOVIES - TURBO MODE                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('  Finding movies with TMDB IDs but missing data...\n'));

  // Find movies with TMDB ID but missing any critical data
  // Get all movies with TMDB IDs first
  const { data: allMovies } = await supabase
    .from('movies')
    .select('id, slug, title_en, title_te, release_year, tmdb_id, director, hero, heroine, poster_url, backdrop_url, runtime')
    .not('tmdb_id', 'is', null)
    .order('release_year', { ascending: false })
    .limit(100);

  // Filter in JS for movies missing ANY critical field
  const movies = allMovies?.filter(m => 
    !m.director || m.director === '' || m.director === 'Unknown' ||
    !m.hero || m.hero === '' || m.hero === 'Unknown' ||
    !m.heroine || m.heroine === '' ||
    !m.poster_url || m.poster_url === '' ||
    !m.runtime
  ) || [];

  if (!movies || movies.length === 0) {
    console.log(chalk.green('  ✅ All movies with TMDB IDs are complete!\n'));
    return;
  }

  console.log(chalk.green(`  ✓ Found ${movies.length} movies to enrich\n`));
  console.log(chalk.yellow(`  🚀 TURBO MODE: Processing ${BATCH_SIZE} movies at once\n`));

  let totalEnriched = 0;
  let totalFailed = 0;

  // Process in batches
  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(movies.length / BATCH_SIZE);

    console.log(chalk.cyan(`\n  📦 Batch ${batchNum}/${totalBatches} (${batch.length} movies)`));

    const results = await enrichMoviesBatch(batch);

    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    totalEnriched += success;
    totalFailed += failed;

    console.log(chalk.gray(`    Batch result: ${chalk.green(success + ' ✓')} ${failed > 0 ? chalk.red(failed + ' ✗') : ''}`));

    // Delay between batches
    if (i + BATCH_SIZE < movies.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }

  // Summary
  console.log(chalk.blue.bold('\n\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  ENRICHMENT SUMMARY\n'));

  console.log(chalk.green(`  ✅ Successfully Enriched:  ${totalEnriched}`));
  console.log(chalk.red(`  ❌ Failed:                 ${totalFailed}`));
  console.log(chalk.blue.bold(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━`));
  console.log(chalk.blue(`  Total Processed:         ${movies.length}\n`));

  const percentage = Math.round((totalEnriched / movies.length) * 100);
  console.log(chalk.green(`  🎯 Success Rate: ${percentage}%\n`));

  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════\n'));
}

main().catch(console.error);
