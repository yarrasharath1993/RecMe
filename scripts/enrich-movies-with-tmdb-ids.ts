#!/usr/bin/env npx tsx
/**
 * Enrich Movies with TMDB IDs
 * 
 * Fetch missing directors, cast, and posters for movies that have TMDB IDs
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

interface TMDBMovie {
  id: number;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
}

interface TMDBCredits {
  cast: Array<{
    name: string;
    character: string;
    gender: number;
    order: number;
  }>;
  crew: Array<{
    name: string;
    job: string;
  }>;
}

async function fetchTMDBMovie(tmdbId: number): Promise<TMDBMovie | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function fetchTMDBCredits(tmdbId: number): Promise<TMDBCredits | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function enrichMovies() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           ENRICH MOVIES WITH TMDB IDS                                 ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('  Finding movies with TMDB IDs but missing data...\n'));

  // Find movies with TMDB ID but missing critical data
  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, title_te, release_year, tmdb_id, director, hero, heroine, poster_url')
    .not('tmdb_id', 'is', null)
    .or('director.is.null,director.eq."",hero.is.null,hero.eq."",heroine.is.null,heroine.eq."",poster_url.is.null,poster_url.eq.""')
    .order('release_year', { ascending: false })
    .limit(20);

  if (!movies || movies.length === 0) {
    console.log(chalk.green('  ✅ All movies with TMDB IDs are complete!\n'));
    return;
  }

  console.log(chalk.green(`  ✓ Found ${movies.length} movies to enrich\n`));
  console.log(chalk.cyan.bold('  PROCESSING...\n'));

  let enriched = 0;
  let errors = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const title = movie.title_en || movie.title_te || 'Untitled';
    
    console.log(chalk.blue(`\n  [${i + 1}/${movies.length}] ${title} (${movie.release_year})`));
    console.log(chalk.gray(`  TMDB ID: ${movie.tmdb_id}`));

    const updates: any = {};

    // Fetch movie details
    const tmdbMovie = await fetchTMDBMovie(movie.tmdb_id);
    
    if (!tmdbMovie) {
      console.log(chalk.red(`  ❌ Failed to fetch TMDB data\n`));
      errors++;
      continue;
    }

    // Check poster
    if (!movie.poster_url && tmdbMovie.poster_path) {
      updates.poster_url = `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`;
      console.log(chalk.green(`  ✓ Poster found`));
    }

    // Check backdrop
    if (!movie.backdrop_url && tmdbMovie.backdrop_path) {
      updates.backdrop_url = `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}`;
      console.log(chalk.green(`  ✓ Backdrop found`));
    }

    // Fetch credits if director or cast is missing
    if (!movie.director || !movie.hero || !movie.heroine) {
      const credits = await fetchTMDBCredits(movie.tmdb_id);
      
      if (credits) {
        // Get director
        if (!movie.director) {
          const director = credits.crew.find(c => c.job === 'Director');
          if (director) {
            updates.director = director.name;
            console.log(chalk.green(`  ✓ Director: ${director.name}`));
          }
        }

        // Get hero (first male actor)
        if (!movie.hero) {
          const hero = credits.cast.find(c => c.gender === 2); // 2 = male
          if (hero) {
            updates.hero = hero.name;
            console.log(chalk.green(`  ✓ Hero: ${hero.name}`));
          }
        }

        // Get heroine (first female actor)
        if (!movie.heroine) {
          const heroine = credits.cast.find(c => c.gender === 1); // 1 = female
          if (heroine) {
            updates.heroine = heroine.name;
            console.log(chalk.green(`  ✓ Heroine: ${heroine.name}`));
          }
        }
      }
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`  ❌ Update failed: ${error.message}`));
        errors++;
      } else {
        console.log(chalk.green(`  ✅ Updated ${Object.keys(updates).length} fields`));
        enriched++;
      }
    } else {
      console.log(chalk.gray(`  ℹ️  No missing data to enrich`));
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  // Summary
  console.log(chalk.blue.bold('\n\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  ENRICHMENT SUMMARY\n'));

  console.log(chalk.green(`  ✅ Movies Enriched:    ${enriched}`));
  console.log(chalk.red(`  ❌ Errors:             ${errors}`));
  console.log(chalk.blue.bold(`  ━━━━━━━━━━━━━━━━━━━━`));
  console.log(chalk.blue(`  Total Processed:     ${movies.length}\n`));

  if (enriched > 0) {
    const percentage = Math.round((enriched / movies.length) * 100);
    console.log(chalk.green(`  🎯 Success Rate: ${percentage}%\n`));
  }

  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════\n'));
}

async function main() {
  await enrichMovies();
}

main().catch(console.error);
