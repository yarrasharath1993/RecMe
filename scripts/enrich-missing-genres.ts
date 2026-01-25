#!/usr/bin/env npx tsx
/**
 * Enrich Missing Genres
 * 
 * Find all movies without genres and enrich them from TMDB
 * Uses existing TMDB enrichment infrastructure
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface EnrichmentResult {
  slug: string;
  title: string;
  year: number;
  status: 'success' | 'no_tmdb_id' | 'tmdb_error' | 'no_genres' | 'already_has_genres';
  genresAdded?: string[];
  error?: string;
}

async function getMovieGenres(tmdbId: number): Promise<string[] | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.genres && data.genres.length > 0) {
      return data.genres.map((g: any) => g.name);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function findMoviesWithoutGenres() {
  console.log(chalk.cyan('  Searching for movies without genres...\n'));

  // Find movies with empty or null genres array
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, title_te, release_year, tmdb_id, genres')
    .or('genres.is.null,genres.eq.{}')
    .order('release_year', { ascending: false });

  if (error) {
    console.log(chalk.red(`  ❌ Error: ${error.message}\n`));
    return [];
  }

  console.log(chalk.green(`  ✓ Found ${movies?.length || 0} movies without genres\n`));
  
  return movies || [];
}

async function enrichGenres(execute: boolean) {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              ENRICH MISSING GENRES FROM TMDB                          ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}\n`);

  const movies = await findMoviesWithoutGenres();

  if (movies.length === 0) {
    console.log(chalk.green('  ✅ All movies have genres!\n'));
    return;
  }

  const results: EnrichmentResult[] = [];
  const stats = {
    total: movies.length,
    success: 0,
    noTmdbId: 0,
    tmdbError: 0,
    noGenres: 0,
    alreadyHasGenres: 0,
  };

  console.log(chalk.cyan.bold('  PROCESSING MOVIES...\n'));

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const title = movie.title_en || movie.title_te || 'Untitled';
    
    process.stdout.write(chalk.gray(`  [${i + 1}/${movies.length}] ${title} (${movie.release_year})... `));

    // Check if already has genres
    if (movie.genres && Array.isArray(movie.genres) && movie.genres.length > 0) {
      console.log(chalk.yellow('already has genres'));
      stats.alreadyHasGenres++;
      results.push({
        slug: movie.slug,
        title,
        year: movie.release_year,
        status: 'already_has_genres',
      });
      continue;
    }

    // Check if has TMDB ID
    if (!movie.tmdb_id) {
      console.log(chalk.red('no TMDB ID'));
      stats.noTmdbId++;
      results.push({
        slug: movie.slug,
        title,
        year: movie.release_year,
        status: 'no_tmdb_id',
      });
      continue;
    }

    // Fetch genres from TMDB
    const genres = await getMovieGenres(movie.tmdb_id);

    if (!genres || genres.length === 0) {
      console.log(chalk.yellow('no genres in TMDB'));
      stats.noGenres++;
      results.push({
        slug: movie.slug,
        title,
        year: movie.release_year,
        status: 'no_genres',
      });
      continue;
    }

    // Update database
    if (execute) {
      const { error } = await supabase
        .from('movies')
        .update({ genres })
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`error: ${error.message}`));
        stats.tmdbError++;
        results.push({
          slug: movie.slug,
          title,
          year: movie.release_year,
          status: 'tmdb_error',
          error: error.message,
        });
      } else {
        console.log(chalk.green(`✓ ${genres.join(', ')}`));
        stats.success++;
        results.push({
          slug: movie.slug,
          title,
          year: movie.release_year,
          status: 'success',
          genresAdded: genres,
        });
      }
    } else {
      console.log(chalk.yellow(`would add: ${genres.join(', ')}`));
      stats.success++;
      results.push({
        slug: movie.slug,
        title,
        year: movie.release_year,
        status: 'success',
        genresAdded: genres,
      });
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 250));
  }

  // Summary
  console.log(chalk.blue.bold(`\n\n═══════════════════════════════════════════════════════════════════════`));
  console.log(chalk.cyan.bold('  SUMMARY\n'));

  console.log(chalk.green(`  ✅ Success:          ${stats.success}`));
  console.log(chalk.red(`  ❌ No TMDB ID:       ${stats.noTmdbId}`));
  console.log(chalk.yellow(`  ⚠️  No Genres:        ${stats.noGenres}`));
  console.log(chalk.yellow(`  ⚠️  Already Has:      ${stats.alreadyHasGenres}`));
  console.log(chalk.red(`  ❌ Errors:           ${stats.tmdbError}`));
  console.log(chalk.blue.bold(`  ━━━━━━━━━━━━━━━━━━━━`));
  console.log(chalk.blue(`  Total Processed:   ${stats.total}\n`));

  if (stats.success > 0) {
    const percentage = Math.round((stats.success / stats.total) * 100);
    console.log(chalk.green(`  🎯 Success Rate: ${percentage}%\n`));
  }

  // Generate reports
  if (results.length > 0) {
    const reportCSV = generateCSVReport(results);
    const csvPath = resolve(process.cwd(), 'docs/manual-review/GENRE-ENRICHMENT-REPORT.csv');
    writeFileSync(csvPath, reportCSV);
    console.log(chalk.green(`  ✅ Report saved: docs/manual-review/GENRE-ENRICHMENT-REPORT.csv\n`));
  }

  // Show what still needs work
  if (stats.noTmdbId > 0 || stats.noGenres > 0) {
    console.log(chalk.yellow.bold('  ⚠️  REMAINING WORK:\n'));
    
    if (stats.noTmdbId > 0) {
      console.log(chalk.gray(`    ${stats.noTmdbId} movies need TMDB ID linking first`));
      console.log(chalk.gray(`    → Run TMDB search enrichment for these movies\n`));
    }
    
    if (stats.noGenres > 0) {
      console.log(chalk.gray(`    ${stats.noGenres} movies have no genres in TMDB`));
      console.log(chalk.gray(`    → Manual genre classification needed\n`));
    }
  }

  if (!execute && stats.success > 0) {
    console.log(chalk.yellow(`  💡 Run with --execute to apply ${stats.success} genre updates\n`));
  }

  return { results, stats };
}

function generateCSVReport(results: EnrichmentResult[]): string {
  let csv = 'Slug,Title,Year,Status,Genres Added\n';
  
  results.forEach(r => {
    csv += [
      `"${r.slug}"`,
      `"${r.title}"`,
      r.year,
      r.status,
      r.genresAdded ? `"${r.genresAdded.join(', ')}"` : '',
    ].join(',') + '\n';
  });
  
  return csv;
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  await enrichGenres(execute);
}

main().catch(console.error);
