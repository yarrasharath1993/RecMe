#!/usr/bin/env npx tsx
/**
 * CULTURAL SIGNIFICANCE & DEEP DIVE ENRICHMENT SCRIPT
 *
 * Enriches reviews with:
 * - Supporting performances (from movie's supporting_cast)
 * - Cultural impact & legacy status
 * - Era significance
 * - Derived content from movie metadata
 *
 * Usage:
 *   npx tsx scripts/enrich-cultural-significance.ts --limit=500
 *   npx tsx scripts/enrich-cultural-significance.ts --execute
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

const LIMIT = parseInt(getArg('limit', '500'));
const EXECUTE = hasFlag('execute');

// ============================================================================
// TYPES
// ============================================================================

interface SupportingCastMember {
    name: string;
    role?: string;
    order?: number;
}

interface Movie {
    id: string;
    title_en: string;
    release_year: number;
    genres: string[] | null;
    is_classic: boolean;
    awards: string[] | null;
    hero: string | null;
    heroine: string | null;
    director: string | null;
    supporting_cast: SupportingCastMember[] | null;
    our_rating: number | null;
    avg_rating: number | null;
}

interface Review {
    id: string;
    movie_id: string;
    dimensions_json: Record<string, unknown> | null;
    movies: Movie;
}

// ============================================================================
// DERIVATION LOGIC
// ============================================================================

function deriveLegacyStatus(movie: Movie): string {
    const year = movie.release_year;
    const rating = movie.our_rating || movie.avg_rating || 0;
    const hasAwards = movie.awards && movie.awards.length > 0;
    const isClassic = movie.is_classic;

    // Pre-1980: Golden Era Classic
    if (year <= 1980 && (rating >= 7 || hasAwards || isClassic)) {
        return 'Golden Era Classic';
    }
    // 1980-2000: Blockbuster Era
    if (year > 1980 && year <= 2000 && rating >= 7.5) {
        return 'Blockbuster Era Hit';
    }
    // Award winners
    if (hasAwards) {
        return 'Award Winner';
    }
    // High-rated modern films
    if (year > 2000 && rating >= 8) {
        return 'Modern Classic';
    }
    if (rating >= 7) {
        return 'Critically Acclaimed';
    }
    if (isClassic) {
        return 'Cult Classic';
    }
    // Recent well-rated
    if (year >= 2015 && rating >= 6.5) {
        return 'Contemporary Hit';
    }

    return '';
}

function deriveEraSignificance(movie: Movie): string {
    const year = movie.release_year;
    const genres = movie.genres || [];

    if (year <= 1960) {
        return 'Pioneering Telugu Cinema era - foundation of Tollywood';
    }
    if (year <= 1970) {
        return 'Golden Era of Telugu Cinema - legendary performances';
    }
    if (year <= 1980) {
        return 'Commercial cinema boom with NTR/ANR dominance';
    }
    if (year <= 1990) {
        return 'Chiranjeevi era - mass masala entertainment peak';
    }
    if (year <= 2000) {
        return 'Family entertainers and romantic dramas era';
    }
    if (year <= 2010) {
        return 'New wave directors bringing fresh narratives';
    }
    if (year <= 2020) {
        return 'Pan-India expansion and technical excellence era';
    }
    return 'Contemporary Telugu cinema reaching global audiences';
}

function deriveSupportingPerformances(
    supportingCast: SupportingCastMember[] | null
): { name: string; role?: string; score: number }[] {
    if (!supportingCast || supportingCast.length === 0) {
        return [];
    }

    // Assign scores based on order (top supporting actors get higher scores)
    return supportingCast.slice(0, 5).map((member, index) => ({
        name: member.name,
        role: member.role,
        score: Math.max(6.5, 8.5 - index * 0.3), // 8.5, 8.2, 7.9, 7.6, 7.3
    }));
}

function buildDimensionsUpdate(
    movie: Movie,
    existingDimensions: Record<string, unknown> | null
): Record<string, unknown> {
    const dimensions = { ...(existingDimensions || {}) };

    // Add/update cultural_impact
    const legacyStatus = deriveLegacyStatus(movie);
    const eraSignificance = deriveEraSignificance(movie);

    if (legacyStatus || eraSignificance) {
        dimensions.cultural_impact = {
            ...(dimensions.cultural_impact as Record<string, unknown> || {}),
            legacy_status: legacyStatus || (dimensions.cultural_impact as Record<string, unknown>)?.legacy_status,
            era_significance: eraSignificance,
        };
    }

    // Add/update supporting performances
    const supportingPerfs = deriveSupportingPerformances(movie.supporting_cast);
    if (supportingPerfs.length > 0) {
        const existingPerformances = (dimensions.performances || {}) as Record<string, unknown>;
        dimensions.performances = {
            ...existingPerformances,
            supporting: supportingPerfs,
        };
    }

    // Add awards if movie has them
    if (movie.awards && movie.awards.length > 0) {
        dimensions.awards = {
            list: movie.awards,
            count: movie.awards.length,
            summary: `Won ${movie.awards.length} award(s)`,
        };
    }

    return dimensions;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           CULTURAL SIGNIFICANCE ENRICHMENT SCRIPT                    ║
║   Adds supporting performances, legacy status, era significance      ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
    console.log(`  Limit: ${LIMIT} reviews\n`);

    // Fetch reviews with their associated movies
    const { data: reviews, error } = await supabase
        .from('movie_reviews')
        .select(`
            id,
            movie_id,
            dimensions_json,
            movies!inner (
                id,
                title_en,
                release_year,
                genres,
                is_classic,
                awards,
                hero,
                heroine,
                director,
                supporting_cast,
                our_rating,
                avg_rating
            )
        `)
        .limit(LIMIT);

    if (error) {
        console.error(chalk.red('Error fetching reviews:'), error);
        return;
    }

    console.log(`  Found ${chalk.cyan(reviews?.length || 0)} reviews to process\n`);

    if (!reviews || reviews.length === 0) {
        console.log(chalk.green('  ✅ No reviews need processing.'));
        return;
    }

    // Process reviews
    let processed = 0;
    let enriched = 0;
    let updated = 0;
    const enrichmentCounts = {
        legacy_status: 0,
        era_significance: 0,
        supporting_performances: 0,
        awards: 0,
    };

    for (const review of reviews) {
        processed++;
        
        const movie = review.movies as unknown as Movie;
        if (!movie) continue;

        const updatedDimensions = buildDimensionsUpdate(
            movie,
            review.dimensions_json as Record<string, unknown> | null
        );

        // Check what was added
        const culturalImpact = updatedDimensions.cultural_impact as Record<string, unknown> | undefined;
        if (culturalImpact?.legacy_status) enrichmentCounts.legacy_status++;
        if (culturalImpact?.era_significance) enrichmentCounts.era_significance++;
        
        const performances = updatedDimensions.performances as Record<string, unknown> | undefined;
        if (performances?.supporting) enrichmentCounts.supporting_performances++;
        
        if (updatedDimensions.awards) enrichmentCounts.awards++;

        // Only update if we have meaningful changes
        const hasNewData = 
            culturalImpact?.legacy_status ||
            culturalImpact?.era_significance ||
            performances?.supporting ||
            updatedDimensions.awards;

        if (hasNewData) {
            enriched++;

            if (EXECUTE) {
                const { error: updateError } = await supabase
                    .from('movie_reviews')
                    .update({ dimensions_json: updatedDimensions })
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
📊 CULTURAL SIGNIFICANCE SUMMARY
═══════════════════════════════════════════════════════════════════`));
    console.log(`  Processed:     ${reviews.length} reviews`);
    console.log(`  Enriched:      ${chalk.green(enriched)} reviews`);
    console.log(`  Updated in DB: ${updated}`);
    console.log(`  Success rate:  ${Math.round((enriched / reviews.length) * 100)}%`);
    console.log(`
  By Field:`);
    console.log(`    Legacy Status:           ${enrichmentCounts.legacy_status}`);
    console.log(`    Era Significance:        ${enrichmentCounts.era_significance}`);
    console.log(`    Supporting Performances: ${enrichmentCounts.supporting_performances}`);
    console.log(`    Awards:                  ${enrichmentCounts.awards}`);

    if (!EXECUTE) {
        console.log(chalk.yellow(`
  ⚠️  DRY RUN - No changes were made.
  Run with --execute to apply changes.`));
    } else {
        console.log(chalk.green(`
  ✅ Cultural significance enrichment complete!`));
    }
}

main().catch(console.error);

