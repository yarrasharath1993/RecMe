#!/usr/bin/env npx tsx
/**
 * TURBO MODE: TMDB Enrichment with Parallel Processing
 * 
 * 🚀 5-10x FASTER than standard version
 * Processes 5 movies in parallel, respecting TMDB rate limits
 * 
 * Usage:
 *   npx tsx scripts/enrich-movies-tmdb-turbo.ts --language=Telugu --limit=650
 *   npx tsx scripts/enrich-movies-tmdb-turbo.ts --missing-telugu-titles --limit=650
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

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// TURBO CONFIG
const PARALLEL_BATCH_SIZE = 5;  // Process 5 movies at once
const BATCH_DELAY_MS = 1500;     // 1.5 seconds between batches (respects 40 req/10sec limit)

interface Movie {
  id: string;
  title_en: string;
  title_te?: string | null;
  release_year?: number | null;
  tmdb_id?: number | null;
  language?: string | null;
  director?: string | null;
}

/**
 * Search TMDB for a movie
 */
async function searchTMDB(title: string, year?: number): Promise<any | null> {
  if (!TMDB_API_KEY) return null;
  
  try {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      query: title,
      language: 'en-US',
    });
    if (year) params.append('year', year.toString());
    
    const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get movie details with credits
 */
async function getTMDBDetails(tmdbId: number): Promise<any | null> {
  if (!TMDB_API_KEY) return null;
  
  try {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      append_to_response: 'credits,translations',
    });
    
    const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?${params}`);
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Extract Telugu title from translations
 */
function extractTeluguTitle(tmdbData: any): string | null {
  const translations = tmdbData.translations?.translations || [];
  const teluguTranslation = translations.find((t: any) => 
    t.iso_3166_1 === 'IN' && t.iso_639_1 === 'te'
  );
  
  return teluguTranslation?.data?.title || null;
}

/**
 * Enrich a single movie (TURBO)
 */
async function enrichMovie(movie: Movie): Promise<{ success: boolean; changes: string[] }> {
  const changes: string[] = [];
  
  try {
    // Get TMDB data
    let tmdbData = null;
    
    if (movie.tmdb_id) {
      // Direct fetch (faster)
      tmdbData = await getTMDBDetails(movie.tmdb_id);
    } else {
      // Search first
      const searchResult = await searchTMDB(movie.title_en, movie.release_year || undefined);
      if (searchResult) {
        tmdbData = await getTMDBDetails(searchResult.id);
      }
    }
    
    if (!tmdbData) {
      return { success: false, changes: [] };
    }
    
    // Extract fields
    const updates: any = {};
    
    // Telugu title
    if (!movie.title_te) {
      const teluguTitle = extractTeluguTitle(tmdbData);
      if (teluguTitle) {
        updates.title_te = teluguTitle;
        changes.push('title_te');
      }
    }
    
    // Release year
    if (!movie.release_year && tmdbData.release_date) {
      updates.release_year = parseInt(tmdbData.release_date.split('-')[0]);
      changes.push('release_year');
    }
    
    // Director
    if (!movie.director && tmdbData.credits?.crew) {
      const director = tmdbData.credits.crew.find((c: any) => c.job === 'Director');
      if (director) {
        updates.director = director.name;
        changes.push('director');
      }
    }
    
    // Language
    if (!movie.language && tmdbData.original_language) {
      const langMap: Record<string, string> = {
        'te': 'Telugu', 'ta': 'Tamil', 'hi': 'Hindi',
        'ml': 'Malayalam', 'kn': 'Kannada', 'en': 'English',
      };
      updates.language = langMap[tmdbData.original_language] || tmdbData.original_language;
      changes.push('language');
    }
    
    // Store TMDB ID if not present
    if (!movie.tmdb_id && tmdbData.id) {
      updates.tmdb_id = tmdbData.id;
      changes.push('tmdb_id');
    }
    
    // Update database if we have changes
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);
      
      if (error) {
        return { success: false, changes: [] };
      }
      
      return { success: true, changes };
    }
    
    return { success: false, changes: [] };
    
  } catch (error) {
    return { success: false, changes: [] };
  }
}

/**
 * Process movies in parallel batches (TURBO!)
 */
async function processBatch(movies: Movie[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  // Process in parallel batches
  for (let i = 0; i < movies.length; i += PARALLEL_BATCH_SIZE) {
    const batch = movies.slice(i, i + PARALLEL_BATCH_SIZE);
    
    // Process batch in parallel
    const results = await Promise.all(
      batch.map(movie => enrichMovie(movie))
    );
    
    // Count results
    results.forEach((result, idx) => {
      if (result.success) {
        success++;
        const movie = batch[idx];
        console.log(chalk.green(`  ✓ ${movie.title_en} → ${result.changes.join(', ')}`));
      } else {
        failed++;
      }
    });
    
    // Progress
    const processed = Math.min(i + PARALLEL_BATCH_SIZE, movies.length);
    console.log(chalk.cyan(`  Progress: ${processed}/${movies.length} (${success} enriched)`));
    
    // Rate limit delay between batches
    if (i + PARALLEL_BATCH_SIZE < movies.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }
  
  return { success, failed };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string, defaultValue: string = '') => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };
  
  const LANGUAGE = getArg('language', 'Telugu');
  const LIMIT = parseInt(getArg('limit', '650'), 10);
  const MISSING_TITLES = args.includes('--missing-telugu-titles');
  
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            TURBO MODE: TMDB ENRICHMENT (5x FASTER!)                  ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.yellow(`  🚀 TURBO MODE ENABLED`));
  console.log(chalk.gray(`  Parallel batches: ${PARALLEL_BATCH_SIZE} movies at once`));
  console.log(chalk.gray(`  Batch delay: ${BATCH_DELAY_MS}ms`));
  console.log(chalk.gray(`  Language: ${LANGUAGE}`));
  console.log(chalk.gray(`  Limit: ${LIMIT}\n`));
  
  // Fetch movies
  let query = supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, tmdb_id, language, director')
    .eq('language', LANGUAGE)
    .limit(LIMIT);
  
  if (MISSING_TITLES) {
    query = query.is('title_te', null);
  }
  
  const { data: movies, error } = await query;
  
  if (error || !movies) {
    console.error(chalk.red(`  ❌ Error fetching movies: ${error?.message}`));
    return;
  }
  
  console.log(chalk.blue(`  📋 Found ${movies.length} movies to enrich\n`));
  
  const startTime = Date.now();
  
  // Process in turbo mode
  const { success, failed } = await processBatch(movies);
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║            TURBO ENRICHMENT COMPLETE!                                ║'));
  console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.gray(`  Total processed: ${movies.length}`));
  console.log(chalk.green(`  Successfully enriched: ${success}`));
  console.log(chalk.red(`  Failed: ${failed}`));
  console.log(chalk.cyan(`  Duration: ${duration} minutes`));
  console.log(chalk.yellow(`  Speed: ${(movies.length / parseFloat(duration)).toFixed(1)} movies/minute 🚀\n`));
}

main().catch(console.error);
