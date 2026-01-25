/**
 * Fix movies using Vanisri.jpg (actress photo) as poster
 * This is a common issue where movies use actor/actress headshots instead of actual posters
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

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const PROBLEMATIC_URLS = [
  'https://upload.wikimedia.org/wikipedia/commons/d/de/Vanisri.jpg',
  // Add more if found
];

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

async function searchTMDB(title: string, year?: number): Promise<TMDBMovie | null> {
  try {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      query: title,
      language: 'te-IN',
      include_adult: 'false',
    });

    if (year) {
      params.append('year', year.toString());
      params.append('primary_release_year', year.toString());
    }

    const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    const movies = data.results as TMDBMovie[];
    
    // Try to find exact year match
    if (year) {
      const exactMatch = movies.find(m => {
        const releaseYear = m.release_date ? new Date(m.release_date).getFullYear() : 0;
        return releaseYear === year;
      });
      if (exactMatch) return exactMatch;
    }

    return movies[0];
  } catch (error) {
    console.error(`TMDB search error:`, error);
    return null;
  }
}

async function main() {
  const execute = process.argv.includes('--execute');

  console.log(chalk.blue.bold('\n🔍 Finding movies with actor headshots as posters\n'));

  // Find all movies with the problematic URLs
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .in('poster_url', PROBLEMATIC_URLS)
    .eq('is_published', true)
    .order('release_year', { ascending: true });

  if (error) {
    console.error(chalk.red('Error:'), error.message);
    return;
  }

  console.log(chalk.yellow(`Found ${movies?.length || 0} movies with problematic images\n`));

  if (!movies || movies.length === 0) {
    console.log(chalk.green('No issues found!'));
    return;
  }

  const results = {
    fixed: [] as any[],
    notFoundInTMDB: [] as any[],
    failed: [] as any[],
  };

  for (const movie of movies) {
    console.log(chalk.cyan(`\n${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`  Slug: ${movie.slug}`));
    console.log(chalk.gray(`  Current: ${movie.poster_url}`));
    console.log(chalk.gray(`  URL: http://localhost:3000/movies/${movie.slug}`));

    // Search for correct poster
    const tmdbMovie = await searchTMDB(movie.title_en, movie.release_year);

    if (!tmdbMovie || !tmdbMovie.poster_path) {
      console.log(chalk.red('  ❌ Not found in TMDB'));
      results.notFoundInTMDB.push({
        title: movie.title_en,
        year: movie.release_year,
        slug: movie.slug,
      });
      continue;
    }

    const newPosterUrl = `${TMDB_IMAGE_BASE}${tmdbMovie.poster_path}`;
    console.log(chalk.green(`  ✅ Found: ${newPosterUrl}`));

    if (execute) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({
          poster_url: newPosterUrl,
          tmdb_id: tmdbMovie.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`  ❌ Failed to update: ${updateError.message}`));
        results.failed.push({
          title: movie.title_en,
          year: movie.release_year,
          error: updateError.message,
        });
      } else {
        console.log(chalk.green('  ✅ Updated in database'));
        results.fixed.push({
          title: movie.title_en,
          year: movie.release_year,
          slug: movie.slug,
          newUrl: newPosterUrl,
        });
      }
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Summary
  console.log(chalk.blue.bold('\n\n📊 Summary\n'));
  console.log(chalk.white(`Total issues: ${movies.length}`));
  
  if (execute) {
    console.log(chalk.green(`Fixed: ${results.fixed.length}`));
    console.log(chalk.red(`Not found in TMDB: ${results.notFoundInTMDB.length}`));
    console.log(chalk.red(`Failed: ${results.failed.length}`));
  } else {
    console.log(chalk.yellow('\n💡 Run with --execute to fix these issues'));
  }

  // Show movies that need manual review
  if (results.notFoundInTMDB.length > 0) {
    console.log(chalk.yellow('\n\n🔍 Movies needing manual review (not in TMDB):\n'));
    results.notFoundInTMDB.forEach((m, idx) => {
      console.log(`${idx + 1}. ${m.title} (${m.year})`);
      console.log(chalk.gray(`   http://localhost:3000/movies/${m.slug}\n`));
    });
  }
}

main().catch(console.error);
