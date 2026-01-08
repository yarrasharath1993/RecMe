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
 *   npx tsx scripts/migrate-smart-review-to-columns.ts --limit=100
 *   npx tsx scripts/migrate-smart-review-to-columns.ts --execute
 *   npx tsx scripts/migrate-smart-review-to-columns.ts --full --execute
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
const FULL = hasFlag('full');
const CONCURRENCY = parseInt(getArg('concurrency', '50'));

// ============================================================================
// TYPES
// ============================================================================

interface SmartReview {
    critics_pov?: string;
    audience_pov?: string | null;
    why_to_watch?: string[];
    why_to_skip?: string[];
    legacy_status?: string;
    mood_suitability?: string[];
    content_warnings?: string[];
    best_of_tags?: Record<string, unknown>;
    era_significance?: string | null;
    derivation_confidence?: number;
}

interface Verdict {
    en?: string;
    te?: string;
    final_rating?: number;
    category?: string;
}

interface WhyWatch {
    reasons: string[];
    best_for: string[];
}

interface WhySkip {
    reasons: string[];
}

interface Performances {
    lead?: {
        name: string;
        role: string;
        score: number;
        highlights: string[];
    };
    supporting?: Array<{
        name: string;
        role: string;
        score: number;
    }>;
    chemistry?: string;
}

interface StoryScreenplay {
    plot_summary?: string;
    narrative_style?: string;
    pacing?: string;
    screenplay_score?: number;
    highlights?: string[];
    weaknesses?: string[];
}

interface DirectionTechnicals {
    director_vision?: string;
    cinematography?: string;
    music_score?: string;
    editing?: string;
    production_value?: string;
    technical_score?: number;
}

interface CulturalImpact {
    legacy_status?: string;
    cult_status?: boolean;
    cultural_significance?: string;
    industry_impact?: string;
}

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
    if (rating >= 3) return 'Poor';
    return 'Very Poor';
}

function generateVerdict(movie: any, review: any, smartReview?: SmartReview): Verdict {
    const rating = review?.overall_rating || movie?.avg_rating || movie?.editorial_score || 6;
    const category = getRatingCategory(rating);
    
    let en = smartReview?.critics_pov?.substring(0, 200) || '';
    if (!en && movie?.synopsis) {
        en = movie.synopsis.substring(0, 150) + '...';
    }
    
    return {
        en,
        final_rating: rating,
        category,
    };
}

function generateWhyWatch(movie: any, smartReview?: SmartReview): WhyWatch {
    const reasons: string[] = [];
    const bestFor: string[] = [];
    
    // Use smart_review data first
    if (smartReview?.why_to_watch?.length) {
        reasons.push(...smartReview.why_to_watch.slice(0, 5));
    }
    
    // Generate from movie metadata if not enough
    if (reasons.length < 3) {
        if (movie?.is_classic) reasons.push('Classic Telugu cinema');
        if (movie?.is_blockbuster) reasons.push('Box office blockbuster');
        if (movie?.avg_rating >= 8) reasons.push('Highly rated by audiences');
        if (movie?.awards?.length > 0) reasons.push('Award-winning film');
        if (movie?.hero) reasons.push(`${movie.hero}'s stellar performance`);
        if (movie?.director) reasons.push(`${movie.director}'s vision`);
        if (movie?.music_director) reasons.push(`Memorable music by ${movie.music_director}`);
    }
    
    // Generate best_for from genres
    const genres = movie?.genres || [];
    if (genres.includes('Action')) bestFor.push('Action lovers');
    if (genres.includes('Romance')) bestFor.push('Romance fans');
    if (genres.includes('Comedy')) bestFor.push('Comedy enthusiasts');
    if (genres.includes('Drama')) bestFor.push('Drama aficionados');
    if (genres.includes('Family')) bestFor.push('Family viewing');
    if (genres.includes('Thriller')) bestFor.push('Thriller buffs');
    
    return {
        reasons: reasons.slice(0, 5),
        best_for: bestFor.slice(0, 4),
    };
}

function generateWhySkip(movie: any, smartReview?: SmartReview): WhySkip {
    const reasons: string[] = [];
    
    if (smartReview?.why_to_skip?.length) {
        reasons.push(...smartReview.why_to_skip.slice(0, 3));
    }
    
    // Generate from metadata
    if (reasons.length === 0) {
        const rating = movie?.avg_rating || 5;
        if (rating < 5) reasons.push('Below average ratings');
        if (movie?.runtime > 180) reasons.push('Lengthy runtime');
        
        const genres = movie?.genres || [];
        if (genres.includes('Horror')) reasons.push('Not for the faint-hearted');
        if (genres.includes('Violence') || smartReview?.content_warnings?.includes('violence')) {
            reasons.push('Contains violent scenes');
        }
    }
    
    return { reasons: reasons.slice(0, 3) };
}

function generatePerformances(movie: any): Performances {
    const performances: Performances = {};
    
    if (movie?.hero) {
        performances.lead = {
            name: movie.hero,
            role: 'Lead Actor',
            score: movie?.avg_rating >= 7 ? 8 : 7,
            highlights: ['Captivating screen presence', 'Emotional depth'],
        };
    }
    
    if (movie?.supporting_cast?.length > 0) {
        performances.supporting = movie.supporting_cast.slice(0, 3).map((cast: any) => ({
            name: cast.name,
            role: cast.role || 'Supporting',
            score: 7,
        }));
    }
    
    if (movie?.hero && movie?.heroine) {
        performances.chemistry = 'Good on-screen chemistry between the leads';
    }
    
    return performances;
}

function generateStoryScreenplay(movie: any): StoryScreenplay {
    const genres = movie?.genres || [];
    const pacing = genres.includes('Action') ? 'Fast-paced' : 
                   genres.includes('Drama') ? 'Measured' : 'Balanced';
    
    return {
        plot_summary: movie?.synopsis?.substring(0, 200) || '',
        narrative_style: genres.includes('Thriller') ? 'Non-linear' : 'Linear',
        pacing,
        screenplay_score: movie?.avg_rating >= 7 ? 7.5 : 6.5,
        highlights: ['Engaging storyline', 'Well-written dialogues'],
        weaknesses: [],
    };
}

function generateDirectionTechnicals(movie: any): DirectionTechnicals {
    return {
        director_vision: movie?.director ? `${movie.director}'s direction` : undefined,
        cinematography: movie?.crew?.cinematographer ? `Shot by ${movie.crew.cinematographer}` : 'Visually appealing',
        music_score: movie?.music_director ? `Music by ${movie.music_director}` : undefined,
        editing: movie?.crew?.editor ? `Edited by ${movie.crew.editor}` : 'Crisp editing',
        production_value: 'Quality production',
        technical_score: movie?.avg_rating >= 7 ? 7.5 : 6.5,
    };
}

function generateCulturalImpact(movie: any, smartReview?: SmartReview): CulturalImpact {
    return {
        legacy_status: smartReview?.legacy_status || (movie?.is_classic ? 'classic' : undefined),
        cult_status: movie?.is_cult || false,
        cultural_significance: movie?.is_classic ? 'Part of Telugu cinema heritage' : undefined,
    };
}

// ============================================================================
// MAIN MIGRATION
// ============================================================================

async function migrateReview(review: any, movie: any): Promise<any> {
    const smartReview: SmartReview = review.smart_review || {};
    
    // Generate all 9-section data
    const verdict = generateVerdict(movie, review, smartReview);
    const whyWatch = generateWhyWatch(movie, smartReview);
    const whySkip = generateWhySkip(movie, smartReview);
    const performances = generatePerformances(movie);
    const storyScreenplay = generateStoryScreenplay(movie);
    const directionTechnicals = generateDirectionTechnicals(movie);
    const culturalImpact = generateCulturalImpact(movie, smartReview);
    const moodTags = smartReview.mood_suitability || [];
    const contentWarnings = smartReview.content_warnings || [];
    
    return {
        verdict,
        why_watch: whyWatch,
        why_skip: whySkip,
        performances,
        story_screenplay: storyScreenplay,
        direction_technicals: directionTechnicals,
        cultural_impact: culturalImpact,
        mood_tags: moodTags,
        content_warnings: contentWarnings,
    };
}

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║     SMART REVIEW → UI COLUMNS MIGRATION                              ║
║     Populating verdict, why_watch, performances, etc.                ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
    console.log(`  Limit: ${LIMIT} reviews`);
    console.log(`  Concurrency: ${CONCURRENCY}`);

    // Fetch reviews with their movies
    let query = supabase
        .from('movie_reviews')
        .select(`
            id, movie_id, smart_review, overall_rating,
            verdict, why_watch
        `);
    
    if (!FULL) {
        // Only migrate reviews without populated verdict
        query = query.or('verdict.is.null,verdict.eq.{}');
    }
    
    query = query.limit(LIMIT);
    
    const { data: reviews, error } = await query;
    
    if (error) {
        console.error(chalk.red('Error fetching reviews:'), error.message);
        return;
    }
    
    console.log(`\n  Found ${reviews?.length || 0} reviews to migrate\n`);
    
    if (!reviews || reviews.length === 0) {
        console.log(chalk.yellow('  No reviews to migrate.'));
        return;
    }
    
    // Fetch all relevant movies
    const movieIds = [...new Set(reviews.map(r => r.movie_id))];
    const { data: movies } = await supabase
        .from('movies')
        .select('*')
        .in('id', movieIds);
    
    const movieMap = new Map(movies?.map(m => [m.id, m]) || []);
    
    let migrated = 0;
    let skipped = 0;
    const updates: Array<{ id: string; data: any }> = [];
    
    console.log('  Processing reviews...\n');
    
    for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        const movie = movieMap.get(review.movie_id);
        
        if (!movie) {
            skipped++;
            continue;
        }
        
        try {
            const migrationData = await migrateReview(review, movie);
            
            updates.push({
                id: review.id,
                data: migrationData,
            });
            
            migrated++;
            
            if ((i + 1) % 100 === 0) {
                const pct = Math.round(((i + 1) / reviews.length) * 100);
                console.log(`  [${pct}%] Processed ${i + 1}/${reviews.length} | Migrated: ${migrated}`);
            }
        } catch (err: any) {
            console.error(`  Error processing review ${review.id}:`, err.message);
            skipped++;
        }
    }
    
    console.log(`\n  Processing complete: ${migrated} migrated, ${skipped} skipped`);
    
    // Apply updates in batches
    if (EXECUTE && updates.length > 0) {
        console.log(chalk.cyan(`\n  Applying ${updates.length} updates to database...`));
        
        const BATCH_SIZE = 100;
        let updated = 0;
        
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE);
            
            for (const update of batch) {
                const { error: updateError } = await supabase
                    .from('movie_reviews')
                    .update(update.data)
                    .eq('id', update.id);
                
                if (!updateError) {
                    updated++;
                }
            }
            
            console.log(`  Updated ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length}`);
        }
        
        console.log(chalk.green(`\n  ✅ Successfully updated ${updated} reviews in database`));
    }
    
    // Summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
📊 MIGRATION SUMMARY
═══════════════════════════════════════════════════════════════════`));
    console.log(`  Reviews processed: ${reviews.length}`);
    console.log(`  Reviews migrated:  ${migrated}`);
    console.log(`  Reviews skipped:   ${skipped}`);
    console.log(`  Success rate:      ${Math.round((migrated / reviews.length) * 100)}%`);
    
    if (!EXECUTE) {
        console.log(chalk.yellow(`\n  ⚠️  DRY RUN - No changes made. Use --execute to apply.`));
    }
}

main().catch(console.error);

