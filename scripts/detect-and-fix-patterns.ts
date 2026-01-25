#!/usr/bin/env npx tsx
/**
 * Detect and Fix Data Quality Patterns
 * 
 * Based on manually identified issues, this script:
 * 1. Detects similar patterns across the database
 * 2. Fixes them systematically
 * 
 * Patterns detected:
 * - Wrong cast attribution (actresses in hero field)
 * - Placeholder/broken images
 * - Missing critical data
 * - Movies with no TMDB ID linkage
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
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface Pattern {
  name: string;
  description: string;
  query: () => Promise<any[]>;
  fix: (movie: any, execute: boolean) => Promise<any>;
}

// Pattern 1: Movies with placeholder images
async function findPlaceholderImages() {
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, poster_url, tmdb_id')
    .or('poster_url.is.null,poster_url.ilike.%placeholder%,poster_url.eq.')
    .eq('language', 'Telugu')
    .limit(50);
  
  return data || [];
}

// Pattern 2: Movies with no TMDB ID
async function findMissingTMDBIds() {
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, director, tmdb_id')
    .is('tmdb_id', null)
    .eq('language', 'Telugu')
    .not('release_year', 'is', null)
    .gte('release_year', 1980)
    .lte('release_year', 2024)
    .limit(100);
  
  return data || [];
}

// Pattern 3: Movies with missing directors
async function findMissingDirectors() {
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, director, tmdb_id')
    .or('director.is.null,director.eq.Unknown,director.eq.')
    .eq('language', 'Telugu')
    .not('release_year', 'is', null)
    .gte('release_year', 2000)
    .limit(100);
  
  return data || [];
}

// Pattern 4: Movies with hero/heroine mismatch
async function findCastMismatches() {
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, hero, heroine, tmdb_id')
    .eq('language', 'Telugu')
    .not('hero', 'is', null)
    .not('heroine', 'is', null)
    .limit(200);
  
  // Filter for potential mismatches (same name in both fields)
  return (data || []).filter((m: any) => 
    m.hero && m.heroine && m.hero === m.heroine
  );
}

// Pattern 5: Movies with broken Wikipedia images
async function findBrokenWikipediaImages() {
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, poster_url, tmdb_id')
    .ilike('poster_url', '%wikipedia%')
    .eq('language', 'Telugu')
    .limit(100);
  
  return data || [];
}

// Helper: Search TMDB
async function searchTMDB(title: string, year: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: title,
    year: year.toString(),
  });

  const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
  if (!response.ok) return null;
  
  const data = await response.json();
  return data.results?.[0] || null;
}

async function getTMDBDetails(tmdbId: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    append_to_response: 'credits',
  });

  const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?${params}`);
  if (!response.ok) return null;
  
  return response.json();
}

// Fix function
async function fixMovieData(movie: any, execute: boolean) {
  let tmdbId = movie.tmdb_id;
  
  // Search TMDB if no ID
  if (!tmdbId && movie.title_en && movie.release_year) {
    const tmdbMovie = await searchTMDB(movie.title_en, movie.release_year);
    if (tmdbMovie) {
      tmdbId = tmdbMovie.id;
    }
  }
  
  if (!tmdbId) {
    return { success: false, reason: 'no_tmdb_id' };
  }
  
  const details = await getTMDBDetails(tmdbId);
  if (!details) {
    return { success: false, reason: 'tmdb_fetch_failed' };
  }
  
  const updates: any = { tmdb_id: tmdbId };
  const fixed: string[] = [];
  
  // Fix poster
  if (!movie.poster_url || movie.poster_url.includes('placeholder') || movie.poster_url.includes('wikipedia')) {
    if (details.poster_path) {
      updates.poster_url = `${TMDB_IMAGE_BASE}${details.poster_path}`;
      fixed.push('poster');
    }
  }
  
  // Fix director
  if (!movie.director || movie.director === 'Unknown') {
    const director = details.credits?.crew?.find((c: any) => c.job === 'Director');
    if (director) {
      updates.director = director.name;
      fixed.push('director');
    }
  }
  
  // Fix cast mismatch
  if (movie.hero === movie.heroine && details.credits?.cast) {
    const cast = details.credits.cast;
    const maleLeads = cast.filter((c: any) => c.gender === 2).sort((a: any, b: any) => a.order - b.order);
    const femaleLeads = cast.filter((c: any) => c.gender === 1).sort((a: any, b: any) => a.order - b.order);
    
    if (maleLeads.length > 0) {
      updates.hero = maleLeads[0].name;
      fixed.push('hero');
    }
    if (femaleLeads.length > 0) {
      updates.heroine = femaleLeads[0].name;
      fixed.push('heroine');
    }
  }
  
  // Fix genres
  if (details.genres && details.genres.length > 0) {
    updates.genres = details.genres.map((g: any) => g.name);
    fixed.push('genres');
  }
  
  // Fix runtime
  if (details.runtime && !movie.runtime_minutes) {
    updates.runtime_minutes = details.runtime;
    fixed.push('runtime');
  }
  
  if (fixed.length === 0) {
    return { success: false, reason: 'no_fixes_needed' };
  }
  
  if (execute) {
    const { error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movie.id);
    
    if (error) {
      return { success: false, reason: 'update_failed', error: error.message };
    }
  }
  
  return { success: true, fixed, dryRun: !execute };
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const pattern = args.find(a => a.startsWith('--pattern='))?.split('=')[1];

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            DETECT AND FIX DATA QUALITY PATTERNS                      ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log(`  Pattern: ${pattern || 'ALL'}\n`);

  const patterns: Pattern[] = [
    {
      name: 'placeholder_images',
      description: 'Movies with placeholder or missing images',
      query: findPlaceholderImages,
      fix: fixMovieData,
    },
    {
      name: 'missing_tmdb',
      description: 'Movies without TMDB linkage',
      query: findMissingTMDBIds,
      fix: fixMovieData,
    },
    {
      name: 'missing_directors',
      description: 'Movies with missing or unknown directors',
      query: findMissingDirectors,
      fix: fixMovieData,
    },
    {
      name: 'cast_mismatch',
      description: 'Movies with hero/heroine mismatch',
      query: findCastMismatches,
      fix: fixMovieData,
    },
    {
      name: 'broken_wiki_images',
      description: 'Movies with potentially broken Wikipedia images',
      query: findBrokenWikipediaImages,
      fix: fixMovieData,
    },
  ];

  const patternsToRun = pattern 
    ? patterns.filter(p => p.name === pattern)
    : patterns;

  const results: any = {};

  for (const patternDef of patternsToRun) {
    console.log(chalk.magenta.bold(`\n📊 PATTERN: ${patternDef.description}`));
    console.log(chalk.gray(`   Identifier: ${patternDef.name}\n`));

    const movies = await patternDef.query();
    console.log(chalk.cyan(`   Found ${movies.length} movies matching pattern\n`));

    if (movies.length === 0) {
      results[patternDef.name] = { found: 0, fixed: 0, failed: 0 };
      continue;
    }

    let fixed = 0;
    let failed = 0;

    for (const movie of movies) {
      process.stdout.write(chalk.gray(`   Processing: ${movie.title_en} (${movie.release_year})...`));
      
      const result = await patternDef.fix(movie, execute);
      
      if (result.success) {
        fixed++;
        console.log(chalk.green(` ✓ Fixed: ${result.fixed?.join(', ') || 'data'}`));
      } else {
        failed++;
        console.log(chalk.yellow(` ⊘ ${result.reason}`));
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    results[patternDef.name] = { found: movies.length, fixed, failed };
  }

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY BY PATTERN                                        ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  for (const [patternName, stats] of Object.entries(results)) {
    const s: any = stats;
    console.log(chalk.cyan(`\n  ${patternName}:`));
    console.log(`    Found: ${s.found}`);
    console.log(chalk.green(`    Fixed: ${s.fixed}`));
    console.log(chalk.yellow(`    Failed: ${s.failed}`));
  }

  const totalFound = Object.values(results).reduce((sum: number, s: any) => sum + s.found, 0);
  const totalFixed = Object.values(results).reduce((sum: number, s: any) => sum + s.fixed, 0);

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            OVERALL SUMMARY                                           ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Total movies found: ${totalFound}`);
  console.log(chalk.green(`  Total fixed: ${totalFixed}`));
  console.log(`  Success rate: ${Math.round((totalFixed / totalFound) * 100)}%`);

  if (!execute) {
    console.log(chalk.yellow(`\n  Run with --execute to apply fixes`));
    console.log(chalk.gray(`  Run with --pattern=<name> to target specific pattern\n`));
  }
}

main().catch(console.error);
