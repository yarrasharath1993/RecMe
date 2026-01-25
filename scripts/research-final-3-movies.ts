#!/usr/bin/env npx tsx
/**
 * Deep Research for Final 3 Hero Attribution Issues
 * 
 * Get complete database info + web research for:
 * 1. Moondram Pirai (1981)
 * 2. Meendum Kokila (1982)
 * 3. Lamhe (1992)
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

const TARGET_MOVIES = [
  { title: 'Moondram Pirai', year: 1981 },
  { title: 'Meendum Kokila', year: 1982 },
  { title: 'Lamhe', year: 1992 },
];

async function searchTMDBDetailed(title: string, year: number) {
  if (!TMDB_API_KEY) return null;

  try {
    // Search for exact year
    let searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`;
    let response = await fetch(searchUrl);
    let data = await response.json();

    if (!data.results || data.results.length === 0) {
      // Try without year
      searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US`;
      response = await fetch(searchUrl);
      data = await response.json();
    }

    if (!data.results || data.results.length === 0) return null;

    // Get all results
    const allResults = data.results.slice(0, 5);
    
    const detailed = await Promise.all(
      allResults.map(async (movie: any) => {
        const creditsUrl = `${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`;
        const creditsResponse = await fetch(creditsUrl);
        const credits = await creditsResponse.json();

        return {
          id: movie.id,
          title: movie.title,
          year: movie.release_date?.substring(0, 4),
          overview: movie.overview,
          cast: credits.cast.slice(0, 10),
          url: `https://www.themoviedb.org/movie/${movie.id}`,
          imdb_id: movie.imdb_id,
        };
      })
    );

    return detailed;
  } catch (error) {
    return null;
  }
}

async function researchMovie(ref: { title: string; year: number }) {
  console.log(chalk.blue.bold(`\n${'='.repeat(75)}`));
  console.log(chalk.cyan.bold(`  ${ref.title} (${ref.year})\n`));

  // Get from database
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .ilike('title_en', `%${ref.title}%`)
    .limit(10);

  if (!movies || movies.length === 0) {
    console.log(chalk.red('  ❌ NOT FOUND IN DATABASE'));
    return;
  }

  // Find all matches
  const matches = movies.filter(m => 
    m.title_en?.toLowerCase().includes(ref.title.toLowerCase())
  );

  console.log(chalk.yellow(`  📁 Found ${matches.length} database entries:\n`));

  matches.forEach((movie, i) => {
    console.log(chalk.cyan(`  ${i + 1}. ${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`     Slug: ${movie.slug}`));
    console.log(chalk.gray(`     Hero: ${movie.hero || 'null'}`));
    console.log(chalk.gray(`     Heroine: ${movie.heroine || 'null'}`));
    console.log(chalk.gray(`     Director: ${movie.director || 'null'}`));
    console.log(chalk.gray(`     Language: ${movie.language || 'null'}`));
    console.log(chalk.gray(`     TMDB ID: ${movie.tmdb_id || 'null'}`));
    console.log(chalk.gray(`     IMDb ID: ${movie.imdb_id || 'null'}`));
    console.log(chalk.gray(`     Published: ${movie.is_published ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`     URL: http://localhost:3000/movies/${movie.slug}\n`));
  });

  // Search TMDB
  console.log(chalk.yellow(`  🔍 Searching TMDB for "${ref.title}"...\n`));
  
  const tmdbResults = await searchTMDBDetailed(ref.title, ref.year);
  
  if (!tmdbResults || tmdbResults.length === 0) {
    console.log(chalk.red('  ❌ No TMDB results found'));
  } else {
    tmdbResults.forEach((result: any, i: number) => {
      console.log(chalk.green(`  📽️  TMDB Result ${i + 1}:`));
      console.log(chalk.cyan(`     Title: ${result.title} (${result.year})`));
      console.log(chalk.gray(`     URL: ${result.url}`));
      
      if (result.overview) {
        console.log(chalk.gray(`     Plot: ${result.overview.substring(0, 150)}...`));
      }
      
      const maleCast = result.cast.filter((c: any) => c.gender === 2);
      const femaleCast = result.cast.filter((c: any) => c.gender === 1);
      
      if (maleCast.length > 0) {
        console.log(chalk.green(`     ♂️  Male Leads: ${maleCast.slice(0, 3).map((c: any) => c.name).join(', ')}`));
      }
      
      if (femaleCast.length > 0) {
        console.log(chalk.magenta(`     ♀️  Female Leads: ${femaleCast.slice(0, 3).map((c: any) => c.name).join(', ')}`));
      }
      
      console.log();
    });
  }

  // Recommendation
  console.log(chalk.yellow.bold('  💡 RECOMMENDATION:\n'));
  
  if (matches.length > 1) {
    const correctYear = matches.find(m => m.release_year === ref.year);
    const otherYears = matches.filter(m => m.release_year !== ref.year);
    
    if (otherYears.length > 0) {
      console.log(chalk.cyan('     This appears to be a DUPLICATE entry with wrong year.'));
      console.log(chalk.gray(`     - Keep: ${otherYears[0].title_en} (${otherYears[0].release_year})`));
      if (correctYear) {
        console.log(chalk.gray(`     - Delete: ${correctYear.title_en} (${correctYear.release_year}) - wrong year\n`));
      }
    }
  }

  if (tmdbResults && tmdbResults.length > 0) {
    const bestMatch = tmdbResults[0];
    const maleLead = bestMatch.cast.find((c: any) => c.gender === 2);
    
    if (maleLead) {
      console.log(chalk.green(`     Suggested Hero: ${maleLead.name}`));
      console.log(chalk.gray(`     Based on TMDB: ${bestMatch.title} (${bestMatch.year})\n`));
    }
  }
}

async function main() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           DEEP RESEARCH: FINAL 3 HERO ATTRIBUTION ISSUES              ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  for (const movie of TARGET_MOVIES) {
    await researchMovie(movie);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(chalk.blue.bold(`\n${'='.repeat(75)}\n`));
  console.log(chalk.green.bold('  ✅ Research Complete!\n'));
  console.log(chalk.cyan('  Review the recommendations above and decide:'));
  console.log(chalk.gray('    1. Delete duplicate entries (wrong years)'));
  console.log(chalk.gray('    2. Update hero attribution for correct entries'));
  console.log(chalk.gray('    3. Merge if multiple valid entries exist\n'));
}

main().catch(console.error);
