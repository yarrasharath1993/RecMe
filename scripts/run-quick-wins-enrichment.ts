#!/usr/bin/env npx tsx
/**
 * QUICK WINS ENRICHMENT - Phase 1
 * 
 * Executes all quick-win improvements identified in the audit:
 * 1. Bulk TMDB enrichment for all movies with IDs
 * 2. Visual asset completion (posters, backdrops)
 * 3. Cast & crew enrichment from multiple sources
 * 
 * Expected Impact:
 * - Hero Section: 85.9% → 95%+
 * - Synopsis: 64.7% → 80%+
 * - Visual Assets: 86.6% → 95%+
 * - Cast & Crew: 34.3% → 50%+
 * 
 * Duration: 2-3 hours (with rate limiting)
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

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const RATE_LIMIT_MS = 300; // TMDB allows ~40 requests/sec, we'll be conservative

interface EnrichmentStats {
  total_processed: number;
  successful: number;
  failed: number;
  skipped: number;
  fields_updated: Record<string, number>;
}

async function fetchTmdbMovie(tmdbId: number): Promise<any> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,images`
    );
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching TMDB ${tmdbId}:`, error);
    return null;
  }
}

async function enrichMovieFromTmdb(
  movie: any,
  stats: EnrichmentStats
): Promise<boolean> {
  if (!movie.tmdb_id) {
    stats.skipped++;
    return false;
  }

  const tmdbData = await fetchTmdbMovie(movie.tmdb_id);
  if (!tmdbData) {
    stats.failed++;
    return false;
  }

  const updates: Record<string, any> = {};

  // 1. Basic metadata
  if (!movie.runtime_minutes && tmdbData.runtime) {
    updates.runtime_minutes = tmdbData.runtime;
    stats.fields_updated.runtime_minutes = (stats.fields_updated.runtime_minutes || 0) + 1;
  }

  if (!movie.certification && tmdbData.release_dates?.results) {
    // Try to find US or IN certification
    const usRelease = tmdbData.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
    const inRelease = tmdbData.release_dates.results.find((r: any) => r.iso_3166_1 === 'IN');
    const cert = inRelease?.release_dates?.[0]?.certification || usRelease?.release_dates?.[0]?.certification;
    if (cert) {
      updates.certification = cert;
      stats.fields_updated.certification = (stats.fields_updated.certification || 0) + 1;
    }
  }

  // 2. Visual assets
  if (!movie.poster_url && tmdbData.poster_path) {
    updates.poster_url = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
    stats.fields_updated.poster_url = (stats.fields_updated.poster_url || 0) + 1;
  }

  if (!movie.backdrop_url && tmdbData.backdrop_path) {
    updates.backdrop_url = `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}`;
    stats.fields_updated.backdrop_url = (stats.fields_updated.backdrop_url || 0) + 1;
  }

  // 3. Synopsis (only if completely missing)
  if (!movie.synopsis && tmdbData.overview) {
    updates.synopsis = tmdbData.overview;
    stats.fields_updated.synopsis = (stats.fields_updated.synopsis || 0) + 1;
  }

  // 4. Tagline
  if (!movie.tagline && tmdbData.tagline) {
    updates.tagline = tmdbData.tagline;
    stats.fields_updated.tagline = (stats.fields_updated.tagline || 0) + 1;
  }

  // 5. Cast & Crew from credits
  if (tmdbData.credits) {
    const crew = tmdbData.credits.crew || [];
    const cast = tmdbData.credits.cast || [];

    // Director
    if (!movie.director) {
      const director = crew.find((c: any) => c.job === 'Director');
      if (director) {
        updates.director = director.name;
        stats.fields_updated.director = (stats.fields_updated.director || 0) + 1;
      }
    }

    // Music Director
    if (!movie.music_director) {
      const composer = crew.find((c: any) => 
        c.job === 'Original Music Composer' || c.job === 'Music'
      );
      if (composer) {
        updates.music_director = composer.name;
        stats.fields_updated.music_director = (stats.fields_updated.music_director || 0) + 1;
      }
    }

    // Cinematographer
    if (!movie.cinematographer) {
      const dop = crew.find((c: any) => c.job === 'Director of Photography');
      if (dop) {
        updates.cinematographer = dop.name;
        stats.fields_updated.cinematographer = (stats.fields_updated.cinematographer || 0) + 1;
      }
    }

    // Producer
    if (!movie.producer && crew.length > 0) {
      const producer = crew.find((c: any) => c.job === 'Producer');
      if (producer) {
        updates.producer = producer.name;
        stats.fields_updated.producer = (stats.fields_updated.producer || 0) + 1;
      }
    }

    // Hero/Heroine (if missing and cast has data)
    // Only update if completely missing, don't override existing
    if (!movie.hero && cast.length > 0 && cast[0].gender === 2) {
      updates.hero = cast[0].name;
      stats.fields_updated.hero = (stats.fields_updated.hero || 0) + 1;
    }

    if (!movie.heroine && cast.length > 0) {
      const femaleActor = cast.find((c: any) => c.gender === 1);
      if (femaleActor) {
        updates.heroine = femaleActor.name;
        stats.fields_updated.heroine = (stats.fields_updated.heroine || 0) + 1;
      }
    }
  }

  // 6. Trailer URL
  if (!movie.trailer_url && tmdbData.videos?.results) {
    const trailer = tmdbData.videos.results.find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
    );
    if (trailer) {
      updates.trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`;
      stats.fields_updated.trailer_url = (stats.fields_updated.trailer_url || 0) + 1;
    }
  }

  // Apply updates if any
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', movie.id);

    if (error) {
      console.error(`Error updating movie ${movie.title_en}:`, error);
      stats.failed++;
      return false;
    }

    stats.successful++;
    return true;
  }

  stats.skipped++;
  return false;
}

async function runQuickWinsEnrichment() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              QUICK WINS ENRICHMENT - PHASE 1                          ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  if (!TMDB_API_KEY) {
    console.error(chalk.red('  ✗ TMDB_API_KEY not found in environment'));
    console.log(chalk.yellow('  Please add TMDB_API_KEY to .env.local'));
    process.exit(1);
  }

  const startTime = Date.now();
  const stats: EnrichmentStats = {
    total_processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    fields_updated: {}
  };

  // Fetch movies with TMDB IDs (priority: missing data)
  console.log(chalk.white('  Fetching movies needing enrichment...\n'));

  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .not('tmdb_id', 'is', null)
    .or('poster_url.is.null,runtime_minutes.is.null,synopsis.is.null,director.is.null,trailer_url.is.null')
    .order('release_year', { ascending: false })
    .limit(1000); // Process in batches

  if (error || !movies) {
    console.error(chalk.red('  ✗ Error fetching movies:'), error);
    process.exit(1);
  }

  console.log(chalk.green(`  ✓ Found ${movies.length} movies to enrich\n`));
  console.log(chalk.white('  Starting enrichment (with rate limiting)...\n'));

  // Process movies in batches
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 1500; // 1.5 seconds between batches

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(movies.length / BATCH_SIZE);

    console.log(chalk.gray(`  📦 Batch ${batchNum}/${totalBatches}`));

    await Promise.all(
      batch.map(async (movie) => {
        stats.total_processed++;
        const updated = await enrichMovieFromTmdb(movie, stats);
        
        if (updated) {
          console.log(chalk.green(`    ✓ ${movie.title_en} (${movie.release_year})`));
        } else {
          console.log(chalk.gray(`    ⊘ ${movie.title_en} (no updates)`));
        }
      })
    );

    // Rate limiting delay
    if (i + BATCH_SIZE < movies.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   ENRICHMENT COMPLETE                                 ║
╚═══════════════════════════════════════════════════════════════════════╝

  Total Processed:          ${stats.total_processed.toLocaleString()}
  ✓ Successfully Updated:   ${stats.successful.toLocaleString()}
  ✗ Failed:                 ${stats.failed}
  ⊘ Skipped (no updates):   ${stats.skipped.toLocaleString()}
  
  Fields Updated:
${Object.entries(stats.fields_updated)
  .sort((a, b) => b[1] - a[1])
  .map(([field, count]) => `  - ${field}: ${count}`)
  .join('\n')}
  
  Duration: ${duration} minutes
  
  ✅ Quick wins enrichment complete!
  
  Recommendations:
  1. Run audit again to measure improvement
  2. Process remaining movies in next batch
  3. Review and enable Telugu sources for cast enrichment

`));
}

runQuickWinsEnrichment().catch(console.error);
