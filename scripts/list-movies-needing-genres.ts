#!/usr/bin/env npx tsx
/**
 * List Movies Needing Genres
 * 
 * Display all movies without genres for manual review
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

async function listMoviesNeedingGenres() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              MOVIES NEEDING GENRE INFORMATION (286)                   ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  // Find movies without genres
  const { data: movies, error } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, tmdb_id, director, hero, heroine')
    .or('genres.is.null,genres.eq.{}')
    .order('release_year', { ascending: false });

  if (error) {
    console.log(chalk.red(`Error: ${error.message}\n`));
    return;
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.green('✅ All movies have genres!\n'));
    return;
  }

  // Group by TMDB ID status
  const withTmdbId = movies.filter(m => m.tmdb_id);
  const withoutTmdbId = movies.filter(m => !m.tmdb_id);

  console.log(chalk.cyan.bold(`Total Movies: ${movies.length}\n`));
  console.log(chalk.yellow(`  • With TMDB ID: ${withTmdbId.length} (TMDB has no genre data)`));
  console.log(chalk.red(`  • Without TMDB ID: ${withoutTmdbId.length} (needs research)\n`));

  // List movies WITH TMDB ID (but no genres in TMDB)
  console.log(chalk.yellow.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.yellow.bold('  MOVIES WITH TMDB ID (TMDB has movie but no genres)'));
  console.log(chalk.yellow.bold('═══════════════════════════════════════════════════════════════════════\n'));

  withTmdbId.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    const year = movie.release_year;
    const cast = [movie.director, movie.hero, movie.heroine].filter(Boolean).join(', ');
    
    console.log(chalk.gray(`  ${(i + 1).toString().padStart(3)}. `) + 
                chalk.white(`${title} (${year})`) + 
                chalk.gray(` • TMDB: ${movie.tmdb_id}`));
    
    if (cast) {
      console.log(chalk.gray(`       Cast: ${cast}`));
    }
    
    console.log(chalk.gray(`       URL: http://localhost:3000/movies/${movie.slug}\n`));
  });

  // List movies WITHOUT TMDB ID (needs research)
  console.log(chalk.red.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.red.bold('  MOVIES WITHOUT TMDB ID (needs alternative sources)'));
  console.log(chalk.red.bold('═══════════════════════════════════════════════════════════════════════\n'));

  withoutTmdbId.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    const year = movie.release_year;
    const cast = [movie.director, movie.hero, movie.heroine].filter(Boolean).join(', ');
    
    console.log(chalk.gray(`  ${(i + 1).toString().padStart(3)}. `) + 
                chalk.white(`${title} (${year})`));
    
    if (cast) {
      console.log(chalk.gray(`       Cast: ${cast}`));
    }
    
    console.log(chalk.gray(`       URL: http://localhost:3000/movies/${movie.slug}\n`));
  });

  // Summary
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  SUMMARY FOR MANUAL REVIEW\n'));

  console.log(chalk.yellow(`  📊 ${withTmdbId.length} movies:`));
  console.log(chalk.gray(`     • Already in TMDB but genres missing`));
  console.log(chalk.gray(`     • Check IMDb, Wikipedia, or manual classification\n`));

  console.log(chalk.red(`  🔍 ${withoutTmdbId.length} movies:`));
  console.log(chalk.gray(`     • No TMDB link found`));
  console.log(chalk.gray(`     • Need research from alternative sources`));
  console.log(chalk.gray(`     • May be regional/obscure films\n`));

  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════\n'));
}

async function main() {
  await listMoviesNeedingGenres();
}

main().catch(console.error);
