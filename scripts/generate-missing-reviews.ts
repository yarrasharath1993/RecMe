#!/usr/bin/env npx tsx
/**
 * GENERATE REVIEWS FOR MOVIES WITHOUT REVIEWS
 *
 * Creates reviews with 9-section data (dimensions_json) for movies
 * that don't have any reviews yet.
 *
 * Generates:
 *   - verdict (rating category + tagline)
 *   - why_watch / why_skip reasons
 *   - performances section from movie cast
 *   - story_screenplay from synopsis + genre
 *   - direction_technicals from director + crew
 *   - cultural_impact from movie metadata
 *
 * Usage:
 *   npx tsx scripts/generate-missing-reviews.ts --limit=100
 *   npx tsx scripts/generate-missing-reviews.ts --execute
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

const LIMIT = parseInt(getArg('limit', '300'));
const EXECUTE = hasFlag('execute');

// ============================================================================
// GENERATION HELPERS
// ============================================================================

function getRatingCategory(rating: number): string {
    if (rating >= 9) return 'Masterpiece';
    if (rating >= 8) return 'Excellent';
    if (rating >= 7) return 'Very Good';
    if (rating >= 6) return 'Good';
    if (rating >= 5) return 'Average';
    if (rating >= 4) return 'Below Average';
    return 'One-time Watch';
}

function generateEditorialReview(movie: any): any {
    const rating = movie.avg_rating || movie.editorial_score || 6;
    const category = getRatingCategory(rating);
    const genres = movie.genres || [];
    
    // Generate verdict
    const verdict = {
        en: movie.synopsis?.substring(0, 150) || `${movie.title_en} is a ${genres.join('/')} Telugu film featuring ${movie.hero || 'talented actors'}.`,
        te: movie.synopsis_te?.substring(0, 150) || '',
        category,
        final_rating: rating,
        confidence_score: 0.7,
    };
    
    // Generate why_watch
    const whyWatch: any = { reasons: [], best_for: [] };
    if (movie.is_classic) whyWatch.reasons.push('Classic Telugu cinema heritage');
    if (movie.is_blockbuster) whyWatch.reasons.push('Box office blockbuster');
    if (rating >= 8) whyWatch.reasons.push('Highly rated by audiences');
    if (movie.awards?.length > 0) whyWatch.reasons.push('Award-winning film');
    if (movie.hero) whyWatch.reasons.push(`${movie.hero}'s captivating performance`);
    if (movie.director) whyWatch.reasons.push(`${movie.director}'s directorial vision`);
    if (movie.music_director) whyWatch.reasons.push(`Memorable music by ${movie.music_director}`);
    if (whyWatch.reasons.length < 3) {
        whyWatch.reasons.push('Engaging storyline', 'Quality entertainment');
    }
    
    // Best for based on genres
    if (genres.includes('Action')) whyWatch.best_for.push('Action lovers');
    if (genres.includes('Romance')) whyWatch.best_for.push('Romance fans');
    if (genres.includes('Comedy')) whyWatch.best_for.push('Comedy enthusiasts');
    if (genres.includes('Drama')) whyWatch.best_for.push('Drama aficionados');
    if (genres.includes('Family')) whyWatch.best_for.push('Family viewing');
    if (genres.includes('Thriller')) whyWatch.best_for.push('Thriller buffs');
    
    // Generate why_skip
    const whySkip: any = { reasons: [] };
    if (rating < 5) whySkip.reasons.push('Below average ratings');
    if (movie.runtime > 180) whySkip.reasons.push('Lengthy runtime');
    if (genres.includes('Horror')) whySkip.reasons.push('Not for the faint-hearted');
    
    // Generate performances
    const performances: any = {};
    if (movie.hero) {
        performances.lead = {
            name: movie.hero,
            role: 'Lead Actor',
            score: rating >= 7 ? 8 : 7,
            highlights: ['Captivating screen presence', 'Emotional depth'],
        };
    }
    if (movie.heroine) {
        performances.female_lead = {
            name: movie.heroine,
            role: 'Lead Actress',
            score: rating >= 7 ? 7.5 : 7,
        };
    }
    if (movie.supporting_cast?.length > 0) {
        performances.supporting = movie.supporting_cast.slice(0, 3).map((cast: any) => ({
            name: cast.name,
            role: cast.role || 'Supporting',
            score: 7,
        }));
    }
    
    // Generate story_screenplay
    const pacing = genres.includes('Action') ? 'Fast-paced' : 
                   genres.includes('Drama') ? 'Measured' : 'Balanced';
    const storyScreenplay = {
        plot_summary: movie.synopsis?.substring(0, 200) || '',
        narrative_style: genres.includes('Thriller') ? 'Non-linear' : 'Linear',
        pacing,
        story_score: rating >= 7 ? 7.5 : 6.5,
        highlights: ['Engaging storyline', 'Well-written dialogues'],
        weaknesses: [],
    };
    
    // Generate direction_technicals
    const directionTechnicals = {
        director_vision: movie.director ? `${movie.director}'s creative direction` : 'Competent direction',
        direction_score: rating >= 7 ? 7.5 : 6.5,
        cinematography: movie.crew?.cinematographer ? `Shot by ${movie.crew.cinematographer}` : 'Visually appealing',
        cinematography_score: 7,
        music_score: movie.music_director ? 7.5 : 7,
        editing: movie.crew?.editor ? `Edited by ${movie.crew.editor}` : 'Crisp editing',
        production_value: 'Quality production',
    };
    
    // Generate cultural_impact
    const culturalImpact: any = {};
    if (movie.is_classic) culturalImpact.legacy_status = 'classic';
    if (movie.is_cult) culturalImpact.cult_status = true;
    if (movie.release_year < 1990) culturalImpact.era_significance = 'Golden era Telugu cinema';
    
    return {
        _type: 'editorial_review_v2',
        verdict,
        synopsis: {
            en: movie.synopsis || '',
            te: movie.synopsis_te || '',
            spoiler_free: true,
        },
        why_watch: whyWatch,
        why_skip: whySkip,
        performances,
        story_screenplay: storyScreenplay,
        direction_technicals: directionTechnicals,
        cultural_impact: culturalImpact,
        _generated_at: new Date().toISOString(),
        _quality_score: 0.7,
    };
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║     GENERATE MISSING REVIEWS                                         ║
║     Creating 9-section reviews for movies without any                ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
    console.log(`  Limit: ${LIMIT} movies`);

    // Get all movie IDs
    console.log(chalk.cyan('\n  Finding movies without reviews...'));
    
    let allMovieIds = new Set<string>();
    for (let offset = 0; offset < 6000; offset += 1000) {
        const { data } = await supabase
            .from('movies')
            .select('id')
            .eq('language', 'Telugu')
            .eq('is_published', true)
            .range(offset, offset + 999);
        if (!data || data.length === 0) break;
        data.forEach(m => allMovieIds.add(m.id));
    }
    
    // Get reviewed movie IDs
    let reviewedMovieIds = new Set<string>();
    for (let offset = 0; offset < 20000; offset += 1000) {
        const { data } = await supabase
            .from('movie_reviews')
            .select('movie_id')
            .range(offset, offset + 999);
        if (!data || data.length === 0) break;
        data.forEach(r => reviewedMovieIds.add(r.movie_id));
    }
    
    // Find movies without reviews
    const moviesWithoutReviews = [...allMovieIds].filter(id => !reviewedMovieIds.has(id));
    
    console.log(`  Total movies: ${allMovieIds.size}`);
    console.log(`  Movies with reviews: ${reviewedMovieIds.size}`);
    console.log(`  Movies WITHOUT reviews: ${moviesWithoutReviews.length}`);
    
    if (moviesWithoutReviews.length === 0) {
        console.log(chalk.green('\n  ✅ All movies already have reviews!'));
        return;
    }
    
    // Get movie details for those without reviews
    const targetIds = moviesWithoutReviews.slice(0, LIMIT);
    const { data: movies } = await supabase
        .from('movies')
        .select('*')
        .in('id', targetIds);
    
    if (!movies || movies.length === 0) {
        console.log(chalk.yellow('\n  No movies found to process.'));
        return;
    }
    
    console.log(`\n  Processing ${movies.length} movies...\n`);
    
    let created = 0;
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        const batch = movies.slice(i, i + BATCH_SIZE);
        
        for (const movie of batch) {
            const dimensionsJson = generateEditorialReview(movie);
            
            const review = {
                movie_id: movie.id,
                reviewer_type: 'admin',
                reviewer_name: 'TeluguVibes Editorial',
                overall_rating: dimensionsJson.verdict.final_rating,
                summary: dimensionsJson.synopsis.en?.substring(0, 500) || '',
                worth_watching: dimensionsJson.verdict.final_rating >= 6,
                is_featured: true,
                is_spoiler_free: true,
                status: 'published',
                source: 'template_fallback',
                confidence_score: 0.7,
                enrichment_version: 'v2.0',
                dimensions_json: dimensionsJson,
                smart_review: {
                    critics_pov: dimensionsJson.verdict.en,
                    why_to_watch: dimensionsJson.why_watch.reasons,
                    why_to_skip: dimensionsJson.why_skip.reasons,
                    legacy_status: dimensionsJson.cultural_impact.legacy_status,
                    mood_suitability: [],
                    content_warnings: [],
                    derivation_confidence: 0.7,
                },
                smart_review_derived_at: new Date().toISOString(),
            };
            
            if (EXECUTE) {
                const { error } = await supabase
                    .from('movie_reviews')
                    .insert(review);
                
                if (!error) {
                    created++;
                }
            } else {
                created++;
            }
        }
        
        const pct = Math.round(((i + batch.length) / movies.length) * 100);
        console.log(`  [${pct}%] Processed ${i + batch.length}/${movies.length} | Created: ${created}`);
    }
    
    // Summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
📊 REVIEW GENERATION SUMMARY
═══════════════════════════════════════════════════════════════════`));
    console.log(`  Movies processed: ${movies.length}`);
    console.log(`  Reviews created:  ${created}`);
    console.log(`  Remaining movies: ${moviesWithoutReviews.length - created}`);
    
    if (!EXECUTE) {
        console.log(chalk.yellow(`\n  ⚠️  DRY RUN - No changes made. Use --execute to apply.`));
    } else {
        console.log(chalk.green(`\n  ✅ Reviews created successfully!`));
    }
}

main().catch(console.error);

