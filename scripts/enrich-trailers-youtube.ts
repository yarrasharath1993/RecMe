#!/usr/bin/env npx tsx
/**
 * YOUTUBE TRAILER ENRICHMENT
 * 
 * Uses YouTube Data API to search for and add trailer URLs.
 * Prioritizes recent and popular movies due to API quota limits.
 * 
 * Usage:
 *   npx tsx scripts/enrich-trailers-youtube.ts --execute --limit=100
 *   npx tsx scripts/enrich-trailers-youtube.ts --report-only
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

const EXECUTE = process.argv.includes('--execute');
const REPORT_ONLY = process.argv.includes('--report-only');

// Get limit from command line (default 100 to respect daily quota)
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 100;

const BATCH_DELAY_MS = 2000; // 2 seconds between searches (rate limiting)

interface Movie {
  id: string;
  title_en: string;
  title_te?: string;
  release_year?: number;
  avg_rating?: number;
  trailer_url?: string;
}

let stats = {
  searched: 0,
  found: 0,
  notFound: 0,
  errors: 0,
};

/**
 * Search YouTube for a movie trailer
 */
async function searchYouTubeTrailer(movie: Movie): Promise<string | null> {
  if (!YOUTUBE_API_KEY) {
    console.error(chalk.red('  ❌ YouTube API key not configured'));
    return null;
  }

  try {
    const title = movie.title_te || movie.title_en;
    const year = movie.release_year || '';
    
    // Try multiple search queries for better results
    const queries = [
      `${title} ${year} telugu movie official trailer`,
      `${title} ${year} telugu trailer`,
      `${title} telugu movie trailer`,
    ];

    for (const query of queries) {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        videoDefinition: 'high',
        maxResults: '5',
        key: YOUTUBE_API_KEY,
      });

      const response = await fetch(`${YOUTUBE_API_URL}?${params}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          console.error(chalk.red(`  ❌ YouTube API quota exceeded`));
          stats.errors++;
          return null;
        }
        continue;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // Filter results to find actual trailers
        const trailer = data.items.find((item: any) => {
          const title = item.snippet.title.toLowerCase();
          return title.includes('trailer') || title.includes('teaser');
        });

        if (trailer) {
          const videoId = trailer.id.videoId;
          stats.found++;
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
      
      // Small delay between retry attempts
      await new Promise(r => setTimeout(r, 500));
    }

    stats.notFound++;
    return null;
  } catch (error) {
    console.error(chalk.red(`  Error searching for ${movie.title_en}: ${error}`));
    stats.errors++;
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║         YOUTUBE TRAILER ENRICHMENT                                   ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  if (!YOUTUBE_API_KEY) {
    console.error(chalk.red('  ❌ YouTube API key not found in .env.local'));
    console.error(chalk.yellow('  Please set YOUTUBE_API_KEY in .env.local\n'));
    return;
  }

  // Load movies needing trailers (prioritized)
  console.log(chalk.cyan(`  📋 Loading movies without trailers (prioritized)...`));
  
  const { data: allMovies, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, avg_rating, trailer_url')
    .eq('language', 'Telugu')
    .is('trailer_url', null)
    .order('release_year', { ascending: false }) // Recent first
    .order('avg_rating', { ascending: false, nullsLast: true }) // Popular first
    .limit(LIMIT * 2); // Get more to account for movies without ratings

  if (error || !allMovies) {
    console.error(chalk.red(`  ❌ Error loading movies: ${error?.message}`));
    return;
  }

  // Prioritize movies with ratings
  const moviesWithRatings = allMovies.filter(m => m.avg_rating && m.avg_rating > 0);
  const moviesWithoutRatings = allMovies.filter(m => !m.avg_rating || m.avg_rating === 0);
  
  // Take first LIMIT movies, prioritizing those with ratings
  const moviesToProcess = [
    ...moviesWithRatings.slice(0, Math.floor(LIMIT * 0.8)),
    ...moviesWithoutRatings.slice(0, Math.ceil(LIMIT * 0.2))
  ].slice(0, LIMIT);

  console.log(chalk.green(`  ✅ Loaded ${moviesToProcess.length} movies to process\n`));

  // Report mode
  if (REPORT_ONLY) {
    console.log(chalk.cyan(`  📊 TRAILER GAPS:`));
    console.log(chalk.gray(`    Total movies without trailers: ${allMovies.length}`));
    console.log(chalk.gray(`    Selected for processing: ${moviesToProcess.length}`));
    console.log(chalk.gray(`    YouTube API quota: 100 searches/day\n`));
    
    console.log(chalk.yellow(`  ⚠️  REPORT-ONLY MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
    return;
  }

  if (!EXECUTE) {
    console.log(chalk.yellow(`  ⚠️  DRY RUN MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
    return;
  }

  // Start enrichment
  console.log(chalk.cyan(`  🎬 Searching for trailers...\n`));
  const startTime = Date.now();

  for (let i = 0; i < moviesToProcess.length; i++) {
    const movie = moviesToProcess[i];
    
    console.log(chalk.gray(`  [${i + 1}/${moviesToProcess.length}] ${movie.title_en} (${movie.release_year || 'N/A'})`));
    
    const trailerUrl = await searchYouTubeTrailer(movie);
    stats.searched++;

    if (trailerUrl) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ trailer_url: trailerUrl })
        .eq('id', movie.id);

      if (updateError) {
        console.error(chalk.red(`    Error updating: ${updateError.message}`));
      } else {
        console.log(chalk.green(`    ✓ Trailer found and saved`));
      }
    } else {
      console.log(chalk.yellow(`    ⚠️  No trailer found`));
    }

    // Rate limiting delay (except for last item)
    if (i < moviesToProcess.length - 1) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }

    // Progress update every 10 movies
    if ((i + 1) % 10 === 0) {
      console.log(chalk.cyan(`\n  Progress: ${i + 1}/${moviesToProcess.length} (${stats.found} found, ${stats.notFound} not found)\n`));
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Final report
  console.log(chalk.green(`\n  ✅ Trailer search complete!\n`));

  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            ENRICHMENT COMPLETE!                                      ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.green(`  Total movies searched: ${stats.searched}`));
  console.log(chalk.green(`  Duration: ${duration} minutes\n`));

  console.log(chalk.green(`  ✅ Trailers found: ${stats.found}`));
  console.log(chalk.yellow(`  ⚠️  Trailers not found: ${stats.notFound}`));
  console.log(chalk.red(`  ❌ Errors: ${stats.errors}\n`));

  const successRate = stats.searched > 0 ? ((stats.found / stats.searched) * 100).toFixed(1) : 0;
  console.log(chalk.cyan(`  Success rate: ${successRate}%\n`));

  console.log(chalk.cyan(`  💡 Run audit to see improvements:`));
  console.log(chalk.gray(`     npx tsx scripts/audit-movie-data-completeness.ts\n`));
  
  console.log(chalk.cyan(`  💡 To process more movies (respecting daily quota):`));
  console.log(chalk.gray(`     npx tsx scripts/enrich-trailers-youtube.ts --execute --limit=100\n`));
}

main();
