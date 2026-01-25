#!/usr/bin/env npx tsx
/**
 * REMOVE RATINGS FROM UNRELEASED MOVIES
 * 
 * Audits and removes all ratings from movies that are not yet released.
 * This ensures unreleased movies don't show ratings on the UI.
 * 
 * Usage:
 *   npx tsx scripts/remove-unreleased-ratings.ts --audit
 *   npx tsx scripts/remove-unreleased-ratings.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { isMovieUpcoming } from '../lib/utils/movie-status';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const EXECUTE = hasFlag('execute');
const AUDIT = hasFlag('audit') || !EXECUTE;

interface UnreleasedMovie {
  id: string;
  slug: string;
  title_en: string;
  title_te?: string;
  release_year: number | null;
  release_date: string | null;
  our_rating: number | null;
  avg_rating: number | null;
  editorial_score: number | null;
  editorial_score_breakdown: any;
}

async function main() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         REMOVE RATINGS FROM UNRELEASED MOVIES                       ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(`Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('AUDIT ONLY')}\n`);

  // Fetch all movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select(`
      id,
      slug,
      title_en,
      title_te,
      release_year,
      release_date,
      our_rating,
      avg_rating,
      editorial_score,
      editorial_score_breakdown
    `)
    .order('release_year', { ascending: false, nullsFirst: true });

  if (error) {
    console.log(chalk.red(`Error fetching movies: ${error.message}`));
    return;
  }

  console.log(`Total movies in database: ${chalk.cyan(movies.length)}\n`);

  // Filter unreleased movies
  const unreleasedMovies: UnreleasedMovie[] = movies.filter(movie => 
    isMovieUpcoming({
      release_date: movie.release_date,
      release_year: movie.release_year
    })
  );

  console.log(`Unreleased movies found: ${chalk.cyan(unreleasedMovies.length)}\n`);

  // Filter movies that have ratings
  const moviesWithRatings = unreleasedMovies.filter(movie =>
    movie.our_rating !== null ||
    movie.avg_rating !== null ||
    movie.editorial_score !== null ||
    movie.editorial_score_breakdown !== null
  );

  console.log(`Unreleased movies with ratings: ${chalk.red(moviesWithRatings.length)}\n`);

  if (moviesWithRatings.length === 0) {
    console.log(chalk.green('✅ No unreleased movies have ratings. Database is clean!\n'));
    return;
  }

  // Display summary
  console.log(chalk.bold('═══ UNRELEASED MOVIES BY CATEGORY ═══\n'));

  const categories = {
    'No Release Year (NULL)': moviesWithRatings.filter(m => !m.release_year && !m.release_date),
    'Future Release Year': moviesWithRatings.filter(m => m.release_year && m.release_year > new Date().getFullYear()),
    'Future Release Date': moviesWithRatings.filter(m => m.release_date && new Date(m.release_date) > new Date())
  };

  Object.entries(categories).forEach(([category, items]) => {
    if (items.length > 0) {
      console.log(chalk.yellow(`${category}: ${items.length} movies`));
      items.slice(0, 5).forEach(movie => {
        const ratings = [];
        if (movie.our_rating) ratings.push(`our: ${movie.our_rating}`);
        if (movie.avg_rating) ratings.push(`avg: ${movie.avg_rating}`);
        if (movie.editorial_score) ratings.push(`editorial: ${movie.editorial_score}`);
        
        console.log(`  • ${movie.title_en} (${movie.release_year || 'TBA'}) - ${chalk.red(ratings.join(', '))}`);
      });
      if (items.length > 5) {
        console.log(chalk.gray(`  ... and ${items.length - 5} more`));
      }
      console.log('');
    }
  });

  // Show top 20 movies that will be cleaned
  console.log(chalk.bold('\n═══ TOP 20 MOVIES TO CLEAN ═══\n'));
  
  moviesWithRatings.slice(0, 20).forEach((movie, index) => {
    console.log(`${index + 1}. ${chalk.bold(movie.title_en)} ${movie.title_te ? chalk.gray(`(${movie.title_te})`) : ''}`);
    console.log(`   Year: ${movie.release_year || chalk.yellow('NULL')}`);
    console.log(`   Slug: ${chalk.dim(movie.slug)}`);
    
    const changes = [];
    if (movie.our_rating !== null) changes.push(`our_rating: ${movie.our_rating} → NULL`);
    if (movie.avg_rating !== null) changes.push(`avg_rating: ${movie.avg_rating} → NULL`);
    if (movie.editorial_score !== null) changes.push(`editorial_score: ${movie.editorial_score} → NULL`);
    if (movie.editorial_score_breakdown !== null) changes.push(`editorial_score_breakdown: {...} → NULL`);
    
    console.log(`   Changes: ${chalk.red(changes.join(', '))}`);
    console.log('');
  });

  if (moviesWithRatings.length > 20) {
    console.log(chalk.gray(`... and ${moviesWithRatings.length - 20} more movies\n`));
  }

  // Export to CSV
  const timestamp = new Date().toISOString().split('T')[0];
  const csvFilename = `unreleased-movies-cleanup-${timestamp}.csv`;
  
  const csvHeaders = 'Slug,Title (English),Title (Telugu),Release Year,Release Date,Our Rating,Avg Rating,Editorial Score';
  const csvRows = moviesWithRatings.map(movie =>
    [
      movie.slug,
      `"${(movie.title_en || '').replace(/"/g, '""')}"`,
      `"${(movie.title_te || '').replace(/"/g, '""')}"`,
      movie.release_year || '',
      movie.release_date || '',
      movie.our_rating || '',
      movie.avg_rating || '',
      movie.editorial_score || ''
    ].join(',')
  );
  
  const csv = [csvHeaders, ...csvRows].join('\n');
  writeFileSync(csvFilename, csv, 'utf-8');
  
  console.log(chalk.green(`✅ Exported list to: ${chalk.bold(csvFilename)}\n`));

  // Execute cleanup
  if (EXECUTE) {
    console.log(chalk.yellow.bold('🚀 EXECUTING CLEANUP...\n'));

    let successCount = 0;
    let errorCount = 0;

    for (const movie of moviesWithRatings) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({
          our_rating: null,
          avg_rating: null,
          editorial_score: null,
          editorial_score_breakdown: null
        })
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`✗ ${movie.title_en}: ${updateError.message}`));
        errorCount++;
      } else {
        successCount++;
        if (successCount <= 10) {
          console.log(chalk.green(`✓ ${movie.title_en}`));
        }
      }
    }

    if (successCount > 10) {
      console.log(chalk.gray(`... and ${successCount - 10} more movies cleaned`));
    }

    console.log(chalk.bold('\n═══ CLEANUP SUMMARY ═══'));
    console.log(`Successfully cleaned: ${chalk.green(successCount)}`);
    console.log(`Errors: ${errorCount > 0 ? chalk.red(errorCount) : chalk.green(0)}`);
    console.log(`Total processed: ${moviesWithRatings.length}\n`);

    if (successCount > 0) {
      console.log(chalk.green.bold('✅ Cleanup complete! Unreleased movies no longer have ratings.\n'));
    }
  } else {
    console.log(chalk.yellow('\n⚠️  AUDIT ONLY - Use --execute to apply changes\n'));
    console.log(chalk.dim('Command to execute:'));
    console.log(chalk.dim('  npx tsx scripts/remove-unreleased-ratings.ts --execute\n'));
  }
}

main().catch(console.error);
