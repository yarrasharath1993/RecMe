/**
 * Enrichment Status Checker
 *
 * Shows the current status of data enrichment across all categories
 *
 * Usage:
 *   npx tsx scripts/check-enrichment-status.ts
 *   npx tsx scripts/check-enrichment-status.ts --detailed
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DETAILED = process.argv.includes('--detailed');

function progressBar(percent: number, width: number = 20): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percent}%`;
}

function statusIcon(percent: number): string {
    if (percent >= 90) return '🟢';
    if (percent >= 70) return '🟡';
    if (percent >= 50) return '🟠';
    return '🔴';
}

async function main(): Promise<void> {
    console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║               TELUGU PORTAL ENRICHMENT STATUS                         ║');
    console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

    const timestamp = new Date().toISOString().split('T')[0];
    console.log(`📅 Report Date: ${timestamp}\n`);

    // Get total movies
    const { count: totalMovies } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu');

    console.log(`📊 Total Telugu Movies: ${totalMovies}\n`);
    console.log('─'.repeat(70));

    // Image Coverage
    const { count: withImages } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu')
        .not('poster_url', 'is', null)
        .not('poster_url', 'ilike', '%placeholder%');

    const imagePercent = Math.round(((withImages || 0) / (totalMovies || 1)) * 100);
    console.log(`\n🖼️  IMAGES`);
    console.log(`   ${statusIcon(imagePercent)} ${progressBar(imagePercent)}`);
    console.log(`   ${withImages} / ${totalMovies} movies have real images`);

    // Hero Coverage
    const { count: withHero } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu')
        .not('hero', 'is', null)
        .not('hero', 'eq', 'Unknown');

    const heroPercent = Math.round(((withHero || 0) / (totalMovies || 1)) * 100);
    console.log(`\n🎭 LEAD ACTOR (Hero)`);
    console.log(`   ${statusIcon(heroPercent)} ${progressBar(heroPercent)}`);
    console.log(`   ${withHero} / ${totalMovies} movies have lead actor data`);

    // Heroine Coverage
    const { count: withHeroine } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu')
        .not('heroine', 'is', null)
        .not('heroine', 'eq', 'Unknown');

    const heroinePercent = Math.round(((withHeroine || 0) / (totalMovies || 1)) * 100);
    console.log(`\n💃 LEAD ACTRESS (Heroine)`);
    console.log(`   ${statusIcon(heroinePercent)} ${progressBar(heroinePercent)}`);
    console.log(`   ${withHeroine} / ${totalMovies} movies have lead actress data`);

    // Director Coverage
    const { count: withDirector } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu')
        .not('director', 'is', null)
        .not('director', 'eq', 'Unknown');

    const directorPercent = Math.round(((withDirector || 0) / (totalMovies || 1)) * 100);
    console.log(`\n🎬 DIRECTOR`);
    console.log(`   ${statusIcon(directorPercent)} ${progressBar(directorPercent)}`);
    console.log(`   ${withDirector} / ${totalMovies} movies have director data`);

    // Synopsis Coverage
    const { count: withSynopsis } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu')
        .not('synopsis', 'is', null)
        .neq('synopsis', '');

    const synopsisPercent = Math.round(((withSynopsis || 0) / (totalMovies || 1)) * 100);
    console.log(`\n📝 SYNOPSIS`);
    console.log(`   ${statusIcon(synopsisPercent)} ${progressBar(synopsisPercent)}`);
    console.log(`   ${withSynopsis} / ${totalMovies} movies have synopsis`);

    // Review Coverage
    const { count: withReview } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu')
        .not('review', 'is', null)
        .neq('review', '');

    const reviewPercent = Math.round(((withReview || 0) / (totalMovies || 1)) * 100);
    console.log(`\n✍️  REVIEWS`);
    console.log(`   ${statusIcon(reviewPercent)} ${progressBar(reviewPercent)}`);
    console.log(`   ${withReview} / ${totalMovies} movies have reviews`);

    // Rating Coverage
    const { count: withRating } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu')
        .not('ox_rating', 'is', null)
        .gt('ox_rating', 0);

    const ratingPercent = Math.round(((withRating || 0) / (totalMovies || 1)) * 100);
    console.log(`\n⭐ RATINGS`);
    console.log(`   ${statusIcon(ratingPercent)} ${progressBar(ratingPercent)}`);
    console.log(`   ${withRating} / ${totalMovies} movies have ratings`);

    // Genre Coverage
    const { count: withGenres } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu')
        .not('genres', 'is', null);

    const genrePercent = Math.round(((withGenres || 0) / (totalMovies || 1)) * 100);
    console.log(`\n🏷️  GENRES`);
    console.log(`   ${statusIcon(genrePercent)} ${progressBar(genrePercent)}`);
    console.log(`   ${withGenres} / ${totalMovies} movies have genres`);

    // TMDB ID Coverage (useful for further enrichment)
    const { count: withTmdb } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'Telugu')
        .not('tmdb_id', 'is', null);

    const tmdbPercent = Math.round(((withTmdb || 0) / (totalMovies || 1)) * 100);
    console.log(`\n🔗 TMDB IDs`);
    console.log(`   ${statusIcon(tmdbPercent)} ${progressBar(tmdbPercent)}`);
    console.log(`   ${withTmdb} / ${totalMovies} movies linked to TMDB`);

    // Summary
    console.log('\n' + '─'.repeat(70));
    console.log('\n📈 OVERALL SUMMARY\n');

    const metrics = [
        { name: 'Images', percent: imagePercent },
        { name: 'Lead Actor', percent: heroPercent },
        { name: 'Lead Actress', percent: heroinePercent },
        { name: 'Director', percent: directorPercent },
        { name: 'Synopsis', percent: synopsisPercent },
        { name: 'Reviews', percent: reviewPercent },
        { name: 'Ratings', percent: ratingPercent },
        { name: 'Genres', percent: genrePercent },
    ];

    const avgCompletion = Math.round(
        metrics.reduce((sum, m) => sum + m.percent, 0) / metrics.length
    );

    console.log(`   Average Completion: ${avgCompletion}%\n`);

    // Priority recommendations
    console.log('🎯 PRIORITY RECOMMENDATIONS:\n');

    const sorted = [...metrics].sort((a, b) => a.percent - b.percent);

    for (let i = 0; i < 3; i++) {
        const m = sorted[i];
        const target = Math.min(m.percent + 15, 95);
        const moviesNeeded = Math.round(((target - m.percent) / 100) * (totalMovies || 0));
        console.log(`   ${i + 1}. ${m.name}: ${m.percent}% → Target ${target}% (+${moviesNeeded} movies)`);
    }

    if (DETAILED) {
        console.log('\n' + '─'.repeat(70));
        console.log('\n📋 DETAILED BREAKDOWN BY DECADE\n');

        const decades = ['1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

        for (const decade of decades) {
            const startYear = parseInt(decade.replace('s', ''));

            const { count: decadeTotal } = await supabase
                .from('movies')
                .select('*', { count: 'exact', head: true })
                .eq('language', 'Telugu')
                .gte('release_year', startYear)
                .lt('release_year', startYear + 10);

            const { count: decadeImages } = await supabase
                .from('movies')
                .select('*', { count: 'exact', head: true })
                .eq('language', 'Telugu')
                .gte('release_year', startYear)
                .lt('release_year', startYear + 10)
                .not('poster_url', 'is', null)
                .not('poster_url', 'ilike', '%placeholder%');

            const pct = Math.round(((decadeImages || 0) / (decadeTotal || 1)) * 100);
            console.log(`   ${decade}: ${decadeTotal} movies, ${pct}% with images`);
        }
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`Report generated: ${new Date().toISOString()}`);
    console.log('═'.repeat(70) + '\n');
}

main().catch(console.error);

