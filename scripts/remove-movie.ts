#!/usr/bin/env npx tsx
/**
 * REMOVE SPECIFIC MOVIE
 * 
 * Safely removes a movie from the database by title
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function removeMovie(title: string, execute: boolean = false) {
  console.log(chalk.cyan.bold('\n🗑️  Movie Removal Tool\n'));
  console.log(`  Searching for: ${chalk.yellow(title)}`);
  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}\n`);

  // Find the movie
  const { data: movies, error: searchError } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, synopsis_te_source')
    .ilike('title_en', `%${title}%`);

  if (searchError) {
    console.error(chalk.red('  ❌ Error searching:'), searchError.message);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('  ⚠️  No movies found matching that title.'));
    return;
  }

  console.log(chalk.cyan(`  Found ${movies.length} matching movie(s):\n`));

  movies.forEach((movie, i) => {
    console.log(chalk.white(`  ${i + 1}. ${chalk.bold(movie.title_en)} (${movie.release_year})`));
    console.log(chalk.gray(`     ID: ${movie.id}`));
    console.log(chalk.gray(`     Telugu: ${movie.title_te || 'N/A'}`));
    console.log(chalk.gray(`     Synopsis Source: ${movie.synopsis_te_source || 'N/A'}`));
    console.log('');
  });

  if (!execute) {
    console.log(chalk.yellow('  💡 Run with --execute to delete these movies\n'));
    return;
  }

  // Execute deletion
  console.log(chalk.red.bold('  🗑️  Deleting movies...\n'));

  let deletedCount = 0;
  for (const movie of movies) {
    const { error: deleteError } = await supabase
      .from('movies')
      .delete()
      .eq('id', movie.id);

    if (deleteError) {
      console.error(chalk.red(`  ❌ Failed to delete "${movie.title_en}":`, deleteError.message));
    } else {
      console.log(chalk.green(`  ✅ Deleted: ${movie.title_en} (${movie.release_year})`));
      deletedCount++;
    }
  }

  console.log(chalk.green.bold(`\n  ✅ Successfully deleted ${deletedCount}/${movies.length} movie(s)\n`));
}

// Parse CLI arguments
const args = process.argv.slice(2);
const titleArg = args.find(a => a.startsWith('--title='));
const execute = args.includes('--execute');

if (!titleArg) {
  console.error(chalk.red('Usage: npx tsx scripts/remove-movie.ts --title="Movie Name" [--execute]'));
  process.exit(1);
}

const title = titleArg.split('=')[1];
removeMovie(title, execute).catch(console.error);
