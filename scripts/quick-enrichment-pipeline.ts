#!/usr/bin/env npx tsx
/**
 * QUICK ENRICHMENT PIPELINE
 * 
 * Fast enrichment of the 3 biggest gaps:
 * 1. Trailers (from TMDB videos API)
 * 2. Auto-tags (heuristic rules)
 * 3. Synopsis Telugu (AI translation)
 * 
 * Usage:
 *   npx tsx scripts/quick-enrichment-pipeline.ts --limit=1000
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import { translateToTelugu } from '../lib/enrichment/translation-service';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '1000', 10);
const PARALLEL_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;

interface Movie {
  id: string;
  title_en: string;
  title_te?: string;
  release_year?: number;
  tmdb_id?: number;
  synopsis?: string;
  synopsis_te?: string;
  trailer_url?: string;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  is_underrated?: boolean;
  avg_rating?: number;
}

const stats = {
  trailers: 0,
  tags: 0,
  synopsis: 0,
};

// ============================================================
// PHASE 1: TRAILERS
// ============================================================

async function enrichTrailer(movie: Movie): Promise<boolean> {
  if (!movie.tmdb_id || movie.trailer_url) return false;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movie.tmdb_id}/videos?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const trailer = data.results?.find((v: any) => 
      v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );

    if (trailer) {
      await supabase
        .from('movies')
        .update({ trailer_url: `https://www.youtube.com/watch?v=${trailer.key}` })
        .eq('id', movie.id);
      
      return true;
    }
  } catch (error) {
    // Silently continue
  }

  return false;
}

// ============================================================
// PHASE 2: AUTO-TAGS
// ============================================================

function calculateTags(movie: Movie): { updates: any; hasChanges: boolean } {
  const updates: any = {};
  let hasChanges = false;

  const year = movie.release_year || 0;
  const rating = movie.avg_rating || 0;

  // Blockbuster: Recent movies (2015+) with high ratings (8.0+)
  if (year >= 2015 && rating >= 8.0 && !movie.is_blockbuster) {
    updates.is_blockbuster = true;
    hasChanges = true;
  }

  // Classic: Old movies (before 1990) with high ratings (7.5+)
  if (year < 1990 && rating >= 7.5 && !movie.is_classic) {
    updates.is_classic = true;
    hasChanges = true;
  }

  // Underrated: Decent movies (7.0-7.9) that aren't blockbusters
  if (rating >= 7.0 && rating < 8.0 && !movie.is_underrated && !movie.is_blockbuster) {
    updates.is_underrated = true;
    hasChanges = true;
  }

  return { updates, hasChanges };
}

// ============================================================
// PHASE 3: SYNOPSIS TRANSLATION
// ============================================================

async function enrichSynopsis(movie: Movie): Promise<boolean> {
  if (!movie.synopsis || movie.synopsis_te) return false;

  try {
    const result = await translateToTelugu(movie.synopsis, { maxLength: 1000 });
    
    if (result && result.text && result.confidence >= 0.70) {
      await supabase
        .from('movies')
        .update({ 
          synopsis_te: result.text,
          synopsis_te_source: result.source,
          synopsis_te_confidence: result.confidence
        })
        .eq('id', movie.id);
      
      return true;
    }
  } catch (error) {
    // Silently continue
  }

  return false;
}

// ============================================================
// MAIN PIPELINE
// ============================================================

async function main() {
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            QUICK ENRICHMENT PIPELINE (3 PHASES)                     ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const startTime = Date.now();

  // Fetch movies
  console.log(chalk.cyan('  📋 Fetching movies...'));
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, tmdb_id, synopsis, synopsis_te, trailer_url, is_blockbuster, is_classic, is_underrated, avg_rating')
    .eq('language', 'Telugu')
    .limit(LIMIT);

  if (error || !movies) {
    console.error(chalk.red('  ❌ Error fetching movies'));
    return;
  }

  console.log(chalk.green(`  ✅ Loaded ${movies.length} movies\n`));

  // ============================================================
  // PHASE 1: TRAILERS (5 minutes)
  // ============================================================
  
  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║  PHASE 1: TRAILERS                                                    ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const moviesNeedingTrailers = movies.filter(m => m.tmdb_id && !m.trailer_url);
  console.log(chalk.yellow(`  🎬 ${moviesNeedingTrailers.length} movies need trailers`));

  for (let i = 0; i < moviesNeedingTrailers.length; i += PARALLEL_BATCH_SIZE) {
    const batch = moviesNeedingTrailers.slice(i, i + PARALLEL_BATCH_SIZE);
    const results = await Promise.all(batch.map(m => enrichTrailer(m)));
    stats.trailers += results.filter(Boolean).length;

    if ((i / PARALLEL_BATCH_SIZE) % 10 === 0) {
      console.log(chalk.gray(`  Progress: ${Math.min(i + PARALLEL_BATCH_SIZE, moviesNeedingTrailers.length)}/${moviesNeedingTrailers.length} (${stats.trailers} added)`));
    }

    if (i + PARALLEL_BATCH_SIZE < moviesNeedingTrailers.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log(chalk.green(`  ✅ Trailers enriched: ${stats.trailers}\n`));

  // ============================================================
  // PHASE 2: AUTO-TAGS (instant)
  // ============================================================
  
  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║  PHASE 2: AUTO-TAGS                                                   ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const moviesNeedingTags = movies.filter(m => !m.is_blockbuster && !m.is_classic && !m.is_underrated);
  console.log(chalk.yellow(`  🏷️  ${moviesNeedingTags.length} movies need tags`));

  for (const movie of moviesNeedingTags) {
    const { updates, hasChanges } = calculateTags(movie);
    
    if (hasChanges) {
      await supabase.from('movies').update(updates).eq('id', movie.id);
      stats.tags++;
    }
  }

  console.log(chalk.green(`  ✅ Tags applied: ${stats.tags}\n`));

  // ============================================================
  // PHASE 3: SYNOPSIS TRANSLATION (15 minutes)
  // ============================================================
  
  console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║  PHASE 3: SYNOPSIS TRANSLATION                                        ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const moviesNeedingSynopsis = movies.filter(m => m.synopsis && !m.synopsis_te);
  console.log(chalk.yellow(`  📝 ${moviesNeedingSynopsis.length} movies need Telugu synopsis`));

  for (let i = 0; i < moviesNeedingSynopsis.length; i++) {
    const movie = moviesNeedingSynopsis[i];
    const success = await enrichSynopsis(movie);
    
    if (success) {
      stats.synopsis++;
    }

    if (i % 10 === 0) {
      console.log(chalk.gray(`  Progress: ${i + 1}/${moviesNeedingSynopsis.length} (${stats.synopsis} translated)`));
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(chalk.green(`  ✅ Synopsis translated: ${stats.synopsis}\n`));

  // ============================================================
  // SUMMARY
  // ============================================================
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            PIPELINE COMPLETE!                                         ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.cyan(`  Total movies processed: ${movies.length}`));
  console.log(chalk.cyan(`  Duration: ${duration} minutes\n`));

  console.log(chalk.green(`  ✅ Trailers added: ${stats.trailers}`));
  console.log(chalk.green(`  ✅ Tags applied: ${stats.tags}`));
  console.log(chalk.green(`  ✅ Synopsis translated: ${stats.synopsis}`));
  
  console.log(chalk.yellow(`\n  Total enrichments: ${stats.trailers + stats.tags + stats.synopsis}\n`));
}

main().catch(console.error);
