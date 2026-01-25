#!/usr/bin/env npx tsx
/**
 * Fix Specific Movie Issues
 * 
 * Targets specific movies with identified data quality issues:
 * - Wrong images/posters
 * - Wrong cast/actors
 * - Wrong synopsis
 * - Missing data
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

interface MovieIssue {
  slug: string;
  title: string;
  year: number;
  issues: string[];
}

const MOVIES_WITH_ISSUES: MovieIssue[] = [
  { slug: 'manasunna-maaraju-2000', title: 'Manasunna Maaraju', year: 2000, issues: ['wrong_image', 'wrong_actor'] },
  { slug: 'agni-jwala-1983', title: 'Agni Jwala', year: 1983, issues: ['wrong_data'] },
  { slug: 'murali-krishnudu-1988', title: 'Murali Krishnudu', year: 1988, issues: ['wrong_cast'] },
  { slug: 'drohi-1996', title: 'Drohi', year: 1996, issues: ['wrong_image', 'wrong_synopsis'] },
  { slug: 'rakhi-2006', title: 'Rakhi', year: 2006, issues: ['wrong_poster'] },
  { slug: 'gruhalakshmi-1984', title: 'Gruhalakshmi', year: 1984, issues: ['wrong_image'] },
  { slug: 'alasyam-amrutham-2010', title: 'Alasyam Amrutham', year: 2010, issues: ['wrong_data'] },
  { slug: 'shivashankar-2004', title: 'Shivashankar', year: 2004, issues: ['wrong_image'] },
  { slug: 'ramudochadu-1996', title: 'Ramudochadu', year: 1996, issues: ['wrong_hero'] },
  { slug: 'guru-sishyulu-1981', title: 'Guru Sishyulu', year: 1981, issues: ['wrong_image', 'wrong_cast'] },
  { slug: 'sher-2015', title: 'Sher', year: 2015, issues: ['wrong_data', 'wrong_image'] },
  { slug: 'guard-2025', title: 'Guard', year: 2025, issues: ['wrong_data', 'missing_poster', 'wrong_background'] },
  { slug: 'super-machi-2022', title: 'Super Machi', year: 2022, issues: ['wrong_data'] },
  { slug: 'sati-tulasi-1959', title: 'Sati Tulasi', year: 1959, issues: ['wrong_image'] },
];

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

async function fixMovie(movie: MovieIssue, execute: boolean) {
  console.log(chalk.cyan(`\n📽️  ${movie.title} (${movie.year})`));
  console.log(chalk.gray(`   Issues: ${movie.issues.join(', ')}`));

  // Get movie from database
  const { data: dbMovie, error } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', movie.slug)
    .single();

  if (error || !dbMovie) {
    console.log(chalk.red(`   ❌ Movie not found in database`));
    return { success: false, reason: 'not_found' };
  }

  // Search TMDB for correct data
  const tmdbMovie = await searchTMDB(movie.title, movie.year);
  if (!tmdbMovie) {
    console.log(chalk.yellow(`   ⚠️  Not found in TMDB`));
    return { success: false, reason: 'tmdb_not_found' };
  }

  const tmdbDetails = await getTMDBDetails(tmdbMovie.id);
  if (!tmdbDetails) {
    console.log(chalk.yellow(`   ⚠️  Could not fetch TMDB details`));
    return { success: false, reason: 'tmdb_details_failed' };
  }

  const updates: any = {};
  const fixed: string[] = [];

  // Fix image/poster issues
  if (movie.issues.some(i => i.includes('image') || i.includes('poster'))) {
    if (tmdbDetails.poster_path) {
      updates.poster_url = `${TMDB_IMAGE_BASE}${tmdbDetails.poster_path}`;
      fixed.push('poster');
    }
  }

  // Fix cast issues
  if (movie.issues.some(i => i.includes('cast') || i.includes('hero') || i.includes('actor'))) {
    if (tmdbDetails.credits?.cast) {
      const cast = tmdbDetails.credits.cast;
      
      // Find male lead (hero)
      const maleLeads = cast.filter((c: any) => c.gender === 2).sort((a: any, b: any) => a.order - b.order);
      if (maleLeads.length > 0) {
        updates.hero = maleLeads[0].name;
        fixed.push('hero');
      }

      // Find female lead (heroine)
      const femaleLeads = cast.filter((c: any) => c.gender === 1).sort((a: any, b: any) => a.order - b.order);
      if (femaleLeads.length > 0) {
        updates.heroine = femaleLeads[0].name;
        fixed.push('heroine');
      }

      // Supporting cast (as array)
      const supportingCast = cast.slice(0, 10).map((c: any) => c.name);
      if (supportingCast.length > 0) {
        updates.supporting_cast = supportingCast;
        fixed.push('cast');
      }
    }
  }

  // Fix synopsis
  if (movie.issues.some(i => i.includes('synopsis'))) {
    if (tmdbDetails.overview) {
      updates.synopsis = tmdbDetails.overview;
      fixed.push('synopsis');
    }
  }

  // Fix general data issues
  if (movie.issues.includes('wrong_data')) {
    if (tmdbDetails.release_date) {
      updates.release_date = tmdbDetails.release_date;
      fixed.push('release_date');
    }
    if (tmdbDetails.genres) {
      updates.genres = tmdbDetails.genres.map((g: any) => g.name);
      fixed.push('genres');
    }
    if (tmdbDetails.runtime) {
      updates.runtime_minutes = tmdbDetails.runtime;
      fixed.push('runtime');
    }
    
    // Director
    const director = tmdbDetails.credits?.crew?.find((c: any) => c.job === 'Director');
    if (director) {
      updates.director = director.name;
      fixed.push('director');
    }
  }

  // Add TMDB ID
  updates.tmdb_id = tmdbMovie.id;

  if (fixed.length === 0) {
    console.log(chalk.yellow(`   ⊘ No fixes available`));
    return { success: false, reason: 'no_fixes' };
  }

  console.log(chalk.green(`   ✓ Will fix: ${fixed.join(', ')}`));

  if (execute) {
    const { error: updateError } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', dbMovie.id);

    if (updateError) {
      console.log(chalk.red(`   ❌ Update failed: ${updateError.message}`));
      return { success: false, reason: 'update_failed' };
    }

    console.log(chalk.green(`   ✅ Updated in database`));
    return { success: true, fixed };
  }

  return { success: true, fixed, dryRun: true };
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            FIX SPECIFIC MOVIE ISSUES                                 ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log(`  Movies to fix: ${MOVIES_WITH_ISSUES.length}\n`);

  let fixed = 0;
  let failed = 0;
  const results: any[] = [];

  for (const movie of MOVIES_WITH_ISSUES) {
    const result = await fixMovie(movie, execute);
    results.push({ movie: movie.title, ...result });
    
    if (result.success) {
      fixed++;
    } else {
      failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY                                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Total movies: ${MOVIES_WITH_ISSUES.length}`);
  console.log(chalk.green(`  Successfully fixed: ${fixed}`));
  console.log(chalk.red(`  Failed: ${failed}`));

  // Show failure reasons
  const notFound = results.filter(r => r.reason === 'not_found').length;
  const tmdbNotFound = results.filter(r => r.reason === 'tmdb_not_found').length;
  const noFixes = results.filter(r => r.reason === 'no_fixes').length;

  if (notFound > 0) console.log(chalk.gray(`    - Not in DB: ${notFound}`));
  if (tmdbNotFound > 0) console.log(chalk.gray(`    - Not in TMDB: ${tmdbNotFound}`));
  if (noFixes > 0) console.log(chalk.gray(`    - No fixes available: ${noFixes}`));

  if (!execute) {
    console.log(chalk.yellow(`\n  Run with --execute to apply fixes\n`));
  }
}

main().catch(console.error);
