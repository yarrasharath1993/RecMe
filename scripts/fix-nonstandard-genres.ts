#!/usr/bin/env npx tsx
/**
 * Fix Non-Standard Genres
 * 
 * Automatically maps non-standard genre names to standard TMDB-compatible genres
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Genre mapping configuration
const GENRE_MAPPINGS: Record<string, string | null> = {
  // Biographical/History
  'Biographical': 'Drama',
  'Biography': 'Drama',
  'Biopic': 'Drama',
  'Historical': 'History',
  
  // Art/Cultural
  'Art': 'Drama',
  'Coming-of-age': 'Drama',
  
  // Telugu-specific
  'Mass': 'Action',  // Telugu "mass masala" films
  
  // Sports
  'Sports': 'Drama',  // Sports dramas
  
  // Sci-Fi variations
  'Sci-Fi': 'Science Fiction',
  
  // Thriller variations
  'Suspense': 'Thriller',
  
  // Supernatural
  'Supernatural': 'Fantasy',
  
  // Epic
  'Epic': 'Adventure',
  
  // TV/Streaming
  'TV Movie': null,  // Remove this genre, keep others
  
  // Other variations
  'Teen': 'Drama'
};

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  genres: string[];
  slug: string;
}

async function fetchMoviesWithNonStandardGenres(): Promise<Movie[]> {
  const BATCH_SIZE = 1000;
  let offset = 0;
  let allAffectedMovies: Movie[] = [];
  
  console.log(chalk.white('  Scanning database for non-standard genres...\n'));
  
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, genres, slug')
      .order('release_year', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) break;

    // Filter movies with non-standard genres
    const affected = data.filter((movie: Movie) => {
      if (!movie.genres) return false;
      return movie.genres.some(genre => Object.keys(GENRE_MAPPINGS).includes(genre));
    });

    allAffectedMovies.push(...affected);
    offset += BATCH_SIZE;
    
    if (data.length < BATCH_SIZE) break;
  }

  return allAffectedMovies;
}

function mapGenres(originalGenres: string[]): string[] {
  const mapped = new Set<string>();
  
  originalGenres.forEach(genre => {
    if (genre in GENRE_MAPPINGS) {
      const replacement = GENRE_MAPPINGS[genre];
      if (replacement !== null) {
        mapped.add(replacement);
      }
      // If replacement is null, skip this genre (remove it)
    } else {
      mapped.add(genre);
    }
  });

  return Array.from(mapped);
}

async function fixNonStandardGenres() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              FIX NON-STANDARD GENRES                                  ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  const movies = await fetchMoviesWithNonStandardGenres();
  console.log(chalk.green(`  ✓ Found ${chalk.cyan(movies.length)} movies with non-standard genres\n`));

  if (movies.length === 0) {
    console.log(chalk.green('  🎉 All genres are already standard!\n'));
    return;
  }

  console.log(chalk.white('  Genre Mappings:\n'));
  Object.entries(GENRE_MAPPINGS).forEach(([from, to]) => {
    const toDisplay = to === null ? chalk.red('REMOVE') : chalk.green(`→ ${to}`);
    console.log(chalk.gray(`    "${from}" ${toDisplay}`));
  });
  console.log();

  console.log(chalk.white('  Applying fixes...\n'));

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  for (const movie of movies) {
    const originalGenres = movie.genres || [];
    const newGenres = mapGenres(originalGenres);
    
    // Only update if genres actually changed
    if (JSON.stringify(originalGenres.sort()) === JSON.stringify(newGenres.sort())) {
      continue;
    }

    console.log(chalk.white(`  ${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`    ${originalGenres.join(', ')} → ${newGenres.join(', ')}`));

    const { error } = await supabase
      .from('movies')
      .update({ genres: newGenres })
      .eq('id', movie.id);

    if (error) {
      console.log(chalk.red(`    ✗ Failed: ${error.message}`));
      failCount++;
      errors.push(`${movie.title_en}: ${error.message}`);
    } else {
      console.log(chalk.green(`    ✓ Updated`));
      successCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 30));
  }

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   FIX COMPLETE                                        ║
╚═══════════════════════════════════════════════════════════════════════╝

  Total Movies Scanned:     ${movies.length}
  ✓ Successfully Fixed:     ${successCount}
  ✗ Failed:                 ${failCount}

`));

  if (errors.length > 0) {
    console.log(chalk.red('  Errors:\n'));
    errors.forEach(err => console.log(chalk.red(`    - ${err}`)));
  }

  console.log(chalk.green(`\n  ✅ Non-standard genres have been mapped to standard genres!\n`));
  console.log(chalk.white('  Run audit again to verify: npx tsx scripts/audit-genre-quality-complete.ts\n'));
}

fixNonStandardGenres();
