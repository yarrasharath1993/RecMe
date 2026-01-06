#!/usr/bin/env npx tsx
/**
 * PAGE DATA COVERAGE CHECK
 *
 * Verifies that all required fields for movie reviews and celebrity pages
 * have data populated. Reports missing fields by category.
 *
 * Usage:
 *   npx tsx scripts/check-page-coverage.ts --page=reviews
 *   npx tsx scripts/check-page-coverage.ts --page=celebrities
 *   npx tsx scripts/check-page-coverage.ts --all
 *   npx tsx scripts/check-page-coverage.ts --page=reviews --decade=2020
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

const PAGE = getArg('page', 'reviews');
const ALL = hasFlag('all');
const DECADE = getArg('decade', '');
const DETAILED = hasFlag('detailed');

// ============================================================================
// FIELD DEFINITIONS
// ============================================================================

interface FieldDef {
    name: string;
    column: string;
    category: 'essential' | 'visual' | 'cast' | 'metadata' | 'ratings' | 'reviews';
    validator: (val: unknown) => boolean;
}

const MOVIE_FIELDS: FieldDef[] = [
    // Essential
    { name: 'Title (English)', column: 'title_en', category: 'essential', validator: v => !!v },
    { name: 'Slug', column: 'slug', category: 'essential', validator: v => !!v },
    { name: 'Release Year', column: 'release_year', category: 'essential', validator: v => !!v && (v as number) > 1900 },
    { name: 'Genres', column: 'genres', category: 'essential', validator: v => Array.isArray(v) && v.length > 0 },
    
    // Visual
    { name: 'Poster Image', column: 'poster_url', category: 'visual', validator: v => !!v && !(v as string).includes('placeholder') },
    { name: 'Backdrop Image', column: 'backdrop_url', category: 'visual', validator: v => !!v },
    
    // Cast
    { name: 'Director', column: 'director', category: 'cast', validator: v => !!v && v !== 'Unknown' },
    { name: 'Hero', column: 'hero', category: 'cast', validator: v => !!v && v !== 'Unknown' },
    { name: 'Heroine', column: 'heroine', category: 'cast', validator: v => !!v && v !== 'Unknown' && v !== 'N/A' },
    { name: 'Music Director', column: 'music_director', category: 'cast', validator: v => !!v },
    { name: 'Producer', column: 'producer', category: 'cast', validator: v => !!v },
    { name: 'Supporting Cast', column: 'supporting_cast', category: 'cast', validator: v => Array.isArray(v) && v.length >= 3 },
    { name: 'Crew Data', column: 'crew', category: 'cast', validator: v => !!v && typeof v === 'object' && Object.keys(v as object).length > 0 },
    
    // Metadata
    { name: 'Synopsis', column: 'synopsis_en', category: 'metadata', validator: v => !!v && (v as string).length > 50 },
    { name: 'Telugu Synopsis', column: 'synopsis_te', category: 'metadata', validator: v => !!v },
    { name: 'TMDB ID', column: 'tmdb_id', category: 'metadata', validator: v => !!v },
    { name: 'Runtime', column: 'runtime_minutes', category: 'metadata', validator: v => !!v && (v as number) > 0 },
    { name: 'Certification', column: 'certification', category: 'metadata', validator: v => !!v },
    { name: 'Trailer URL', column: 'trailer_url', category: 'metadata', validator: v => !!v },
    
    // Ratings
    { name: 'Our Rating', column: 'our_rating', category: 'ratings', validator: v => !!v && (v as number) > 0 },
    { name: 'IMDB Rating', column: 'imdb_rating', category: 'ratings', validator: v => !!v && (v as number) > 0 },
    { name: 'TMDB Rating', column: 'tmdb_rating', category: 'ratings', validator: v => !!v && (v as number) > 0 },
    { name: 'Any External Rating', column: 'avg_rating', category: 'ratings', validator: v => !!v && (v as number) > 0 },
    { name: 'Editorial Score', column: 'editorial_score', category: 'ratings', validator: v => !!v && (v as number) > 0 },
];

const REVIEW_FIELDS: FieldDef[] = [
    { name: 'Has Review', column: 'id', category: 'reviews', validator: v => !!v },
    { name: 'Featured Review', column: 'is_featured', category: 'reviews', validator: v => !!v },
    { name: 'Editorial Review', column: 'dimensions_json', category: 'reviews', validator: v => !!(v as Record<string, unknown>)?._type?.toString().includes('editorial') },
    { name: 'Smart Review', column: 'smart_review', category: 'reviews', validator: v => !!v },
];

// ============================================================================
// COVERAGE CHECK
// ============================================================================

async function checkMovieCoverage(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           MOVIE PAGE DATA COVERAGE                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    // Build base query
    let query = supabase
        .from('movies')
        .select(`
            id, title_en, slug, release_year, genres, poster_url, backdrop_url,
            director, hero, heroine, music_director, producer, supporting_cast, crew,
            synopsis_en, synopsis_te, tmdb_id, runtime_minutes, certification, trailer_url,
            our_rating, imdb_rating, tmdb_rating, avg_rating, editorial_score
        `)
        .eq('language', 'Telugu')
        .eq('is_published', true);

    if (DECADE) {
        const startYear = parseInt(DECADE);
        query = query.gte('release_year', startYear).lt('release_year', startYear + 10);
        console.log(`  Filtering: ${DECADE}s movies\n`);
    }

    const { data: movies, error, count } = await query
        .order('release_year', { ascending: false });

    if (error) {
        console.error(chalk.red('Error:'), error);
        return;
    }

    const totalMovies = movies?.length || 0;
    console.log(`  Total published Telugu movies: ${chalk.cyan(totalMovies)}\n`);

    if (!movies || movies.length === 0) return;

    // Get reviews for these movies
    const movieIds = movies.map(m => m.id);
    const { data: reviews } = await supabase
        .from('movie_reviews')
        .select('movie_id, is_featured, dimensions_json, smart_review')
        .in('movie_id', movieIds)
        .eq('status', 'published');

    const reviewsByMovie = new Map<string, typeof reviews>();
    for (const review of reviews || []) {
        if (!reviewsByMovie.has(review.movie_id)) {
            reviewsByMovie.set(review.movie_id, []);
        }
        reviewsByMovie.get(review.movie_id)!.push(review);
    }

    // Count coverage by category
    const coverage: Record<string, Record<string, { has: number; total: number }>> = {};

    for (const category of ['essential', 'visual', 'cast', 'metadata', 'ratings', 'reviews']) {
        coverage[category] = {};
    }

    // Check each movie
    for (const movie of movies) {
        const movieReviews = reviewsByMovie.get(movie.id) || [];

        // Check movie fields
        for (const field of MOVIE_FIELDS) {
            if (!coverage[field.category][field.name]) {
                coverage[field.category][field.name] = { has: 0, total: 0 };
            }
            coverage[field.category][field.name].total++;
            if (field.validator(movie[field.column as keyof typeof movie])) {
                coverage[field.category][field.name].has++;
            }
        }

        // Check review fields
        for (const field of REVIEW_FIELDS) {
            if (!coverage[field.category][field.name]) {
                coverage[field.category][field.name] = { has: 0, total: 0 };
            }
            coverage[field.category][field.name].total++;

            if (field.name === 'Has Review') {
                if (movieReviews.length > 0) coverage[field.category][field.name].has++;
            } else if (field.name === 'Featured Review') {
                if (movieReviews.some(r => r.is_featured)) coverage[field.category][field.name].has++;
            } else if (field.name === 'Editorial Review') {
                if (movieReviews.some(r => (r.dimensions_json as Record<string, unknown>)?._type?.toString().includes('editorial'))) {
                    coverage[field.category][field.name].has++;
                }
            } else if (field.name === 'Smart Review') {
                if (movieReviews.some(r => r.smart_review)) coverage[field.category][field.name].has++;
            }
        }
    }

    // Print coverage by category
    const categories = ['essential', 'visual', 'cast', 'metadata', 'ratings', 'reviews'];

    for (const category of categories) {
        const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
        console.log(chalk.cyan(`  ${categoryTitle} Fields:\n`));

        for (const [fieldName, stats] of Object.entries(coverage[category])) {
            const pct = Math.round((stats.has / stats.total) * 100);
            const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
            const colorFn = pct >= 80 ? chalk.green : pct >= 50 ? chalk.yellow : chalk.red;
            console.log(`    ${fieldName.padEnd(22)} [${bar}] ${colorFn(`${pct}%`)} (${stats.has}/${stats.total})`);
        }
        console.log('');
    }

    // Summary
    console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════'));
    console.log('  Summary by Priority:\n');

    // Calculate category averages
    for (const category of categories) {
        const fields = Object.values(coverage[category]);
        const avgPct = fields.reduce((sum, f) => sum + (f.has / f.total), 0) / fields.length * 100;
        const colorFn = avgPct >= 80 ? chalk.green : avgPct >= 50 ? chalk.yellow : chalk.red;
        console.log(`    ${category.padEnd(12)} ${colorFn(`${avgPct.toFixed(0)}%`)} average`);
    }

    // Top missing fields
    console.log(chalk.cyan('\n  Top Missing Fields (Priority):\n'));

    const allFields: { name: string; pct: number; missing: number }[] = [];
    for (const category of categories) {
        for (const [name, stats] of Object.entries(coverage[category])) {
            const pct = (stats.has / stats.total) * 100;
            if (pct < 100) {
                allFields.push({ name, pct, missing: stats.total - stats.has });
            }
        }
    }

    allFields.sort((a, b) => a.pct - b.pct);

    for (const field of allFields.slice(0, 10)) {
        const colorFn = field.pct >= 50 ? chalk.yellow : chalk.red;
        console.log(`    ${colorFn(`${field.pct.toFixed(0)}%`.padStart(4))} ${field.name} (${field.missing} missing)`);
    }
}

async function checkCelebrityCoverage(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           CELEBRITY PAGE DATA COVERAGE                               ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    // For now, we derive celebrity data from movies
    // In future, we'd have a dedicated celebrities table

    const { data: movies } = await supabase
        .from('movies')
        .select('director, hero, heroine, music_director, producer')
        .eq('language', 'Telugu')
        .eq('is_published', true);

    if (!movies) return;

    // Count unique celebrities
    const celebrities = new Map<string, { type: string; count: number }>();

    for (const movie of movies) {
        if (movie.director && movie.director !== 'Unknown') {
            const key = movie.director.toLowerCase().trim();
            if (!celebrities.has(key)) {
                celebrities.set(key, { type: 'director', count: 0 });
            }
            celebrities.get(key)!.count++;
        }
        if (movie.hero && movie.hero !== 'Unknown') {
            const key = movie.hero.toLowerCase().trim();
            if (!celebrities.has(key)) {
                celebrities.set(key, { type: 'actor', count: 0 });
            }
            celebrities.get(key)!.count++;
        }
        if (movie.heroine && movie.heroine !== 'Unknown' && movie.heroine !== 'N/A') {
            const key = movie.heroine.toLowerCase().trim();
            if (!celebrities.has(key)) {
                celebrities.set(key, { type: 'actress', count: 0 });
            }
            celebrities.get(key)!.count++;
        }
        if (movie.music_director) {
            const key = movie.music_director.toLowerCase().trim();
            if (!celebrities.has(key)) {
                celebrities.set(key, { type: 'music_director', count: 0 });
            }
            celebrities.get(key)!.count++;
        }
    }

    console.log(`  Unique celebrities found: ${chalk.cyan(celebrities.size)}\n`);

    // Count by type
    const byType = { director: 0, actor: 0, actress: 0, music_director: 0 };
    for (const celeb of celebrities.values()) {
        byType[celeb.type as keyof typeof byType]++;
    }

    console.log('  By Type:');
    console.log(`    Directors:       ${byType.director}`);
    console.log(`    Actors:          ${byType.actor}`);
    console.log(`    Actresses:       ${byType.actress}`);
    console.log(`    Music Directors: ${byType.music_director}`);

    // Top celebrities by movie count
    console.log(chalk.cyan('\n  Top 10 by Movie Count:\n'));

    const sorted = [...celebrities.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);

    for (const [name, info] of sorted) {
        console.log(`    ${info.count.toString().padStart(3)} movies - ${name} (${info.type})`);
    }

    console.log(chalk.yellow(`
  Note: Celebrity pages derive data from movies table.
  Consider creating a dedicated celebrities table with:
    - Profile images
    - Biography
    - Birth date/place
    - Awards
    - Career statistics
`));
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    if (ALL) {
        await checkMovieCoverage();
        await checkCelebrityCoverage();
    } else if (PAGE === 'reviews') {
        await checkMovieCoverage();
    } else if (PAGE === 'celebrities') {
        await checkCelebrityCoverage();
    } else {
        console.log(`Unknown page: ${PAGE}`);
        console.log('Usage: --page=reviews or --page=celebrities or --all');
    }
}

main().catch(console.error);

