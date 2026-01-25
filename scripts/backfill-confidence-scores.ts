#!/usr/bin/env npx tsx
/**
 * CONFIDENCE SCORE BACKFILL BATCH JOB
 * 
 * Calculates and backfills confidence scores for all movies by aggregating
 * existing data quality signals into a single confidence_score (0-1) with
 * detailed breakdown.
 * 
 * Usage:
 *   npx tsx scripts/backfill-confidence-scores.ts --limit=1000 --execute
 *   npx tsx scripts/backfill-confidence-scores.ts --all --execute
 *   npx tsx scripts/backfill-confidence-scores.ts --recalculate --execute
 *   npx tsx scripts/backfill-confidence-scores.ts --low-only --execute  # Only <0.6
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import {
  calculateConfidence,
  extractConfidenceInputs,
  needsConfidenceRecalc,
  getConfidenceStatistics,
  type ConfidenceResult,
} from '../lib/confidence/confidence-calculator';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const EXECUTE = hasFlag('execute');
const LIMIT = parseInt(getArg('limit', '1000'));
const ALL = hasFlag('all'); // Process all movies
const RECALCULATE = hasFlag('recalculate'); // Recalc even if exists
const LOW_ONLY = hasFlag('low-only'); // Only movies with confidence < 0.6
const DRY_RUN = hasFlag('dry-run');
const CONCURRENCY = parseInt(getArg('concurrency', '50'));

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(chalk.blue.bold('\n📊 CONFIDENCE SCORE BACKFILL BATCH JOB\n'));
  
  if (!EXECUTE && !DRY_RUN) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  // Get movies to process
  const movies = await getMovies();
  
  if (!movies || movies.length === 0) {
    console.log(chalk.red('✗ No movies found'));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${movies.length} movies to process\n`));
  
  // Process in batches
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    excellent: 0,
    high: 0,
    good: 0,
    medium: 0,
    low: 0,
    very_low: 0,
  };
  
  const allScores: number[] = [];
  
  for (let i = 0; i < movies.length; i += CONCURRENCY) {
    const batch = movies.slice(i, Math.min(i + CONCURRENCY, movies.length));
    
    console.log(chalk.cyan(`\nProcessing batch ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(movies.length / CONCURRENCY)} (${batch.length} movies)...`));
    
    const batchResults = await Promise.all(
      batch.map(movie => processMovie(movie))
    );
    
    // Aggregate results
    for (const result of batchResults) {
      results.processed++;
      
      if (!result) {
        results.failed++;
        continue;
      }
      
      if (result.status === 'skipped') {
        results.skipped++;
        continue;
      }
      
      if (result.status === 'success') {
        results.succeeded++;
        results[result.tier]++;
        allScores.push(result.confidence_score);
      } else {
        results.failed++;
      }
    }
    
    // Progress indicator
    const progressPct = Math.round((results.processed / movies.length) * 100);
    console.log(chalk.gray(`  Progress: ${results.processed}/${movies.length} (${progressPct}%) - Succeeded: ${results.succeeded}, Skipped: ${results.skipped}, Failed: ${results.failed}`));
  }
  
  // Calculate statistics
  const stats = getConfidenceStatistics(allScores);
  
  // Print summary
  printSummary(results, stats, movies.length);
}

// ============================================================
// HELPERS
// ============================================================

async function getMovies() {
  let query = supabase
    .from('movies')
    .select('id, title_en, slug, release_year, tmdb_id, imdb_id, wikidata_id, data_sources, poster_url, is_published, hero, director, heroine, music_director, producer, synopsis, genres, supporting_cast, crew, our_rating, confidence_score, last_confidence_calc, updated_at')
    .eq('is_published', true);
  
  if (LOW_ONLY) {
    // Only process movies with low confidence or no confidence score
    query = query.or('confidence_score.lt.0.60,confidence_score.is.null');
  } else if (!RECALCULATE) {
    // Skip movies that don't need recalculation
    // (This filter is applied in processMovie instead for better control)
  }
  
  if (!ALL) {
    query = query.limit(LIMIT);
  }
  
  query = query.order('release_year', { ascending: false, nullsFirst: false });
  
  const { data, error } = await query;
  
  if (error) {
    console.log(chalk.red(`Error fetching movies: ${error.message}`));
    return null;
  }
  
  return data;
}

async function processMovie(movie: any): Promise<{
  status: 'success' | 'failed' | 'skipped';
  confidence_score?: number;
  tier?: string;
} | null> {
  try {
    // Skip if doesn't need recalculation (unless --recalculate flag)
    if (!RECALCULATE && !needsConfidenceRecalc(movie)) {
      return { status: 'skipped' };
    }
    
    // Extract inputs from movie data
    const inputs = extractConfidenceInputs(movie);
    
    // Calculate confidence
    const result: ConfidenceResult = calculateConfidence(inputs);
    
    // Update database (if execute mode)
    if (EXECUTE) {
      const { error } = await supabase
        .from('movies')
        .update({
          confidence_score: result.confidence_score,
          confidence_breakdown: result.confidence_breakdown as any,
          last_confidence_calc: new Date().toISOString(),
          governance_flags: result.flags,
        })
        .eq('id', movie.id);
      
      if (error) {
        console.log(chalk.red(`  ✗ ${movie.title_en}: Failed to update - ${error.message}`));
        return { status: 'failed' };
      }
    }
    
    return {
      status: 'success',
      confidence_score: result.confidence_score,
      tier: result.tier,
    };
    
  } catch (error) {
    console.log(chalk.red(`  ✗ ${movie.title_en}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    return { status: 'failed' };
  }
}

function printSummary(results: any, stats: any, total: number) {
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('CONFIDENCE BACKFILL SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies:        ${total}`));
  console.log(chalk.white(`Processed:           ${results.processed}`));
  console.log(chalk.green(`Succeeded:           ${results.succeeded}`));
  console.log(chalk.yellow(`Skipped:             ${results.skipped}`));
  console.log(chalk.red(`Failed:              ${results.failed}`));
  
  console.log(chalk.gray('\nConfidence Distribution:'));
  console.log(chalk.green(`  Excellent (≥0.90):  ${results.excellent} (${stats.excellent_count})`));
  console.log(chalk.cyan(`  High (0.80-0.89):   ${results.high} (${stats.high_count})`));
  console.log(chalk.blue(`  Good (0.70-0.79):   ${results.good} (${stats.good_count})`));
  console.log(chalk.yellow(`  Medium (0.60-0.69): ${results.medium} (${stats.medium_count})`));
  console.log(chalk.magenta(`  Low (0.50-0.59):    ${results.low} (${stats.low_count})`));
  console.log(chalk.red(`  Very Low (<0.50):   ${results.very_low} (${stats.very_low_count})`));
  
  if (results.succeeded > 0) {
    console.log(chalk.gray('\nStatistics:'));
    console.log(chalk.white(`  Mean Confidence:    ${stats.mean.toFixed(2)}`));
    console.log(chalk.white(`  Median Confidence:  ${stats.median.toFixed(2)}`));
    console.log(chalk.white(`  Min Confidence:     ${stats.min.toFixed(2)}`));
    console.log(chalk.white(`  Max Confidence:     ${stats.max.toFixed(2)}`));
  }
  
  const successRate = total > 0 ? Math.round((results.succeeded / total) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:        ${successRate}%`));
  
  // Recommendations
  if (stats.very_low_count > 0 || stats.low_count > 0) {
    console.log(chalk.yellow(`\n⚠️  ${stats.very_low_count + stats.low_count} movies have low confidence (<0.60)`));
    console.log(chalk.yellow('   Consider running enrichment scripts or manual review'));
  }
  
  if (!EXECUTE && !DRY_RUN) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes were made to database'));
    console.log(chalk.yellow('   Run with --execute to apply changes'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

// ============================================================
// RUN
// ============================================================

main()
  .then(() => {
    console.log(chalk.green('✓ Backfill job completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Backfill job failed:'), error);
    process.exit(1);
  });
