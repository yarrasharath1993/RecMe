#!/usr/bin/env npx tsx
/**
 * RATING BREAKDOWN RECALIBRATION SCRIPT
 *
 * When the final rating is manually updated, this script recalibrates:
 * - Rating breakdown (story, performances, direction, music, visuals)
 * - Actor performance scores
 * - Review dimension scores
 *
 * Formula: Each dimension score = final_rating ± variance (max 1.5 points)
 * Variance is distributed to maintain realistic spread while averaging to the final rating.
 *
 * Usage:
 *   npx tsx scripts/recalibrate-rating-breakdowns.ts --audit
 *   npx tsx scripts/recalibrate-rating-breakdowns.ts --fix-anomalies --execute
 *   npx tsx scripts/recalibrate-rating-breakdowns.ts --movie=slug-name --execute
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
const FIX_ANOMALIES = hasFlag('fix-anomalies');
const EXECUTE = hasFlag('execute');
const MOVIE_SLUG = getArg('movie');
const LIMIT = parseInt(getArg('limit') || '500');

// ============================================================================
// RECALIBRATION LOGIC
// ============================================================================

interface RatingBreakdown {
    story: number;
    performances: number;
    direction: number;
    music: number;
    visuals: number;
}

function recalibrateBreakdown(finalRating: number, genres: string[] = []): RatingBreakdown {
    // Distribute scores around the final rating with realistic variance
    // Max variance: 1.5 points either direction
    const maxVariance = 1.5;
    
    // Genre-based tendencies
    const isActionHeavy = genres.some(g => ['Action', 'Thriller'].includes(g));
    const isMusicHeavy = genres.some(g => ['Musical', 'Romance'].includes(g));
    const isDrama = genres.some(g => ['Drama'].includes(g));
    
    // Base scores centered on final rating
    let story = finalRating;
    let performances = finalRating;
    let direction = finalRating;
    let music = finalRating;
    let visuals = finalRating;
    
    // Apply genre-based variance
    if (isActionHeavy) {
        visuals += 0.3;
        story -= 0.2;
    }
    if (isMusicHeavy) {
        music += 0.4;
    }
    if (isDrama) {
        story += 0.3;
        performances += 0.2;
    }
    
    // Add small random variance to make it realistic
    const variance = () => (Math.random() - 0.5) * 0.6;
    story += variance();
    performances += variance();
    direction += variance();
    music += variance();
    visuals += variance();
    
    // Ensure all scores are within valid bounds
    const clamp = (val: number) => Math.round(Math.min(10, Math.max(1, val)) * 10) / 10;
    
    // Ensure average is close to final rating (within 0.2)
    const avg = (story + performances + direction + music + visuals) / 5;
    const adjustment = finalRating - avg;
    
    return {
        story: clamp(story + adjustment * 0.3),
        performances: clamp(performances + adjustment * 0.25),
        direction: clamp(direction + adjustment * 0.25),
        music: clamp(music + adjustment * 0.1),
        visuals: clamp(visuals + adjustment * 0.1),
    };
}

function recalibratePerformances(
    finalRating: number,
    leadActors: Array<{ name: string; analysis?: string; score?: number }>
): Array<{ name: string; analysis: string; score: number }> {
    return leadActors.map((actor, index) => {
        // Lead actor gets slightly higher, supporting slightly lower
        const variance = index === 0 ? 0.3 : -0.2;
        const score = Math.round(Math.min(10, Math.max(1, finalRating + variance)) * 10) / 10;
        
        return {
            name: actor.name,
            analysis: actor.analysis || getDefaultAnalysis(actor.name, score),
            score,
        };
    });
}

function getDefaultAnalysis(name: string, score: number): string {
    if (score >= 8) return `${name} delivers an impressive, memorable performance`;
    if (score >= 7) return `${name} provides a solid, engaging performance`;
    if (score >= 6) return `${name} does justice to the role`;
    if (score >= 5) return `${name} gives an adequate performance`;
    return `${name}'s performance is below expectations`;
}

// ============================================================================
// AUDIT FUNCTION
// ============================================================================

async function auditRatingAnomalies(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           RATING ANOMALY AUDIT                                        ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    // Find reviews where breakdown doesn't match final rating
    const { data: reviews } = await supabase
        .from('movie_reviews')
        .select(`
            id,
            movie_id,
            overall_rating,
            dimensions_json,
            movies!inner (
                id,
                title_en,
                release_year,
                our_rating,
                avg_rating,
                slug,
                genres
            )
        `)
        .not('dimensions_json', 'is', null)
        .limit(LIMIT);

    const anomalies: Array<{
        title: string;
        slug: string;
        movieRating: number;
        breakdownAvg: number;
        difference: number;
    }> = [];

    for (const review of reviews || []) {
        const movie = review.movies as any;
        const dims = review.dimensions_json as any;
        const movieRating = movie.our_rating || movie.avg_rating || 0;
        
        if (!dims.verdict?.rating_breakdown) continue;
        
        const breakdown = dims.verdict.rating_breakdown;
        const breakdownAvg = (
            (breakdown.story || 0) +
            (breakdown.performances || 0) +
            (breakdown.direction || 0) +
            (breakdown.music || 0) +
            (breakdown.visuals || 0)
        ) / 5;
        
        const difference = Math.abs(movieRating - breakdownAvg);
        
        if (difference > 1.0) {
            anomalies.push({
                title: `${movie.title_en} (${movie.release_year})`,
                slug: movie.slug,
                movieRating,
                breakdownAvg: Math.round(breakdownAvg * 10) / 10,
                difference: Math.round(difference * 10) / 10,
            });
        }
    }

    console.log(`Found ${chalk.red(anomalies.length)} movies with rating anomalies (diff > 1.0):\n`);
    
    anomalies
        .sort((a, b) => b.difference - a.difference)
        .slice(0, 30)
        .forEach((a, i) => {
            console.log(`${i + 1}. ${a.title}`);
            console.log(`   Movie: ${a.movieRating} | Breakdown Avg: ${a.breakdownAvg} | Diff: ${chalk.red(a.difference)}`);
            console.log(`   Slug: ${a.slug}`);
            console.log('');
        });

    if (FIX_ANOMALIES && anomalies.length > 0) {
        console.log(chalk.yellow(`\nWill fix ${anomalies.length} anomalies...`));
        
        for (const anomaly of anomalies) {
            await recalibrateMovie(anomaly.slug);
        }
    }
}

// ============================================================================
// RECALIBRATE SINGLE MOVIE
// ============================================================================

async function recalibrateMovie(slug: string): Promise<void> {
    const { data: movie } = await supabase
        .from('movies')
        .select('id, title_en, release_year, our_rating, avg_rating, genres')
        .eq('slug', slug)
        .single();

    if (!movie) {
        console.log(chalk.red(`Movie not found: ${slug}`));
        return;
    }

    const finalRating = movie.our_rating || movie.avg_rating || 6;
    const genres = movie.genres || [];

    console.log(`Recalibrating: ${movie.title_en} (${movie.release_year}) → ${finalRating}/10`);

    // Get reviews
    const { data: reviews } = await supabase
        .from('movie_reviews')
        .select('id, dimensions_json')
        .eq('movie_id', movie.id);

    if (!reviews || reviews.length === 0) {
        console.log(chalk.yellow(`  No reviews found`));
        return;
    }

    for (const review of reviews) {
        const dims = (review.dimensions_json || {}) as any;
        
        // Recalibrate breakdown
        const newBreakdown = recalibrateBreakdown(finalRating, genres);
        
        // Recalibrate performances
        const existingPerfs = dims.performances?.lead_actors || [];
        const newPerfs = recalibratePerformances(finalRating, existingPerfs);
        
        // Update dimensions
        const updatedDims = {
            ...dims,
            _type: 'editorial_review_v2',
            verdict: {
                ...(dims.verdict || {}),
                final_rating: finalRating,
                rating_breakdown: newBreakdown,
            },
            story_screenplay: {
                ...(dims.story_screenplay || {}),
                story_score: newBreakdown.story,
            },
            direction_technicals: {
                ...(dims.direction_technicals || {}),
                direction_score: newBreakdown.direction,
                music_score: newBreakdown.music,
                cinematography_score: newBreakdown.visuals,
            },
            performances: {
                ...(dims.performances || {}),
                lead_actors: newPerfs,
                ensemble_score: Math.round((finalRating - 0.3) * 10) / 10,
            },
        };

        if (EXECUTE) {
            const { error } = await supabase
                .from('movie_reviews')
                .update({
                    dimensions_json: updatedDims,
                    overall_rating: finalRating,
                    screenplay_rating: newBreakdown.story,
                    direction_rating: newBreakdown.direction,
                    music_rating: newBreakdown.music,
                    cinematography_rating: newBreakdown.visuals,
                    acting_rating: newBreakdown.performances,
                })
                .eq('id', review.id);

            if (error) {
                console.log(chalk.red(`  Error: ${error.message}`));
            } else {
                console.log(chalk.green(`  ✅ Recalibrated breakdown: Story ${newBreakdown.story}, Dir ${newBreakdown.direction}, Music ${newBreakdown.music}`));
            }
        } else {
            console.log(chalk.yellow(`  Would recalibrate: Story ${newBreakdown.story}, Dir ${newBreakdown.direction}, Music ${newBreakdown.music}`));
        }
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           RATING BREAKDOWN RECALIBRATION                             ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);

    if (AUDIT) {
        await auditRatingAnomalies();
    } else if (MOVIE_SLUG) {
        await recalibrateMovie(MOVIE_SLUG);
    } else if (FIX_ANOMALIES) {
        await auditRatingAnomalies();
    } else {
        console.log(`
Usage:
  --audit                  Find movies with rating anomalies
  --fix-anomalies          Find and fix all anomalies
  --movie=<slug>           Recalibrate specific movie
  --execute                Apply changes (default is dry run)
  --limit=N                Limit movies to check (default: 500)
`);
    }

    if (!EXECUTE) {
        console.log(chalk.yellow(`\n⚠️  DRY RUN - Use --execute to apply changes`));
    }
}

main().catch(console.error);

