#!/usr/bin/env npx tsx
/**
 * COLLECT CHIRANJEEVI FILMOGRAPHY DATA
 * 
 * Collects filmography data from all sources (Wikipedia, Wikidata, TMDB) and database.
 * Outputs JSON report for ClawDBot analysis.
 * 
 * This script handles DATA COLLECTION ONLY - NO ANALYSIS, NO EXECUTION
 * 
 * Usage:
 *   npx tsx scripts/collect-chiranjeevi-filmography.ts
 *   npx tsx scripts/collect-chiranjeevi-filmography.ts --output=reports/chiranjeevi-discovery.json
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { fetchTMDBFilmography } from './lib/tmdb-filmography';
import { fetchWikidataFilmography } from './lib/wikidata-filmography';
import { fetchWikipediaFilmography } from './lib/wikipedia-infobox-parser';
import { 
  mergeFilmSources, 
  type DiscoveredFilm 
} from './lib/film-discovery-engine';

dotenv.config({ path: '.env.local' });

const ACTOR_NAME = 'Chiranjeevi';

type Movie = any;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name: string): string => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1].replace(/['"]/g, '') : '';
};

const OUTPUT_PATH = getArg('output') || `reports/chiranjeevi-filmography-discovery-${Date.now()}.json`;
const VERBOSE = args.includes('--verbose') || args.includes('-v');

/**
 * Fetch existing movies for actor from database (checking ALL fields)
 */
async function fetchExistingMovies(actorName: string): Promise<Movie[]> {
  console.log(chalk.cyan(`\n📥 Fetching existing movies for "${actorName}" from database...`));
  
  // Search by hero
  const { data: heroMovies, error: heroError } = await supabase
    .from('movies')
    .select('*')
    .ilike('hero', `%${actorName}%`);
  
  if (heroError && VERBOSE) {
    console.error('Error fetching hero movies:', heroError);
  }
  
  // Search by heroine
  const { data: heroineMovies, error: heroineError } = await supabase
    .from('movies')
    .select('*')
    .ilike('heroine', `%${actorName}%`);
  
  if (heroineError && VERBOSE) {
    console.error('Error fetching heroine movies:', heroineError);
  }
  
  // Search by supporting cast
  const { data: supportingMovies, error: supportingError } = await supabase
    .from('movies')
    .select('*')
    .not('supporting_cast', 'is', null);
  
  if (supportingError && VERBOSE) {
    console.error('Error fetching supporting movies:', supportingError);
  }
  
  // Search by producer
  const { data: producerMovies, error: producerError } = await supabase
    .from('movies')
    .select('*')
    .ilike('producer', `%${actorName}%`);
  
  if (producerError && VERBOSE) {
    console.error('Error fetching producer movies:', producerError);
  }
  
  // Search by directors
  const { data: directorMovies, error: directorError } = await supabase
    .from('movies')
    .select('*')
    .ilike('director', `%${actorName}%`);
  
  if (directorError && VERBOSE) {
    console.error('Error fetching director movies:', directorError);
  }
  
  // Search by music director
  const { data: musicMovies, error: musicError } = await supabase
    .from('movies')
    .select('*')
    .ilike('music_director', `%${actorName}%`);
  
  if (musicError && VERBOSE) {
    console.error('Error fetching music director movies:', musicError);
  }
  
  // Search by cinematographer
  const { data: cinematographerMovies, error: cinematographerError } = await supabase
    .from('movies')
    .select('*')
    .ilike('cinematographer', `%${actorName}%`);
  
  if (cinematographerError && VERBOSE) {
    console.error('Error fetching cinematographer movies:', cinematographerError);
  }
  
  // Filter supporting cast movies
  const actorNameLower = actorName.toLowerCase();
  const filteredSupporting = (supportingMovies || []).filter((movie: any) => {
    if (!movie.supporting_cast || !Array.isArray(movie.supporting_cast)) return false;
    return movie.supporting_cast.some((c: any) => 
      (typeof c === 'string' && c.toLowerCase().includes(actorNameLower)) ||
      (typeof c === 'object' && c.name && c.name.toLowerCase().includes(actorNameLower))
    );
  });
  
  // Filter crew movies (check crew JSONB field)
  const allMovies = [
    ...(heroMovies || []),
    ...(heroineMovies || []),
    ...filteredSupporting,
    ...(producerMovies || []),
    ...(directorMovies || []),
    ...(musicMovies || []),
    ...(cinematographerMovies || []),
  ];
  
  // Also check crew JSONB field
  const { data: allMoviesForCrew, error: crewError } = await supabase
    .from('movies')
    .select('*')
    .not('crew', 'is', null);
  
  if (!crewError && allMoviesForCrew) {
    const crewFiltered = allMoviesForCrew.filter((movie: any) => {
      if (!movie.crew || typeof movie.crew !== 'object') return false;
      return Object.values(movie.crew).some((v: any) => 
        typeof v === 'string' && v.toLowerCase().includes(actorNameLower)
      );
    });
    allMovies.push(...crewFiltered);
  }
  
  // Merge and deduplicate
  const uniqueMovies = allMovies.filter((movie, index, self) =>
    index === self.findIndex(m => m.id === movie.id)
  );
  
  console.log(chalk.green(`✓ Found ${uniqueMovies.length} existing movies in database`));
  if (VERBOSE) {
    console.log(chalk.gray(`  • Hero: ${heroMovies?.length || 0}`));
    console.log(chalk.gray(`  • Heroine: ${heroineMovies?.length || 0}`));
    console.log(chalk.gray(`  • Supporting: ${filteredSupporting.length}`));
    console.log(chalk.gray(`  • Producer: ${producerMovies?.length || 0}`));
    console.log(chalk.gray(`  • Director: ${directorMovies?.length || 0}`));
    console.log(chalk.gray(`  • Music Director: ${musicMovies?.length || 0}`));
    console.log(chalk.gray(`  • Cinematographer: ${cinematographerMovies?.length || 0}`));
  }
  
  return uniqueMovies;
}

/**
 * Convert Wikipedia entries to DiscoveredFilm format
 */
function convertWikipediaToDiscovered(wikiFilms: any[]): DiscoveredFilm[] {
  return wikiFilms.map(f => ({
    title_en: f.title,
    release_year: f.year,
    role: 'hero', // Default, will be classified later
    sources: ['wikipedia'],
    confidence: 0.80,
    language: f.language || 'Telugu',
    credits: f.notes,
    crewRoles: f.crewRoles,
    roleNotes: f.isCameo ? 'Cameo' : f.isSpecialAppearance ? 'Special Appearance' : undefined,
  }));
}

/**
 * Main collection process
 */
async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         CHIRANJEEVI FILMOGRAPHY DATA COLLECTION                      ║
║         (Data Collection Only - No Analysis)                         ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(chalk.cyan(`Actor: ${chalk.bold(ACTOR_NAME)}`));
  console.log(chalk.cyan(`Output: ${OUTPUT_PATH}`));
  
  // Step 1: Fetch existing movies from database
  const existingMovies = await fetchExistingMovies(ACTOR_NAME);
  
  // Step 2: Discover films from multiple sources
  console.log(chalk.cyan(`\n📥 Discovering films from multiple sources...`));
  
  const filmsBySource: Record<string, DiscoveredFilm[]> = {};
  
  // TMDB
  try {
    console.log(chalk.gray(`  Fetching from TMDB...`));
    const tmdbFilms = await fetchTMDBFilmography(ACTOR_NAME);
    if (tmdbFilms.length > 0) {
      filmsBySource.tmdb = tmdbFilms;
      console.log(chalk.green(`  ✓ TMDB: ${tmdbFilms.length} films`));
    }
  } catch (error) {
    console.log(chalk.yellow(`  ⚠️  TMDB: Failed`));
    if (VERBOSE) console.error(error);
  }
  
  // Wikipedia
  try {
    console.log(chalk.gray(`  Fetching from Wikipedia...`));
    const wikiFilms = await fetchWikipediaFilmography(ACTOR_NAME);
    if (wikiFilms.length > 0) {
      const converted = convertWikipediaToDiscovered(wikiFilms);
      filmsBySource.wikipedia = converted;
      console.log(chalk.green(`  ✓ Wikipedia: ${wikiFilms.length} films`));
    }
  } catch (error) {
    console.log(chalk.yellow(`  ⚠️  Wikipedia: Failed`));
    if (VERBOSE) console.error(error);
  }
  
  // Wikidata
  try {
    console.log(chalk.gray(`  Fetching from Wikidata...`));
    const wikidataFilms = await fetchWikidataFilmography(ACTOR_NAME);
    if (wikidataFilms.length > 0) {
      filmsBySource.wikidata = wikidataFilms;
      console.log(chalk.green(`  ✓ Wikidata: ${wikidataFilms.length} films`));
    }
  } catch (error) {
    console.log(chalk.yellow(`  ⚠️  Wikidata: Failed`));
    if (VERBOSE) console.error(error);
  }
  
  // Step 3: Merge and deduplicate
  console.log(chalk.cyan(`\n🔍 Merging and deduplicating...`));
  const allFilms = mergeFilmSources(filmsBySource);
  console.log(chalk.green(`  ✓ Total unique films: ${allFilms.length}`));
  
  // Step 4: Generate report
  const report = {
    actor: ACTOR_NAME,
    timestamp: new Date().toISOString(),
    discoveredFilms: allFilms,
    existingMovies: existingMovies,
    sourceStats: {
      wikipedia: filmsBySource.wikipedia?.length || 0,
      wikidata: filmsBySource.wikidata?.length || 0,
      tmdb: filmsBySource.tmdb?.length || 0,
      database: existingMovies.length,
    },
  };
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write report
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));
  
  console.log(chalk.green(`\n✅ Report saved: ${OUTPUT_PATH}`));
  console.log(chalk.cyan(`\n📊 Summary:`));
  console.log(`  • Discovered films: ${allFilms.length}`);
  console.log(`  • Existing in database: ${existingMovies.length}`);
  console.log(`  • Sources: Wikipedia (${report.sourceStats.wikipedia}), Wikidata (${report.sourceStats.wikidata}), TMDB (${report.sourceStats.tmdb})`);
  console.log(chalk.gray(`\n💡 Next step: Run ClawDBot analysis on this report`));
}

main().catch(console.error);
