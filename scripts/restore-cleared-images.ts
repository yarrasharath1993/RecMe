#!/usr/bin/env npx tsx
/**
 * Restore Cleared Images
 * 
 * Finds movies that had their images cleared and attempts to restore them
 * by searching TMDB and fetching correct posters.
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

interface ClearedMovie {
  id: string;
  title_en: string;
  release_year: number | null;
  tmdb_id: number | null;
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
}

async function searchTMDB(title: string, year?: number): Promise<TMDBSearchResult | null> {
  if (!TMDB_API_KEY) return null;

  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query: title,
    language: 'en-US',
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
      // Prefer Telugu match
      const teluguMatch = data.results.find(
        (r: TMDBSearchResult) => r.original_language === 'te'
      );
      
      if (teluguMatch) return teluguMatch;
      
      // Check if any result matches year closely
      if (year) {
        const yearMatch = data.results.find((r: TMDBSearchResult) => {
          if (!r.release_date) return false;
          const tmdbYear = parseInt(r.release_date.split('-')[0]);
          return Math.abs(tmdbYear - year) <= 1;
        });
        if (yearMatch) return yearMatch;
      }
      
      // Return first result if Telugu or close year match
      return data.results[0];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function restoreMovieImage(movie: ClearedMovie): Promise<{
  success: boolean;
  tmdb_id?: number;
  poster_url?: string;
  backdrop_url?: string;
  reason?: string;
}> {
  // Search TMDB
  const tmdbResult = await searchTMDB(movie.title_en, movie.release_year || undefined);
  
  if (!tmdbResult) {
    return { success: false, reason: 'Not found on TMDB' };
  }
  
  // Check if it's actually Telugu
  if (tmdbResult.original_language !== 'te') {
    // Check if title/year match closely
    const titleMatch = movie.title_en.toLowerCase() === tmdbResult.title.toLowerCase() ||
                       movie.title_en.toLowerCase() === tmdbResult.original_title.toLowerCase();
    
    if (!titleMatch) {
      return { success: false, reason: `Found non-Telugu: ${tmdbResult.original_language}` };
    }
  }
  
  // Get images
  const posterUrl = tmdbResult.poster_path 
    ? `${TMDB_IMAGE_BASE}/w500${tmdbResult.poster_path}` 
    : null;
  const backdropUrl = tmdbResult.backdrop_path 
    ? `${TMDB_IMAGE_BASE}/w1280${tmdbResult.backdrop_path}` 
    : null;
  
  if (!posterUrl && !backdropUrl) {
    return { success: false, reason: 'TMDB has no images' };
  }
  
  // Update movie
  const updates: Record<string, any> = {
    tmdb_id: tmdbResult.id,
  };
  
  if (posterUrl) updates.poster_url = posterUrl;
  if (backdropUrl) updates.backdrop_url = backdropUrl;
  
  const { error } = await supabase
    .from('movies')
    .update(updates)
    .eq('id', movie.id);
  
  if (error) {
    return { success: false, reason: error.message };
  }
  
  return {
    success: true,
    tmdb_id: tmdbResult.id,
    poster_url: posterUrl || undefined,
    backdrop_url: backdropUrl || undefined
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '100');
  const daysBack = parseInt(args.find(a => a.startsWith('--days='))?.split('=')[1] || '7');
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║              RESTORE CLEARED IMAGES                           ║
╚══════════════════════════════════════════════════════════════╝
`));

  if (dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE\n'));
  }

  // Find movies cleared in the specified period
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: clearedMovies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, director')
    .is('poster_url', null)
    .gte('updated_at', cutoffDate)
    .order('release_year', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(chalk.red('Failed to fetch movies:'), error.message);
    process.exit(1);
  }

  if (!clearedMovies || clearedMovies.length === 0) {
    console.log(chalk.green('✅ No cleared movies found'));
    return;
  }

  console.log(`📋 Found ${clearedMovies.length} movies to restore\n`);

  let restored = 0;
  let failed = 0;
  const failures: { title: string; year: number | null; reason: string }[] = [];

  for (let i = 0; i < clearedMovies.length; i++) {
    const movie = clearedMovies[i];
    const progress = `[${i + 1}/${clearedMovies.length}]`;
    
    if (dryRun) {
      const tmdbResult = await searchTMDB(movie.title_en, movie.release_year || undefined);
      const status = tmdbResult?.original_language === 'te' ? '✓ Telugu' : 
                     tmdbResult ? `? ${tmdbResult.original_language}` : '✗ Not found';
      console.log(`${progress} ${status} ${movie.title_en} (${movie.release_year})`);
      if (tmdbResult?.original_language === 'te') restored++;
      await new Promise(r => setTimeout(r, 200));
      continue;
    }

    const result = await restoreMovieImage(movie);
    
    if (result.success) {
      console.log(chalk.green(`${progress} ✓ ${movie.title_en} (${movie.release_year}) - TMDB:${result.tmdb_id}`));
      restored++;
    } else {
      console.log(chalk.gray(`${progress} ○ ${movie.title_en} (${movie.release_year}) - ${result.reason}`));
      failures.push({ title: movie.title_en, year: movie.release_year, reason: result.reason || 'Unknown' });
      failed++;
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(chalk.cyan(`
═══════════════════════════════════════════════════════════
📊 RESTORATION RESULTS
═══════════════════════════════════════════════════════════
  Restored: ${chalk.green(restored)}
  Failed: ${chalk.red(failed)}
  Total: ${clearedMovies.length}
`));

  if (failures.length > 0 && failures.length <= 20) {
    console.log(chalk.yellow('\n⚠️  Movies that need manual restoration:\n'));
    failures.forEach(f => {
      console.log(`  • ${f.title} (${f.year}) - ${f.reason}`);
    });
  }
}

main().catch(console.error);

