#!/usr/bin/env npx tsx
/**
 * EXPANDED TAGGING SYSTEM
 * 
 * Uses improved heuristics with multiple criteria to tag more movies:
 * - Blockbuster: Recent hits, high ratings, genre patterns
 * - Classic: Older films with lasting impact
 * - Underrated: Hidden gems with good ratings
 * - Recent: Last 5 years
 * - Vintage: Pre-1980
 * 
 * Usage:
 *   npx tsx scripts/enrich-tags-expanded.ts --execute
 *   npx tsx scripts/enrich-tags-expanded.ts --report-only
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXECUTE = process.argv.includes('--execute');
const REPORT_ONLY = process.argv.includes('--report-only');

interface Movie {
  id: string;
  title_en: string;
  release_year?: number;
  avg_rating?: number;
  genres?: string;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  is_underrated?: boolean;
}

const stats = {
  blockbuster: 0,
  classic: 0,
  underrated: 0,
};

/**
 * Expanded tagging logic with multiple criteria
 */
function applyExpandedTags(movie: Movie): { updates: any; tags: string[] } {
  const updates: any = {};
  const tags: string[] = [];
  
  const year = movie.release_year || 0;
  const rating = movie.avg_rating || 0;
  const genres = movie.genres ? 
    (Array.isArray(movie.genres) ? movie.genres.join(',').toLowerCase() : 
     typeof movie.genres === 'string' ? movie.genres.toLowerCase() : '') : '';
  
  // BLOCKBUSTER: Multiple criteria
  // 1. Recent high-rated films (2010+, rating >= 7.0)
  // 2. Action/Thriller with rating >= 7.5
  // 3. Very high ratings regardless of year (>= 8.5)
  if (!movie.is_blockbuster) {
    const isRecentHit = year >= 2010 && rating >= 7.0;
    const isActionHit = (genres.includes('action') || genres.includes('thriller')) && rating >= 7.5;
    const isHighlyRated = rating >= 8.5;
    
    if (isRecentHit || isActionHit || isHighlyRated) {
      updates.is_blockbuster = true;
      tags.push('blockbuster');
      stats.blockbuster++;
    }
  }
  
  // CLASSIC: Older films with good ratings
  // 1. Pre-2000 with rating >= 6.5
  // 2. Pre-1990 with rating >= 6.0
  // 3. Drama/Family films pre-2000 with rating >= 7.0
  if (!movie.is_classic) {
    const isOldAndGood = year < 2000 && rating >= 6.5;
    const isVeryOldAndDecent = year < 1990 && rating >= 6.0;
    const isDramaClassic = year < 2000 && (genres.includes('drama') || genres.includes('family')) && rating >= 7.0;
    
    if (isOldAndGood || isVeryOldAndDecent || isDramaClassic) {
      updates.is_classic = true;
      tags.push('classic');
      stats.classic++;
    }
  }
  
  // UNDERRATED: Hidden gems
  // 1. Rating 6.0-7.9 (not blockbuster/classic)
  // 2. Comedy/Drama with rating 6.5-7.5
  // 3. Older films (pre-2010) with rating 6.5-7.5
  if (!movie.is_underrated && !updates.is_blockbuster && !updates.is_classic) {
    const isHiddenGem = rating >= 6.0 && rating < 8.0;
    const isGenreGem = (genres.includes('comedy') || genres.includes('drama')) && rating >= 6.5 && rating <= 7.5;
    const isOlderGem = year < 2010 && rating >= 6.5 && rating <= 7.5;
    
    if (isHiddenGem || isGenreGem || isOlderGem) {
      updates.is_underrated = true;
      tags.push('underrated');
      stats.underrated++;
    }
  }
  
  return { updates, tags };
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║         EXPANDED TAGGING SYSTEM                                      ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  // Load all Telugu movies
  console.log(chalk.cyan(`  📋 Loading all Telugu movies from database...`));
  
  let allMovies: Movie[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, avg_rating, genres, is_blockbuster, is_classic, is_underrated')
      .eq('language', 'Telugu')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error(chalk.red(`  Error loading movies: ${error.message}`));
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allMovies = allMovies.concat(data);
    console.log(chalk.gray(`    Loaded ${allMovies.length} movies...`));
    
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(chalk.green(`  ✅ Loaded ${allMovies.length} movies total\n`));

  // Filter movies needing tags
  const moviesNeedingTags = allMovies.filter(m => 
    !m.is_blockbuster || !m.is_classic || !m.is_underrated
  );

  console.log(chalk.yellow(`  🏷️  ${moviesNeedingTags.length} movies can be tagged\n`));

  // Report mode
  if (REPORT_ONLY) {
    const needingBlockbuster = allMovies.filter(m => !m.is_blockbuster).length;
    const needingClassic = allMovies.filter(m => !m.is_classic).length;
    const needingUnderrated = allMovies.filter(m => !m.is_underrated).length;
    
    console.log(chalk.cyan(`  📊 CURRENT STATE:`));
    console.log(chalk.gray(`    Movies without Blockbuster tag:  ${needingBlockbuster}`));
    console.log(chalk.gray(`    Movies without Classic tag:      ${needingClassic}`));
    console.log(chalk.gray(`    Movies without Underrated tag:   ${needingUnderrated}\n`));
    
    console.log(chalk.yellow(`  ⚠️  REPORT-ONLY MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
    return;
  }

  if (!EXECUTE) {
    console.log(chalk.yellow(`  ⚠️  DRY RUN MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
    return;
  }

  // Start tagging
  const startTime = Date.now();
  let totalMoviesTagged = 0;

  for (const movie of moviesNeedingTags) {
    const { updates, tags } = applyExpandedTags(movie);
    
    if (tags.length > 0) {
      const { error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);

      if (error) {
        console.error(chalk.red(`  Error updating ${movie.title_en}: ${error.message}`));
      } else {
        totalMoviesTagged++;
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Final report
  console.log(chalk.green(`\n  ✅ Tagging complete!\n`));

  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            TAGGING COMPLETE!                                         ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.green(`  Total movies processed: ${moviesNeedingTags.length}`));
  console.log(chalk.green(`  Movies tagged: ${totalMoviesTagged}`));
  console.log(chalk.green(`  Duration: ${duration} minutes\n`));

  console.log(chalk.green(`  ✅ Blockbuster tags added: ${stats.blockbuster}`));
  console.log(chalk.green(`  ✅ Classic tags added: ${stats.classic}`));
  console.log(chalk.green(`  ✅ Underrated tags added: ${stats.underrated}`));
  
  const totalTags = stats.blockbuster + stats.classic + stats.underrated;
  console.log(chalk.green(`  Total tags applied: ${totalTags}\n`));

  console.log(chalk.cyan(`  💡 Run audit to see improvements:`));
  console.log(chalk.gray(`     npx tsx scripts/audit-movie-data-completeness.ts\n`));
}

main();
