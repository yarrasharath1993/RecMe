#!/usr/bin/env npx tsx
/**
 * BOX OFFICE RATING AUDIT & APPLICATION
 * 
 * Audits and applies ratings based on box office categories with proper weightages.
 * Uses the established boost system for different box office performance tiers.
 * 
 * Box Office Category Weightages:
 * - industry-hit:   +1.0 boost
 * - blockbuster:    +0.7 boost
 * - super-hit:      +0.5 boost
 * - hit:            +0.3 boost
 * - average:        +0.0 (no boost)
 * - below-average:  -0.2 penalty
 * - disaster:       -0.5 penalty
 * 
 * Rating Calculation:
 * Base rating = weighted average of:
 *   - Story score (25%)
 *   - Direction score (25%)
 *   - Performance scores (20%)
 *   - TMDB rating (20%)
 *   - Existing review scores (10%)
 * 
 * Final rating = Base rating + Box office boost/penalty
 * 
 * Usage:
 *   npx tsx scripts/audit-apply-box-office-ratings.ts --audit
 *   npx tsx scripts/audit-apply-box-office-ratings.ts --apply --execute
 *   npx tsx scripts/audit-apply-box-office-ratings.ts --category=blockbuster --execute
 *   npx tsx scripts/audit-apply-box-office-ratings.ts --slug=pokiri-2006 --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const args = process.argv.slice(2);
const getArg = (name: string): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : '';
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const AUDIT = hasFlag('audit');
const APPLY = hasFlag('apply');
const EXECUTE = hasFlag('execute');
const CATEGORY = getArg('category');
const SLUG = getArg('slug');
const LIMIT = parseInt(getArg('limit') || '1000');

// ============================================================================
// BOX OFFICE WEIGHTAGES
// ============================================================================

const BOX_OFFICE_WEIGHTS: Record<string, { boost: number; label: string; color: string }> = {
  'industry-hit': { boost: 1.0, label: 'Industry Hit', color: 'magenta' },
  'blockbuster': { boost: 0.7, label: 'Blockbuster', color: 'green' },
  'super-hit': { boost: 0.5, label: 'Super Hit', color: 'cyan' },
  'hit': { boost: 0.3, label: 'Hit', color: 'blue' },
  'average': { boost: 0.0, label: 'Average', color: 'yellow' },
  'below-average': { boost: -0.2, label: 'Below Average', color: 'orange' },
  'disaster': { boost: -0.5, label: 'Disaster', color: 'red' },
};

interface Movie {
  id: string;
  slug: string;
  title_en: string;
  title_te?: string;
  release_year: number;
  our_rating: number;
  avg_rating: number;
  box_office_category: string | null;
  genres: string[];
  is_blockbuster: boolean;
  is_classic: boolean;
  is_underrated: boolean;
}

interface ReviewData {
  id: string;
  dimensions_json: any;
  overall_rating: number;
}

// ============================================================================
// RATING CALCULATION WITH BOX OFFICE WEIGHTAGE
// ============================================================================

function calculateRatingWithBoxOffice(
  movie: Movie,
  review: ReviewData | null
): {
  baseRating: number;
  boxOfficeBoost: number;
  finalRating: number;
  breakdown: string;
  shouldUpdate: boolean;
  difference: number;
} {
  const dims = review?.dimensions_json || {};
  
  // Extract component scores
  const storyScore = dims.story_screenplay?.story_score || 
                     dims.story_screenplay?.originality_score || 0;
  const directionScore = dims.direction_technicals?.direction_score || 0;
  const perfScores = (dims.performances?.lead_actors || [])
    .map((a: any) => a.score)
    .filter((s: number) => s > 0);
  const avgPerf = perfScores.length > 0
    ? perfScores.reduce((a: number, b: number) => a + b, 0) / perfScores.length
    : 0;
  
  // Collect scores with weights
  const scores: number[] = [];
  const weights: number[] = [];
  
  if (storyScore > 0) {
    scores.push(storyScore);
    weights.push(0.25);
  }
  
  if (directionScore > 0) {
    scores.push(directionScore);
    weights.push(0.25);
  }
  
  if (avgPerf > 0) {
    scores.push(avgPerf);
    weights.push(0.20);
  }
  
  // TMDB/Average rating (capped at 8.5 for reliability)
  if (movie.avg_rating > 0) {
    const cappedAvg = Math.min(movie.avg_rating, 8.5);
    scores.push(cappedAvg);
    weights.push(0.20);
  }
  
  // Existing review overall rating (if reliable)
  if (review?.overall_rating > 0 && review.overall_rating <= 10) {
    scores.push(review.overall_rating);
    weights.push(0.10);
  }
  
  // Calculate base rating
  let baseRating = 6.0; // Default fallback
  if (scores.length > 0) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    baseRating = 0;
    for (let i = 0; i < scores.length; i++) {
      baseRating += scores[i] * (weights[i] / totalWeight);
    }
  }
  
  // Apply box office boost/penalty
  const boxOfficeBoost = movie.box_office_category
    ? BOX_OFFICE_WEIGHTS[movie.box_office_category]?.boost || 0
    : 0;
  
  let finalRating = baseRating + boxOfficeBoost;
  
  // Clamp between 1.0 and 10.0
  finalRating = Math.max(1.0, Math.min(10.0, finalRating));
  finalRating = Math.round(finalRating * 10) / 10;
  
  const currentRating = movie.our_rating || movie.avg_rating || 0;
  const difference = Math.abs(finalRating - currentRating);
  const shouldUpdate = difference >= 0.3; // Update if difference is significant
  
  const breakdown = `Base: ${baseRating.toFixed(1)} + Box Office (${movie.box_office_category}): ${boxOfficeBoost >= 0 ? '+' : ''}${boxOfficeBoost.toFixed(1)} = ${finalRating.toFixed(1)}`;
  
  return {
    baseRating: Math.round(baseRating * 10) / 10,
    boxOfficeBoost,
    finalRating,
    breakdown,
    shouldUpdate,
    difference: Math.round(difference * 10) / 10,
  };
}

// ============================================================================
// AUDIT FUNCTION
// ============================================================================

async function auditBoxOfficeRatings(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           BOX OFFICE RATING AUDIT                                    ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  // Build query - only process released movies
  let query = supabase
    .from('movies')
    .select(`
      id,
      slug,
      title_en,
      title_te,
      release_year,
      our_rating,
      avg_rating,
      release_date,
      
      box_office_category,
      genres,
      is_blockbuster,
      is_classic,
      is_underrated
    `)
    .not('box_office_category', 'is', null)
    // Skip unreleased movies
    .not('release_year', 'is', null)
    .lte('release_year', new Date().getFullYear())
    .order('release_year', { ascending: false });

  if (CATEGORY) {
    query = query.eq('box_office_category', CATEGORY);
  }

  if (SLUG) {
    query = query.eq('slug', SLUG);
  }

  if (!SLUG) {
    query = query.limit(LIMIT);
  }

  const { data: movies, error } = await query;

  if (error) {
    console.log(chalk.red(`Error fetching movies: ${error.message}`));
    return;
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('No movies found with box office categories.'));
    return;
  }

  console.log(`Found ${chalk.cyan(movies.length)} movies with box office categories\n`);

  // Fetch reviews for these movies
  const movieIds = movies.map(m => m.id);
  const { data: reviews } = await supabase
    .from('movie_reviews')
    .select('id, movie_id, dimensions_json, overall_rating')
    .in('movie_id', movieIds);

  const reviewsByMovieId = new Map<string, ReviewData>();
  (reviews || []).forEach(r => {
    reviewsByMovieId.set(r.movie_id, r);
  });

  // Analyze each movie
  const results: Array<{
    movie: Movie;
    calculation: ReturnType<typeof calculateRatingWithBoxOffice>;
  }> = [];

  for (const movie of movies as Movie[]) {
    const review = reviewsByMovieId.get(movie.id) || null;
    const calculation = calculateRatingWithBoxOffice(movie, review);
    
    if (calculation.shouldUpdate || SLUG) {
      results.push({ movie, calculation });
    }
  }

  // Group by box office category
  const byCategory: Record<string, typeof results> = {};
  results.forEach(r => {
    const cat = r.movie.box_office_category || 'unknown';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(r);
  });

  // Print summary
  console.log(chalk.bold('═══ SUMMARY BY BOX OFFICE CATEGORY ═══\n'));
  
  Object.keys(BOX_OFFICE_WEIGHTS).forEach(category => {
    const items = byCategory[category] || [];
    if (items.length === 0) return;
    
    const weight = BOX_OFFICE_WEIGHTS[category];
    const colorFn = (chalk as any)[weight.color] || chalk.white;
    
    console.log(colorFn.bold(`${weight.label} (boost: ${weight.boost >= 0 ? '+' : ''}${weight.boost})`));
    console.log(colorFn(`  Movies: ${items.length}`));
    console.log(colorFn(`  Average difference: ${(items.reduce((sum, i) => sum + i.calculation.difference, 0) / items.length).toFixed(2)}\n`));
  });

  // Print detailed results
  console.log(chalk.bold('\n═══ DETAILED RESULTS (Top 50) ═══\n'));
  
  results
    .sort((a, b) => b.calculation.difference - a.calculation.difference)
    .slice(0, 50)
    .forEach((result, index) => {
      const { movie, calculation } = result;
      const weight = BOX_OFFICE_WEIGHTS[movie.box_office_category!];
      const colorFn = (chalk as any)[weight.color] || chalk.white;
      
      console.log(`${index + 1}. ${chalk.bold(movie.title_en)} (${movie.release_year})`);
      console.log(`   Category: ${colorFn(weight.label)} (boost: ${weight.boost >= 0 ? '+' : ''}${weight.boost})`);
      console.log(`   Current: ${movie.our_rating || movie.avg_rating || 'N/A'} → Calculated: ${chalk.bold(calculation.finalRating)}`);
      console.log(`   Difference: ${calculation.difference >= 0.5 ? chalk.red(calculation.difference) : chalk.yellow(calculation.difference)}`);
      console.log(`   ${chalk.gray(calculation.breakdown)}`);
      console.log(`   Slug: ${chalk.dim(movie.slug)}`);
      console.log('');
    });

  if (results.length > 50) {
    console.log(chalk.gray(`... and ${results.length - 50} more movies\n`));
  }

  console.log(chalk.bold(`\nTotal movies needing update: ${chalk.cyan(results.length)}`));
}

// ============================================================================
// APPLY FUNCTION
// ============================================================================

async function applyBoxOfficeRatings(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           APPLY BOX OFFICE RATINGS                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  // Build query
  let query = supabase
    .from('movies')
    .select(`
      id,
      slug,
      title_en,
      title_te,
      release_year,
      our_rating,
      avg_rating,
      
      
      box_office_category,
      genres,
      is_blockbuster,
      is_classic,
      is_underrated
    `)
    .not('box_office_category', 'is', null)
    .order('release_year', { ascending: false });

  if (CATEGORY) {
    query = query.eq('box_office_category', CATEGORY);
  }

  if (SLUG) {
    query = query.eq('slug', SLUG);
  }

  if (!SLUG) {
    query = query.limit(LIMIT);
  }

  const { data: movies, error } = await query;

  if (error) {
    console.log(chalk.red(`Error fetching movies: ${error.message}`));
    return;
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('No movies found with box office categories.'));
    return;
  }

  console.log(`Processing ${chalk.cyan(movies.length)} movies...\n`);

  // Fetch reviews
  const movieIds = movies.map(m => m.id);
  const { data: reviews } = await supabase
    .from('movie_reviews')
    .select('id, movie_id, dimensions_json, overall_rating')
    .in('movie_id', movieIds);

  const reviewsByMovieId = new Map<string, ReviewData>();
  (reviews || []).forEach(r => {
    reviewsByMovieId.set(r.movie_id, r);
  });

  let updated = 0;
  let skipped = 0;

  for (const movie of movies as Movie[]) {
    const review = reviewsByMovieId.get(movie.id) || null;
    const calculation = calculateRatingWithBoxOffice(movie, review);
    
    if (!calculation.shouldUpdate && !SLUG) {
      skipped++;
      continue;
    }

    const weight = BOX_OFFICE_WEIGHTS[movie.box_office_category!];
    const colorFn = (chalk as any)[weight.color] || chalk.white;

    console.log(`${colorFn('●')} ${movie.title_en} (${movie.release_year})`);
    console.log(`  Category: ${colorFn(weight.label)} | ${calculation.breakdown}`);
    console.log(`  Update: ${movie.our_rating || movie.avg_rating} → ${chalk.bold(calculation.finalRating)}`);

    if (EXECUTE) {
      // Update movie rating
      const { error: movieError } = await supabase
        .from('movies')
        .update({ our_rating: calculation.finalRating })
        .eq('id', movie.id);

      if (movieError) {
        console.log(chalk.red(`  ✗ Error updating movie: ${movieError.message}`));
        continue;
      }

      // Update review if exists
      if (review) {
        const { error: reviewError } = await supabase
          .from('movie_reviews')
          .update({ overall_rating: calculation.finalRating })
          .eq('id', review.id);

        if (reviewError) {
          console.log(chalk.yellow(`  ⚠ Error updating review: ${reviewError.message}`));
        }
      }

      console.log(chalk.green(`  ✓ Updated successfully`));
      updated++;
    } else {
      console.log(chalk.yellow(`  ○ Would update (use --execute to apply)`));
    }

    console.log('');
  }

  console.log(chalk.bold('\n═══ SUMMARY ═══'));
  console.log(`Updated: ${chalk.green(updated)}`);
  console.log(`Skipped: ${chalk.gray(skipped)}`);
  console.log(`Total: ${movies.length}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  if (!AUDIT && !APPLY) {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           BOX OFFICE RATING SYSTEM                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(chalk.bold('Box Office Weightages:\n'));
    Object.entries(BOX_OFFICE_WEIGHTS).forEach(([key, value]) => {
      const colorFn = (chalk as any)[value.color] || chalk.white;
      console.log(colorFn(`  ${value.label.padEnd(20)} ${value.boost >= 0 ? '+' : ''}${value.boost.toFixed(1)}`));
    });

    console.log(chalk.bold('\n\nUsage:\n'));
    console.log('  --audit                      Audit all movies with box office categories');
    console.log('  --apply                      Apply calculated ratings');
    console.log('  --execute                    Execute updates (default is dry run)');
    console.log('  --category=<category>        Filter by specific category');
    console.log('  --slug=<slug>                Process a single movie');
    console.log('  --limit=<number>             Limit number of movies (default: 1000)');
    console.log(chalk.bold('\n\nExamples:\n'));
    console.log('  npx tsx scripts/audit-apply-box-office-ratings.ts --audit');
    console.log('  npx tsx scripts/audit-apply-box-office-ratings.ts --apply --execute');
    console.log('  npx tsx scripts/audit-apply-box-office-ratings.ts --category=blockbuster --apply --execute');
    console.log('  npx tsx scripts/audit-apply-box-office-ratings.ts --slug=pokiri-2006 --apply --execute');
    console.log('');
    return;
  }

  if (AUDIT) {
    await auditBoxOfficeRatings();
  } else if (APPLY) {
    await applyBoxOfficeRatings();
  }

  if (!EXECUTE && APPLY) {
    console.log(chalk.yellow(`\n⚠️  DRY RUN - Use --execute to apply changes`));
  }
}

main().catch(console.error);
