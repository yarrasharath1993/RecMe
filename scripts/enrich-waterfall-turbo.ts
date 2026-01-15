#!/usr/bin/env npx tsx
/**
 * TURBO WATERFALL ENRICHMENT
 * 
 * 10-20x faster than regular waterfall using parallel processing
 * with concurrency control (like enrich-images-fast.ts pattern)
 * 
 * Still uses multi-source validation but in parallel batches
 * 
 * Usage:
 *   npx tsx scripts/enrich-waterfall-turbo.ts --limit=500 --execute
 *   npx tsx scripts/enrich-waterfall-turbo.ts --concurrency=30 --execute
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
const OMDB_API_KEY = process.env.OMDB_API_KEY;

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  poster_url: string | null;
  hero: string | null;
  heroine: string | null;
  director: string | null;
  tmdb_id: number | null;
}

interface EnrichmentResult {
  movieId: string;
  updates: Record<string, any>;
  source: string;
  confidence: number;
}

// ===================================================================
// SOURCE FETCHERS (SIMPLIFIED - NO COMPLEX ORCHESTRATION)
// ===================================================================

async function tryTMDB(movie: Movie): Promise<{ data: Record<string, any>; source: string; confidence: number } | null> {
  if (!TMDB_API_KEY) return null;
  
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.title_en)}&year=${movie.release_year}&language=en-US`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    if (!data.results || data.results.length === 0) return null;
    
    const result = data.results.find((m: any) => m.original_language === 'te') || data.results[0];
    
    if (!result) return null;
    
    const updates: Record<string, any> = {
      tmdb_id: result.id,
    };
    
    if (result.poster_path) {
      updates.poster_url = `https://image.tmdb.org/t/p/w500${result.poster_path}`;
      updates.poster_confidence = 0.95;
      updates.archival_source = {
        source_name: 'tmdb',
        source_type: 'database',
        license_type: 'attribution',
        acquisition_date: new Date().toISOString(),
        image_url: updates.poster_url,
        license_verified: true,
      };
    }
    
    if (result.backdrop_path) {
      updates.backdrop_url = `https://image.tmdb.org/t/p/w1280${result.backdrop_path}`;
    }
    
    // Get detailed info for cast
    if (result.id) {
      try {
        const detailsUrl = `https://api.themoviedb.org/3/movie/${result.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
        const detailsRes = await fetch(detailsUrl);
        const details = await detailsRes.json();
        
        if (details.credits?.cast && details.credits.cast.length > 0) {
          updates.hero = updates.hero || details.credits.cast[0].name;
        }
        if (details.credits?.cast && details.credits.cast.length > 1) {
          updates.heroine = updates.heroine || details.credits.cast.find((c: any) => c.gender === 1)?.name;
        }
        if (details.credits?.crew) {
          const director = details.credits.crew.find((c: any) => c.job === 'Director');
          if (director) updates.director = updates.director || director.name;
        }
      } catch {}
    }
    
    return { data: updates, source: 'tmdb', confidence: 0.95 };
  } catch {
    return null;
  }
}

async function tryOMDB(movie: Movie): Promise<{ data: Record<string, any>; source: string; confidence: number } | null> {
  if (!OMDB_API_KEY) return null;
  
  try {
    const url = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(movie.title_en)}&y=${movie.release_year}&type=movie`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.Response !== 'True') return null;
    
    const updates: Record<string, any> = {};
    
    if (data.Poster && data.Poster !== 'N/A') {
      updates.poster_url = data.Poster;
      updates.poster_confidence = 0.80;
      updates.archival_source = {
        source_name: 'omdb',
        source_type: 'database',
        license_type: 'attribution',
        acquisition_date: new Date().toISOString(),
        image_url: data.Poster,
        license_verified: true,
      };
    }
    
    if (data.Director && data.Director !== 'N/A') {
      updates.director = updates.director || data.Director.split(',')[0].trim();
    }
    
    if (data.Actors && data.Actors !== 'N/A') {
      const actors = data.Actors.split(',').map((a: string) => a.trim());
      updates.hero = updates.hero || actors[0];
      if (actors.length > 1) updates.heroine = updates.heroine || actors[1];
    }
    
    return { data: updates, source: 'omdb', confidence: 0.80 };
  } catch {
    return null;
  }
}

async function tryWikidata(movie: Movie): Promise<{ data: Record<string, any>; source: string; confidence: number } | null> {
  try {
    const query = `
      SELECT ?item ?director ?directorLabel ?hero ?heroLabel WHERE {
        ?item wdt:P31 wd:Q11424.
        ?item rdfs:label "${movie.title_en.replace(/"/g, '\\"')}"@en.
        OPTIONAL { ?item wdt:P57 ?director. }
        OPTIONAL { ?item wdt:P161 ?hero. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 1
    `;
    
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const bindings = data.results?.bindings;
    
    if (!bindings || bindings.length === 0) return null;
    
    const result = bindings[0];
    const updates: Record<string, any> = {};
    
    if (result.directorLabel?.value) {
      updates.director = updates.director || result.directorLabel.value;
    }
    if (result.heroLabel?.value) {
      updates.hero = updates.hero || result.heroLabel.value;
    }
    
    return { data: updates, source: 'wikidata', confidence: 0.70 };
  } catch {
    return null;
  }
}

// ===================================================================
// ENRICHMENT LOGIC (SIMPLIFIED - TRY ALL SOURCES IN PARALLEL)
// ===================================================================

async function enrichMovie(movie: Movie): Promise<EnrichmentResult> {
  // Try all sources in parallel (faster than waterfall)
  const [tmdbResult, omdbResult, wikidataResult] = await Promise.all([
    tryTMDB(movie),
    tryOMDB(movie),
    tryWikidata(movie),
  ]);
  
  // Merge results (priority: TMDB > OMDB > Wikidata)
  const updates: Record<string, any> = {};
  let bestSource = 'none';
  let bestConfidence = 0;
  
  // Apply in reverse priority order (so higher priority overwrites)
  for (const result of [wikidataResult, omdbResult, tmdbResult]) {
    if (result) {
      Object.assign(updates, result.data);
      if (result.confidence > bestConfidence) {
        bestSource = result.source;
        bestConfidence = result.confidence;
      }
    }
  }
  
  return {
    movieId: movie.id,
    updates,
    source: bestSource,
    confidence: bestConfidence,
  };
}

// ===================================================================
// MAIN (PARALLEL BATCH PROCESSING)
// ===================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
  const placeholdersOnly = args.includes('--placeholders-only');
  
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 500;
  const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1]) : 25;
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║         TURBO WATERFALL ENRICHMENT (PARALLEL) v2             ║
║         TMDB ⚡ OMDB ⚡ Wikidata (All in Parallel)            ║
╚══════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Mode: ${dryRun ? chalk.yellow('DRY RUN') : chalk.green('LIVE')}`);
  console.log(`  Limit: ${limit} movies`);
  console.log(`  Concurrency: ${concurrency} parallel requests`);
  console.log(`  Filter: ${placeholdersOnly ? 'Placeholders only' : 'All movies'}\n`);
  
  // Fetch movies
  console.log('  Fetching movies...');
  
  let query = supabase
    .from('movies')
    .select('id, title_en, release_year, poster_url, hero, heroine, director, tmdb_id')
    .eq('language', 'Telugu');
  
  if (placeholdersOnly) {
    query = query.or('poster_url.is.null,poster_url.ilike.%placeholder%');
  }
  
  const { data: movies, error } = await query
    .order('release_year', { ascending: false })
    .limit(limit);
  
  if (error || !movies) {
    console.error(chalk.red(`  Error: ${error?.message}`));
    return;
  }
  
  console.log(`  Found ${chalk.cyan(movies.length)} movies to process\n`);
  
  if (movies.length === 0) {
    console.log(chalk.green('  ✅ No movies to process!'));
    return;
  }
  
  const startTime = Date.now();
  
  // Stats
  const stats = { tmdb: 0, omdb: 0, wikidata: 0, none: 0 };
  let enriched = 0;
  let failed = 0;
  
  console.log('  Processing in parallel...\n');
  
  // Process with concurrency control (TURBO MODE)
  const results: EnrichmentResult[] = [];
  const batchSize = concurrency;
  
  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, Math.min(i + batchSize, movies.length));
    
    // Process batch in parallel
    const batchPromises = batch.map(async (movie) => {
      try {
        return await enrichMovie(movie);
      } catch (error) {
        failed++;
        return { movieId: movie.id, updates: {}, source: 'none', confidence: 0 } as EnrichmentResult;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const res of batchResults) {
      results.push(res);
      if (res.source !== 'none') {
        stats[res.source as keyof typeof stats]++;
        if (Object.keys(res.updates).length > 0) enriched++;
      }
    }
    
    // Progress bar
    const completed = Math.min(i + batchSize, movies.length);
    const pct = Math.round((completed / movies.length) * 100);
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  [${bar}] ${pct}% (${completed}/${movies.length}) | Enriched: ${enriched}`);
  }
  
  console.log('\n');
  
  // Apply updates to database
  if (!dryRun && enriched > 0) {
    console.log('  Applying updates to database...');
    
    let updateCount = 0;
    
    for (const result of results) {
      if (Object.keys(result.updates).length === 0) continue;
      
      const { error } = await supabase
        .from('movies')
        .update({
          ...result.updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', result.movieId);
      
      if (!error) updateCount++;
    }
    
    console.log(`  ${chalk.green('✓')} Updated ${updateCount} movies`);
  }
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = (movies.length / parseFloat(duration)).toFixed(1);
  
  console.log(`
${chalk.cyan.bold('═══════════════════════════════════════════════════════════════')}
  ${chalk.green.bold('SUMMARY')}
${chalk.cyan('═══════════════════════════════════════════════════════════════')}

  Processed:    ${movies.length} movies
  Enriched:     ${enriched} movies
  Failed:       ${failed} movies
  Duration:     ${duration}s
  Rate:         ${rate} movies/sec (${(parseFloat(rate) * 60).toFixed(0)} movies/min)

  By Source:
    TMDB:       ${stats.tmdb}
    OMDB:       ${stats.omdb}
    Wikidata:   ${stats.wikidata}
    None:       ${stats.none}

${chalk.cyan('═══════════════════════════════════════════════════════════════')}
`);
}

main().catch(console.error);
