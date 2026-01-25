#!/usr/bin/env npx tsx
/**
 * Fix Wrong Hero Gender from CSV
 * 
 * Processes the wrong-hero-gender CSV file and reattributes correct heroes
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function searchTMDB(title: string, year: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: title,
    year: year?.toString() || '',
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

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const csvFile = args.find(a => a.startsWith('--csv='))?.split('=')[1];
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         FIX WRONG HERO GENDER FROM CSV                               ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log(`  CSV File: ${csvFile || 'Auto-detect latest'}`);
  console.log(`  Limit: ${limit}\n`);

  // Find CSV file
  let csvPath: string;
  if (csvFile) {
    csvPath = resolve(process.cwd(), csvFile);
  } else {
    // Find latest wrong-hero-gender CSV
    const fs = await import('fs');
    const files = fs.readdirSync('docs/manual-review')
      .filter(f => f.startsWith('wrong-hero-gender-batch-') && f.endsWith('.csv'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.log(chalk.red('  ❌ No CSV file found'));
      return;
    }
    
    csvPath = resolve(process.cwd(), 'docs/manual-review', files[0]);
  }

  console.log(chalk.cyan(`  Processing: ${csvPath}\n`));

  // Read CSV
  const csvContent = readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header

  const movies = lines
    .filter(line => line.trim())
    .slice(0, limit)
    .map(line => {
      const parts = line.match(/"([^"]*)"/g)?.map(p => p.replace(/"/g, '')) || [];
      return {
        slug: parts[0],
        title: parts[1],
        year: parseInt(parts[2]),
        current_hero: parts[3],
        current_heroine: parts[4],
        director: parts[5],
      };
    });

  console.log(chalk.cyan(`  Found ${movies.length} movies to process\n`));

  let fixed = 0;
  let failed = 0;
  const needManual: any[] = [];

  for (const movieInfo of movies) {
    console.log(chalk.gray(`  Processing: ${movieInfo.title} (${movieInfo.year})`));
    console.log(chalk.gray(`    Current: Hero="${movieInfo.current_hero}", Heroine="${movieInfo.current_heroine}"`));

    // Get movie from database
    const { data: movie } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', movieInfo.slug)
      .single();

    if (!movie) {
      console.log(chalk.red(`    ❌ Not found in database\n`));
      failed++;
      continue;
    }

    // Get TMDB data
    let tmdbId = movie.tmdb_id;

    if (!tmdbId) {
      const tmdbMovie = await searchTMDB(movieInfo.title, movieInfo.year);
      if (tmdbMovie) {
        tmdbId = tmdbMovie.id;
      }
    }

    if (!tmdbId) {
      console.log(chalk.yellow(`    ⊘ No TMDB ID found - needs manual review\n`));
      needManual.push(movieInfo);
      failed++;
      continue;
    }

    const details = await getTMDBDetails(tmdbId);
    if (!details?.credits?.cast) {
      console.log(chalk.yellow(`    ⊘ No cast data from TMDB\n`));
      needManual.push(movieInfo);
      failed++;
      continue;
    }

    const cast = details.credits.cast;
    const maleLeads = cast.filter((c: any) => c.gender === 2).sort((a: any, b: any) => a.order - b.order);
    const femaleLeads = cast.filter((c: any) => c.gender === 1).sort((a: any, b: any) => a.order - b.order);

    if (maleLeads.length === 0) {
      console.log(chalk.yellow(`    ⊘ No male leads found in TMDB\n`));
      needManual.push(movieInfo);
      failed++;
      continue;
    }

    const updates: any = {
      hero: maleLeads[0].name,
      tmdb_id: tmdbId,
    };

    // Handle heroine
    if (movieInfo.current_heroine === 'null' || !movieInfo.current_heroine) {
      // Move current hero (female) to heroine
      updates.heroine = movieInfo.current_hero;
    } else if (femaleLeads.length > 0) {
      // Use TMDB's first female lead
      updates.heroine = femaleLeads[0].name;
    }

    console.log(chalk.green(`    ✓ New: Hero="${updates.hero}", Heroine="${updates.heroine || 'unchanged'}"`));

    if (execute) {
      const { error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`    ❌ Update failed: ${error.message}\n`));
        failed++;
        continue;
      }
    }

    console.log(chalk.green(`    ✅ Fixed!\n`));
    fixed++;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY                                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Total Processed: ${movies.length}`);
  console.log(chalk.green(`  Fixed: ${fixed}`));
  console.log(chalk.yellow(`  Need Manual Review: ${needManual.length}`));
  console.log(chalk.red(`  Failed: ${failed}`));
  console.log(`  Success Rate: ${Math.round((fixed / movies.length) * 100)}%`);

  if (needManual.length > 0) {
    console.log(chalk.yellow(`\n  Movies needing manual review:`));
    needManual.slice(0, 10).forEach(m => {
      console.log(chalk.gray(`    - ${m.title} (${m.year})`));
    });
    if (needManual.length > 10) {
      console.log(chalk.gray(`    ... and ${needManual.length - 10} more`));
    }
  }

  if (!execute) {
    console.log(chalk.yellow(`\n  Run with --execute to apply fixes`));
    console.log(chalk.gray(`  Options:`));
    console.log(chalk.gray(`    --csv=<path>      Specify CSV file`));
    console.log(chalk.gray(`    --limit=<number>  Limit number of movies (default: 50)\n`));
  }
}

main().catch(console.error);
