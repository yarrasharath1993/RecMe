#!/usr/bin/env npx tsx
/**
 * Fix Legacy Movies - Re-verify movies without TMDB IDs
 * 
 * Problem: 2,462 movies imported from old data have potentially wrong images
 * Solution: Try to match them to TMDB and update with verified images
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface LegacyMovie {
  id: string;
  title_en: string;
  release_year: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  director: string | null;
}

interface TMDBSearchResult {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  original_language: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
}

async function searchTMDB(title: string, year?: number): Promise<TMDBSearchResult | null> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: title,
    language: 'te-IN',
    include_adult: 'false',
  });
  
  if (year) {
    params.set('year', year.toString());
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?${params}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Find Telugu movie match
      const teluguMatch = data.results.find(
        (r: TMDBSearchResult) => r.original_language === 'te'
      );
      
      if (teluguMatch) return teluguMatch;
      
      // If no Telugu match, check if first result is close enough
      const first = data.results[0];
      if (first.release_date && year) {
        const tmdbYear = parseInt(first.release_date.split('-')[0]);
        if (Math.abs(tmdbYear - year) <= 1) {
          return first;
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function fixLegacyMovie(movie: LegacyMovie): Promise<{
  action: 'fixed' | 'cleared' | 'skipped';
  reason: string;
}> {
  // Try to find on TMDB
  const tmdbMatch = await searchTMDB(movie.title_en, movie.release_year || undefined);
  
  if (tmdbMatch && tmdbMatch.original_language === 'te') {
    // Found verified Telugu movie - update with correct data
    const updates: Record<string, any> = {
      tmdb_id: tmdbMatch.id,
    };
    
    if (tmdbMatch.poster_path) {
      updates.poster_url = `${TMDB_IMAGE_BASE}/w500${tmdbMatch.poster_path}`;
    }
    
    if (tmdbMatch.backdrop_path) {
      updates.backdrop_url = `${TMDB_IMAGE_BASE}/w1280${tmdbMatch.backdrop_path}`;
    }
    
    const { error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movie.id);
    
    if (error) {
      return { action: 'skipped', reason: error.message };
    }
    
    return { action: 'fixed', reason: `Matched to TMDB ${tmdbMatch.id}` };
  }
  
  // No match found - only clear placeholder images, NOT wikimedia/manual images
  // Wikimedia images might be manually added by users and should be preserved
  const hasPlaceholderImage = 
    movie.poster_url?.includes('placeholder') ||
    movie.poster_url?.includes('via.placeholder') ||
    movie.poster_url?.includes('erosnow.com/public/images/sq-thumb'); // Generic placeholder
  
  if (hasPlaceholderImage) {
    // Only clear obvious placeholder images
    const { error } = await supabase
      .from('movies')
      .update({ 
        poster_url: null,
        backdrop_url: null 
      })
      .eq('id', movie.id);
    
    if (error) {
      return { action: 'skipped', reason: error.message };
    }
    
    return { action: 'cleared', reason: 'Removed placeholder image' };
  }
  
  // Preserve wikimedia and other manually-added images
  return { action: 'skipped', reason: 'No TMDB match, preserving existing image' };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');
  const clearOnly = args.includes('--clear-suspicious');
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║              FIX LEGACY MOVIES                                ║
╚══════════════════════════════════════════════════════════════╝
`));

  if (dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE\n'));
  }

  // Get legacy movies (no TMDB ID)
  const { data: legacyMovies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, poster_url, backdrop_url, director')
    .is('tmdb_id', null)
    .not('title_en', 'is', null)
    .limit(limit);

  if (error) {
    console.error(chalk.red('Failed to fetch movies:'), error.message);
    process.exit(1);
  }

  if (!legacyMovies || legacyMovies.length === 0) {
    console.log(chalk.green('✅ No legacy movies to fix'));
    return;
  }

  console.log(`📋 Processing ${legacyMovies.length} legacy movies...\n`);

  let fixed = 0;
  let cleared = 0;
  let skipped = 0;

  for (let i = 0; i < legacyMovies.length; i++) {
    const movie = legacyMovies[i];
    const progress = `[${i + 1}/${legacyMovies.length}]`;
    
    if (dryRun) {
      const tmdbMatch = await searchTMDB(movie.title_en, movie.release_year || undefined);
      const status = tmdbMatch?.original_language === 'te' ? '✓ Match' : '? No match';
      console.log(`${progress} ${status} ${movie.title_en} (${movie.release_year})`);
      if (tmdbMatch?.original_language === 'te') fixed++;
      continue;
    }

    const result = await fixLegacyMovie(movie);
    
    const icon = result.action === 'fixed' ? '✓' : 
                 result.action === 'cleared' ? '○' : '?';
    const color = result.action === 'fixed' ? chalk.green :
                  result.action === 'cleared' ? chalk.yellow : chalk.gray;
    
    console.log(color(`${progress} ${icon} ${movie.title_en} (${movie.release_year}) - ${result.reason}`));
    
    if (result.action === 'fixed') fixed++;
    else if (result.action === 'cleared') cleared++;
    else skipped++;
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(chalk.cyan(`
═══════════════════════════════════════════════════════════
📊 RESULTS
═══════════════════════════════════════════════════════════
  Fixed (matched to TMDB): ${chalk.green(fixed)}
  Cleared (removed bad images): ${chalk.yellow(cleared)}
  Skipped: ${chalk.gray(skipped)}
`));
}

main().catch(console.error);


