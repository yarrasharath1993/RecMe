#!/usr/bin/env npx tsx
/**
 * RATING BREAKDOWNS ENRICHMENT SCRIPT
 *
 * Maps scores from dimensions_json to individual review columns:
 * - story_screenplay.score -> screenplay_rating
 * - direction_technicals.direction_score -> direction_rating
 * - direction_technicals.music_score -> music_rating
 * - direction_technicals.cinematography_score -> cinematography_rating
 * - performances average -> acting_rating
 *
 * Usage:
 *   npx tsx scripts/enrich-rating-breakdowns.ts --limit=500
 *   npx tsx scripts/enrich-rating-breakdowns.ts --execute
 *   npx tsx scripts/enrich-rating-breakdowns.ts --all --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

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

const LIMIT = parseInt(getArg('limit', '1000'));
const EXECUTE = hasFlag('execute');
const ALL = hasFlag('all');

// ============================================================================
// TYPES
// ============================================================================

interface DimensionsJson {
    story_screenplay?: {
        score?: number;
        story_score?: number;
    };
    direction_technicals?: {
        direction_score?: number;
        music_score?: number;
        cinematography_score?: number;
    };
    performances?: {
        lead?: { score?: number }[];
        hero?: { score?: number };
        heroine?: { score?: number };
    };
    verdict?: {
        en?: string;
    };
    why_watch?: {
        reasons?: string[];
    } | string[];
    why_skip?: {
        reasons?: string[];
    } | string[];
    cultural_impact?: {
        legacy_status?: string;
    };
}

interface Review {
    id: string;
    movie_id: string;
    dimensions_json: DimensionsJson | null;
    screenplay_rating: number | null;
    direction_rating: number | null;
    music_rating: number | null;
    cinematography_rating: number | null;
    acting_rating: number | null;
}

// ============================================================================
// EXTRACTION LOGIC
// ============================================================================

function extractRatings(dimensions: DimensionsJson): {
    screenplay_rating?: number;
    direction_rating?: number;
    music_rating?: number;
    cinematography_rating?: number;
    acting_rating?: number;
} {
    const ratings: {
        screenplay_rating?: number;
        direction_rating?: number;
        music_rating?: number;
        cinematography_rating?: number;
        acting_rating?: number;
    } = {};

    // Story/Screenplay rating
    if (dimensions.story_screenplay) {
        const storyScore = dimensions.story_screenplay.score || dimensions.story_screenplay.story_score;
        if (storyScore && storyScore > 0 && storyScore <= 10) {
            ratings.screenplay_rating = storyScore;
        }
    }

    // Direction rating
    if (dimensions.direction_technicals?.direction_score) {
        const dirScore = dimensions.direction_technicals.direction_score;
        if (dirScore > 0 && dirScore <= 10) {
            ratings.direction_rating = dirScore;
        }
    }

    // Music rating
    if (dimensions.direction_technicals?.music_score) {
        const musicScore = dimensions.direction_technicals.music_score;
        if (musicScore > 0 && musicScore <= 10) {
            ratings.music_rating = musicScore;
        }
    }

    // Cinematography rating
    if (dimensions.direction_technicals?.cinematography_score) {
        const cinemaScore = dimensions.direction_technicals.cinematography_score;
        if (cinemaScore > 0 && cinemaScore <= 10) {
            ratings.cinematography_rating = cinemaScore;
        }
    }

    // Acting rating (average of lead performances)
    if (dimensions.performances) {
        const scores: number[] = [];
        
        if (dimensions.performances.lead && Array.isArray(dimensions.performances.lead)) {
            for (const lead of dimensions.performances.lead) {
                if (lead.score && lead.score > 0 && lead.score <= 10) {
                    scores.push(lead.score);
                }
            }
        }
        
        if (dimensions.performances.hero?.score) {
            scores.push(dimensions.performances.hero.score);
        }
        if (dimensions.performances.heroine?.score) {
            scores.push(dimensions.performances.heroine.score);
        }

        if (scores.length > 0) {
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            ratings.acting_rating = Math.round(avgScore * 10) / 10;
        }
    }

    return ratings;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           RATING BREAKDOWNS ENRICHMENT SCRIPT                        ║
║   Maps dimensions_json scores to individual rating columns           ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
    console.log(`  Limit: ${LIMIT} reviews`);
    console.log(`  Filter: ${ALL ? 'All reviews with dimensions_json' : 'Reviews missing rating breakdowns'}`);

    // Build query
    let query = supabase
        .from('movie_reviews')
        .select('id, movie_id, dimensions_json, screenplay_rating, direction_rating, music_rating, cinematography_rating, acting_rating')
        .not('dimensions_json', 'is', null);

    if (!ALL) {
        // Only get reviews missing some rating breakdowns
        query = query.or(
            'screenplay_rating.is.null,direction_rating.is.null,music_rating.is.null,cinematography_rating.is.null,acting_rating.is.null'
        );
    }

    query = query.limit(LIMIT);

    const { data: reviews, error } = await query;

    if (error) {
        console.error(chalk.red('Error fetching reviews:'), error);
        return;
    }

    console.log(`\n  Found ${chalk.cyan(reviews?.length || 0)} reviews to process\n`);

    if (!reviews || reviews.length === 0) {
        console.log(chalk.green('  ✅ No reviews need processing.'));
        return;
    }

    // Process reviews
    let processed = 0;
    let enriched = 0;
    let updated = 0;
    const fieldCounts = {
        screenplay: 0,
        direction: 0,
        music: 0,
        cinematography: 0,
        acting: 0,
    };

    for (const review of reviews) {
        processed++;
        
        if (!review.dimensions_json) continue;

        const ratings = extractRatings(review.dimensions_json as DimensionsJson);
        
        // Only update fields that are currently null
        const updateData: Record<string, number> = {};
        
        if (ratings.screenplay_rating && !review.screenplay_rating) {
            updateData.screenplay_rating = ratings.screenplay_rating;
            fieldCounts.screenplay++;
        }
        if (ratings.direction_rating && !review.direction_rating) {
            updateData.direction_rating = ratings.direction_rating;
            fieldCounts.direction++;
        }
        if (ratings.music_rating && !review.music_rating) {
            updateData.music_rating = ratings.music_rating;
            fieldCounts.music++;
        }
        if (ratings.cinematography_rating && !review.cinematography_rating) {
            updateData.cinematography_rating = ratings.cinematography_rating;
            fieldCounts.cinematography++;
        }
        if (ratings.acting_rating && !review.acting_rating) {
            updateData.acting_rating = ratings.acting_rating;
            fieldCounts.acting++;
        }

        if (Object.keys(updateData).length > 0) {
            enriched++;
            
            if (EXECUTE) {
                const { error: updateError } = await supabase
                    .from('movie_reviews')
                    .update(updateData)
                    .eq('id', review.id);

                if (!updateError) {
                    updated++;
                }
            }
        }

        // Progress
        if (processed % 100 === 0) {
            const pct = Math.round((processed / reviews.length) * 100);
            console.log(`  [${pct}%] Processed ${processed}/${reviews.length} | Enriched: ${enriched}`);
        }
    }

    // Summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
📊 RATING BREAKDOWNS SUMMARY
═══════════════════════════════════════════════════════════════════`));
    console.log(`  Processed:     ${reviews.length} reviews`);
    console.log(`  Enriched:      ${chalk.green(enriched)} reviews`);
    console.log(`  Updated in DB: ${updated}`);
    console.log(`  Success rate:  ${Math.round((enriched / reviews.length) * 100)}%`);
    console.log(`
  By Field:`);
    console.log(`    Screenplay:     ${fieldCounts.screenplay}`);
    console.log(`    Direction:      ${fieldCounts.direction}`);
    console.log(`    Music:          ${fieldCounts.music}`);
    console.log(`    Cinematography: ${fieldCounts.cinematography}`);
    console.log(`    Acting:         ${fieldCounts.acting}`);

    if (!EXECUTE) {
        console.log(chalk.yellow(`
  ⚠️  DRY RUN - No changes were made.
  Run with --execute to apply changes.`));
    } else {
        console.log(chalk.green(`
  ✅ Rating breakdowns enrichment complete!`));
    }
}

main().catch(console.error);

