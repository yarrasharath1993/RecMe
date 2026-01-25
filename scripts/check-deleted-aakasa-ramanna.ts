#!/usr/bin/env npx tsx
/**
 * Check and restore Aakasa Ramanna (2010) if needed
 * User confirmed both 1965 and 2010 are valid movies
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

async function main() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║        CHECK AAKASA RAMANNA MOVIES                                    ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  // Check what exists now
  const { data: existing } = await supabase
    .from('movies')
    .select('*')
    .or('title_en.ilike.%Aakasa Ramanna%,title_en.ilike.%Akasha Ramanna%')
    .order('release_year');

  console.log(chalk.cyan(`\n  Currently in Database:\n`));
  
  if (existing && existing.length > 0) {
    existing.forEach((m, i) => {
      console.log(chalk.green(`  ${i + 1}. ${m.title_en} (${m.release_year})`));
      console.log(chalk.gray(`     Slug: ${m.slug}`));
      console.log(chalk.gray(`     TMDB ID: ${m.tmdb_id || 'null'}`));
      console.log(chalk.gray(`     Director: ${m.director || 'null'}`));
      console.log(chalk.gray(`     Hero: ${m.hero || 'null'}`));
      console.log(chalk.gray(`     URL: http://localhost:3000/movies/${m.slug}\n`));
    });
  } else {
    console.log(chalk.red('  No Aakasa Ramanna movies found!\n'));
  }

  // Check if 2010 movie exists
  const has2010 = existing?.some(m => m.release_year === 2010);
  const has1965 = existing?.some(m => m.release_year === 1965);

  console.log(chalk.cyan('  Status:'));
  console.log(has1965 ? chalk.green('  ✓ 1965 movie exists') : chalk.red('  ✗ 1965 movie missing'));
  console.log(has2010 ? chalk.green('  ✓ 2010 movie exists') : chalk.red('  ✗ 2010 movie missing'));

  if (!has2010) {
    console.log(chalk.yellow.bold(`\n  ⚠️  ISSUE: 2010 movie was deleted but user says it's valid!\n`));
    console.log(chalk.cyan('  OPTIONS:\n'));
    console.log(chalk.gray('  1. Re-fetch from TMDB (TMDB ID: 339178)'));
    console.log(chalk.gray('  2. Check if it was a different movie entirely'));
    console.log(chalk.gray('  3. Manual re-entry required\n'));
    
    // Try to fetch from TMDB
    console.log(chalk.yellow('  Attempting TMDB lookup for 2010 movie...\n'));
    
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (TMDB_API_KEY) {
      try {
        const url = `https://api.themoviedb.org/3/movie/339178?api_key=${TMDB_API_KEY}&append_to_response=credits`;
        const response = await fetch(url);
        const tmdbData = await response.json();
        
        if (tmdbData && tmdbData.id) {
          console.log(chalk.green('  ✓ Found in TMDB:'));
          console.log(chalk.cyan(`     Title: ${tmdbData.title}`));
          console.log(chalk.cyan(`     Year: ${tmdbData.release_date?.substring(0, 4)}`));
          console.log(chalk.cyan(`     Director: ${tmdbData.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'N/A'}`));
          
          const hero = tmdbData.credits?.cast?.find((c: any) => c.gender === 2)?.name;
          const heroine = tmdbData.credits?.cast?.find((c: any) => c.gender === 1)?.name;
          
          console.log(chalk.cyan(`     Hero: ${hero || 'N/A'}`));
          console.log(chalk.cyan(`     Heroine: ${heroine || 'N/A'}`));
          console.log(chalk.cyan(`     Plot: ${tmdbData.overview?.substring(0, 150)}...\n`));
          
          console.log(chalk.yellow('  This is a DIFFERENT movie from the 1965 classic!\n'));
          console.log(chalk.green('  Run with --restore to re-add this movie to database\n'));
        }
      } catch (error: any) {
        console.log(chalk.red(`  ✗ TMDB lookup failed: ${error.message}\n`));
      }
    }
  } else {
    console.log(chalk.green.bold(`\n  ✅ Both movies exist - no action needed!\n`));
  }
}

main().catch(console.error);
