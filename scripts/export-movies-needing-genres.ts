#!/usr/bin/env npx tsx
/**
 * Export Movies Needing Genres to CSV
 * 
 * Clean format for manual review
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function exportMoviesNeedingGenres() {
  console.log(chalk.cyan('  Fetching movies without genres...\n'));

  const { data: movies } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, tmdb_id, director, hero, heroine')
    .or('genres.is.null,genres.eq.{}')
    .order('release_year', { ascending: false });

  if (!movies || movies.length === 0) {
    console.log(chalk.green('✅ All movies have genres!\n'));
    return;
  }

  // Create CSV
  let csv = 'Year,Title,Director,Hero,Heroine,TMDB_ID,Status,URL\n';
  
  movies.forEach(movie => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    const status = movie.tmdb_id ? 'Has TMDB (no genres)' : 'No TMDB ID';
    const url = `http://localhost:3000/movies/${movie.slug}`;
    
    csv += [
      movie.release_year,
      `"${title}"`,
      `"${movie.director || ''}"`,
      `"${movie.hero || ''}"`,
      `"${movie.heroine || ''}"`,
      movie.tmdb_id || '',
      status,
      url,
    ].join(',') + '\n';
  });

  // Save CSV
  const csvPath = resolve(process.cwd(), 'docs/manual-review/MOVIES-NEEDING-GENRES.csv');
  writeFileSync(csvPath, csv);

  console.log(chalk.green(`  ✅ Exported ${movies.length} movies\n`));
  console.log(chalk.gray(`  📁 File: docs/manual-review/MOVIES-NEEDING-GENRES.csv\n`));

  // Summary stats
  const withTmdb = movies.filter(m => m.tmdb_id).length;
  const withoutTmdb = movies.filter(m => !m.tmdb_id).length;

  console.log(chalk.cyan.bold('  BREAKDOWN:\n'));
  console.log(chalk.yellow(`    ${withTmdb} movies with TMDB ID (but no genres in TMDB)`));
  console.log(chalk.red(`    ${withoutTmdb} movies without TMDB ID (need research)\n`));

  // Print first 20 for quick view
  console.log(chalk.blue.bold('  PREVIEW (First 20):\n'));
  
  movies.slice(0, 20).forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    const tmdbStatus = movie.tmdb_id ? chalk.yellow('[Has TMDB]') : chalk.red('[No TMDB]');
    
    console.log(chalk.gray(`  ${(i + 1).toString().padStart(2)}.`) + 
                ` ${chalk.white(title)} ${chalk.gray(`(${movie.release_year})`)} ${tmdbStatus}`);
  });

  console.log(chalk.gray(`\n  ... and ${movies.length - 20} more (see CSV file)\n`));
}

async function main() {
  await exportMoviesNeedingGenres();
}

main().catch(console.error);
