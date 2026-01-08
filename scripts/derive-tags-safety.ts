#!/usr/bin/env npx tsx
/**
 * TAGS & SAFETY DERIVATION SCRIPT
 *
 * Derives and populates:
 * - mood_tags (thrilling, emotional, uplifting, nostalgic, romantic)
 * - content_flags (pan_india, biopic, remake, sequel)
 * - trigger_warnings (violence, substance_use, strong_language)
 * - audience_fit (kids_friendly, family_watch, date_movie)
 * - quality_tags (masterpiece, must_watch, worth_watching, etc.)
 *
 * Based on existing tag-derivation.ts library logic.
 *
 * Usage:
 *   npx tsx scripts/derive-tags-safety.ts --limit=500
 *   npx tsx scripts/derive-tags-safety.ts --execute
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

interface Movie {
    id: string;
    title_en: string;
    release_year: number;
    genres: string[] | null;
    our_rating: number | null;
    avg_rating: number | null;
    certification: string | null;
    synopsis: string | null;
    is_classic: boolean;
    is_blockbuster: boolean;
    content_flags: Record<string, boolean> | null;
    mood_tags: string[] | null;
    trigger_warnings: string[] | null;
    audience_fit: Record<string, boolean> | null;
    quality_tags: string[] | null;
}

// ============================================================================
// DERIVATION LOGIC
// ============================================================================

const GENRE_MOOD_MAP: Record<string, string[]> = {
    'Action': ['thrilling', 'adrenaline'],
    'Drama': ['emotional', 'intense'],
    'Romance': ['romantic', 'heartwarming'],
    'Comedy': ['fun', 'lighthearted'],
    'Thriller': ['thrilling', 'suspenseful'],
    'Horror': ['scary', 'intense'],
    'Family': ['heartwarming', 'family'],
    'Musical': ['uplifting', 'nostalgic'],
    'Historical': ['nostalgic', 'emotional'],
    'War': ['intense', 'emotional'],
    'Sports': ['inspiring', 'adrenaline'],
    'Crime': ['intense', 'thrilling'],
    'Fantasy': ['magical', 'fun'],
    'Sci-Fi': ['thought-provoking', 'thrilling'],
};

const SYNOPSIS_TRIGGER_PATTERNS: Record<string, RegExp[]> = {
    violence: [
        /murder|kill|death|blood|fight|war|battle|weapon|gun|knife|attack/i,
    ],
    substance_use: [
        /alcohol|drink|drunk|drug|smoking|cigarette|liquor|bar/i,
    ],
    strong_language: [
        /vulgar|abuse|slang|language|curse/i,
    ],
    emotional_distress: [
        /suicide|depression|trauma|abuse|assault|death of|grief|loss/i,
    ],
    adult_themes: [
        /adult|mature|sensual|intimate|romance.*explicit/i,
    ],
};

function deriveMoodTags(movie: Movie): string[] {
    const moods = new Set<string>();
    
    // From genres
    if (movie.genres) {
        for (const genre of movie.genres) {
            const genreMoods = GENRE_MOOD_MAP[genre];
            if (genreMoods) {
                genreMoods.forEach(m => moods.add(m));
            }
        }
    }

    // From year (classics are nostalgic)
    if (movie.release_year && movie.release_year < 2000) {
        moods.add('nostalgic');
    }
    if (movie.is_classic) {
        moods.add('nostalgic');
        moods.add('timeless');
    }

    // From rating (high-rated = must-see)
    const rating = movie.our_rating || movie.avg_rating || 0;
    if (rating >= 8) {
        moods.add('must-see');
    }

    return [...moods].slice(0, 5);
}

function deriveTriggerWarnings(movie: Movie): string[] {
    const warnings: string[] = [];
    
    if (!movie.synopsis) return warnings;

    for (const [warning, patterns] of Object.entries(SYNOPSIS_TRIGGER_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(movie.synopsis)) {
                warnings.push(warning);
                break;
            }
        }
    }

    // From certification
    if (movie.certification) {
        if (movie.certification === 'A' || movie.certification === 'R') {
            if (!warnings.includes('adult_themes')) {
                warnings.push('adult_themes');
            }
        }
    }

    // From genres
    if (movie.genres) {
        if (movie.genres.includes('Horror')) {
            if (!warnings.includes('violence')) {
                warnings.push('scary_content');
            }
        }
        if (movie.genres.includes('War') || movie.genres.includes('Crime')) {
            if (!warnings.includes('violence')) {
                warnings.push('violence');
            }
        }
    }

    return [...new Set(warnings)];
}

function deriveAudienceFit(movie: Movie): Record<string, boolean> {
    const fit: Record<string, boolean> = {
        kids_friendly: false,
        family_watch: false,
        date_movie: false,
        solo_watch: false,
        group_watch: false,
    };

    const genres = movie.genres || [];
    const cert = movie.certification || '';

    // Kids friendly
    if (
        (genres.includes('Family') || genres.includes('Animation')) &&
        !['A', 'R', 'UA'].includes(cert) &&
        !genres.includes('Horror')
    ) {
        fit.kids_friendly = true;
    }

    // Family watch
    if (
        (genres.includes('Family') || genres.includes('Drama') || genres.includes('Comedy')) &&
        !['A', 'R'].includes(cert)
    ) {
        fit.family_watch = true;
    }

    // Date movie
    if (genres.includes('Romance') || genres.includes('Comedy')) {
        fit.date_movie = true;
    }

    // Solo watch (thrillers, dramas)
    if (genres.includes('Thriller') || genres.includes('Mystery') || genres.includes('Psychological')) {
        fit.solo_watch = true;
    }

    // Group watch (action, comedy)
    if (genres.includes('Action') || genres.includes('Comedy') || genres.includes('Sports')) {
        fit.group_watch = true;
    }

    return fit;
}

function deriveQualityTags(movie: Movie): string[] {
    const tags: string[] = [];
    const rating = movie.our_rating || movie.avg_rating || 0;

    if (rating >= 9) {
        tags.push('masterpiece');
    } else if (rating >= 8) {
        tags.push('must_watch');
    } else if (rating >= 7) {
        tags.push('worth_watching');
    } else if (rating >= 6) {
        tags.push('one_time_watch');
    } else if (rating >= 4) {
        tags.push('average');
    } else if (rating > 0) {
        tags.push('skip_worthy');
    }

    if (movie.is_blockbuster) {
        tags.push('blockbuster');
    }
    if (movie.is_classic) {
        tags.push('classic');
    }

    return tags;
}

function deriveContentFlags(movie: Movie): Record<string, boolean> {
    const flags: Record<string, boolean> = {
        pan_india: false,
        biopic: false,
        remake: false,
        sequel: false,
        dubbed: false,
    };

    const synopsis = (movie.synopsis || '').toLowerCase();
    const title = movie.title_en.toLowerCase();

    // Pan India check
    if (
        synopsis.includes('pan india') ||
        synopsis.includes('pan-india') ||
        (movie.release_year && movie.release_year >= 2018 && movie.our_rating && movie.our_rating >= 8)
    ) {
        flags.pan_india = true;
    }

    // Biopic check
    if (
        synopsis.includes('biopic') ||
        synopsis.includes('true story') ||
        synopsis.includes('real life') ||
        synopsis.includes('life story') ||
        synopsis.includes('biography')
    ) {
        flags.biopic = true;
    }

    // Sequel check
    if (/\b(2|II|part 2|sequel|returns)\b/i.test(title)) {
        flags.sequel = true;
    }

    // Remake check
    if (
        synopsis.includes('remake') ||
        synopsis.includes('adapted from')
    ) {
        flags.remake = true;
    }

    return flags;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           TAGS & SAFETY DERIVATION SCRIPT                            ║
║   Derives mood_tags, content_flags, trigger_warnings, audience_fit   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
    console.log(`  Limit: ${LIMIT} movies\n`);

    // Fetch movies missing tags
    const { data: movies, error } = await supabase
        .from('movies')
        .select('id, title_en, release_year, genres, our_rating, avg_rating, certification, synopsis, is_classic, is_blockbuster, content_flags, mood_tags, trigger_warnings, audience_fit, quality_tags')
        .eq('language', 'Telugu')
        .or('mood_tags.is.null,quality_tags.is.null,audience_fit.is.null')
        .limit(LIMIT);

    if (error) {
        console.error(chalk.red('Error fetching movies:'), error);
        return;
    }

    console.log(`  Found ${chalk.cyan(movies?.length || 0)} movies to process\n`);

    if (!movies || movies.length === 0) {
        console.log(chalk.green('  ✅ No movies need processing.'));
        return;
    }

    // Process movies
    let processed = 0;
    let enriched = 0;
    let updated = 0;
    const tagCounts = {
        mood_tags: 0,
        trigger_warnings: 0,
        audience_fit: 0,
        quality_tags: 0,
        content_flags: 0,
    };

    for (const movie of movies) {
        processed++;

        const updateData: Record<string, unknown> = {};

        // Derive mood tags
        if (!movie.mood_tags || movie.mood_tags.length === 0) {
            const moodTags = deriveMoodTags(movie as Movie);
            if (moodTags.length > 0) {
                updateData.mood_tags = moodTags;
                tagCounts.mood_tags++;
            }
        }

        // Derive trigger warnings
        if (!movie.trigger_warnings || movie.trigger_warnings.length === 0) {
            const warnings = deriveTriggerWarnings(movie as Movie);
            if (warnings.length > 0) {
                updateData.trigger_warnings = warnings;
                tagCounts.trigger_warnings++;
            }
        }

        // Derive audience fit
        if (!movie.audience_fit) {
            const fit = deriveAudienceFit(movie as Movie);
            updateData.audience_fit = fit;
            tagCounts.audience_fit++;
        }

        // Derive quality tags
        if (!movie.quality_tags || movie.quality_tags.length === 0) {
            const qualityTags = deriveQualityTags(movie as Movie);
            if (qualityTags.length > 0) {
                updateData.quality_tags = qualityTags;
                tagCounts.quality_tags++;
            }
        }

        // Derive content flags
        if (!movie.content_flags) {
            const flags = deriveContentFlags(movie as Movie);
            updateData.content_flags = flags;
            tagCounts.content_flags++;
        }

        if (Object.keys(updateData).length > 0) {
            enriched++;

            if (EXECUTE) {
                const { error: updateError } = await supabase
                    .from('movies')
                    .update(updateData)
                    .eq('id', movie.id);

                if (!updateError) {
                    updated++;
                }
            }
        }

        // Progress
        if (processed % 100 === 0) {
            const pct = Math.round((processed / movies.length) * 100);
            console.log(`  [${pct}%] Processed ${processed}/${movies.length} | Enriched: ${enriched}`);
        }
    }

    // Summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
📊 TAGS & SAFETY SUMMARY
═══════════════════════════════════════════════════════════════════`));
    console.log(`  Processed:     ${movies.length} movies`);
    console.log(`  Enriched:      ${chalk.green(enriched)} movies`);
    console.log(`  Updated in DB: ${updated}`);
    console.log(`  Success rate:  ${Math.round((enriched / movies.length) * 100)}%`);
    console.log(`
  By Tag Type:`);
    console.log(`    Mood Tags:         ${tagCounts.mood_tags}`);
    console.log(`    Trigger Warnings:  ${tagCounts.trigger_warnings}`);
    console.log(`    Audience Fit:      ${tagCounts.audience_fit}`);
    console.log(`    Quality Tags:      ${tagCounts.quality_tags}`);
    console.log(`    Content Flags:     ${tagCounts.content_flags}`);

    if (!EXECUTE) {
        console.log(chalk.yellow(`
  ⚠️  DRY RUN - No changes were made.
  Run with --execute to apply changes.`));
    } else {
        console.log(chalk.green(`
  ✅ Tags & safety derivation complete!`));
    }
}

main().catch(console.error);

