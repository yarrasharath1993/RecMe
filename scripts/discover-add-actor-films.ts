#!/usr/bin/env npx tsx
/**
 * DISCOVER AND ADD ACTOR FILMS
 * 
 * Discovers missing films from multiple sources and auto-adds them to the database.
 * This fixes the critical gap where only existing films are enriched.
 * 
 * Features:
 * - Fetches filmography from 9+ sources
 * - Cross-references with database
 * - Auto-adds missing films with basic metadata
 * - Flags child actor roles and cameos
 * - Generates detailed report
 * 
 * Usage:
 *   npx tsx scripts/discover-add-actor-films.ts --actor="Manchu Manoj" --execute
 *   npx tsx scripts/discover-add-actor-films.ts --actor="Manchu Manoj" --report-only
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
  findMissingFilms, 
  mergeFilmSources, 
  generateDiscoverySummary,
  type DiscoveredFilm 
} from './lib/film-discovery-engine';
import { classifyActorRole, getRoleStatistics, type RoleClassification } from './lib/role-classifier';

dotenv.config({ path: '.env.local' });

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
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const ACTOR = getArg('actor');
const EXECUTE = hasFlag('execute');
const REPORT_ONLY = hasFlag('report-only');
const VERBOSE = hasFlag('verbose');

/**
 * Generate slug from title and year
 */
function generateSlug(title: string, year: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-${year}`;
}

/**
 * Fetch existing movies for actor from database
 */
async function fetchExistingMovies(actorName: string): Promise<Movie[]> {
  console.log(chalk.cyan(`\n📥 Fetching existing movies for "${actorName}" from database...`));
  
  // Search by hero
  const { data: heroMovies, error: heroError } = await supabase
    .from('movies')
    .select('*')
    .eq('language', 'Telugu')
    .ilike('hero', `%${actorName}%`);
  
  if (heroError) {
    console.error('Error fetching hero movies:', heroError);
  }
  
  // Search by heroine
  const { data: heroineMovies, error: heroineError } = await supabase
    .from('movies')
    .select('*')
    .eq('language', 'Telugu')
    .ilike('heroine', `%${actorName}%`);
  
  if (heroineError) {
    console.error('Error fetching heroine movies:', heroineError);
  }
  
  // Search by supporting cast
  const { data: supportingMovies, error: supportingError } = await supabase
    .from('movies')
    .select('*')
    .eq('language', 'Telugu')
    .contains('supporting_cast', [actorName]);
  
  if (supportingError) {
    console.error('Error fetching supporting movies:', supportingError);
  }
  
  // Merge and deduplicate
  const allMovies = [
    ...(heroMovies || []),
    ...(heroineMovies || []),
    ...(supportingMovies || []),
  ];
  
  const uniqueMovies = allMovies.filter((movie, index, self) =>
    index === self.findIndex(m => m.id === movie.id)
  );
  
  console.log(chalk.green(`✓ Found ${uniqueMovies.length} existing movies in database`));
  
  return uniqueMovies;
}

/**
 * Add missing film to database
 */
async function addFilmToDatabase(
  film: DiscoveredFilm,
  actorName: string,
  classification: RoleClassification
): Promise<boolean> {
  const slug = generateSlug(film.title_en, film.release_year);
  
  // Check if slug already exists
  const { data: existing } = await supabase
    .from('movies')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (existing) {
    if (VERBOSE) {
      console.log(chalk.yellow(`  ⚠️  Slug "${slug}" already exists, skipping`));
    }
    return false;
  }
  
  // Prepare movie data
  const movieData: any = {
    title_en: film.title_en,
    title_te: film.title_te || null,
    slug,
    release_year: film.release_year,
    language: 'Telugu',
    is_published: false, // Mark as unpublished until enriched
    content_type: 'speculative', // Flag as speculative until verified
    tmdb_id: film.tmdb_id || null,
    imdb_id: film.imdb_id || null,
  };
  
  // Set actor based on role
  if (classification.type === 'lead') {
    if (film.role === 'hero') {
      movieData.hero = actorName;
    } else if (film.role === 'heroine') {
      movieData.heroine = actorName;
    }
  } else if (classification.type === 'supporting' || classification.type === 'cameo') {
    movieData.supporting_cast = [actorName];
  }
  
  // Add notes for special roles
  if (classification.type === 'child_actor') {
    movieData.notes = `Child actor role`;
  } else if (classification.type === 'cameo') {
    movieData.notes = `Cameo appearance`;
  } else if (classification.appearsAs) {
    movieData.notes = `Appears as ${classification.appearsAs.replace(/_/g, ' ')}`;
  }
  
  // Insert into database
  const { error } = await supabase
    .from('movies')
    .insert(movieData);
  
  if (error) {
    console.error(chalk.red(`  ❌ Failed to add "${film.title_en}":`, error.message));
    return false;
  }
  
  return true;
}

/**
 * Generate CSV report
 */
function generateReport(
  actor: string,
  discoveredFilms: DiscoveredFilm[],
  missingFilms: DiscoveredFilm[],
  classifications: Map<DiscoveredFilm, RoleClassification>,
  addedCount: number
): void {
  const reportDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const filename = `${actor.toLowerCase().replace(/\s+/g, '-')}-discovery-report.csv`;
  const filepath = path.join(reportDir, filename);
  
  const rows = [
    ['Title', 'Year', 'Role Type', 'Is Primary', 'Appears As', 'Sources', 'Confidence', 'Status', 'TMDB ID', 'IMDb ID'],
  ];
  
  for (const film of discoveredFilms) {
    const classification = classifications.get(film)!;
    // Check if film is missing by comparing title and year
    const isMissing = missingFilms.some(m => 
      m.title_en === film.title_en && m.release_year === film.release_year
    );
    
    rows.push([
      film.title_en,
      film.release_year.toString(),
      classification.type,
      classification.isPrimaryRole ? 'Yes' : 'No',
      classification.appearsAs || '',
      film.sources.join(', '),
      film.confidence.toFixed(2),
      isMissing ? (EXECUTE ? 'Added' : 'Missing') : 'Exists',
      film.tmdb_id?.toString() || '',
      film.imdb_id || '',
    ]);
  }
  
  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  fs.writeFileSync(filepath, csv);
  
  console.log(chalk.gray(`\n📝 Report saved: ${filepath}`));
}

/**
 * Main discovery process
 */
async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║              FILM DISCOVERY & AUTO-ADD                               ║
║              (Find missing films from multiple sources)              ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  if (!ACTOR) {
    console.error(chalk.red('Error: --actor argument is required'));
    console.log('\nUsage:');
    console.log('  npx tsx scripts/discover-add-actor-films.ts --actor="Manchu Manoj" --execute');
    console.log('  npx tsx scripts/discover-add-actor-films.ts --actor="Manchu Manoj" --report-only');
    process.exit(1);
  }
  
  console.log(chalk.cyan(`Actor: ${chalk.bold(ACTOR)}`));
  console.log(chalk.cyan(`Mode: ${EXECUTE ? chalk.green('EXECUTE') : REPORT_ONLY ? chalk.yellow('REPORT ONLY') : chalk.yellow('DRY RUN')}`));
  
  // Step 1: Fetch existing movies
  const existingMovies = await fetchExistingMovies(ACTOR);
  
  // Step 2: Discover films from multiple sources
  console.log(chalk.cyan(`\n📥 Discovering films from multiple sources...`));
  
  const filmsBySource: Record<string, DiscoveredFilm[]> = {};
  
  // TMDB
  try {
    const tmdbFilms = await fetchTMDBFilmography(ACTOR);
    if (tmdbFilms.length > 0) {
      filmsBySource.tmdb = tmdbFilms;
      console.log(chalk.green(`  ✓ TMDB: ${tmdbFilms.length} films`));
    }
  } catch (error) {
    console.log(chalk.yellow(`  ⚠️  TMDB: Failed`));
  }
  
  // Wikipedia
  try {
    const wikiFilms = await fetchWikipediaFilmography(ACTOR);
    if (wikiFilms.length > 0) {
      // Convert Wikipedia format to DiscoveredFilm
      const converted: DiscoveredFilm[] = wikiFilms.map(f => ({
        title_en: f.title,
        release_year: f.year,
        role: 'hero', // Default to hero
        sources: ['wikipedia'],
        confidence: 0.80,
        language: f.language || 'Telugu',
        credits: f.notes,
      }));
      filmsBySource.wikipedia = converted;
      console.log(chalk.green(`  ✓ Wikipedia: ${wikiFilms.length} films`));
    }
  } catch (error) {
    console.log(chalk.yellow(`  ⚠️  Wikipedia: Failed`));
  }
  
  // Wikidata
  try {
    const wikidataFilms = await fetchWikidataFilmography(ACTOR);
    if (wikidataFilms.length > 0) {
      filmsBySource.wikidata = wikidataFilms;
      console.log(chalk.green(`  ✓ Wikidata: ${wikidataFilms.length} films`));
    }
  } catch (error) {
    console.log(chalk.yellow(`  ⚠️  Wikidata: Failed`));
  }
  
  // Step 3: Merge and deduplicate
  console.log(chalk.cyan(`\n🔍 Cross-referencing and deduplicating...`));
  const allFilms = mergeFilmSources(filmsBySource);
  console.log(chalk.green(`  ✓ Total unique films: ${allFilms.length}`));
  
  // Step 4: Find missing films
  const missingFilms = await findMissingFilms(allFilms, existingMovies);
  console.log(chalk.cyan(`  • Already in database: ${existingMovies.length}`));
  console.log(chalk.yellow(`  • Missing films: ${missingFilms.length}`));
  
  // Step 5: Classify roles
  console.log(chalk.cyan(`\n🎭 Classifying roles...`));
  const classifications = new Map<DiscoveredFilm, RoleClassification>();
  for (const film of allFilms) {
    const classification = classifyActorRole(film, ACTOR);
    classifications.set(film, classification);
  }
  
  const stats = getRoleStatistics(classifications);
  console.log(chalk.gray(`  • Child actor roles: ${stats.childActor}`));
  console.log(chalk.gray(`  • Lead roles: ${stats.lead}`));
  console.log(chalk.gray(`  • Supporting roles: ${stats.supporting}`));
  console.log(chalk.gray(`  • Cameo appearances: ${stats.cameo}`));
  console.log(chalk.gray(`  • Voice roles: ${stats.voice}`));
  
  // Step 6: Add missing films (if execute mode)
  let addedCount = 0;
  if (EXECUTE && missingFilms.length > 0) {
    console.log(chalk.cyan(`\n✅ Auto-adding ${missingFilms.length} missing films...`));
    
    for (const film of missingFilms) {
      // Re-classify the missing film (it's a new object, not in the classifications map)
      const classification = classifyActorRole(film, ACTOR);
      const success = await addFilmToDatabase(film, ACTOR, classification);
      if (success) {
        addedCount++;
        console.log(chalk.green(`  ✓ Added: ${film.title_en} (${film.release_year})`));
      }
    }
    
    console.log(chalk.green(`\n✅ Successfully added ${addedCount}/${missingFilms.length} films`));
  }
  
  // Step 7: Generate report
  generateReport(ACTOR, allFilms, missingFilms, classifications, addedCount);
  
  // Summary
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║                        DISCOVERY SUMMARY                             ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  console.log(`  Actor: ${ACTOR}`);
  console.log(`  Total films found: ${allFilms.length}`);
  console.log(`  Already in database: ${existingMovies.length}`);
  console.log(`  Missing films: ${missingFilms.length}`);
  if (EXECUTE) {
    console.log(chalk.green(`  Added to database: ${addedCount}`));
  }
  console.log(`\n  Role breakdown:`);
  console.log(`    Child actor: ${stats.childActor}`);
  console.log(`    Lead: ${stats.lead}`);
  console.log(`    Supporting: ${stats.supporting}`);
  console.log(`    Cameo: ${stats.cameo}`);
  console.log(`    Voice: ${stats.voice}`);
  
  if (!EXECUTE && missingFilms.length > 0) {
    console.log(chalk.yellow(`\n  💡 Run with --execute to add missing films to database`));
  }
}

main().catch(console.error);
