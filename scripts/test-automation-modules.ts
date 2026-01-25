#!/usr/bin/env npx tsx
/**
 * TEST AUTOMATION MODULES
 * 
 * Quick test script to validate the new automation modules work correctly.
 * 
 * Usage:
 *   npx tsx scripts/test-automation-modules.ts --actor="Pawan Kalyan"
 *   npx tsx scripts/test-automation-modules.ts --test=missing-films
 *   npx tsx scripts/test-automation-modules.ts --test=ghost-entries
 *   npx tsx scripts/test-automation-modules.ts --test=tmdb-validator
 *   npx tsx scripts/test-automation-modules.ts --test=multi-source
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

// Import new modules
import { detectMissingFilms, generateMissingFilmsReport } from './lib/missing-film-detector';
import { analyzeGhostEntry, batchAnalyzeGhostEntries, generateGhostEntriesReport } from './lib/ghost-reattribution-engine';
import { validateTMDBId, batchValidateTMDBIds, generateTMDBValidationReport } from './lib/tmdb-id-validator';
import { fetchFromAllSources } from './lib/multi-source-orchestrator';
import { CONFIDENCE_THRESHOLDS, printThresholds } from './lib/confidence-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse args
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const ACTOR = getArg('actor', 'Pawan Kalyan');
const TEST = getArg('test', 'all'); // all, missing-films, ghost-entries, tmdb-validator, multi-source

// ============================================================
// TEST 1: MISSING FILM DETECTOR
// ============================================================

async function testMissingFilmDetector(actorName: string): Promise<void> {
  console.log(chalk.cyan.bold(`\n╔══════════════════════════════════════════════════════════════════════╗`));
  console.log(chalk.cyan.bold(`║  TEST 1: Missing Film Detector                                       ║`));
  console.log(chalk.cyan.bold(`╚══════════════════════════════════════════════════════════════════════╝\n`));

  console.log(`Testing missing film detection for: ${chalk.yellow(actorName)}\n`);

  try {
    // Fetch existing films from database
    const { data: existingFilms, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, tmdb_id')
      .or(`hero.ilike.%${actorName}%,heroine.ilike.%${actorName}%`)
      .eq('language', 'Telugu');

    if (error) throw error;

    console.log(`Found ${chalk.cyan(existingFilms.length)} existing films in database\n`);

    // Detect missing films
    const analysis = await detectMissingFilms(actorName, existingFilms);

    if (!analysis) {
      console.log(chalk.red('✗ Actor not found on TMDB\n'));
      return;
    }

    console.log(chalk.green('✓ Missing film detection complete\n'));
    console.log(chalk.cyan('Analysis Summary:'));
    console.log(`  TMDB Actor ID: ${analysis.tmdbActorId}`);
    console.log(`  Total TMDB Credits: ${analysis.totalTMDBCredits}`);
    console.log(`  Telugu Credits: ${analysis.teluguCredits}`);
    console.log(`  Existing in DB: ${analysis.existingInDB}`);
    console.log(`  Missing Films: ${chalk.yellow(analysis.missingFilms.length)}`);
    console.log(`  Auto-Add Candidates: ${chalk.green(analysis.autoAddCandidates.length)}`);
    console.log(`  Manual Review: ${chalk.yellow(analysis.manualReviewCandidates.length)}\n`);

    if (analysis.autoAddCandidates.length > 0) {
      console.log(chalk.green('Auto-Add Candidates (High Confidence):'));
      for (const film of analysis.autoAddCandidates.slice(0, 5)) {
        console.log(`  • ${film.title} (${film.releaseYear}) - ${film.role} - ${(film.confidence * 100).toFixed(0)}%`);
      }
      console.log();
    }

    if (analysis.manualReviewCandidates.length > 0) {
      console.log(chalk.yellow('Manual Review Required (Lower Confidence):'));
      for (const film of analysis.manualReviewCandidates.slice(0, 5)) {
        console.log(`  • ${film.title} (${film.releaseYear}) - ${film.role} - ${(film.confidence * 100).toFixed(0)}%`);
      }
      console.log();
    }

    // Generate report
    const report = generateMissingFilmsReport(analysis);
    console.log(chalk.gray('Full report generated (not shown here)\n'));

  } catch (error) {
    console.log(chalk.red(`✗ Error: ${error}\n`));
  }
}

// ============================================================
// TEST 2: GHOST ENTRY RE-ATTRIBUTION
// ============================================================

async function testGhostReattribution(actorName: string): Promise<void> {
  console.log(chalk.cyan.bold(`\n╔══════════════════════════════════════════════════════════════════════╗`));
  console.log(chalk.cyan.bold(`║  TEST 2: Ghost Entry Re-Attribution Engine                           ║`));
  console.log(chalk.cyan.bold(`╚══════════════════════════════════════════════════════════════════════╝\n`));

  console.log(`Testing ghost entry detection for: ${chalk.yellow(actorName)}\n`);

  try {
    // Fetch a few films to test
    const { data: films, error } = await supabase
      .from('movies')
      .select('id, slug, title_en, release_year, tmdb_id, imdb_id')
      .or(`hero.ilike.%${actorName}%,heroine.ilike.%${actorName}%`)
      .eq('language', 'Telugu')
      .limit(3);

    if (error) throw error;

    if (!films || films.length === 0) {
      console.log(chalk.yellow('No films found for testing\n'));
      return;
    }

    console.log(`Testing ${chalk.cyan(films.length)} films\n`);

    // Analyze first film as example
    const testFilm = films[0];
    console.log(chalk.cyan(`Analyzing: ${testFilm.title_en} (${testFilm.release_year})`));
    
    const analysis = await analyzeGhostEntry({
      movieId: testFilm.id,
      title: testFilm.title_en,
      releaseYear: testFilm.release_year,
      currentActor: actorName,
      tmdbId: testFilm.tmdb_id,
      imdbId: testFilm.imdb_id,
    });

    if (analysis.isGhost) {
      console.log(chalk.yellow(`✓ Ghost entry detected`));
      if (analysis.reattribution) {
        console.log(`  Suggested Actor: ${chalk.green(analysis.reattribution.suggestedActor || 'Unknown')}`);
        console.log(`  Confidence: ${(analysis.reattribution.confidence * 100).toFixed(0)}%`);
        console.log(`  Action: ${analysis.reattribution.action}`);
        console.log(`  Reason: ${analysis.reattribution.reason}`);
      }
    } else {
      console.log(chalk.green(`✓ Valid entry - actor verified in cast`));
    }
    console.log();

  } catch (error) {
    console.log(chalk.red(`✗ Error: ${error}\n`));
  }
}

// ============================================================
// TEST 3: TMDB ID VALIDATOR
// ============================================================

async function testTMDBValidator(actorName: string): Promise<void> {
  console.log(chalk.cyan.bold(`\n╔══════════════════════════════════════════════════════════════════════╗`));
  console.log(chalk.cyan.bold(`║  TEST 3: TMDB ID Validator                                           ║`));
  console.log(chalk.cyan.bold(`╚══════════════════════════════════════════════════════════════════════╝\n`));

  console.log(`Testing TMDB ID validation for: ${chalk.yellow(actorName)}\n`);

  try {
    // Fetch films with TMDB IDs
    const { data: films, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, tmdb_id')
      .or(`hero.ilike.%${actorName}%,heroine.ilike.%${actorName}%`)
      .eq('language', 'Telugu')
      .not('tmdb_id', 'is', null)
      .limit(5);

    if (error) throw error;

    if (!films || films.length === 0) {
      console.log(chalk.yellow('No films with TMDB IDs found for testing\n'));
      return;
    }

    console.log(`Testing ${chalk.cyan(films.length)} TMDB IDs\n`);

    // Validate first film as example
    const testFilm = films[0];
    console.log(chalk.cyan(`Validating: ${testFilm.title_en} (${testFilm.release_year}) - TMDB ID: ${testFilm.tmdb_id}`));
    
    const validation = await validateTMDBId({
      title_en: testFilm.title_en,
      release_year: testFilm.release_year,
      hero: actorName,
      currentTmdbId: testFilm.tmdb_id,
    });

    if (validation.isValid) {
      console.log(chalk.green(`✓ TMDB ID is valid`));
    } else {
      console.log(chalk.yellow(`! TMDB ID has issues`));
      console.log(`  Issues: ${validation.issues.join(', ')}`);
      console.log(`  Action: ${validation.action}`);
      if (validation.suggestedId) {
        console.log(`  Suggested ID: ${validation.suggestedId}`);
      }
      console.log(`  Confidence: ${(validation.confidence * 100).toFixed(0)}%`);
      console.log(`  Reason: ${validation.reason}`);
    }
    console.log();

  } catch (error) {
    console.log(chalk.red(`✗ Error: ${error}\n`));
  }
}

// ============================================================
// TEST 4: MULTI-SOURCE ORCHESTRATOR
// ============================================================

async function testMultiSourceOrchestrator(actorName: string): Promise<void> {
  console.log(chalk.cyan.bold(`\n╔══════════════════════════════════════════════════════════════════════╗`));
  console.log(chalk.cyan.bold(`║  TEST 4: Multi-Source Orchestrator                                   ║`));
  console.log(chalk.cyan.bold(`╚══════════════════════════════════════════════════════════════════════╝\n`));

  console.log(`Testing multi-source data fetching for: ${chalk.yellow(actorName)}\n`);

  try {
    // Fetch a film to test
    const { data: films, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, tmdb_id, imdb_id')
      .or(`hero.ilike.%${actorName}%,heroine.ilike.%${actorName}%`)
      .eq('language', 'Telugu')
      .limit(1);

    if (error) throw error;

    if (!films || films.length === 0) {
      console.log(chalk.yellow('No films found for testing\n'));
      return;
    }

    const testFilm = films[0];
    console.log(chalk.cyan(`Testing: ${testFilm.title_en} (${testFilm.release_year})\n`));

    // Fetch from all sources
    const fields = ['director', 'cinematographer', 'editor', 'writer', 'producer'];
    console.log(`Fetching fields: ${fields.join(', ')}\n`);

    const results = await fetchFromAllSources({
      title_en: testFilm.title_en,
      release_year: testFilm.release_year,
      tmdb_id: testFilm.tmdb_id,
      imdb_id: testFilm.imdb_id,
    }, fields);

    console.log(chalk.green('✓ Multi-source fetch complete\n'));

    for (const result of results) {
      console.log(chalk.cyan(`Field: ${result.field}`));
      console.log(`  Sources: ${result.sources.length}`);
      if (result.consensus) {
        console.log(`  Consensus: ${chalk.green(result.consensus)}`);
        console.log(`  Confidence: ${(result.consensusConfidence * 100).toFixed(0)}%`);
        console.log(`  Action: ${result.action}`);
      } else {
        console.log(`  ${chalk.yellow('No consensus reached')}`);
      }
      
      if (result.sources.length > 0) {
        console.log(`  Source Values:`);
        for (const source of result.sources) {
          console.log(`    - ${source.sourceId}: ${source.value} (${(source.confidence * 100).toFixed(0)}%)`);
        }
      }
      
      console.log();
    }

  } catch (error) {
    console.log(chalk.red(`✗ Error: ${error}\n`));
  }
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║        AUTOMATION MODULES TEST SUITE                                 ║
║                                                                      ║
║        Testing new actor validation automation modules               ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`Actor: ${chalk.yellow(ACTOR)}`);
  console.log(`Test: ${chalk.cyan(TEST)}\n`);

  // Print confidence thresholds
  if (TEST === 'all' || TEST === 'config') {
    console.log(chalk.cyan.bold('Current Confidence Configuration:\n'));
    printThresholds();
  }

  // Run tests
  if (TEST === 'all' || TEST === 'missing-films') {
    await testMissingFilmDetector(ACTOR);
  }

  if (TEST === 'all' || TEST === 'ghost-entries') {
    await testGhostReattribution(ACTOR);
  }

  if (TEST === 'all' || TEST === 'tmdb-validator') {
    await testTMDBValidator(ACTOR);
  }

  if (TEST === 'all' || TEST === 'multi-source') {
    await testMultiSourceOrchestrator(ACTOR);
  }

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║        TEST SUITE COMPLETE                                           ║
╚══════════════════════════════════════════════════════════════════════╝
`));
}

main().catch(console.error);
