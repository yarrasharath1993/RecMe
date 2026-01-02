#!/usr/bin/env npx tsx
/**
 * Movie Coverage Report
 * 
 * Phase 9: Success Metrics
 * 
 * Reports:
 * - Total Telugu movies indexed
 * - % coverage vs TMDB Telugu count
 * - % with full cast & crew
 * - % with reviews
 * - % with image coverage
 * - Duplicate count (must be ~0)
 * 
 * Usage:
 *   pnpm movies:coverage           # Quick summary
 *   pnpm movies:coverage --full    # Detailed report
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

interface CoverageMetrics {
  // Index coverage
  totalIndexed: number;
  tmdbEstimate: number;
  indexCoverage: number;
  
  // Validation status
  valid: number;
  needsReview: number;
  rejected: number;
  pending: number;
  
  // Data quality
  withPoster: number;
  withBackdrop: number;
  withDirector: number;
  withCast3Plus: number;
  withCast5Plus: number;
  withGenres: number;
  avgQualityScore: number;
  
  // Reviews
  totalMoviesTable: number;
  withReviews: number;
  reviewCoverage: number;
  
  // Duplicates
  duplicateCount: number;
  
  // By year
  byYear: Record<number, { indexed: number; enriched: number }>;
  
  // By decade
  byDecade: Record<string, number>;
}

// ============================================================
// SUPABASE
// ============================================================

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(url, key);
}

// ============================================================
// METRICS COLLECTION
// ============================================================

async function collectMetrics(): Promise<CoverageMetrics> {
  const supabase = getSupabaseClient();

  // Use movies table directly (telugu_movie_index may not exist yet)
  const { count: totalIndexed } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);

  // Validation status - movies with TMDB ID are considered valid
  const { count: valid } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .not('tmdb_id', 'is', null);

  const { count: needsReview } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .is('tmdb_id', null)
    .not('director', 'is', null);

  const { count: rejected } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false);

  const { count: pending } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .is('tmdb_id', null)
    .is('director', null);

  // Data quality from movies table
  const { count: withPoster } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .not('poster_url', 'is', null);

  const { count: withBackdrop } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .not('backdrop_url', 'is', null);

  const { count: withDirector } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .not('director', 'is', null);

  // Cast count - check cast_members array length
  const { data: moviesWithCast } = await supabase
    .from('movies')
    .select('cast_members')
    .eq('is_published', true)
    .not('cast_members', 'is', null);

  const withCast3Plus = moviesWithCast?.filter(m => 
    m.cast_members && Array.isArray(m.cast_members) && m.cast_members.length >= 3
  ).length || 0;

  const withCast5Plus = moviesWithCast?.filter(m => 
    m.cast_members && Array.isArray(m.cast_members) && m.cast_members.length >= 5
  ).length || 0;

  // Movies table stats
  const { count: totalMoviesTable } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);

  const { count: withGenres } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('genres', 'is', null);

  // Reviews
  const { count: withReviews } = await supabase
    .from('movie_reviews')
    .select('movie_id', { count: 'exact', head: true });

  // Quality score average
  const { data: qualityData } = await supabase
    .from('movies')
    .select('data_quality_score')
    .not('data_quality_score', 'is', null);

  const avgQualityScore = qualityData?.length 
    ? qualityData.reduce((sum, m) => sum + (m.data_quality_score || 0), 0) / qualityData.length
    : 0;

  // Duplicates - check by slug
  const { data: allMovies } = await supabase
    .from('movies')
    .select('title_en, release_year')
    .eq('is_published', true);

  const titleYearCounts = new Map<string, number>();
  for (const movie of allMovies || []) {
    if (movie.title_en && movie.release_year) {
      const canonical = movie.title_en.toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `${canonical}|${movie.release_year}`;
      titleYearCounts.set(key, (titleYearCounts.get(key) || 0) + 1);
    }
  }
  const duplicateCount = Array.from(titleYearCounts.values()).filter(c => c > 1).length;

  // By year
  const { data: yearData } = await supabase
    .from('movies')
    .select('release_year, tmdb_id')
    .eq('is_published', true);

  const byYear: Record<number, { indexed: number; enriched: number }> = {};
  for (const movie of yearData || []) {
    if (movie.release_year) {
      if (!byYear[movie.release_year]) {
        byYear[movie.release_year] = { indexed: 0, enriched: 0 };
      }
      byYear[movie.release_year].indexed++;
      if (movie.tmdb_id) {
        byYear[movie.release_year].enriched++;
      }
    }
  }

  // By decade
  const byDecade: Record<string, number> = {};
  for (const [year, data] of Object.entries(byYear)) {
    const decade = `${Math.floor(parseInt(year) / 10) * 10}s`;
    byDecade[decade] = (byDecade[decade] || 0) + data.indexed;
  }

  // TMDB estimate (typical Telugu movie count)
  const tmdbEstimate = 2000;

  return {
    totalIndexed: totalIndexed || 0,
    tmdbEstimate,
    indexCoverage: totalIndexed ? (totalIndexed / tmdbEstimate) * 100 : 0,
    
    valid: valid || 0,
    needsReview: needsReview || 0,
    rejected: rejected || 0,
    pending: pending || 0,
    
    withPoster: withPoster || 0,
    withBackdrop: withBackdrop || 0,
    withDirector: withDirector || 0,
    withCast3Plus: withCast3Plus || 0,
    withCast5Plus: withCast5Plus || 0,
    withGenres: withGenres || 0,
    avgQualityScore,
    
    totalMoviesTable: totalMoviesTable || 0,
    withReviews: withReviews || 0,
    reviewCoverage: totalMoviesTable ? ((withReviews || 0) / totalMoviesTable) * 100 : 0,
    
    duplicateCount,
    byYear,
    byDecade,
  };
}

// ============================================================
// DISPLAY
// ============================================================

function displayMetrics(metrics: CoverageMetrics, detailed: boolean): void {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║             TELUGU MOVIE COVERAGE REPORT                      ║
╚══════════════════════════════════════════════════════════════╝
`));

  // Index coverage
  console.log(chalk.bold('📊 INDEX COVERAGE'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`  Total Indexed:         ${chalk.cyan(metrics.totalIndexed)}`);
  console.log(`  TMDB Estimate:         ~${metrics.tmdbEstimate}`);
  console.log(`  Index Coverage:        ${formatPercent(metrics.indexCoverage)}`);
  
  const coverageBar = createBar(metrics.indexCoverage, 50);
  console.log(`  ${coverageBar}`);

  // Validation status
  console.log(chalk.bold('\n📋 VALIDATION STATUS'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`  Valid:                 ${chalk.green(metrics.valid)} (${formatPercent(pct(metrics.valid, metrics.totalIndexed))})`);
  console.log(`  Needs Review:          ${chalk.yellow(metrics.needsReview)} (${formatPercent(pct(metrics.needsReview, metrics.totalIndexed))})`);
  console.log(`  Rejected:              ${chalk.red(metrics.rejected)} (${formatPercent(pct(metrics.rejected, metrics.totalIndexed))})`);
  console.log(`  Pending:               ${chalk.gray(metrics.pending)} (${formatPercent(pct(metrics.pending, metrics.totalIndexed))})`);

  // Data quality
  console.log(chalk.bold('\n📷 DATA QUALITY'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`  With Poster:           ${metrics.withPoster} (${formatPercent(pct(metrics.withPoster, metrics.totalIndexed))})`);
  console.log(`  With Backdrop:         ${metrics.withBackdrop} (${formatPercent(pct(metrics.withBackdrop, metrics.totalIndexed))})`);
  console.log(`  With Director:         ${metrics.withDirector} (${formatPercent(pct(metrics.withDirector, metrics.totalIndexed))})`);
  console.log(`  With 3+ Cast:          ${metrics.withCast3Plus} (${formatPercent(pct(metrics.withCast3Plus, metrics.totalIndexed))})`);
  console.log(`  With 5+ Cast:          ${metrics.withCast5Plus} (${formatPercent(pct(metrics.withCast5Plus, metrics.totalIndexed))})`);
  console.log(`  Avg Quality Score:     ${formatPercent(metrics.avgQualityScore * 100)}`);

  // Reviews coverage
  console.log(chalk.bold('\n📝 REVIEW COVERAGE'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`  Movies in Table:       ${metrics.totalMoviesTable}`);
  console.log(`  With Reviews:          ${metrics.withReviews}`);
  console.log(`  Review Coverage:       ${formatPercent(metrics.reviewCoverage)}`);
  
  const reviewBar = createBar(metrics.reviewCoverage, 50);
  console.log(`  ${reviewBar}`);

  // Duplicates
  console.log(chalk.bold('\n🔍 DUPLICATES'));
  console.log(chalk.gray('─'.repeat(60)));
  if (metrics.duplicateCount === 0) {
    console.log(`  ${chalk.green('✅ No duplicates found')}`);
  } else {
    console.log(`  ${chalk.red(`⚠️ ${metrics.duplicateCount} duplicate sets detected`)}`);
    console.log(chalk.gray('  Run: pnpm intel:movie-audit --duplicates'));
  }

  // By decade
  if (detailed) {
    console.log(chalk.bold('\n📅 BY DECADE'));
    console.log(chalk.gray('─'.repeat(60)));
    
    const sortedDecades = Object.entries(metrics.byDecade)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10);

    const maxDecade = Math.max(...sortedDecades.map(([, v]) => v), 1);
    
    for (const [decade, count] of sortedDecades) {
      const bar = '█'.repeat(Math.round((count / maxDecade) * 30));
      console.log(`  ${decade.padEnd(6)} ${chalk.blue(bar)} ${count}`);
    }
  }

  // Success summary
  console.log(chalk.bold('\n🎯 SUCCESS METRICS'));
  console.log(chalk.gray('─'.repeat(60)));

  const goals = [
    { name: 'Index Coverage ≥90%', value: metrics.indexCoverage >= 90, actual: metrics.indexCoverage },
    { name: 'Valid Movies ≥80%', value: pct(metrics.valid, metrics.totalIndexed) >= 80, actual: pct(metrics.valid, metrics.totalIndexed) },
    { name: 'With Director ≥70%', value: pct(metrics.withDirector, metrics.totalIndexed) >= 70, actual: pct(metrics.withDirector, metrics.totalIndexed) },
    { name: 'With Cast 3+ ≥60%', value: pct(metrics.withCast3Plus, metrics.totalIndexed) >= 60, actual: pct(metrics.withCast3Plus, metrics.totalIndexed) },
    { name: 'Review Coverage ≥95%', value: metrics.reviewCoverage >= 95, actual: metrics.reviewCoverage },
    { name: 'Duplicates = 0', value: metrics.duplicateCount === 0, actual: metrics.duplicateCount },
  ];

  for (const goal of goals) {
    const icon = goal.value ? chalk.green('✅') : chalk.red('❌');
    const actual = goal.name.includes('Duplicates') 
      ? goal.actual.toString()
      : formatPercent(goal.actual as number);
    console.log(`  ${icon} ${goal.name.padEnd(25)} ${actual}`);
  }

  const passedGoals = goals.filter(g => g.value).length;
  console.log(chalk.bold(`\n  Overall: ${passedGoals}/${goals.length} goals met`));

  if (passedGoals === goals.length) {
    console.log(chalk.green.bold('\n🎉 All success metrics achieved!'));
  } else {
    console.log(chalk.yellow('\n📋 NEXT STEPS:'));
    if (metrics.indexCoverage < 90) {
      console.log(chalk.gray('  pnpm ingest:tmdb:telugu       # Increase index coverage'));
    }
    if (pct(metrics.valid, metrics.totalIndexed) < 80) {
      console.log(chalk.gray('  pnpm intel:validate:movies    # Validate pending movies'));
    }
    if (pct(metrics.withDirector, metrics.totalIndexed) < 70 || pct(metrics.withCast3Plus, metrics.totalIndexed) < 60) {
      console.log(chalk.gray('  pnpm ingest:movies:smart      # Enrich with credits'));
    }
    if (metrics.reviewCoverage < 95) {
      console.log(chalk.gray('  pnpm reviews:coverage         # Generate reviews'));
    }
    if (metrics.duplicateCount > 0) {
      console.log(chalk.gray('  pnpm intel:movie-audit --fix  # Fix duplicates'));
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

function pct(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0;
}

function formatPercent(value: number): string {
  const formatted = value.toFixed(1) + '%';
  if (value >= 90) return chalk.green(formatted);
  if (value >= 70) return chalk.yellow(formatted);
  return chalk.red(formatted);
}

function createBar(percent: number, width: number): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  if (percent >= 90) return chalk.green(bar);
  if (percent >= 70) return chalk.yellow(bar);
  return chalk.red(bar);
}

// ============================================================
// CLI
// ============================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const detailed = args.includes('--full') || args.includes('--detailed');

  try {
    const metrics = await collectMetrics();
    displayMetrics(metrics, detailed);
  } catch (error: any) {
    console.error(chalk.red('Failed to collect metrics:'), error.message);
    
    if (error.message.includes('telugu_movie_index')) {
      console.log(chalk.yellow('\nRun the schema migrations first:'));
      console.log(chalk.gray('  psql -f supabase-telugu-movie-index.sql'));
    }
    
    process.exit(1);
  }
}

main();

