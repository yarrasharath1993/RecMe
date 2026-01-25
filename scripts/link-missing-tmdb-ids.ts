#!/usr/bin/env npx tsx
/**
 * Link Missing TMDB IDs
 * 
 * Search TMDB for movies without TMDB IDs and link them
 * Then we can enrich genres in a second pass
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

async function searchTMDB(title: string, year: number) {
  if (!TMDB_API_KEY) return null;

  try {
    // Try with year first
    let searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
    let response = await fetch(searchUrl);
    let data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0];
    }

    // Try without year
    searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    response = await fetch(searchUrl);
    data = await response.json();

    if (data.results && data.results.length > 0) {
      // Find closest year match
      const closest = data.results.reduce((prev: any, curr: any) => {
        const prevYear = parseInt(prev.release_date?.substring(0, 4) || '0');
        const currYear = parseInt(curr.release_date?.substring(0, 4) || '0');
        const prevDiff = Math.abs(prevYear - year);
        const currDiff = Math.abs(currYear - year);
        return currDiff < prevDiff ? curr : prev;
      });
      
      return closest;
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function linkMissingTMDBIds(execute: boolean) {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║            LINK MISSING TMDB IDS (For Genre Enrichment)               ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}\n`);

  // Find movies without TMDB ID and without genres
  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, title_te, release_year, tmdb_id, genres')
    .is('tmdb_id', null)
    .or('genres.is.null,genres.eq.{}')
    .order('release_year', { ascending: false })
    .limit(200); // Process 200 at a time

  if (!movies || movies.length === 0) {
    console.log(chalk.green('  ✅ All genre-less movies have TMDB IDs!\n'));
    return;
  }

  console.log(chalk.green(`  ✓ Found ${movies.length} movies to process\n`));
  console.log(chalk.cyan.bold('  SEARCHING TMDB...\n'));

  let found = 0;
  let notFound = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const title = movie.title_en || movie.title_te || 'Untitled';
    
    process.stdout.write(chalk.gray(`  [${i + 1}/${movies.length}] ${title} (${movie.release_year})... `));

    const tmdbResult = await searchTMDB(title, movie.release_year);

    if (tmdbResult) {
      const tmdbYear = tmdbResult.release_date?.substring(0, 4);
      console.log(chalk.green(`✓ TMDB ID: ${tmdbResult.id} (${tmdbResult.title}, ${tmdbYear})`));
      
      if (execute) {
        await supabase
          .from('movies')
          .update({ tmdb_id: tmdbResult.id })
          .eq('id', movie.id);
      }
      
      found++;
    } else {
      console.log(chalk.red('✗ not found'));
      notFound++;
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(chalk.blue.bold(`\n\n═══════════════════════════════════════════════════════════════════════`));
  console.log(chalk.cyan.bold('  SUMMARY\n'));

  console.log(chalk.green(`  ✅ Found & Linked:   ${found}`));
  console.log(chalk.red(`  ❌ Not Found:        ${notFound}`));
  console.log(chalk.blue.bold(`  ━━━━━━━━━━━━━━━━━━━━`));
  console.log(chalk.blue(`  Total Processed:   ${movies.length}\n`));

  const percentage = Math.round((found / movies.length) * 100);
  console.log(chalk.green(`  🎯 Success Rate: ${percentage}%\n`));

  if (!execute && found > 0) {
    console.log(chalk.yellow(`  💡 Run with --execute to link ${found} TMDB IDs\n`));
    console.log(chalk.gray(`  After linking, re-run genre enrichment to add genres\n`));
  } else if (execute && found > 0) {
    console.log(chalk.green(`  ✅ ${found} TMDB IDs linked successfully!\n`));
    console.log(chalk.cyan(`  🔄 Next: Re-run genre enrichment to add genres\n`));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  await linkMissingTMDBIds(execute);
}

main().catch(console.error);
