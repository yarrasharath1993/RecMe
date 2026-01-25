#!/usr/bin/env npx tsx
/**
 * Properly search and restore Aakasa Ramanna (2010) if it exists
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function searchTMDB(title: string, year: number) {
  if (!TMDB_API_KEY) return null;

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Get full details
      const movieId = data.results[0].id;
      const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
      const detailsResponse = await fetch(detailsUrl);
      return await detailsResponse.json();
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║        SEARCH & RESTORE AAKASA RAMANNA 2010                           ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}\n`);

  // Search TMDB for 2010 movie
  console.log(chalk.cyan('  Searching TMDB for "Aakasa Ramanna" (2010)...\n'));
  
  const tmdbData = await searchTMDB('Aakasa Ramanna', 2010);

  if (tmdbData) {
    console.log(chalk.green('  ✓ Found in TMDB:\n'));
    console.log(chalk.cyan(`     TMDB ID: ${tmdbData.id}`));
    console.log(chalk.cyan(`     Title: ${tmdbData.title}`));
    console.log(chalk.cyan(`     Original Title: ${tmdbData.original_title}`));
    console.log(chalk.cyan(`     Release Date: ${tmdbData.release_date}`));
    
    const director = tmdbData.credits?.crew?.find((c: any) => c.job === 'Director');
    console.log(chalk.cyan(`     Director: ${director?.name || 'N/A'}`));
    
    const hero = tmdbData.credits?.cast?.find((c: any) => c.gender === 2);
    const heroine = tmdbData.credits?.cast?.find((c: any) => c.gender === 1);
    
    console.log(chalk.cyan(`     Hero: ${hero?.name || 'N/A'}`));
    console.log(chalk.cyan(`     Heroine: ${heroine?.name || 'N/A'}`));
    console.log(chalk.cyan(`     Genres: ${tmdbData.genres?.map((g: any) => g.name).join(', ') || 'N/A'}`));
    
    if (tmdbData.overview) {
      console.log(chalk.cyan(`     Plot: ${tmdbData.overview.substring(0, 200)}...`));
    }
    console.log();

    if (execute) {
      console.log(chalk.yellow('  Re-adding to database...\n'));

      const slug = 'aakasa-ramanna-2010';
      
      // Check if it already exists
      const { data: existing } = await supabase
        .from('movies')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        console.log(chalk.green(`  ✓ Movie already exists (slug: ${slug})\n`));
        return;
      }

      const movieData: any = {
        slug,
        title_en: tmdbData.title,
        title_te: tmdbData.original_title !== tmdbData.title ? tmdbData.original_title : null,
        release_year: parseInt(tmdbData.release_date?.substring(0, 4) || '2010'),
        tmdb_id: tmdbData.id,
        director: director?.name || null,
        hero: hero?.name || null,
        heroine: heroine?.name || null,
        genres: tmdbData.genres?.map((g: any) => g.name) || [],
        poster_url: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : null,
        backdrop_url: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` : null,
        runtime_minutes: tmdbData.runtime || null,
        avg_rating: tmdbData.vote_average || null,
        language: 'Telugu',
        is_published: true,
      };

      const { error } = await supabase
        .from('movies')
        .insert([movieData]);

      if (error) {
        console.log(chalk.red(`  ❌ Failed to restore: ${error.message}\n`));
      } else {
        console.log(chalk.green(`  ✅ Successfully restored!\n`));
        console.log(chalk.gray(`     URL: http://localhost:3000/movies/${slug}\n`));
      }
    } else {
      console.log(chalk.yellow('  (Dry run - not restored)\n'));
      console.log(chalk.yellow('  Run with --execute to restore this movie\n'));
    }
  } else {
    console.log(chalk.red('  ✗ NOT FOUND in TMDB\n'));
    console.log(chalk.yellow('  Possible reasons:\n'));
    console.log(chalk.gray('  1. Movie doesn\'t exist in TMDB'));
    console.log(chalk.gray('  2. Wrong year (maybe it\'s actually a different year?)'));
    console.log(chalk.gray('  3. Different spelling/title\n'));
    
    console.log(chalk.cyan('  Trying alternate searches...\n'));
    
    // Try without year
    const altSearch = await searchTMDB('Aakasa Ramanna', 0);
    if (altSearch) {
      console.log(chalk.yellow(`  Found: ${altSearch.title} (${altSearch.release_date?.substring(0, 4)})`));
      console.log(chalk.gray(`  TMDB ID: ${altSearch.id}\n`));
    }
  }

  // Show what's currently in DB
  const { data: current } = await supabase
    .from('movies')
    .select('title_en, release_year, slug')
    .or('title_en.ilike.%Aakasa Ramanna%,title_en.ilike.%Akasha Ramanna%')
    .order('release_year');

  console.log(chalk.cyan('  Currently in Database:\n'));
  current?.forEach(m => {
    console.log(chalk.gray(`  • ${m.title_en} (${m.release_year}) - ${m.slug}`));
  });
  console.log();
}

main().catch(console.error);
