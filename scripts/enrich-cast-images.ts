#!/usr/bin/env npx tsx

/**
 * Enrich Cast Images Script
 * 
 * Pre-populates celebrity profile images from TMDB for movies without posters.
 * This reduces API calls at runtime by caching images in the celebrities table.
 * 
 * Usage:
 *   npx tsx scripts/enrich-cast-images.ts
 *   npx tsx scripts/enrich-cast-images.ts --limit 100
 *   npx tsx scripts/enrich-cast-images.ts --dry-run
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

// ============================================================
// CONFIGURATION
// ============================================================

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPES
// ============================================================

interface CastMember {
  name: string;
  role: 'hero' | 'heroine' | 'director';
}

interface Stats {
  moviesProcessed: number;
  uniqueNames: number;
  foundInDb: number;
  fetchedFromTmdb: number;
  notFound: number;
  errors: number;
}

// ============================================================
// TMDB FUNCTIONS
// ============================================================

async function searchTMDBPerson(name: string): Promise<{ id: number; profile_path: string } | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      if (res.status === 429) {
        // Rate limited - wait and retry
        await new Promise(r => setTimeout(r, 2000));
        return searchTMDBPerson(name);
      }
      return null;
    }

    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      // Prefer actors/directors with profile images
      const withImage = data.results.find((p: any) => p.profile_path);
      if (withImage) {
        return {
          id: withImage.id,
          profile_path: withImage.profile_path,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(chalk.red(`  TMDB error for ${name}:`), error);
    return null;
  }
}

// ============================================================
// DATABASE FUNCTIONS
// ============================================================

async function getCelebrityByName(name: string): Promise<{
  id: string;
  profile_image: string | null;
  tmdb_id: number | null;
} | null> {
  const { data } = await supabase
    .from('celebrities')
    .select('id, profile_image, tmdb_id')
    .ilike('name_en', name)
    .limit(1)
    .single();

  return data;
}

async function createOrUpdateCelebrity(
  name: string,
  tmdbId: number,
  profileImage: string
): Promise<boolean> {
  const existing = await getCelebrityByName(name);

  if (existing) {
    // Update if missing image
    if (!existing.profile_image) {
      const { error } = await supabase
        .from('celebrities')
        .update({
          profile_image: profileImage,
          profile_image_source: 'TMDB',
          tmdb_id: tmdbId,
        })
        .eq('id', existing.id);

      return !error;
    }
    return true; // Already has image
  } else {
    // Create new entry
    const { error } = await supabase
      .from('celebrities')
      .insert({
        name_en: name,
        profile_image: profileImage,
        profile_image_source: 'TMDB',
        tmdb_id: tmdbId,
        is_published: true,
      });

    return !error;
  }
}

// ============================================================
// MAIN ENRICHMENT LOGIC
// ============================================================

async function getMoviesWithoutPosters(limit: number = 500): Promise<Array<{
  id: string;
  title_en: string;
  hero: string | null;
  heroine: string | null;
  director: string | null;
}>> {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title_en, hero, heroine, director')
    .is('poster_url', null)
    .eq('is_published', true)
    .limit(limit);

  if (error) {
    console.error(chalk.red('Error fetching movies:'), error);
    return [];
  }

  return data || [];
}

async function enrichCastImages(options: {
  limit?: number;
  dryRun?: boolean;
  verbose?: boolean;
}): Promise<Stats> {
  const { limit = 500, dryRun = false, verbose = false } = options;

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  CAST IMAGES ENRICHMENT'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  if (dryRun) {
    console.log(chalk.yellow('  ⚠️  DRY RUN MODE - No changes will be made\n'));
  }

  const stats: Stats = {
    moviesProcessed: 0,
    uniqueNames: 0,
    foundInDb: 0,
    fetchedFromTmdb: 0,
    notFound: 0,
    errors: 0,
  };

  // Fetch movies without posters
  console.log(chalk.gray(`  Fetching up to ${limit} movies without posters...`));
  const movies = await getMoviesWithoutPosters(limit);
  stats.moviesProcessed = movies.length;
  console.log(chalk.gray(`  Found ${movies.length} movies\n`));

  if (movies.length === 0) {
    console.log(chalk.green('  ✓ No movies without posters need enrichment\n'));
    return stats;
  }

  // Collect unique cast member names
  const castMembers = new Map<string, CastMember>();
  
  for (const movie of movies) {
    if (movie.hero && movie.hero !== 'Unknown' && movie.hero !== 'Various') {
      if (!castMembers.has(movie.hero)) {
        castMembers.set(movie.hero, { name: movie.hero, role: 'hero' });
      }
    }
    if (movie.heroine && movie.heroine !== 'Unknown' && movie.heroine !== 'Various' && movie.heroine !== 'No Female Lead') {
      if (!castMembers.has(movie.heroine)) {
        castMembers.set(movie.heroine, { name: movie.heroine, role: 'heroine' });
      }
    }
    if (movie.director && movie.director !== 'Unknown') {
      if (!castMembers.has(movie.director)) {
        castMembers.set(movie.director, { name: movie.director, role: 'director' });
      }
    }
  }

  stats.uniqueNames = castMembers.size;
  console.log(chalk.gray(`  Found ${castMembers.size} unique cast members to process\n`));

  // Process each cast member
  let processed = 0;
  for (const [name, member] of castMembers) {
    processed++;
    const progress = `[${processed}/${castMembers.size}]`;

    // Check if already in database with image
    const existing = await getCelebrityByName(name);
    
    if (existing?.profile_image) {
      stats.foundInDb++;
      if (verbose) {
        console.log(chalk.gray(`  ${progress} ${name}: Already in DB`));
      }
      continue;
    }

    // Fetch from TMDB
    if (verbose) {
      console.log(chalk.gray(`  ${progress} ${name}: Searching TMDB...`));
    }

    const tmdbPerson = await searchTMDBPerson(name);
    
    if (tmdbPerson?.profile_path) {
      const imageUrl = `${TMDB_IMAGE_BASE}${tmdbPerson.profile_path}`;
      
      if (!dryRun) {
        const success = await createOrUpdateCelebrity(name, tmdbPerson.id, imageUrl);
        if (success) {
          stats.fetchedFromTmdb++;
          console.log(chalk.green(`  ${progress} ✓ ${name}`));
        } else {
          stats.errors++;
          console.log(chalk.red(`  ${progress} ✗ ${name}: DB error`));
        }
      } else {
        stats.fetchedFromTmdb++;
        console.log(chalk.yellow(`  ${progress} [DRY] ${name}: Would fetch from TMDB`));
      }
    } else {
      stats.notFound++;
      if (verbose) {
        console.log(chalk.gray(`  ${progress} ${name}: Not found on TMDB`));
      }
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 150));
  }

  // Print summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  ENRICHMENT SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  console.log(`  Movies processed:      ${stats.moviesProcessed}`);
  console.log(`  Unique cast members:   ${stats.uniqueNames}`);
  console.log(`  Already in database:   ${stats.foundInDb}`);
  console.log(`  Fetched from TMDB:     ${chalk.green(stats.fetchedFromTmdb.toString())}`);
  console.log(`  Not found:             ${stats.notFound}`);
  console.log(`  Errors:                ${stats.errors > 0 ? chalk.red(stats.errors.toString()) : '0'}`);
  console.log('');

  return stats;
}

// ============================================================
// CLI
// ============================================================

function parseArgs(): { limit: number; dryRun: boolean; verbose: boolean } {
  const args = process.argv.slice(2);
  let limit = 500;
  let dryRun = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: npx tsx scripts/enrich-cast-images.ts [options]

Options:
  --limit <n>    Process up to n movies (default: 500)
  --dry-run      Show what would be done without making changes
  --verbose, -v  Show detailed progress
  --help, -h     Show this help message
`);
      process.exit(0);
    }
  }

  return { limit, dryRun, verbose };
}

async function main() {
  const options = parseArgs();
  
  if (!TMDB_API_KEY) {
    console.error(chalk.red('Error: TMDB_API_KEY not set in environment'));
    process.exit(1);
  }

  try {
    await enrichCastImages(options);
    console.log(chalk.green('✓ Enrichment complete\n'));
  } catch (error) {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  }
}

main();
