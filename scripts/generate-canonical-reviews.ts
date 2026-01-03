#!/usr/bin/env npx tsx
/**
 * Canonical Review Generator
 * 
 * Phase 5: Template-driven movie reviews
 * 
 * Rules:
 * - Reviews are TEMPLATE-FIRST, AI only as enhancer
 * - One movie → one canonical review
 * - Reviews auto-evolve when new data appears
 * 
 * Uses:
 * - Genre
 * - Cast weight
 * - Director history
 * - Similar movie ratings
 * - Audience sentiment (if available)
 * 
 * Usage:
 *   pnpm reviews:generate             # Generate for movies without reviews
 *   pnpm reviews:generate --dry       # Preview mode
 *   pnpm reviews:generate --canonical # Only generate canonical reviews
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import { generateTemplateReview, type TemplateReview } from '../lib/reviews/template-reviews';
import type { Movie, DIMENSION_DEFINITIONS } from '../lib/reviews/coverage-engine';

// ============================================================
// TYPES
// ============================================================

interface GenerationStats {
  total: number;
  generated: number;
  skipped: number;
  errors: string[];
  byGenre: Record<string, number>;
  avgConfidence: number;
}

interface CLIArgs {
  dryRun: boolean;
  canonical: boolean;
  limit?: number;
  verbose: boolean;
  force: boolean;
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
// REVIEW LOGIC
// ============================================================

/**
 * Get movies that need reviews
 */
async function getMoviesNeedingReviews(
  supabase: ReturnType<typeof getSupabaseClient>,
  options: { limit: number; force: boolean }
): Promise<Movie[]> {
  // Get all movies
  const { data: movies, error} = await supabase
    .from('movies')
    .select('*')
    .eq('is_published', true)
    .order('release_year', { ascending: false })
    .limit(options.limit);

  if (error || !movies) {
    console.error('Failed to fetch movies:', error?.message);
    return [];
  }

  if (options.force) {
    return movies as Movie[];
  }

  // Get movies that already have reviews
  const { data: existingReviews } = await supabase
    .from('movie_reviews')
    .select('movie_id');

  const reviewedIds = new Set(existingReviews?.map(r => r.movie_id) || []);

  return movies.filter(m => !reviewedIds.has(m.id)) as Movie[];
}

/**
 * Save generated review to database
 */
async function saveReview(
  supabase: ReturnType<typeof getSupabaseClient>,
  review: TemplateReview
): Promise<{ success: boolean; error?: string }> {
  const reviewData = {
    movie_id: review.movie_id,
    reviewer_name: 'TeluguVibes Template Engine',
    overall_rating: review.overall_score,
    verdict: review.verdict,
    verdict_te: review.verdict_te,
    one_liner_te: review.one_liner_te,
    one_liner_en: review.one_liner_en,
    summary: review.one_liner_en, // Using one-liner as summary
    status: 'published',
    is_ai_generated: false,
    needs_human_review: review.confidence < 0.7,
    confidence: review.confidence,
    generated_at: new Date().toISOString(),
    // Store dimensions as JSONB
    dimensions_json: review.dimensions,
    strengths: review.strengths,
    weaknesses: review.weaknesses,
    target_audience: review.target_audience,
  };

  const { error } = await supabase
    .from('movie_reviews')
    .upsert(reviewData, { 
      onConflict: 'movie_id',
      ignoreDuplicates: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update movie with our rating from review
 */
async function updateMovieRating(
  supabase: ReturnType<typeof getSupabaseClient>,
  movieId: string,
  rating: number
): Promise<void> {
  await supabase
    .from('movies')
    .update({ our_rating: rating })
    .eq('id', movieId);
}

// ============================================================
// CLI
// ============================================================

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry') || args.includes('--dry-run'),
    canonical: args.includes('--canonical'),
    force: args.includes('--force'),
    verbose: args.includes('-v') || args.includes('--verbose'),
    limit: args.find(a => a.startsWith('--limit='))
      ? parseInt(args.find(a => a.startsWith('--limit='))!.split('=')[1])
      : undefined,
  };
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const args = parseArgs();
  const supabase = getSupabaseClient();

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║          CANONICAL REVIEW GENERATOR - PHASE 5                 ║
╚══════════════════════════════════════════════════════════════╝
`));

  if (args.dryRun) {
    console.log(chalk.yellow.bold('🔍 DRY RUN MODE\n'));
  }

  if (args.canonical) {
    console.log(chalk.blue('📝 CANONICAL MODE - Generating definitive reviews\n'));
  }

  // Get movies needing reviews
  const movies = await getMoviesNeedingReviews(supabase, {
    limit: args.limit || 100,
    force: args.force,
  });

  if (movies.length === 0) {
    console.log(chalk.green('✅ All movies have reviews'));
    process.exit(0);
  }

  console.log(chalk.cyan(`📋 Generating reviews for ${movies.length} movies...\n`));

  const stats: GenerationStats = {
    total: movies.length,
    generated: 0,
    skipped: 0,
    errors: [],
    byGenre: {},
    avgConfidence: 0,
  };

  let totalConfidence = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];

    if (args.verbose) {
      console.log(`  [${i + 1}/${movies.length}] ${movie.title_en}`);
    }

    try {
      // Generate review using template
      const review = generateTemplateReview(movie);

      if (!review) {
        stats.skipped++;
        continue;
      }

      stats.generated++;
      totalConfidence += review.confidence;

      // Track by genre
      const genre = movie.genres?.[0] || 'Unknown';
      stats.byGenre[genre] = (stats.byGenre[genre] || 0) + 1;

      if (args.verbose) {
        console.log(chalk.gray(`    Verdict: ${review.verdict_te} (${review.overall_score}/10)`));
        console.log(chalk.gray(`    Confidence: ${(review.confidence * 100).toFixed(0)}%`));
      }

      if (args.dryRun) {
        continue;
      }

      // Save review
      const result = await saveReview(supabase, review);

      if (result.error) {
        stats.errors.push(`${movie.title_en}: ${result.error}`);
      } else {
        // Update movie with our rating
        await updateMovieRating(supabase, movie.id, review.overall_score);
      }

    } catch (error: any) {
      stats.errors.push(`${movie.title_en}: ${error.message}`);
    }

    // Progress
    if (i > 0 && i % 25 === 0) {
      console.log(`  Progress: ${i}/${movies.length} (${stats.generated} generated)`);
    }
  }

  stats.avgConfidence = stats.generated > 0 ? totalConfidence / stats.generated : 0;

  // Results
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.bold('📊 GENERATION RESULTS'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  console.log(`  Total Movies:      ${stats.total}`);
  console.log(`  Reviews Generated: ${chalk.green(stats.generated)}`);
  console.log(`  Skipped:           ${chalk.yellow(stats.skipped)}`);
  console.log(`  Avg Confidence:    ${(stats.avgConfidence * 100).toFixed(1)}%`);
  console.log(`  Errors:            ${chalk.red(stats.errors.length)}`);

  // By genre
  if (Object.keys(stats.byGenre).length > 0) {
    console.log(chalk.bold('\n📊 BY GENRE'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const sortedGenres = Object.entries(stats.byGenre)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    for (const [genre, count] of sortedGenres) {
      const bar = '█'.repeat(Math.min(count, 30));
      console.log(`  ${genre.padEnd(15)} ${chalk.blue(bar)} ${count}`);
    }
  }

  if (stats.errors.length > 0) {
    console.log(chalk.yellow('\n⚠️ Errors:'));
    for (const error of stats.errors.slice(0, 5)) {
      console.log(chalk.yellow(`  - ${error}`));
    }
  }

  // Coverage update
  if (!args.dryRun) {
    console.log(chalk.bold('\n📈 COVERAGE UPDATE'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const { count: totalMovies } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    const { count: totalReviews } = await supabase
      .from('movie_reviews')
      .select('*', { count: 'exact', head: true });

    const coverage = totalMovies ? ((totalReviews || 0) / totalMovies * 100).toFixed(1) : 0;
    console.log(`  Total Movies:  ${totalMovies || 0}`);
    console.log(`  Total Reviews: ${totalReviews || 0}`);
    console.log(`  Coverage:      ${coverage}%`);
  }

  console.log(chalk.green('\n✅ Review generation complete\n'));
}

main().catch(console.error);

