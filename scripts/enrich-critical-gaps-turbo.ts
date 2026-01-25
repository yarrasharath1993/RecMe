#!/usr/bin/env npx tsx
/**
 * CRITICAL DATA GAPS ENRICHMENT (TURBO MODE)
 * 
 * Focuses on the 5 critical gaps identified in the data audit:
 * 1. Cast & Crew: 4,787 missing producer, 4,354 missing music director
 * 2. Synopsis: 2,600 missing Telugu synopsis
 * 3. Tags: 6,805 movies need tagging (blockbuster, classic, underrated, featured)
 * 4. Media: 7,397 movies need trailers
 * 5. Editorial: 6,454 movies need reviews (manual process)
 * 
 * Uses:
 * - Turbo parallel processing (5-10x faster)
 * - Multi-source validation for cast/crew (21 sources)
 * - TMDB for trailers and basic metadata
 * - AI for Telugu synopsis translation
 * - Confidence scoring for all enrichments
 * 
 * Performance:
 * - 1,000 movies in ~30-40 minutes
 * - Respects API rate limits (TMDB: 40 req/10sec)
 * 
 * Usage:
 *   npx tsx scripts/enrich-critical-gaps-turbo.ts --limit=1000 --execute
 *   npx tsx scripts/enrich-critical-gaps-turbo.ts --focus=cast-crew --limit=500 --execute
 *   npx tsx scripts/enrich-critical-gaps-turbo.ts --focus=synopsis --limit=500 --execute
 *   npx tsx scripts/enrich-critical-gaps-turbo.ts --focus=trailers --limit=1000 --execute
 *   npx tsx scripts/enrich-critical-gaps-turbo.ts --report-only
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import { fetchFromAllSources, MultiSourceResult, MovieQuery } from './lib/multi-source-orchestrator';
import { translateToTelugu } from '../lib/enrichment/translation-service';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// TURBO CONFIG
const PARALLEL_BATCH_SIZE = 5;  // Process 5 movies at once
const BATCH_DELAY_MS = 1500;     // 1.5 seconds between batches (respects 40 req/10sec limit)

interface Movie {
  id: string;
  title_en: string;
  title_te?: string | null;
  release_year?: number | null;
  tmdb_id?: number | null;
  imdb_id?: string | null;
  director?: string | null;
  hero?: string | null;
  heroine?: string | null;
  music_director?: string | null;
  producer?: string | null;
  cinematographer?: string | null;
  synopsis?: string | null;
  synopsis_te?: string | null;
  trailer_url?: string | null;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  is_underrated?: boolean;
  avg_rating?: number | null;
}

interface EnrichmentResult {
  success: boolean;
  changes: string[];
  confidence: number;
  sources: string[];
  conflicts: string[];
}

interface EnrichmentStats {
  total: number;
  cast_crew_enriched: number;
  synopsis_enriched: number;
  trailers_enriched: number;
  tags_enriched: number;
  failed: number;
  skipped: number;
  duration_ms: number;
}

/**
 * Enrich cast & crew using multi-source orchestrator
 */
async function enrichCastCrew(movie: Movie): Promise<{ updates: any; changes: string[]; sources: string[]; conflicts: string[] }> {
  const updates: any = {};
  const changes: string[] = [];
  const sources: string[] = [];
  const conflicts: string[] = [];

  try {
    const query: MovieQuery = {
      title_en: movie.title_en,
      release_year: movie.release_year || 0,
      tmdb_id: movie.tmdb_id,
      imdb_id: movie.imdb_id || undefined,
      hero: movie.hero || undefined,
      director: movie.director || undefined,
    };

    // Fields to enrich (only missing ones)
    const fieldsToEnrich: string[] = [];
    if (!movie.producer) fieldsToEnrich.push('producer');
    if (!movie.music_director) fieldsToEnrich.push('music_director');
    if (!movie.cinematographer) fieldsToEnrich.push('cinematographer');

    if (fieldsToEnrich.length === 0) {
      return { updates, changes, sources, conflicts };
    }

    // Fetch from all sources
    const results: MultiSourceResult[] = await fetchFromAllSources(query, fieldsToEnrich);

    for (const result of results) {
      if (result.action === 'auto_apply' && result.consensus && result.consensusConfidence >= 0.75) {
        updates[result.field] = result.consensus;
        changes.push(result.field);
        sources.push(...result.sources.map(s => s.sourceId).slice(0, 3)); // Top 3 sources
      } else if (result.action === 'flag_conflict' && result.conflict) {
        conflicts.push(`${result.field}: ${result.conflict.values.join(' vs ')}`);
      }
    }
  } catch (error) {
    console.error(`  Cast/crew enrichment error: ${error}`);
  }

  return { updates, changes, sources, conflicts };
}

/**
 * Translate synopsis to Telugu using existing translation service
 * Uses Google Translate, Groq LLM, or LibreTranslate as fallback
 */
async function translateSynopsisToTelugu(englishSynopsis: string): Promise<{ text: string; confidence: number } | null> {
  if (!englishSynopsis) return null;

  try {
    const result = await translateToTelugu(englishSynopsis, { maxLength: 1000 });
    if (result) {
      return {
        text: result.text,
        confidence: result.confidence
      };
    }
  } catch (error) {
    console.error(`  Telugu translation error: ${error}`);
  }

  return null;
}

/**
 * Enrich synopsis (Telugu translation)
 */
async function enrichSynopsis(movie: Movie): Promise<{ updates: any; changes: string[]; confidence?: number }> {
  const updates: any = {};
  const changes: string[] = [];
  let confidence: number | undefined;

  // Only translate if we have English synopsis but missing Telugu
  if (movie.synopsis && !movie.synopsis_te) {
    const result = await translateSynopsisToTelugu(movie.synopsis);
    if (result) {
      updates.synopsis_te = result.text;
      changes.push('synopsis_te');
      confidence = result.confidence;
    }
  }

  return { updates, changes, confidence };
}

/**
 * Enrich trailer URL from TMDB
 */
async function enrichTrailer(movie: Movie): Promise<{ updates: any; changes: string[] }> {
  const updates: any = {};
  const changes: string[] = [];

  if (!TMDB_API_KEY || movie.trailer_url || !movie.tmdb_id) {
    return { updates, changes };
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${movie.tmdb_id}/videos?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    // Find YouTube trailer
    const trailer = data.results?.find((v: any) =>
      v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );

    if (trailer) {
      updates.trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`;
      changes.push('trailer_url');
    }
  } catch (error) {
    console.error(`  Trailer enrichment error: ${error}`);
  }

  return { updates, changes };
}

/**
 * Auto-tag movies based on ratings and era (simple heuristics)
 */
function autoTag(movie: Movie): { updates: any; changes: string[] } {
  const updates: any = {};
  const changes: string[] = [];

  // Skip if already tagged
  if (movie.is_blockbuster || movie.is_classic || movie.is_underrated) {
    return { updates, changes };
  }

  const year = movie.release_year || 0;
  const rating = movie.avg_rating || 0;

  // Blockbuster: Recent movies (2015+) with high ratings (8.0+)
  if (year >= 2015 && rating >= 8.0) {
    updates.is_blockbuster = true;
    changes.push('is_blockbuster');
  }

  // Classic: Old movies (before 1990) with high ratings (7.5+)
  if (year < 1990 && rating >= 7.5) {
    updates.is_classic = true;
    changes.push('is_classic');
  }

  // Underrated: Decent movies (7.0-7.9) that aren't blockbusters
  if (rating >= 7.0 && rating < 8.0 && !updates.is_blockbuster) {
    updates.is_underrated = true;
    changes.push('is_underrated');
  }

  return { updates, changes };
}

/**
 * Enrich a single movie (TURBO)
 */
async function enrichMovie(movie: Movie, focus?: string): Promise<EnrichmentResult> {
  const allUpdates: any = {};
  const allChanges: string[] = [];
  const allSources: string[] = [];
  const allConflicts: string[] = [];
  let overallConfidence = 0;
  let confidenceCount = 0;

  try {
    // 1. Cast & Crew (if focus=cast-crew or no focus)
    if (!focus || focus === 'cast-crew') {
      const { updates, changes, sources, conflicts } = await enrichCastCrew(movie);
      Object.assign(allUpdates, updates);
      allChanges.push(...changes);
      allSources.push(...sources);
      allConflicts.push(...conflicts);
      if (changes.length > 0) {
        overallConfidence += 0.85; // Multi-source has high confidence
        confidenceCount++;
      }
    }

    // 2. Synopsis (if focus=synopsis or no focus)
    if (!focus || focus === 'synopsis') {
      const { updates, changes, confidence } = await enrichSynopsis(movie);
      Object.assign(allUpdates, updates);
      allChanges.push(...changes);
      if (changes.length > 0) {
        overallConfidence += (confidence || 0.80); // Use actual translation confidence
        confidenceCount++;
      }
    }

    // 3. Trailer (if focus=trailers or no focus)
    if (!focus || focus === 'trailers') {
      const { updates, changes } = await enrichTrailer(movie);
      Object.assign(allUpdates, updates);
      allChanges.push(...changes);
      if (changes.length > 0) {
        overallConfidence += 0.95; // TMDB trailers are reliable
        confidenceCount++;
      }
    }

    // 4. Tags (if focus=tags or no focus)
    if (!focus || focus === 'tags') {
      const { updates, changes } = autoTag(movie);
      Object.assign(allUpdates, updates);
      allChanges.push(...changes);
      if (changes.length > 0) {
        overallConfidence += 0.70; // Auto-tagging is heuristic-based
        confidenceCount++;
      }
    }

    // Update database if we have changes
    if (Object.keys(allUpdates).length > 0) {
      const { error } = await supabase
        .from('movies')
        .update(allUpdates)
        .eq('id', movie.id);

      if (error) {
        return {
          success: false,
          changes: [],
          confidence: 0,
          sources: [],
          conflicts: []
        };
      }

      return {
        success: true,
        changes: allChanges,
        confidence: confidenceCount > 0 ? overallConfidence / confidenceCount : 0,
        sources: Array.from(new Set(allSources)),
        conflicts: allConflicts
      };
    }

    return {
      success: false,
      changes: [],
      confidence: 0,
      sources: [],
      conflicts: []
    };

  } catch (error) {
    console.error(`  Enrichment error: ${error}`);
    return {
      success: false,
      changes: [],
      confidence: 0,
      sources: [],
      conflicts: []
    };
  }
}

/**
 * Process movies in parallel batches (TURBO!)
 */
async function processBatch(movies: Movie[], focus?: string): Promise<EnrichmentStats> {
  const stats: EnrichmentStats = {
    total: movies.length,
    cast_crew_enriched: 0,
    synopsis_enriched: 0,
    trailers_enriched: 0,
    tags_enriched: 0,
    failed: 0,
    skipped: 0,
    duration_ms: 0
  };

  const startTime = Date.now();

  // Process in parallel batches
  for (let i = 0; i < movies.length; i += PARALLEL_BATCH_SIZE) {
    const batch = movies.slice(i, i + PARALLEL_BATCH_SIZE);

    // Process batch in parallel
    const results = await Promise.all(
      batch.map(movie => enrichMovie(movie, focus))
    );

    // Count results
    results.forEach((result, idx) => {
      const movie = batch[idx];

      if (result.success) {
        // Count by category
        if (result.changes.some(c => ['producer', 'music_director', 'cinematographer'].includes(c))) {
          stats.cast_crew_enriched++;
        }
        if (result.changes.includes('synopsis_te')) {
          stats.synopsis_enriched++;
        }
        if (result.changes.includes('trailer_url')) {
          stats.trailers_enriched++;
        }
        if (result.changes.some(c => ['is_blockbuster', 'is_classic', 'is_underrated'].includes(c))) {
          stats.tags_enriched++;
        }

        console.log(chalk.green(`  ✓ ${movie.title_en} (${movie.release_year || 'N/A'})`));
        console.log(chalk.gray(`    → ${result.changes.join(', ')} (conf: ${(result.confidence * 100).toFixed(0)}%)`));
        if (result.sources.length > 0) {
          console.log(chalk.gray(`    → Sources: ${result.sources.slice(0, 3).join(', ')}`));
        }
        if (result.conflicts.length > 0) {
          console.log(chalk.yellow(`    ⚠️  Conflicts: ${result.conflicts.join('; ')}`));
        }
      } else if (result.changes.length === 0) {
        stats.skipped++;
      } else {
        stats.failed++;
        console.log(chalk.red(`  ✗ ${movie.title_en} (${movie.release_year || 'N/A'})`));
      }
    });

    // Progress
    const processed = Math.min(i + PARALLEL_BATCH_SIZE, movies.length);
    const enriched = stats.cast_crew_enriched + stats.synopsis_enriched + stats.trailers_enriched + stats.tags_enriched;
    console.log(chalk.cyan(`\n  Progress: ${processed}/${movies.length} (${enriched} total enrichments)`));

    // Rate limit delay between batches
    if (i + PARALLEL_BATCH_SIZE < movies.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  stats.duration_ms = Date.now() - startTime;
  return stats;
}

/**
 * Generate enrichment report
 */
function generateReport(stats: EnrichmentStats, focus?: string): string {
  const duration = (stats.duration_ms / 1000 / 60).toFixed(1);
  const rate = (stats.total / parseFloat(duration)).toFixed(1);

  let report = `
╔═══════════════════════════════════════════════════════════════════════╗
║         CRITICAL GAPS ENRICHMENT REPORT                               ║
╚═══════════════════════════════════════════════════════════════════════╝

Total Movies Processed:    ${stats.total}
Duration:                  ${duration} minutes
Processing Rate:           ${rate} movies/minute

ENRICHMENT RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cast & Crew Enriched:     ${stats.cast_crew_enriched} (${((stats.cast_crew_enriched / stats.total) * 100).toFixed(1)}%)
Synopsis Enriched:         ${stats.synopsis_enriched} (${((stats.synopsis_enriched / stats.total) * 100).toFixed(1)}%)
Trailers Added:            ${stats.trailers_enriched} (${((stats.trailers_enriched / stats.total) * 100).toFixed(1)}%)
Tags Applied:              ${stats.tags_enriched} (${((stats.tags_enriched / stats.total) * 100).toFixed(1)}%)

Skipped (no changes):      ${stats.skipped}
Failed:                    ${stats.failed}

Total Enrichments:         ${stats.cast_crew_enriched + stats.synopsis_enriched + stats.trailers_enriched + stats.tags_enriched}

RECOMMENDATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  if (stats.cast_crew_enriched < stats.total * 0.5) {
    report += `⚠️  Low cast/crew enrichment rate. Consider:\n`;
    report += `   - Enabling more Telugu sources (bookmyshow, eenadu, sakshi, etc.)\n`;
    report += `   - Running focused enrichment: --focus=cast-crew\n\n`;
  }

  if (stats.synopsis_enriched < stats.total * 0.3) {
    report += `⚠️  Low synopsis enrichment rate. Many movies already have Telugu synopsis or missing English.\n\n`;
  }

  if (stats.trailers_enriched < stats.total * 0.3) {
    report += `⚠️  Low trailer enrichment rate. Movies may not have TMDB IDs or trailers not available.\n`;
    report += `   - Run TMDB ID enrichment first: npx tsx scripts/enrich-tmdb-ids.ts\n\n`;
  }

  report += `Next Steps:\n`;
  report += `1. Re-run audit: npx tsx scripts/audit-movie-data-completeness.ts\n`;
  report += `2. Review conflicts (if any) in manual review queue\n`;
  report += `3. Run editorial tagging for 'featured' movies (manual)\n\n`;

  return report;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string, defaultValue: string = '') => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };

  const LIMIT = parseInt(getArg('limit', '1000'), 10);
  const FOCUS = getArg('focus', ''); // cast-crew, synopsis, trailers, tags, or empty for all
  const EXECUTE = args.includes('--execute');
  const REPORT_ONLY = args.includes('--report-only');

  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║       CRITICAL DATA GAPS ENRICHMENT (TURBO MODE)                    ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow(`  🚀 TURBO MODE ENABLED`));
  console.log(chalk.gray(`  Parallel batches: ${PARALLEL_BATCH_SIZE} movies at once`));
  console.log(chalk.gray(`  Batch delay: ${BATCH_DELAY_MS}ms`));
  console.log(chalk.gray(`  Limit: ${LIMIT}`));
  if (FOCUS) {
    console.log(chalk.gray(`  Focus: ${FOCUS}`));
  }
  console.log(chalk.gray(`  Mode: ${EXECUTE ? 'EXECUTE' : REPORT_ONLY ? 'REPORT' : 'DRY RUN'}\n`));

  // Build query based on focus - SIMPLIFIED to avoid complex OR filters
  console.log(chalk.cyan(`  📡 Querying database...`));
  
  const { data: allMovies, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, tmdb_id, imdb_id, director, hero, heroine, music_director, producer, cinematographer, synopsis, synopsis_te, trailer_url, is_blockbuster, is_classic, is_underrated, avg_rating')
    .eq('language', 'Telugu')
    .limit(LIMIT);

  if (error || !allMovies) {
    console.error(chalk.red(`  ❌ Error fetching movies: ${error?.message}`));
    return;
  }

  console.log(chalk.green(`  ✅ Fetched ${allMovies.length} movies from database`));
  
  // Filter in-memory based on focus (much faster than complex DB queries)
  let movies = allMovies;
  if (FOCUS === 'cast-crew') {
    movies = allMovies.filter(m => !m.producer || !m.music_director || !m.cinematographer);
    console.log(chalk.gray(`  🎯 Filtered to ${movies.length} movies missing cast/crew data`));
  } else if (FOCUS === 'synopsis') {
    movies = allMovies.filter(m => m.synopsis && !m.synopsis_te);
    console.log(chalk.gray(`  🎯 Filtered to ${movies.length} movies missing Telugu synopsis`));
  } else if (FOCUS === 'trailers') {
    movies = allMovies.filter(m => !m.trailer_url && m.tmdb_id);
    console.log(chalk.gray(`  🎯 Filtered to ${movies.length} movies missing trailers`));
  } else if (FOCUS === 'tags') {
    movies = allMovies.filter(m => !m.is_blockbuster && !m.is_classic && !m.is_underrated);
    console.log(chalk.gray(`  🎯 Filtered to ${movies.length} movies missing tags`));
  }

  console.log(chalk.blue(`  📋 Found ${movies.length} movies to enrich\n`));

  if (REPORT_ONLY) {
    console.log(chalk.cyan(`  Report-only mode. No changes will be made.\n`));
    
    const gaps = {
      cast_crew: movies.filter(m => !m.producer || !m.music_director || !m.cinematographer).length,
      synopsis: movies.filter(m => m.synopsis && !m.synopsis_te).length,
      trailers: movies.filter(m => !m.trailer_url && m.tmdb_id).length,
      tags: movies.filter(m => !m.is_blockbuster && !m.is_classic && !m.is_underrated).length,
    };

    console.log(chalk.yellow(`  GAPS ANALYSIS:\n`));
    console.log(chalk.gray(`  Cast & Crew missing:  ${gaps.cast_crew} movies`));
    console.log(chalk.gray(`  Synopsis (Telugu):    ${gaps.synopsis} movies`));
    console.log(chalk.gray(`  Trailers missing:     ${gaps.trailers} movies`));
    console.log(chalk.gray(`  Tags missing:         ${gaps.tags} movies\n`));

    return;
  }

  if (!EXECUTE) {
    console.log(chalk.yellow(`  ⚠️  DRY RUN MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
    return;
  }

  // Process in turbo mode
  const stats = await processBatch(movies, FOCUS);

  // Generate and display report
  const report = generateReport(stats, FOCUS);
  console.log(report);

  // Save report to file
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = `./docs/manual-review/enrichment-report-${timestamp}.md`;
  writeFileSync(reportPath, report);
  console.log(chalk.green(`  ✓ Report saved: ${reportPath}\n`));
}

main().catch(console.error);
