#!/usr/bin/env npx tsx
/**
 * FIX MISSING CRITICAL DATA - BATCH
 * 
 * Leverages existing enrichment systems to fix 52 movies with missing year/director
 * Uses: enrich-movies-tmdb.ts, multi-source-orchestrator.ts
 * 
 * Usage:
 *   npx tsx scripts/fix-missing-critical-data-batch.ts
 *   npx tsx scripts/fix-missing-critical-data-batch.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import axios from 'axios';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

interface MovieToFix {
  id: string;
  title_en: string;
  release_year?: number | null;
  director?: string | null;
  tmdb_id?: number | null;
  language?: string | null;
  missingFields: string[];
}

/**
 * Search TMDB for movie by title
 */
async function searchTMDB(title: string): Promise<any | null> {
  if (!TMDB_API_KEY) {
    console.log(chalk.red('    ❌ TMDB API key not found'));
    return null;
  }

  try {
    const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        language: 'en-US',
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0]; // Return first result
    }
    return null;
  } catch (error) {
    console.log(chalk.red(`    ❌ TMDB search error: ${error}`));
    return null;
  }
}

/**
 * Get movie details from TMDB
 */
async function getTMDBDetails(tmdbId: number): Promise<any | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: 'credits',
      },
    });

    return response.data;
  } catch (error) {
    console.log(chalk.red(`    ❌ TMDB details error: ${error}`));
    return null;
  }
}

/**
 * Extract missing fields from TMDB data
 */
function extractFields(movie: MovieToFix, tmdbData: any): Partial<MovieToFix> {
  const updates: any = {};

  // Extract year
  if (movie.missingFields.includes('release_year') && !movie.release_year && tmdbData.release_date) {
    updates.release_year = parseInt(tmdbData.release_date.split('-')[0]);
    console.log(chalk.yellow(`    → Found year: ${updates.release_year}`));
  }

  // Extract director from credits
  if (movie.missingFields.includes('director') && !movie.director && tmdbData.credits?.crew) {
    const director = tmdbData.credits.crew.find((c: any) => c.job === 'Director');
    if (director) {
      updates.director = director.name;
      console.log(chalk.yellow(`    → Found director: ${updates.director}`));
    }
  }

  // Extract language
  if (movie.missingFields.includes('language') && !movie.language && tmdbData.original_language) {
    const langMap: Record<string, string> = {
      'te': 'Telugu',
      'ta': 'Tamil',
      'hi': 'Hindi',
      'ml': 'Malayalam',
      'kn': 'Kannada',
      'en': 'English',
    };
    updates.language = langMap[tmdbData.original_language] || tmdbData.original_language;
    console.log(chalk.yellow(`    → Found language: ${updates.language}`));
  }

  // Store TMDB ID if not present
  if (!movie.tmdb_id && tmdbData.id) {
    updates.tmdb_id = tmdbData.id;
    console.log(chalk.yellow(`    → Found TMDB ID: ${updates.tmdb_id}`));
  }

  return updates;
}

/**
 * Load movies needing fixes from action plan
 */
async function loadMoviesNeedingFixes(): Promise<MovieToFix[]> {
  const csvPath = 'docs/audit-reports/suspicious-entries.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(chalk.red(`CSV not found: ${csvPath}`));
    return [];
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  const movies: MovieToFix[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 7 && parts[4] === 'critical') {
      const id = parts[0].trim();
      const title = parts[1].replace(/"/g, '').trim();
      const missingFieldsStr = parts[6].replace(/"/g, '').trim();
      const missingFields = missingFieldsStr ? missingFieldsStr.split(';') : [];

      // Skip placeholder titles
      if (title.length <= 5 && /^[A-Z0-9]+$/.test(title)) continue;
      
      // Skip future releases
      if (title.includes('Pushpa 3') || title.includes('Devara 2')) continue;

      // Fetch from DB
      const { data: movieData } = await supabase
        .from('movies')
        .select('id, title_en, release_year, director, tmdb_id, language')
        .eq('id', id)
        .single();

      if (movieData) {
        movies.push({
          id: movieData.id,
          title_en: movieData.title_en,
          release_year: movieData.release_year,
          director: movieData.director,
          tmdb_id: movieData.tmdb_id,
          language: movieData.language,
          missingFields,
        });
      }
    }
  }

  return movies;
}

/**
 * Enrich a single movie
 */
async function enrichMovie(movie: MovieToFix, execute: boolean): Promise<boolean> {
  console.log(chalk.blue(`\n  Processing: "${movie.title_en}"`));
  console.log(chalk.gray(`    Missing: ${movie.missingFields.join(', ')}`));

  // If we have TMDB ID, fetch details directly
  let tmdbData = null;
  if (movie.tmdb_id) {
    console.log(chalk.gray(`    Using existing TMDB ID: ${movie.tmdb_id}`));
    tmdbData = await getTMDBDetails(movie.tmdb_id);
  } else {
    // Search TMDB
    console.log(chalk.gray(`    Searching TMDB...`));
    const searchResult = await searchTMDB(movie.title_en);
    if (searchResult) {
      tmdbData = await getTMDBDetails(searchResult.id);
    }
  }

  if (!tmdbData) {
    console.log(chalk.red(`    ❌ No TMDB data found`));
    return false;
  }

  // Extract fields
  const updates = extractFields(movie, tmdbData);

  if (Object.keys(updates).length === 0) {
    console.log(chalk.red(`    ❌ No new data found`));
    return false;
  }

  if (!execute) {
    console.log(chalk.yellow(`    (Dry run - no changes made)`));
    return true;
  }

  // Apply updates
  const { error } = await supabase
    .from('movies')
    .update(updates)
    .eq('id', movie.id);

  if (error) {
    console.log(chalk.red(`    ❌ Update failed: ${error.message}`));
    return false;
  }

  console.log(chalk.green(`    ✅ Enriched with ${Object.keys(updates).length} fields!`));
  return true;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const EXECUTE = args.includes('--execute');
  const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '52', 10);

  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            FIX MISSING CRITICAL DATA (TMDB BATCH)                    ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.gray(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`));
  console.log(chalk.gray(`  Using existing TMDB enrichment system\n`));

  const movies = await loadMoviesNeedingFixes();
  const targetMovies = movies.slice(0, LIMIT);

  console.log(chalk.blue(`  Found ${targetMovies.length} movies to enrich\n`));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetMovies.length; i++) {
    console.log(chalk.magenta(`[${i + 1}/${targetMovies.length}]`));
    const success = await enrichMovie(targetMovies[i], EXECUTE);
    
    if (success) successCount++;
    else failCount++;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║            ENRICHMENT COMPLETE                                       ║'));
  console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.gray(`  Total movies: ${targetMovies.length}`));
  console.log(chalk.green(`  Successfully enriched: ${successCount}`));
  if (failCount > 0) {
    console.log(chalk.red(`  Failed: ${failCount}`));
  }

  if (!EXECUTE) {
    console.log(chalk.yellow(`\n  💡 This was a dry run. Use --execute to apply changes.`));
  }
}

main().catch(console.error);
