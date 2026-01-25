#!/usr/bin/env npx tsx
/**
 * PRODUCER & MUSIC DIRECTOR ENRICHMENT
 * 
 * Enriches missing producer and music_director fields using TMDB Credits API.
 * 
 * Usage:
 *   npx tsx scripts/enrich-producer-music.ts --execute
 *   npx tsx scripts/enrich-producer-music.ts --report-only
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
const REPORT_ONLY = process.argv.includes('--report-only');
const PARALLEL_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;

interface Movie {
  id: string;
  title_en: string;
  release_year?: number;
  tmdb_id?: number;
  producer?: string;
  music_director?: string;
}

const stats = {
  producer: 0,
  music_director: 0,
};

/**
 * Get movie credits from TMDB
 */
async function getTMDBCredits(tmdbId: number): Promise<any | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
    });

    const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/credits?${params}`);
    if (!response.ok) {
      console.error(chalk.red(`  TMDB API error for ${tmdbId}: ${response.status} ${response.statusText}`));
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(chalk.red(`  Error fetching TMDB credits for ${tmdbId}: ${error}`));
    return null;
  }
}

/**
 * Enrich Producer and Music Director from TMDB
 */
async function enrichProducerMusic(movie: Movie): Promise<number> {
  if (!movie.tmdb_id) return 0;

  const updates: any = {};
  let fieldsEnriched = 0;

  const tmdbData = await getTMDBCredits(movie.tmdb_id);
  if (!tmdbData || !tmdbData.crew) return 0;

  // Producer (look for Producer or Executive Producer)
  if (!movie.producer) {
    const producer = tmdbData.crew.find((c: any) => 
      c.job === 'Producer' || c.job === 'Executive Producer'
    );
    if (producer) {
      updates.producer = producer.name;
      fieldsEnriched++;
    }
  }

  // Music Director (look for Original Music Composer or Music)
  if (!movie.music_director) {
    const musicDirector = tmdbData.crew.find((c: any) => 
      c.job === 'Original Music Composer' || 
      c.job === 'Music' ||
      c.job === 'Music Director'
    );
    if (musicDirector) {
      updates.music_director = musicDirector.name;
      fieldsEnriched++;
    }
  }

  // Update database if we found anything
  if (fieldsEnriched > 0) {
    const { error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movie.id);

    if (error) {
      console.error(chalk.red(`  Error updating ${movie.title_en}: ${error.message}`));
      return 0;
    }

    // Update stats
    if (updates.producer) stats.producer++;
    if (updates.music_director) stats.music_director++;
  }

  return fieldsEnriched;
}

/**
 * Main enrichment function
 */
async function main() {
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║         PRODUCER & MUSIC DIRECTOR ENRICHMENT                         ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  // Load all Telugu movies
  console.log(chalk.cyan(`  📋 Loading all Telugu movies from database...`));
  
  let allMovies: Movie[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, tmdb_id, producer, music_director')
      .eq('language', 'Telugu')
      .range(offset, offset + batchSize - 1);

    if (error || !data || data.length === 0) break;
    
    allMovies = allMovies.concat(data);
    console.log(chalk.gray(`    Loaded ${allMovies.length} movies...`));
    
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(chalk.green(`  ✅ Loaded ${allMovies.length} movies total\n`));

  // Filter movies needing enrichment
  const moviesWithTMDB = allMovies.filter(m => m.tmdb_id);
  const moviesNeedingEnrichment = moviesWithTMDB.filter(m => 
    !m.producer || !m.music_director
  );

  console.log(chalk.yellow(`  🎬 ${moviesNeedingEnrichment.length} movies need producer/music director`));
  console.log(chalk.gray(`     (${moviesWithTMDB.length} have TMDB IDs)\n`));

  // Report mode
  if (REPORT_ONLY) {
    const needingProducer = moviesNeedingEnrichment.filter(m => !m.producer).length;
    const needingMusic = moviesNeedingEnrichment.filter(m => !m.music_director).length;
    
    console.log(chalk.cyan(`  📊 BREAKDOWN:`));
    console.log(chalk.gray(`    Movies needing Producer:        ${needingProducer}`));
    console.log(chalk.gray(`    Movies needing Music Director:  ${needingMusic}`));
    console.log(chalk.gray(`    Movies with TMDB IDs:           ${moviesWithTMDB.length}`));
    console.log(chalk.gray(`    Movies without TMDB IDs:        ${allMovies.length - moviesWithTMDB.length}\n`));
    
    console.log(chalk.yellow(`  ⚠️  REPORT-ONLY MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
    return;
  }

  if (!EXECUTE) {
    console.log(chalk.yellow(`  ⚠️  DRY RUN MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
    return;
  }

  // Start enrichment
  const startTime = Date.now();
  let totalFieldsEnriched = 0;

  for (let i = 0; i < moviesNeedingEnrichment.length; i += PARALLEL_BATCH_SIZE) {
    const batch = moviesNeedingEnrichment.slice(i, i + PARALLEL_BATCH_SIZE);
    const results = await Promise.all(batch.map(m => enrichProducerMusic(m)));
    
    const batchEnriched = results.reduce((sum, val) => sum + val, 0);
    totalFieldsEnriched += batchEnriched;

    // Log progress every 50 movies or at the end
    if (i % 50 === 0 || i + PARALLEL_BATCH_SIZE >= moviesNeedingEnrichment.length) {
      const progress = Math.min(i + PARALLEL_BATCH_SIZE, moviesNeedingEnrichment.length);
      console.log(chalk.gray(`  Progress: ${progress}/${moviesNeedingEnrichment.length} (${totalFieldsEnriched} fields enriched)`));
    }

    // Rate limiting
    if (i + PARALLEL_BATCH_SIZE < moviesNeedingEnrichment.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Final report
  console.log(chalk.green(`\n  ✅ Enrichment complete!\n`));

  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            ENRICHMENT COMPLETE!                                       ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.green(`  Total movies processed: ${moviesNeedingEnrichment.length}`));
  console.log(chalk.green(`  Duration: ${duration} minutes\n`));

  console.log(chalk.green(`  ✅ Producers added: ${stats.producer}`));
  console.log(chalk.green(`  ✅ Music Directors added: ${stats.music_director}`));
  console.log(chalk.green(`  Total enrichments: ${totalFieldsEnriched}\n`));

  console.log(chalk.cyan(`  💡 Run audit to see improvements:`));
  console.log(chalk.gray(`     npx tsx scripts/audit-movie-data-completeness.ts\n`));
}

main();
