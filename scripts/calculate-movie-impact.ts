#!/usr/bin/env npx tsx
/**
 * MOVIE IMPACT CALCULATION BATCH JOB
 * 
 * Calculates comprehensive impact analysis for significant movies and stores
 * in movies.impact_analysis JSONB field.
 * 
 * Target: Movies with rating > 7 OR is_blockbuster OR is_classic
 * 
 * Usage:
 *   npx tsx scripts/calculate-movie-impact.ts --limit=500 --execute
 *   npx tsx scripts/calculate-movie-impact.ts --top-only --execute   # Top 100 movies only
 *   npx tsx scripts/calculate-movie-impact.ts --slug=baahubali --execute
 *   npx tsx scripts/calculate-movie-impact.ts --recalculate --execute # Recalc existing
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { MovieImpactAnalyzer, type MovieImpactAnalysis } from '../lib/movies/impact-analyzer';

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
const LIMIT = parseInt(getArg('limit', '500'));
const TOP_ONLY = hasFlag('top-only'); // Top 100 movies only
const SLUG = getArg('slug', '');
const RECALCULATE = hasFlag('recalculate'); // Recalculate even if already exists
const DRY_RUN = hasFlag('dry-run');

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(chalk.blue.bold('\n🎬 MOVIE IMPACT CALCULATION BATCH JOB\n'));
  
  if (!EXECUTE && !DRY_RUN) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  // Add impact_analysis column if not exists
  if (EXECUTE) {
    await ensureImpactAnalysisColumn();
  }
  
  // Get target movies
  const movies = await getTargetMovies();
  
  if (!movies || movies.length === 0) {
    console.log(chalk.red('✗ No movies found matching criteria'));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${movies.length} movies to process\n`));
  
  // Calculate impact for each movie
  const analyzer = new MovieImpactAnalyzer();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    landmark: 0,
    influential: 0,
    notable: 0,
    standard: 0,
  };
  
  for (const movie of movies) {
    results.processed++;
    
    console.log(chalk.cyan(`\n[${results.processed}/${movies.length}] Processing: ${movie.title_en} (${movie.release_year})`));
    
    try {
      // Skip if already has analysis (unless recalculate flag)
      if (movie.impact_analysis && !RECALCULATE) {
        console.log(chalk.gray('  ⊳ Already has impact analysis, skipping (use --recalculate to force)'));
        results.skipped++;
        continue;
      }
      
      // Calculate impact
      const impact = await analyzer.analyzeMovieImpact(movie.id, {
        includeCareer: true,
        includeIndustry: true,
        includeBoxOffice: true,
        includeInfluence: true,
      });
      
      if (!impact) {
        console.log(chalk.red('  ✗ Failed to calculate impact'));
        results.failed++;
        continue;
      }
      
      // Display results
      displayImpactSummary(impact);
      
      // Track significance
      results[impact.significance_tier]++;
      
      // Store in database
      if (EXECUTE) {
        const { error } = await supabase
          .from('movies')
          .update({
            impact_analysis: impact as any,
          })
          .eq('id', movie.id);
        
        if (error) {
          console.log(chalk.red(`  ✗ Failed to save: ${error.message}`));
          results.failed++;
        } else {
          console.log(chalk.green('  ✓ Saved to database'));
          results.succeeded++;
        }
      } else {
        console.log(chalk.yellow('  ⊳ DRY RUN - Not saving to database'));
        results.succeeded++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(chalk.red(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      results.failed++;
    }
  }
  
  // Print summary
  printSummary(results, movies.length);
}

// ============================================================
// HELPERS
// ============================================================

async function ensureImpactAnalysisColumn() {
  console.log(chalk.blue('Ensuring impact_analysis column exists...'));
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE movies ADD COLUMN IF NOT EXISTS impact_analysis JSONB DEFAULT NULL;'
  } as any);
  
  if (error) {
    console.log(chalk.yellow(`Note: Could not ensure column (may already exist): ${error.message}`));
  } else {
    console.log(chalk.green('✓ Column ready\n'));
  }
}

async function getTargetMovies() {
  let query = supabase
    .from('movies')
    .select('id, title_en, title_te, slug, release_year, our_rating, avg_rating, is_blockbuster, is_classic, impact_analysis, hero, director, heroine, genres')
    .eq('is_published', true)
    .not('release_year', 'is', null);
  
  if (SLUG) {
    // Single movie by slug
    query = query.eq('slug', SLUG);
  } else if (TOP_ONLY) {
    // Top 100 movies
    query = query
      .or('our_rating.gte.7,avg_rating.gte.7,is_blockbuster.eq.true,is_classic.eq.true')
      .order('our_rating', { ascending: false, nullsFirst: false })
      .limit(100);
  } else {
    // All significant movies
    query = query
      .or('our_rating.gte.7,avg_rating.gte.7,is_blockbuster.eq.true,is_classic.eq.true')
      .order('our_rating', { ascending: false, nullsFirst: false })
      .limit(LIMIT);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.log(chalk.red(`Error fetching movies: ${error.message}`));
    return null;
  }
  
  return data;
}

function displayImpactSummary(impact: MovieImpactAnalysis) {
  console.log(chalk.gray(`  Significance: ${impact.significance_tier.toUpperCase()}`));
  console.log(chalk.gray(`  Confidence: ${Math.round(impact.confidence_score * 100)}%`));
  
  if (impact.career_impact.actors_launched.length > 0) {
    console.log(chalk.gray(`  Career Impact: ${impact.career_impact.actors_launched.length} actors launched/established`));
  }
  
  if (impact.industry_influence.inspired_movies.length > 0) {
    console.log(chalk.gray(`  Industry Influence: ${impact.industry_influence.inspired_movies.length} movies inspired`));
  }
  
  if (impact.influence_graph.franchise_spawned) {
    console.log(chalk.gray(`  Franchise: Spawned ${impact.influence_graph.sequels?.length || 0} sequels`));
  }
  
  if (Math.abs(impact.industry_influence.genre_shift.percentage_change) >= 20) {
    console.log(chalk.gray(`  Genre Impact: ${impact.industry_influence.genre_shift.primary_genre} ${impact.industry_influence.genre_shift.percentage_change > 0 ? '+' : ''}${impact.industry_influence.genre_shift.percentage_change}%`));
  }
}

function printSummary(results: any, total: number) {
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('BATCH JOB SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies:        ${total}`));
  console.log(chalk.white(`Processed:           ${results.processed}`));
  console.log(chalk.green(`Succeeded:           ${results.succeeded}`));
  console.log(chalk.yellow(`Skipped:             ${results.skipped}`));
  console.log(chalk.red(`Failed:              ${results.failed}`));
  
  console.log(chalk.gray('\nSignificance Distribution:'));
  console.log(chalk.magenta(`  Landmark Films:    ${results.landmark}`));
  console.log(chalk.blue(`  Influential:       ${results.influential}`));
  console.log(chalk.cyan(`  Notable:           ${results.notable}`));
  console.log(chalk.gray(`  Standard:          ${results.standard}`));
  
  const successRate = total > 0 ? Math.round((results.succeeded / total) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:        ${successRate}%`));
  
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
    console.log(chalk.green('✓ Batch job completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Batch job failed:'), error);
    process.exit(1);
  });
