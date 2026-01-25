#!/usr/bin/env npx tsx
/**
 * Publish Discovered Movies
 * 
 * Auto-publishes movies that were discovered but left unpublished.
 * Only publishes movies that meet minimum quality criteria.
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

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  director?: string;
  hero?: string;
  heroine?: string;
  synopsis?: string;
  poster_url?: string;
}

/**
 * Check if movie meets minimum criteria for publishing
 */
function meetsPublishCriteria(movie: Movie): boolean {
  // Must have:
  // 1. Title and year
  // 2. At least one of: director, hero, or heroine
  // 3. Not a future release (more than 1 year away)
  
  const currentYear = new Date().getFullYear();
  const isFutureRelease = movie.release_year > currentYear + 1;
  
  if (isFutureRelease) {
    return false; // Don't publish far-future speculative releases
  }
  
  const hasBasicInfo = movie.title_en && movie.release_year;
  const hasCast = movie.director || movie.hero || movie.heroine;
  
  return hasBasicInfo && hasCast;
}

/**
 * Generate a basic synopsis if missing
 */
function generateBasicSynopsis(movie: Movie): string {
  const parts: string[] = [];
  
  if (movie.release_year) {
    parts.push(`A ${movie.release_year} Telugu film`);
  }
  
  if (movie.director) {
    parts.push(`directed by ${movie.director}`);
  }
  
  if (movie.hero && movie.heroine) {
    parts.push(`starring ${movie.hero} and ${movie.heroine}`);
  } else if (movie.hero) {
    parts.push(`starring ${movie.hero}`);
  } else if (movie.heroine) {
    parts.push(`starring ${movie.heroine}`);
  }
  
  return parts.join(' ') + '.';
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '100', 10);
  
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            PUBLISH DISCOVERED MOVIES                                 ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));
  
  console.log(`  Mode: ${isDryRun ? chalk.yellow('DRY RUN') : chalk.red('EXECUTE')}`);
  if (isDryRun) {
    console.log(chalk.yellow('  (Use --execute to apply changes)'));
  }
  console.log(`  Batch size: ${limit}\n`);
  
  // Fetch unpublished movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, director, hero, heroine, synopsis, poster_url')
    .eq('is_published', false)
    .eq('language', 'Telugu')
    .limit(limit);
  
  if (error || !movies) {
    console.error(chalk.red(`  ❌ Error fetching movies: ${error?.message}`));
    return;
  }
  
  console.log(chalk.cyan(`  📋 Found ${movies.length} unpublished movies to review\n`));
  
  let eligible = 0;
  let skipped = 0;
  let published = 0;
  
  for (const movie of movies) {
    const canPublish = meetsPublishCriteria(movie);
    
    if (!canPublish) {
      skipped++;
      console.log(chalk.gray(`  ⊘ Skip: ${movie.title_en} (${movie.release_year}) - Insufficient data or future release`));
      continue;
    }
    
    eligible++;
    
    if (isDryRun) {
      console.log(chalk.yellow(`  ✓ Would publish: ${movie.title_en} (${movie.release_year})`));
      continue;
    }
    
    // Publish the movie
    const updates: any = {
      is_published: true,
      ingestion_status: 'enriched',
    };
    
    // Add basic synopsis if missing
    if (!movie.synopsis) {
      updates.synopsis = generateBasicSynopsis(movie);
    }
    
    const { error: updateError } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movie.id);
    
    if (updateError) {
      console.error(chalk.red(`  ❌ Failed: ${movie.title_en} - ${updateError.message}`));
    } else {
      published++;
      console.log(chalk.green(`  ✓ Published: ${movie.title_en} (${movie.release_year})`));
    }
  }
  
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            SUMMARY                                                   ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.gray(`  Total reviewed: ${movies.length}`));
  console.log(chalk.green(`  Eligible for publishing: ${eligible}`));
  console.log(chalk.gray(`  Skipped (insufficient data): ${skipped}`));
  
  if (!isDryRun) {
    console.log(chalk.green(`  Successfully published: ${published}\n`));
  } else {
    console.log(chalk.yellow(`\n  Run with --execute to publish ${eligible} movies\n`));
  }
}

main().catch(console.error);
