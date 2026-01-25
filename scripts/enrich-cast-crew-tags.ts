#!/usr/bin/env npx tsx
/**
 * CAST & CREW + TAGS ENRICHMENT
 * 
 * Phase 1: Cast & Crew from TMDB Credits API
 * Phase 2: Improved Auto-Tagging with better heuristics
 * 
 * Usage:
 *   npx tsx scripts/enrich-cast-crew-tags.ts --execute
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const EXECUTE = process.argv.includes('--execute');
const PARALLEL_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;

interface Movie {
  id: string;
  title_en: string;
  release_year?: number;
  tmdb_id?: number;
  director?: string;
  hero?: string;
  heroine?: string;
  cinematographer?: string;
  writer?: string;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  is_underrated?: boolean;
  avg_rating?: number;
}

const stats = {
  cast_crew: 0,
  tags: 0,
};

// ============================================================
// PHASE 1: CAST & CREW FROM TMDB
// ============================================================

async function getTMDBCredits(tmdbId: number): Promise<any> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function enrichCastCrew(movie: Movie): Promise<number> {
  if (!movie.tmdb_id) return 0;

  const credits = await getTMDBCredits(movie.tmdb_id);
  if (!credits) return 0;

  const updates: any = {};
  let count = 0;

  // Director
  if (!movie.director && credits.crew) {
    const director = credits.crew.find((c: any) => c.job === 'Director');
    if (director) {
      updates.director = director.name;
      count++;
    }
  }

  // Hero (lead male actor - order 0 or 1, gender 2)
  if (!movie.hero && credits.cast) {
    const leadMale = credits.cast.find((c: any) => 
      c.order <= 1 && c.gender === 2
    );
    if (leadMale) {
      updates.hero = leadMale.name;
      count++;
    }
  }

  // Heroine (lead female actor - order 0-2, gender 1)
  if (!movie.heroine && credits.cast) {
    const leadFemale = credits.cast.find((c: any) => 
      c.order <= 2 && c.gender === 1
    );
    if (leadFemale) {
      updates.heroine = leadFemale.name;
      count++;
    }
  }

  // Cinematographer (Director of Photography)
  if (!movie.cinematographer && credits.crew) {
    const cinematographer = credits.crew.find((c: any) => 
      c.job === 'Director of Photography'
    );
    if (cinematographer) {
      updates.cinematographer = cinematographer.name;
      count++;
    }
  }

  // Writer
  if (!movie.writer && credits.crew) {
    const writer = credits.crew.find((c: any) => 
      c.job === 'Writer' || c.job === 'Screenplay'
    );
    if (writer) {
      updates.writer = writer.name;
      count++;
    }
  }

  // Update database if we have changes
  if (count > 0) {
    await supabase.from('movies').update(updates).eq('id', movie.id);
  }

  return count;
}

// ============================================================
// PHASE 2: IMPROVED AUTO-TAGGING
// ============================================================

function calculateImprovedTags(movie: Movie): { updates: any; count: number } {
  const updates: any = {};
  let count = 0;

  const year = movie.release_year || 0;
  const rating = movie.avg_rating || 0;

  // Blockbuster: Recent movies (2010+) with good ratings (7.5+)
  // OR any movie with rating 8.5+
  if (!movie.is_blockbuster) {
    if ((year >= 2010 && rating >= 7.5) || rating >= 8.5) {
      updates.is_blockbuster = true;
      count++;
    }
  }

  // Classic: Old movies (before 1995) with decent ratings (7.0+)
  // OR pre-1985 with 6.5+
  if (!movie.is_classic) {
    if ((year < 1995 && rating >= 7.0) || (year < 1985 && rating >= 6.5)) {
      updates.is_classic = true;
      count++;
    }
  }

  // Underrated: Movies with decent ratings (6.5-7.9) 
  // that aren't blockbusters or classics
  if (!movie.is_underrated && !updates.is_blockbuster && !movie.is_blockbuster && !updates.is_classic && !movie.is_classic) {
    if (rating >= 6.5 && rating < 8.0) {
      updates.is_underrated = true;
      count++;
    }
  }

  return { updates, count };
}

// ============================================================
// MAIN FUNCTION
// ============================================================

async function main() {
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║         CAST & CREW + TAGS ENRICHMENT                                ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  if (!EXECUTE) {
    console.log(chalk.yellow('  ⚠️  DRY RUN MODE'));
    console.log(chalk.yellow('  Add --execute to apply changes\n'));
    return;
  }

  const startTime = Date.now();

  // Fetch all movies
  console.log(chalk.cyan('  📋 Loading all movies from database...'));
  
  let allMovies: Movie[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, tmdb_id, director, hero, heroine, cinematographer, writer, is_blockbuster, is_classic, is_underrated, avg_rating')
      .eq('language', 'Telugu')
      .range(offset, offset + batchSize - 1);

    if (error || !data || data.length === 0) break;
    
    allMovies = allMovies.concat(data);
    console.log(chalk.gray(`    Loaded ${allMovies.length} movies...`));
    
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(chalk.green(`  ✅ Loaded ${allMovies.length} movies total\n`));

  // ============================================================
  // PHASE 1: CAST & CREW ENRICHMENT
  // ============================================================
  
  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║  PHASE 1: CAST & CREW FROM TMDB                                       ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const moviesWithTMDB = allMovies.filter(m => m.tmdb_id);
  const moviesNeedingCastCrew = moviesWithTMDB.filter(m => 
    !m.director || !m.hero || !m.heroine || !m.cinematographer || !m.writer
  );

  console.log(chalk.yellow(`  🎬 ${moviesNeedingCastCrew.length} movies need cast/crew data`));
  console.log(chalk.gray(`     (${moviesWithTMDB.length} have TMDB IDs)\n`));

  for (let i = 0; i < moviesNeedingCastCrew.length; i += PARALLEL_BATCH_SIZE) {
    const batch = moviesNeedingCastCrew.slice(i, i + PARALLEL_BATCH_SIZE);
    const results = await Promise.all(batch.map(m => enrichCastCrew(m)));
    stats.cast_crew += results.reduce((sum, val) => sum + val, 0);

    if (i % 50 === 0 || i + PARALLEL_BATCH_SIZE >= moviesNeedingCastCrew.length) {
      const progress = Math.min(i + PARALLEL_BATCH_SIZE, moviesNeedingCastCrew.length);
      console.log(chalk.gray(`  Progress: ${progress}/${moviesNeedingCastCrew.length} (${stats.cast_crew} fields enriched)`));
    }

    if (i + PARALLEL_BATCH_SIZE < moviesNeedingCastCrew.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log(chalk.green(`\n  ✅ Cast & Crew enriched: ${stats.cast_crew} fields\n`));

  // ============================================================
  // PHASE 2: IMPROVED AUTO-TAGGING
  // ============================================================
  
  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║  PHASE 2: IMPROVED AUTO-TAGGING                                       ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const moviesNeedingTags = allMovies.filter(m => 
    !m.is_blockbuster || !m.is_classic || !m.is_underrated
  );

  console.log(chalk.yellow(`  🏷️  ${moviesNeedingTags.length} movies to check for tags\n`));

  // Process in batches for database updates
  const tagBatchSize = 100;
  for (let i = 0; i < moviesNeedingTags.length; i += tagBatchSize) {
    const batch = moviesNeedingTags.slice(i, i + tagBatchSize);
    
    for (const movie of batch) {
      const { updates, count } = calculateImprovedTags(movie);
      
      if (count > 0) {
        await supabase.from('movies').update(updates).eq('id', movie.id);
        stats.tags += count;
      }
    }

    if (i % 1000 === 0 || i + tagBatchSize >= moviesNeedingTags.length) {
      const progress = Math.min(i + tagBatchSize, moviesNeedingTags.length);
      console.log(chalk.gray(`  Progress: ${progress}/${moviesNeedingTags.length} (${stats.tags} tags applied)`));
    }
  }

  console.log(chalk.green(`\n  ✅ Tags applied: ${stats.tags}\n`));

  // ============================================================
  // SUMMARY
  // ============================================================
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            ENRICHMENT COMPLETE!                                       ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.cyan(`  Total movies processed: ${allMovies.length}`));
  console.log(chalk.cyan(`  Duration: ${duration} minutes\n`));

  console.log(chalk.green(`  ✅ Cast & Crew fields enriched: ${stats.cast_crew}`));
  console.log(chalk.green(`  ✅ Tags applied: ${stats.tags}`));
  
  console.log(chalk.yellow(`\n  Total enrichments: ${stats.cast_crew + stats.tags}\n`));

  console.log(chalk.cyan(`  💡 Run audit to see improvements:`));
  console.log(chalk.gray(`     npx tsx scripts/audit-movie-data-completeness.ts\n`));
}

main().catch(console.error);
