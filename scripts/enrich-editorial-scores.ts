#!/usr/bin/env npx tsx
/**
 * EDITORIAL SCORE ENRICHMENT SCRIPT
 *
 * Generates editorial scores for movies that don't have external ratings.
 * Uses weighted combination of:
 * - Genre + Era baseline (30%)
 * - Director/Hero track record (40%)
 * - Metadata signals (30%)
 *
 * Usage:
 *   npx tsx scripts/enrich-editorial-scores.ts --limit=100
 *   npx tsx scripts/enrich-editorial-scores.ts --limit=500 --execute
 *   npx tsx scripts/enrich-editorial-scores.ts --unrated-only --execute
 *   npx tsx scripts/enrich-editorial-scores.ts --recalculate --execute  # Recalc all
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { runParallel, type Task } from '../lib/pipeline/execution-controller';
import { calculateEditorialScore, type EditorialScoreResult } from '../lib/reviews/editorial-score-engine';

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

const LIMIT = parseInt(getArg('limit', '100'));
const EXECUTE = hasFlag('execute');
const UNRATED_ONLY = hasFlag('unrated-only');
const RECALCULATE = hasFlag('recalculate');
const CONCURRENCY = parseInt(getArg('concurrency', '15'));
const MIN_CONFIDENCE = parseFloat(getArg('min-confidence', '0.5'));

interface Movie {
    id: string;
    title_en: string;
    release_year?: number;
    genres?: string[];
    director?: string;
    hero?: string;
    heroine?: string;
    avg_rating?: number;
    our_rating?: number;
    is_classic?: boolean;
    is_blockbuster?: boolean;
    is_underrated?: boolean;
}

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           EDITORIAL SCORE ENRICHMENT                                 ║
║     Weighted: Genre(30%) + Comparable(40%) + Metadata(30%)           ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
    console.log(`  Limit: ${LIMIT} movies`);
    console.log(`  Concurrency: ${CONCURRENCY}`);
    console.log(`  Min confidence: ${MIN_CONFIDENCE}`);

    // Build query - using existing schema column names only
    let query = supabase
        .from('movies')
        .select(`
            id, title_en, release_year, genres, director, hero, heroine,
            avg_rating, our_rating, is_classic, is_blockbuster, is_underrated
        `)
        .eq('language', 'Telugu');

    let filterDesc = '';

    if (UNRATED_ONLY) {
        // Movies with no ratings at all
        query = query.is('our_rating', null);
        filterDesc = 'Movies with no our_rating';
    } else if (RECALCULATE) {
        // All movies (for recalculation)
        filterDesc = 'All movies (recalculating)';
    } else {
        // Movies without our_rating
        query = query.is('our_rating', null);
        filterDesc = 'Movies without our_rating';
    }

    console.log(`  Filter: ${filterDesc}\n`);

    const { data: movies, error } = await query
        .order('release_year', { ascending: false })
        .limit(LIMIT);

    if (error) {
        console.error(chalk.red('Error fetching movies:'), error);
        return;
    }

    console.log(`  Found ${chalk.cyan(movies?.length || 0)} movies to process\n`);

    if (!movies || movies.length === 0) {
        console.log(chalk.green('  ✅ No movies need scoring.'));
        return;
    }

    // Create tasks for parallel execution
    const tasks: Task<{ movie: Movie; result: EditorialScoreResult }>[] = movies.map((movie) => ({
        id: movie.id,
        name: movie.title_en,
        execute: async () => {
            const result = await calculateEditorialScore(movie);
            return { movie, result };
        },
        retryable: true,
    }));

    // Stats
    let processed = 0;
    let scored = 0;
    let needsReview = 0;
    let updated = 0;

    const scoreDistribution = {
        excellent: 0,  // 8+
        good: 0,       // 7-8
        average: 0,    // 5-7
        below: 0,      // <5
    };

    console.log('  Processing...\n');

    const result = await runParallel(tasks, {
        concurrency: CONCURRENCY,
        maxRetries: 2,
        retryDelayMs: 300,
        onProgress: (completed, total) => {
            const pct = Math.round((completed / total) * 100);
            const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
            process.stdout.write(`\r  [${bar}] ${pct}% (${completed}/${total}) | Scored: ${scored}`);
        },
        onTaskComplete: (taskResult) => {
            if (taskResult.success && taskResult.result) {
                const { result: scoreResult } = taskResult.result;
                processed++;

                if (scoreResult.confidence >= MIN_CONFIDENCE) {
                    scored++;

                    if (scoreResult.score >= 8) scoreDistribution.excellent++;
                    else if (scoreResult.score >= 7) scoreDistribution.good++;
                    else if (scoreResult.score >= 5) scoreDistribution.average++;
                    else scoreDistribution.below++;
                }

                if (scoreResult.needs_review) {
                    needsReview++;
                }
            }
        },
    });

    console.log('\n\n');

    // Apply updates to database
    if (EXECUTE && scored > 0) {
        console.log('  Applying scores to database...\n');

        for (const taskResult of result.results) {
            if (!taskResult.success || !taskResult.result) continue;

            const { movie, result: scoreResult } = taskResult.result;

            if (scoreResult.confidence < MIN_CONFIDENCE) continue;

            const { error: updateError } = await supabase
                .from('movies')
                .update({
                    editorial_score: scoreResult.score,
                    editorial_score_breakdown: scoreResult.breakdown,
                    editorial_score_confidence: scoreResult.confidence,
                    rating_source: 'editorial_derived',
                })
                .eq('id', movie.id);

            if (!updateError) {
                updated++;
            }
        }

        console.log(`  Updated ${chalk.green(updated)} movies in database\n`);
    }

    // Show some samples
    console.log(chalk.cyan('  Sample Scores:\n'));

    const samples = result.results
        .filter((r) => r.success && r.result)
        .slice(0, 5);

    for (const sample of samples) {
        const { movie, result: scoreResult } = sample.result!;
        console.log(`  ${movie.title_en} (${movie.release_year})`);
        console.log(`    Score: ${chalk.yellow(scoreResult.score.toFixed(1))} | Confidence: ${(scoreResult.confidence * 100).toFixed(0)}%`);
        console.log(`    ${scoreResult.reasoning}`);
        console.log('');
    }

    // Summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
📊 SCORING SUMMARY
═══════════════════════════════════════════════════════════════════`));
    console.log(`  Processed:     ${movies.length} movies`);
    console.log(`  Scored:        ${chalk.green(scored)} movies`);
    console.log(`  Needs review:  ${needsReview} (low confidence)`);
    console.log(`  Updated in DB: ${updated}`);
    console.log(`
  Score Distribution:`);
    console.log(`    Excellent (8+): ${scoreDistribution.excellent}`);
    console.log(`    Good (7-8):     ${scoreDistribution.good}`);
    console.log(`    Average (5-7):  ${scoreDistribution.average}`);
    console.log(`    Below (<5):     ${scoreDistribution.below}`);

    if (!EXECUTE) {
        console.log(chalk.yellow(`
  ⚠️  DRY RUN - No changes were made.
  Run with --execute to apply changes.`));
    } else {
        console.log(chalk.green(`
  ✅ Editorial scoring complete!`));
    }
}

main().catch(console.error);

