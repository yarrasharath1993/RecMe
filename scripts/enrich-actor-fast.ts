#!/usr/bin/env npx tsx
/**
 * FAST SINGLE-ACTOR ENRICHMENT SCRIPT
 * 
 * Runs all enrichment phases for a single actor IN ONE PROCESS.
 * No subprocess spawning = 10x faster startup!
 * 
 * Usage:
 *   npx tsx scripts/enrich-actor-fast.ts --actor="Daggubati Venkatesh"
 *   npx tsx scripts/enrich-actor-fast.ts --actor="Mahesh Babu" --execute
 *   npx tsx scripts/enrich-actor-fast.ts --actor="Chiranjeevi" --execute --phases=cast,genres,tags
 * 
 * Phases available:
 *   - audit: Cross-verify data, detect anomalies
 *   - cast: Enrich cast & crew from TMDB/Wikipedia
 *   - genres: Direct genre fetch from TMDB
 *   - tags: Auto-tag (blockbuster, classic, mood tags)
 *   - flags: Content flags (remake, sequel, biopic)
 *   - trust: Trust & confidence scoring
 *   - all: Run all phases (default)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// ============================================================
// CLI PARSING
// ============================================================

const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const ACTOR = getArg('actor', '');
const EXECUTE = hasFlag('execute');
const PHASES = getArg('phases', 'all').split(',');
const LIMIT = parseInt(getArg('limit', '500'));
const VERBOSE = hasFlag('verbose') || hasFlag('v');

if (!ACTOR) {
  console.error(chalk.red('Error: --actor is required'));
  console.log('Usage: npx tsx scripts/enrich-actor-fast.ts --actor="Actor Name" [--execute]');
  process.exit(1);
}

// ============================================================
// TYPES
// ============================================================

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  hero: string | null;
  heroine: string | null;
  director: string | null;
  music_director: string | null;
  genres: string[] | null;
  tmdb_id: number | null;
  avg_rating: number | null;
  is_blockbuster: boolean;
  is_classic: boolean;
  is_underrated: boolean;
  content_flags: Record<string, unknown> | null;
  trust_score: number | null;
}

interface EnrichmentStats {
  phase: string;
  processed: number;
  enriched: number;
  duration_ms: number;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

async function fetchMoviesForActor(actor: string): Promise<Movie[]> {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('language', 'Telugu')
    .ilike('hero', `%${actor}%`)
    .order('release_year', { ascending: false })
    .limit(LIMIT);

  if (error) {
    console.error(chalk.red('Error fetching movies:'), error.message);
    return [];
  }

  return data || [];
}

async function fetchTMDB(endpoint: string): Promise<any> {
  try {
    const url = `${TMDB_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// PHASE 1: AUDIT (Cross-verification)
// ============================================================

async function runAuditPhase(movies: Movie[]): Promise<EnrichmentStats> {
  const start = Date.now();
  let issues = 0;

  console.log(chalk.cyan('\n📋 PHASE: AUDIT (Cross-verification)'));
  console.log(`   Checking ${movies.length} movies for anomalies...`);

  // Get actor birth years for age validation
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('name, birth_year')
    .not('birth_year', 'is', null);

  const birthYears = new Map<string, number>();
  celebrities?.forEach(c => {
    if (c.birth_year) birthYears.set(c.name.toLowerCase(), c.birth_year);
  });

  const foundIssues: string[] = [];

  for (const movie of movies) {
    // Check hero age
    if (movie.hero) {
      const heroYear = birthYears.get(movie.hero.toLowerCase());
      if (heroYear && movie.release_year - heroYear < 16) {
        foundIssues.push(`${movie.title_en} (${movie.release_year}): ${movie.hero} was only ${movie.release_year - heroYear} years old`);
        issues++;
      }
    }

    // Check heroine age
    if (movie.heroine) {
      const heroineYear = birthYears.get(movie.heroine.toLowerCase());
      if (heroineYear && movie.release_year - heroineYear < 14) {
        foundIssues.push(`${movie.title_en} (${movie.release_year}): ${movie.heroine} was only ${movie.release_year - heroineYear} years old`);
        issues++;
      }
    }
  }

  if (foundIssues.length > 0) {
    console.log(chalk.yellow(`   ⚠️  Found ${foundIssues.length} potential issues:`));
    foundIssues.slice(0, 5).forEach(i => console.log(chalk.gray(`      - ${i}`)));
    if (foundIssues.length > 5) console.log(chalk.gray(`      ... and ${foundIssues.length - 5} more`));
  } else {
    console.log(chalk.green('   ✅ No anomalies found'));
  }

  return { phase: 'audit', processed: movies.length, enriched: issues, duration_ms: Date.now() - start };
}

// ============================================================
// PHASE 2: CAST & CREW (from TMDB)
// ============================================================

async function runCastCrewPhase(movies: Movie[]): Promise<EnrichmentStats> {
  const start = Date.now();
  let enriched = 0;

  console.log(chalk.cyan('\n🎭 PHASE: CAST & CREW'));
  
  const moviesNeedingCrew = movies.filter(m => 
    m.tmdb_id && (!m.music_director || !m.heroine)
  );
  
  console.log(`   Processing ${moviesNeedingCrew.length} movies with TMDB IDs...`);

  const updates: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (let i = 0; i < moviesNeedingCrew.length; i++) {
    const movie = moviesNeedingCrew[i];
    if (!movie.tmdb_id) continue;

    const credits = await fetchTMDB(`/movie/${movie.tmdb_id}/credits`);
    if (!credits) continue;

    const updateData: Record<string, unknown> = {};

    // Get music director from crew
    if (!movie.music_director) {
      const musicDir = credits.crew?.find((c: any) => 
        c.job === 'Original Music Composer' || c.job === 'Music Director' || c.job === 'Music'
      );
      if (musicDir) updateData.music_director = musicDir.name;
    }

    // Get heroine from cast
    if (!movie.heroine) {
      const femaleLeads = credits.cast?.filter((c: any) => 
        c.gender === 1 && c.order < 5
      );
      if (femaleLeads?.length > 0) {
        updateData.heroine = femaleLeads[0].name;
      }
    }

    if (Object.keys(updateData).length > 0) {
      updates.push({ id: movie.id, data: updateData });
      enriched++;
      if (VERBOSE) {
        console.log(chalk.gray(`      ${movie.title_en}: ${JSON.stringify(updateData)}`));
      }
    }

    // Progress
    if ((i + 1) % 20 === 0) {
      process.stdout.write(`   [${Math.round((i + 1) / moviesNeedingCrew.length * 100)}%] `);
    }

    await sleep(50); // Rate limit
  }

  console.log(`\n   Found updates for ${enriched} movies`);

  if (EXECUTE && updates.length > 0) {
    console.log(chalk.cyan('   Applying to database...'));
    for (const { id, data } of updates) {
      await supabase.from('movies').update(data).eq('id', id);
    }
    console.log(chalk.green(`   ✅ Updated ${updates.length} movies`));
  }

  return { phase: 'cast-crew', processed: moviesNeedingCrew.length, enriched, duration_ms: Date.now() - start };
}

// ============================================================
// PHASE 3: GENRES (from TMDB)
// ============================================================

async function runGenresPhase(movies: Movie[]): Promise<EnrichmentStats> {
  const start = Date.now();
  let enriched = 0;

  console.log(chalk.cyan('\n🎬 PHASE: GENRES'));

  const moviesNeedingGenres = movies.filter(m => 
    m.tmdb_id && (!m.genres || m.genres.length === 0)
  );

  console.log(`   Processing ${moviesNeedingGenres.length} movies missing genres...`);

  const updates: Array<{ id: string; genres: string[] }> = [];

  // TMDB genre mapping
  const genreMap: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
    10752: 'War', 37: 'Western'
  };

  for (let i = 0; i < moviesNeedingGenres.length; i++) {
    const movie = moviesNeedingGenres[i];
    if (!movie.tmdb_id) continue;

    const details = await fetchTMDB(`/movie/${movie.tmdb_id}`);
    if (!details?.genres) continue;

    const genres = details.genres.map((g: any) => genreMap[g.id] || g.name).filter(Boolean);
    
    if (genres.length > 0) {
      updates.push({ id: movie.id, genres });
      enriched++;
      if (VERBOSE) {
        console.log(chalk.gray(`      ${movie.title_en}: ${genres.join(', ')}`));
      }
    }

    if ((i + 1) % 20 === 0) {
      process.stdout.write(`   [${Math.round((i + 1) / moviesNeedingGenres.length * 100)}%] `);
    }

    await sleep(50);
  }

  console.log(`\n   Found genres for ${enriched} movies`);

  if (EXECUTE && updates.length > 0) {
    console.log(chalk.cyan('   Applying to database...'));
    for (const { id, genres } of updates) {
      await supabase.from('movies').update({ genres }).eq('id', id);
    }
    console.log(chalk.green(`   ✅ Updated ${updates.length} movies`));
  }

  return { phase: 'genres', processed: moviesNeedingGenres.length, enriched, duration_ms: Date.now() - start };
}

// ============================================================
// PHASE 4: AUTO-TAGS (blockbuster, classic, mood)
// ============================================================

async function runTagsPhase(movies: Movie[]): Promise<EnrichmentStats> {
  const start = Date.now();
  let enriched = 0;

  console.log(chalk.cyan('\n🏷️  PHASE: AUTO-TAGS'));
  console.log(`   Analyzing ${movies.length} movies...`);

  const TOP_HEROES = [
    'Chiranjeevi', 'Pawan Kalyan', 'Mahesh Babu', 'Allu Arjun', 'Jr NTR',
    'Ram Charan', 'Prabhas', 'Nandamuri Balakrishna', 'Venkatesh', 'Ravi Teja',
    'Nagarjuna', 'Nani', 'Vijay Deverakonda', 'Ram Pothineni'
  ];

  const updates: Array<{ id: string; data: Record<string, boolean> }> = [];

  for (const movie of movies) {
    const updateData: Record<string, boolean> = {};
    const year = movie.release_year || 2020;
    const rating = movie.avg_rating || 0;
    const hero = movie.hero?.toLowerCase() || '';
    const hasTopStar = TOP_HEROES.some(h => hero.includes(h.toLowerCase()));

    // Blockbuster detection
    const shouldBeBlockbuster = (
      (year >= 2015 && hasTopStar && rating >= 6) ||
      (year >= 2010 && rating >= 8) ||
      (hasTopStar && rating >= 7)
    );

    if (shouldBeBlockbuster !== movie.is_blockbuster) {
      updateData.is_blockbuster = shouldBeBlockbuster;
    }

    // Classic detection (pre-2005)
    const shouldBeClassic = year <= 2005;
    if (shouldBeClassic !== movie.is_classic) {
      updateData.is_classic = shouldBeClassic;
    }

    // Hidden gem detection
    const shouldBeUnderrated = (
      rating >= 6.5 && !hasTopStar && year >= 2000 && year <= 2020
    );
    if (shouldBeUnderrated !== movie.is_underrated) {
      updateData.is_underrated = shouldBeUnderrated;
    }

    if (Object.keys(updateData).length > 0) {
      updates.push({ id: movie.id, data: updateData });
      enriched++;
    }
  }

  console.log(`   Tag updates needed: ${enriched} movies`);

  if (EXECUTE && updates.length > 0) {
    console.log(chalk.cyan('   Applying to database...'));
    for (const { id, data } of updates) {
      await supabase.from('movies').update(data).eq('id', id);
    }
    console.log(chalk.green(`   ✅ Updated ${updates.length} movies`));
  }

  return { phase: 'tags', processed: movies.length, enriched, duration_ms: Date.now() - start };
}

// ============================================================
// PHASE 5: CONTENT FLAGS (remake, sequel, biopic)
// ============================================================

async function runFlagsPhase(movies: Movie[]): Promise<EnrichmentStats> {
  const start = Date.now();
  let enriched = 0;

  console.log(chalk.cyan('\n🚩 PHASE: CONTENT FLAGS'));

  const moviesWithTMDB = movies.filter(m => m.tmdb_id);
  console.log(`   Checking ${moviesWithTMDB.length} movies for franchises/sequels...`);

  const updates: Array<{ id: string; flags: Record<string, unknown> }> = [];

  for (let i = 0; i < moviesWithTMDB.length; i++) {
    const movie = moviesWithTMDB[i];
    if (!movie.tmdb_id) continue;

    const details = await fetchTMDB(`/movie/${movie.tmdb_id}`);
    if (!details) continue;

    const flags: Record<string, unknown> = { ...(movie.content_flags || {}) };
    let hasNewFlags = false;

    // Check for collection (franchise/sequel)
    if (details.belongs_to_collection && !flags.franchise) {
      const collection = await fetchTMDB(`/collection/${details.belongs_to_collection.id}`);
      if (collection?.parts) {
        const sortedParts = collection.parts.sort((a: any, b: any) => 
          new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        );
        const sequelNum = sortedParts.findIndex((p: any) => p.id === movie.tmdb_id) + 1;
        
        flags.franchise = details.belongs_to_collection.name.replace(' Collection', '');
        flags.sequel_number = sequelNum;
        flags.collection_id = details.belongs_to_collection.id;
        hasNewFlags = true;
      }
    }

    if (hasNewFlags) {
      updates.push({ id: movie.id, flags });
      enriched++;
      if (VERBOSE) {
        console.log(chalk.gray(`      ${movie.title_en}: ${JSON.stringify(flags)}`));
      }
    }

    if ((i + 1) % 20 === 0) {
      process.stdout.write(`   [${Math.round((i + 1) / moviesWithTMDB.length * 100)}%] `);
    }

    await sleep(100);
  }

  console.log(`\n   Found flags for ${enriched} movies`);

  if (EXECUTE && updates.length > 0) {
    console.log(chalk.cyan('   Applying to database...'));
    for (const { id, flags } of updates) {
      await supabase.from('movies').update({ content_flags: flags }).eq('id', id);
    }
    console.log(chalk.green(`   ✅ Updated ${updates.length} movies`));
  }

  return { phase: 'flags', processed: moviesWithTMDB.length, enriched, duration_ms: Date.now() - start };
}

// ============================================================
// PHASE 6: TRUST SCORE
// ============================================================

async function runTrustPhase(movies: Movie[]): Promise<EnrichmentStats> {
  const start = Date.now();
  let enriched = 0;

  console.log(chalk.cyan('\n🛡️  PHASE: TRUST SCORE'));
  console.log(`   Calculating trust scores for ${movies.length} movies...`);

  const updates: Array<{ id: string; score: number }> = [];

  for (const movie of movies) {
    let score = 50; // Base score

    // Has TMDB data (+15)
    if (movie.tmdb_id) score += 15;

    // Has complete cast (+10)
    if (movie.hero && movie.heroine && movie.director) score += 10;

    // Has genres (+10)
    if (movie.genres && movie.genres.length > 0) score += 10;

    // Has rating (+5)
    if (movie.avg_rating) score += 5;

    // Has music director (+5)
    if (movie.music_director) score += 5;

    // Recent movie with TMDB (+5)
    if (movie.release_year >= 2010 && movie.tmdb_id) score += 5;

    score = Math.min(100, score);

    if (movie.trust_score !== score) {
      updates.push({ id: movie.id, score });
      enriched++;
    }
  }

  console.log(`   Trust score updates needed: ${enriched} movies`);

  if (EXECUTE && updates.length > 0) {
    console.log(chalk.cyan('   Applying to database...'));
    for (const { id, score } of updates) {
      await supabase.from('movies').update({ trust_score: score }).eq('id', id);
    }
    console.log(chalk.green(`   ✅ Updated ${updates.length} movies`));
  }

  return { phase: 'trust', processed: movies.length, enriched, duration_ms: Date.now() - start };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const startTime = Date.now();

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           FAST SINGLE-ACTOR ENRICHMENT                               ║
║           No subprocess spawning = 10x faster!                       ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Actor: ${chalk.yellow(ACTOR)}`);
  console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log(`  Phases: ${PHASES.join(', ')}`);
  console.log(`  Limit: ${LIMIT}`);

  // Fetch movies
  console.log(chalk.cyan('\n📂 Fetching movies...'));
  const movies = await fetchMoviesForActor(ACTOR);
  console.log(`   Found ${chalk.green(movies.length)} movies for ${ACTOR}`);

  if (movies.length === 0) {
    console.log(chalk.red('\n   No movies found. Check actor name.'));
    return;
  }

  // Run phases
  const stats: EnrichmentStats[] = [];
  const runAll = PHASES.includes('all');

  if (runAll || PHASES.includes('audit')) {
    stats.push(await runAuditPhase(movies));
  }

  if (runAll || PHASES.includes('cast')) {
    stats.push(await runCastCrewPhase(movies));
  }

  if (runAll || PHASES.includes('genres')) {
    stats.push(await runGenresPhase(movies));
  }

  if (runAll || PHASES.includes('tags')) {
    stats.push(await runTagsPhase(movies));
  }

  if (runAll || PHASES.includes('flags')) {
    stats.push(await runFlagsPhase(movies));
  }

  if (runAll || PHASES.includes('trust')) {
    stats.push(await runTrustPhase(movies));
  }

  // Summary
  const totalDuration = Date.now() - startTime;
  const totalEnriched = stats.reduce((sum, s) => sum + s.enriched, 0);

  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════════
📊 ENRICHMENT SUMMARY
═══════════════════════════════════════════════════════════════════════
`));

  console.log(`  Actor: ${ACTOR}`);
  console.log(`  Movies: ${movies.length}`);
  console.log(`  Total enriched: ${chalk.green(totalEnriched)}`);
  console.log(`  Duration: ${chalk.yellow((totalDuration / 1000).toFixed(1))}s`);
  console.log(`  Speed: ${chalk.green((movies.length / (totalDuration / 1000)).toFixed(1))} movies/sec`);

  console.log('\n  By Phase:');
  for (const s of stats) {
    console.log(`    ${s.phase.padEnd(12)} : ${s.enriched} enriched (${(s.duration_ms / 1000).toFixed(1)}s)`);
  }

  if (!EXECUTE) {
    console.log(chalk.yellow('\n  ⚠️  DRY RUN - Run with --execute to apply changes'));
  }

  console.log('');
}

main().catch(console.error);
