#!/usr/bin/env npx tsx
/**
 * Final Genre Cleanup
 * 
 * 1. Fix remaining non-standard genre variations (spelling/spacing issues)
 * 2. Handle 66 movies with empty genres (critical!)
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

// Additional mappings for edge cases
const ADDITIONAL_MAPPINGS: Record<string, string> = {
  'Coming of age': 'Drama',
  'Period Drama': 'Period',  // Already have 'Period' genre
  'Social drama': 'Drama',
  'Historical drama': 'History',
  'Romantic drama': 'Romance',
  'Romantic comedy': 'Comedy',
  'Black comedy': 'Comedy',
  'Dark comedy': 'Comedy'
};

async function fixRemainingVariations() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              FINAL GENRE CLEANUP                                      ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white('  Phase 1: Fix remaining genre variations...\n'));

  const BATCH_SIZE = 1000;
  let offset = 0;
  let fixedCount = 0;

  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, genres, slug')
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error || !data || data.length === 0) break;

    for (const movie of data) {
      if (!movie.genres || movie.genres.length === 0) continue;

      const hasVariations = movie.genres.some((g: string) => g in ADDITIONAL_MAPPINGS);
      if (!hasVariations) continue;

      const newGenres = new Set<string>();
      movie.genres.forEach((genre: string) => {
        if (genre in ADDITIONAL_MAPPINGS) {
          newGenres.add(ADDITIONAL_MAPPINGS[genre]);
        } else {
          newGenres.add(genre);
        }
      });

      const genresArray = Array.from(newGenres);
      console.log(chalk.white(`  ${movie.title_en} (${movie.release_year})`));
      console.log(chalk.gray(`    ${movie.genres.join(', ')} → ${genresArray.join(', ')}`));

      const { error: updateError } = await supabase
        .from('movies')
        .update({ genres: genresArray })
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`    ✗ Failed: ${updateError.message}`));
      } else {
        console.log(chalk.green(`    ✓ Updated`));
        fixedCount++;
      }
    }

    offset += BATCH_SIZE;
    if (data.length < BATCH_SIZE) break;
  }

  console.log(chalk.green(`\n  ✓ Phase 1 Complete: ${fixedCount} movies fixed\n`));
}

async function fixEmptyGenres() {
  console.log(chalk.white('  Phase 2: Fix movies with empty genres...\n'));

  // Get movies with empty/null genres
  const { data: emptyMovies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, genres, tmdb_id, slug, director, hero')
    .or('genres.is.null,genres.eq.{}')
    .order('release_year', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(chalk.yellow(`  Found ${emptyMovies.length} movies with empty genres\n`));

  if (emptyMovies.length === 0) {
    console.log(chalk.green('  🎉 All movies have genres!\n'));
    return;
  }

  let fixedCount = 0;
  let failedCount = 0;

  for (const movie of emptyMovies) {
    console.log(chalk.white(`  ${movie.title_en} (${movie.release_year})`));

    // Strategy 1: If has TMDB ID, fetch from TMDB
    if (movie.tmdb_id) {
      try {
        const tmdbResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.tmdb_id}?api_key=${process.env.TMDB_API_KEY}`
        );
        
        if (tmdbResponse.ok) {
          const tmdbData = await tmdbResponse.json();
          
          if (tmdbData.genres && tmdbData.genres.length > 0) {
            const genres = tmdbData.genres.slice(0, 3).map((g: any) => g.name);
            
            const { error: updateError } = await supabase
              .from('movies')
              .update({ genres })
              .eq('id', movie.id);

            if (updateError) {
              console.log(chalk.red(`    ✗ Failed to update: ${updateError.message}`));
              failedCount++;
            } else {
              console.log(chalk.green(`    ✓ Enriched from TMDB: [${genres.join(', ')}]`));
              fixedCount++;
            }
            
            await new Promise(r => setTimeout(r, 300)); // Rate limit
            continue;
          }
        }
      } catch (err) {
        // Fall through to default
      }
    }

    // Strategy 2: Assign default "Drama" genre
    const { error: updateError } = await supabase
      .from('movies')
      .update({ genres: ['Drama'] })
      .eq('id', movie.id);

    if (updateError) {
      console.log(chalk.red(`    ✗ Failed to update: ${updateError.message}`));
      failedCount++;
    } else {
      console.log(chalk.yellow(`    ⚠ Assigned default [Drama] genre`));
      fixedCount++;
    }
  }

  console.log(chalk.green(`\n  ✓ Phase 2 Complete: ${fixedCount} fixed, ${failedCount} failed\n`));
}

async function runFinalCleanup() {
  await fixRemainingVariations();
  await fixEmptyGenres();

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   FINAL CLEANUP COMPLETE                              ║
╚═══════════════════════════════════════════════════════════════════════╝

  Run audit again to verify:
  npx tsx scripts/audit-genre-quality-complete.ts

`));
}

runFinalCleanup();
