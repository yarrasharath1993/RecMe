#!/usr/bin/env npx tsx
/**
 * REVIEW FORMAT MIGRATION SCRIPT
 *
 * Converts reviews with older formats (audited_review, no_type) 
 * to editorial_review_v2 format for proper UI rendering.
 *
 * Usage:
 *   npx tsx scripts/migrate-reviews-to-v2.ts
 *   npx tsx scripts/migrate-reviews-to-v2.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXECUTE = process.argv.includes('--execute');

interface OldDimensions {
    _type?: string;
    verdict?: {
        final_rating?: number;
        category?: string;
        cult?: boolean;
    };
    direction?: {
        score?: number;
        style?: string;
        execution?: number;
    };
    story_screenplay?: {
        score?: number;
        pacing?: number;
        originality?: number;
        emotional_depth?: number;
        highlights?: string[];
        weaknesses?: string[];
    };
    music_bgm?: {
        bgm?: number;
        songs?: number;
        integration?: number;
        replay_value?: number;
    };
    cinematography?: {
        score?: number;
        camera_work?: number;
        color_grading?: number;
    };
    acting_lead?: {
        hero?: { name?: string; score?: number };
        overall_chemistry?: number;
    };
    acting_supporting?: {
        standouts?: string[];
        overall_strength?: number;
    };
    cultural_impact?: {
        cult_status?: boolean;
        era_significance?: string;
        legacy_status?: string;
    };
    emotional_impact?: {
        tears?: number;
        thrill?: number;
        laughter?: number;
        nostalgia?: number;
        inspiration?: number;
    };
    rewatch_value?: number;
    mass_vs_class?: {
        mass?: number;
        class?: number;
        family_friendly?: number;
        universal_appeal?: number;
    };
}

interface EditorialReviewV2 {
    _type: 'editorial_review_v2';
    verdict: {
        en: string;
        final_rating: number;
        rating_breakdown: {
            story: number;
            performances: number;
            direction: number;
            music: number;
            visuals: number;
        };
    };
    story_screenplay: {
        story_score: number;
        pacing_score: number;
        emotional_score: number;
        originality_score: number;
        narrative_strength: string;
        pacing_analysis: string;
    };
    direction_technicals: {
        direction_score: number;
        direction_analysis: string;
        cinematography_score: number;
        music_score: number;
        editing_score: number;
    };
    performances: {
        lead_actors: Array<{
            name: string;
            analysis: string;
            score: number;
        }>;
        supporting_cast: string;
        ensemble_score: number;
    };
    cultural_impact: {
        legacy_status: string;
        era_significance: string;
        social_relevance: string;
        impact_score: number;
    };
    why_watch: string[];
    why_skip: string[];
    awards?: {
        list: string[];
        summary: string;
    };
    mood_tags: string[];
    content_warnings: string[];
}

function convertToV2(old: OldDimensions, movie: { title_en: string; release_year: number; hero?: string; heroine?: string; genres?: string[] }): EditorialReviewV2 {
    const storyScore = old.story_screenplay?.score || 6;
    const directionScore = old.direction?.score || 6;
    const musicScore = ((old.music_bgm?.bgm || 6) + (old.music_bgm?.songs || 6)) / 2;
    const cinematographyScore = old.cinematography?.score || 6;
    const actingScore = old.acting_lead?.hero?.score || 6;
    const finalRating = old.verdict?.final_rating || Math.round((storyScore + directionScore + musicScore + cinematographyScore + actingScore) / 5);

    // Generate verdict text
    let verdictText = '';
    if (finalRating >= 8) {
        verdictText = `${movie.title_en} is a must-watch masterpiece that excels in storytelling and performances.`;
    } else if (finalRating >= 7) {
        verdictText = `${movie.title_en} delivers solid entertainment with commendable performances and engaging narrative.`;
    } else if (finalRating >= 6) {
        verdictText = `${movie.title_en} is a one-time watch with decent moments but falls short of excellence.`;
    } else {
        verdictText = `${movie.title_en} has its flaws but may appeal to fans of ${movie.genres?.[0] || 'the genre'}.`;
    }

    // Generate why_watch based on scores
    const whyWatch: string[] = [];
    if (storyScore >= 7) whyWatch.push('Engaging storyline that keeps you hooked');
    if (actingScore >= 7) whyWatch.push(`Impressive performance by ${movie.hero || 'the lead cast'}`);
    if (musicScore >= 7) whyWatch.push('Memorable music and background score');
    if (directionScore >= 7) whyWatch.push('Skilled direction and visual presentation');
    if (old.emotional_impact?.nostalgia && old.emotional_impact.nostalgia >= 5) whyWatch.push('Nostalgic value for classic film lovers');
    if (whyWatch.length === 0) whyWatch.push('Worth watching for fans of the genre');

    // Generate why_skip based on weak areas
    const whySkip: string[] = [];
    if (storyScore < 5) whySkip.push('Predictable storyline lacks freshness');
    if (old.story_screenplay?.pacing && old.story_screenplay.pacing < 5) whySkip.push('Pacing issues may test patience');
    if (musicScore < 5) whySkip.push('Music department could have been better');
    if (whySkip.length === 0) {
        if (finalRating < 7) whySkip.push('May not appeal to everyone');
    }

    // Derive mood tags
    const moodTags: string[] = [];
    if (old.emotional_impact?.thrill && old.emotional_impact.thrill >= 5) moodTags.push('thrilling');
    if (old.emotional_impact?.tears && old.emotional_impact.tears >= 5) moodTags.push('emotional');
    if (old.emotional_impact?.laughter && old.emotional_impact.laughter >= 5) moodTags.push('fun');
    if (old.emotional_impact?.nostalgia && old.emotional_impact.nostalgia >= 5) moodTags.push('nostalgic');
    if (old.mass_vs_class?.family_friendly && old.mass_vs_class.family_friendly >= 6) moodTags.push('family');
    if (moodTags.length === 0 && movie.release_year < 2000) moodTags.push('nostalgic');

    return {
        _type: 'editorial_review_v2',
        verdict: {
            en: verdictText,
            final_rating: finalRating,
            rating_breakdown: {
                story: Math.round(storyScore * 10) / 10,
                performances: Math.round(actingScore * 10) / 10,
                direction: Math.round(directionScore * 10) / 10,
                music: Math.round(musicScore * 10) / 10,
                visuals: Math.round(cinematographyScore * 10) / 10,
            },
        },
        story_screenplay: {
            story_score: storyScore,
            pacing_score: old.story_screenplay?.pacing || 6,
            emotional_score: old.story_screenplay?.emotional_depth || 6,
            originality_score: old.story_screenplay?.originality || 6,
            narrative_strength: storyScore >= 7 ? 'Compelling narrative with good emotional depth' : 'Standard storytelling with familiar beats',
            pacing_analysis: old.story_screenplay?.pacing && old.story_screenplay.pacing >= 6 
                ? 'Well-paced with engaging moments' 
                : 'Pacing could be tighter in places',
        },
        direction_technicals: {
            direction_score: directionScore,
            direction_analysis: old.direction?.style 
                ? `${old.direction.style} directorial approach with ${directionScore >= 7 ? 'impressive' : 'adequate'} execution`
                : `Competent direction with ${directionScore >= 7 ? 'notable' : 'standard'} visual style`,
            cinematography_score: cinematographyScore,
            music_score: musicScore,
            editing_score: 6,
        },
        performances: {
            lead_actors: [
                {
                    name: movie.hero || 'Lead Actor',
                    analysis: actingScore >= 7 
                        ? 'Delivers a compelling performance that anchors the film'
                        : 'Provides a serviceable performance for the role',
                    score: actingScore,
                },
                ...(movie.heroine ? [{
                    name: movie.heroine,
                    analysis: actingScore >= 7 
                        ? 'Impresses with nuanced portrayal'
                        : 'Does justice to the character',
                    score: Math.max(5, actingScore - 0.5),
                }] : []),
            ],
            supporting_cast: old.acting_supporting?.overall_strength && old.acting_supporting.overall_strength >= 6
                ? 'Supporting cast provides solid backing'
                : 'Supporting cast serves the narrative adequately',
            ensemble_score: old.acting_supporting?.overall_strength || 6,
        },
        cultural_impact: {
            legacy_status: old.cultural_impact?.legacy_status || 
                (old.cultural_impact?.cult_status ? 'Cult Classic' : 
                    (movie.release_year < 1990 ? 'Golden Era Film' : '')),
            era_significance: old.cultural_impact?.era_significance || '',
            social_relevance: '',
            impact_score: old.cultural_impact?.cult_status ? 7 : 5,
        },
        why_watch: whyWatch,
        why_skip: whySkip,
        mood_tags: moodTags,
        content_warnings: [],
    };
}

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           REVIEW FORMAT MIGRATION SCRIPT                             ║
║   Converts audited_review/no_type → editorial_review_v2              ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}\n`);

    // Fetch reviews with old formats
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
                hero,
                heroine,
                genres
            )
        `)
        .not('dimensions_json', 'is', null);

    if (error) {
        console.error(chalk.red('Error fetching reviews:'), error);
        return;
    }

    // Filter reviews that need migration
    const needsMigration = reviews?.filter(r => {
        const type = (r.dimensions_json as OldDimensions)?._type;
        return type !== 'editorial_review_v2';
    }) || [];

    console.log(`  Found ${chalk.cyan(needsMigration.length)} reviews needing migration\n`);

    if (needsMigration.length === 0) {
        console.log(chalk.green('  ✅ All reviews are already in v2 format!'));
        return;
    }

    let migrated = 0;
    let updated = 0;

    for (const review of needsMigration) {
        const movie = review.movies as unknown as { 
            id: string; 
            title_en: string; 
            release_year: number;
            hero?: string;
            heroine?: string;
            genres?: string[];
        };
        const oldDims = review.dimensions_json as OldDimensions;

        console.log(`  [${migrated + 1}/${needsMigration.length}] ${movie.title_en} (${movie.release_year})`);
        console.log(`      Old type: ${oldDims._type || 'no_type'}`);

        const v2Format = convertToV2(oldDims, movie);
        migrated++;

        if (EXECUTE) {
            const { error: updateError } = await supabase
                .from('movie_reviews')
                .update({ 
                    dimensions_json: v2Format,
                    // Also update rating columns
                    screenplay_rating: v2Format.story_screenplay.story_score,
                    direction_rating: v2Format.direction_technicals.direction_score,
                    music_rating: v2Format.direction_technicals.music_score,
                    cinematography_rating: v2Format.direction_technicals.cinematography_score,
                    acting_rating: v2Format.performances.lead_actors[0]?.score,
                })
                .eq('id', review.id);

            if (!updateError) {
                updated++;
                console.log(chalk.green(`      ✅ Migrated`));
            } else {
                console.log(chalk.red(`      ❌ Failed: ${updateError.message}`));
            }
        } else {
            console.log(chalk.yellow(`      Would migrate to editorial_review_v2`));
        }
    }

    // Summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
📊 MIGRATION SUMMARY
═══════════════════════════════════════════════════════════════════`));
    console.log(`  Total reviews processed: ${migrated}`);
    console.log(`  Successfully updated: ${updated}`);

    if (!EXECUTE) {
        console.log(chalk.yellow(`
  ⚠️  DRY RUN - No changes were made.
  Run with --execute to apply changes.`));
    } else {
        console.log(chalk.green(`
  ✅ Migration complete!`));
    }
}

main().catch(console.error);

