#!/usr/bin/env npx tsx
/**
 * Batch Actor Validation Processor
 * 
 * Systematically processes ALL actors in the database using the comprehensive
 * validate-actor-complete.ts system.
 * 
 * Features:
 * - ✅ Fetches all actors from database
 * - ✅ Processes in configurable batches
 * - ✅ Progress tracking & resume capability
 * - ✅ Consolidated reporting
 * - ✅ Error handling & retry logic
 * - ✅ Configurable modes (report-only, execute, full)
 * 
 * Usage:
 *   # Dry run (report only)
 *   npx tsx scripts/batch-validate-all-actors.ts --mode=report --batch-size=5
 * 
 *   # Execute fixes + enrich
 *   npx tsx scripts/batch-validate-all-actors.ts --mode=full --batch-size=5
 * 
 *   # Resume from specific actor
 *   npx tsx scripts/batch-validate-all-actors.ts --mode=full --resume-from="Actor Name"
 * 
 *   # Process only specific actors
 *   npx tsx scripts/batch-validate-all-actors.ts --actors="Actor1,Actor2,Actor3" --mode=full
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const MODE = getArg('mode', 'report'); // report, execute, full
const BATCH_SIZE = parseInt(getArg('batch-size', '10'), 10);
const BATCH_DELAY_MS = parseInt(getArg('batch-delay', '5000'), 10); // 5 seconds between actors
const RESUME_FROM = getArg('resume-from', '');
const SPECIFIC_ACTORS = getArg('actors', '').split(',').filter(Boolean);
const MIN_MOVIES = parseInt(getArg('min-movies', '5'), 10); // Only process actors with 5+ movies
const OUTPUT_DIR = getArg('output-dir', 'docs/batch-actor-validation');
const LANGUAGE = getArg('language', 'Telugu');

interface ActorStats {
  name: string;
  movieCount: number;
  heroCount: number;
  heroineCount: number;
}

interface ProcessResult {
  actor: string;
  success: boolean;
  duration_ms: number;
  error?: string;
  movieCount: number;
}

interface BatchSummary {
  totalActors: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  totalDuration_ms: number;
  results: ProcessResult[];
  startTime: string;
  endTime?: string;
}

const progressFile = path.join(OUTPUT_DIR, 'batch-progress.json');
const summaryFile = path.join(OUTPUT_DIR, 'batch-summary.json');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to run validate-actor-complete.ts for a single actor
async function validateActor(
  actorName: string,
  mode: string
): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const scriptArgs = [`--actor="${actorName}"`];
    
    // Add mode flags
    if (mode === 'report') {
      scriptArgs.push('--report-only');
    } else if (mode === 'execute') {
      scriptArgs.push('--execute', '--enrich');
    } else if (mode === 'full') {
      scriptArgs.push('--full');
    }
    
    console.log(chalk.cyan(`\n  ▶️  Processing: ${actorName}`));
    console.log(chalk.gray(`     Mode: ${mode}`));
    
    const child = spawn('npx', ['tsx', 'scripts/validate-actor-complete.ts', ...scriptArgs], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
    });
    
    child.on('close', (code) => {
      const duration_ms = Date.now() - startTime;
      const success = code === 0;
      
      if (success) {
        console.log(chalk.green(`  ✅ ${actorName} completed in ${(duration_ms / 1000).toFixed(1)}s`));
      } else {
        console.log(chalk.red(`  ❌ ${actorName} failed after ${(duration_ms / 1000).toFixed(1)}s`));
      }
      
      resolve({
        actor: actorName,
        success,
        duration_ms,
        movieCount: 0, // Will be updated from DB query
      });
    });
    
    child.on('error', (err) => {
      const duration_ms = Date.now() - startTime;
      console.log(chalk.red(`  ❌ ${actorName} error: ${err.message}`));
      
      resolve({
        actor: actorName,
        success: false,
        duration_ms,
        error: err.message,
        movieCount: 0,
      });
    });
  });
}

// Fetch all actors from database
async function fetchActors(): Promise<ActorStats[]> {
  console.log(chalk.cyan('\n📥 Fetching actors from database...'));
  
  // If specific actors provided, use those
  if (SPECIFIC_ACTORS.length > 0) {
    console.log(chalk.gray(`   Using specific actors: ${SPECIFIC_ACTORS.join(', ')}`));
    const actorStats: ActorStats[] = [];
    
    for (const actorName of SPECIFIC_ACTORS) {
      const { data: heroMovies } = await supabase
        .from('movies')
        .select('id')
        .eq('language', LANGUAGE)
        .ilike('hero', `%${actorName}%`);
      
      const { data: heroineMovies } = await supabase
        .from('movies')
        .select('id')
        .eq('language', LANGUAGE)
        .ilike('heroine', `%${actorName}%`);
      
      const heroCount = heroMovies?.length || 0;
      const heroineCount = heroineMovies?.length || 0;
      const movieCount = heroCount + heroineCount;
      
      if (movieCount >= MIN_MOVIES) {
        actorStats.push({
          name: actorName,
          movieCount,
          heroCount,
          heroineCount,
        });
      }
    }
    
    return actorStats;
  }
  
  // Otherwise, fetch all actors from celebrities table
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('name, primary_role')
    .eq('language', LANGUAGE)
    .order('name');
  
  if (error) {
    console.error(chalk.red('Error fetching celebrities:'), error);
    throw error;
  }
  
  console.log(chalk.gray(`   Found ${celebrities?.length || 0} celebrities in database`));
  console.log(chalk.cyan('\n📊 Analyzing movie counts for each actor...'));
  
  const actorStats: ActorStats[] = [];
  
  for (const celeb of celebrities || []) {
    // Check how many movies they're in
    const { data: heroMovies } = await supabase
      .from('movies')
      .select('id')
      .eq('language', LANGUAGE)
      .ilike('hero', `%${celeb.name}%`);
    
    const { data: heroineMovies } = await supabase
      .from('movies')
      .select('id')
      .eq('language', LANGUAGE)
      .ilike('heroine', `%${celeb.name}%`);
    
    const heroCount = heroMovies?.length || 0;
    const heroineCount = heroineMovies?.length || 0;
    const movieCount = heroCount + heroineCount;
    
    if (movieCount >= MIN_MOVIES) {
      actorStats.push({
        name: celeb.name,
        movieCount,
        heroCount,
        heroineCount,
      });
    }
  }
  
  // Sort by movie count descending (process high-impact actors first)
  actorStats.sort((a, b) => b.movieCount - a.movieCount);
  
  console.log(chalk.green(`   ✅ Found ${actorStats.length} actors with ${MIN_MOVIES}+ movies`));
  
  return actorStats;
}

// Save progress
function saveProgress(summary: BatchSummary) {
  fs.writeFileSync(progressFile, JSON.stringify(summary, null, 2), 'utf8');
}

// Load previous progress
function loadProgress(): BatchSummary | null {
  if (!fs.existsSync(progressFile)) return null;
  
  try {
    const content = fs.readFileSync(progressFile, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Generate consolidated CSV report
function generateConsolidatedReport(summary: BatchSummary) {
  const csvPath = path.join(OUTPUT_DIR, 'batch-validation-results.csv');
  
  const rows = [
    ['Actor', 'Status', 'Duration_Seconds', 'Movie_Count', 'Error'].join(','),
    ...summary.results.map(r => [
      `"${r.actor}"`,
      r.success ? 'Success' : 'Failed',
      (r.duration_ms / 1000).toFixed(1),
      r.movieCount,
      r.error ? `"${r.error}"` : '',
    ].join(',')),
  ];
  
  fs.writeFileSync(csvPath, rows.join('\n'), 'utf8');
  console.log(chalk.green(`\n  ✅ CSV report: ${csvPath}`));
}

// Main batch processing
async function main() {
  const startTime = Date.now();
  
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            BATCH ACTOR VALIDATION PROCESSOR                          ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Mode: ${chalk.yellow(MODE)}`);
  console.log(`  Batch size: ${BATCH_SIZE} actors`);
  console.log(`  Delay between actors: ${BATCH_DELAY_MS}ms`);
  console.log(`  Min movies per actor: ${MIN_MOVIES}`);
  console.log(`  Language: ${LANGUAGE}`);
  console.log(`  Output directory: ${OUTPUT_DIR}`);
  
  // Check for resume
  let previousProgress: BatchSummary | null = null;
  if (RESUME_FROM) {
    console.log(chalk.yellow(`\n  📂 Resuming from: ${RESUME_FROM}`));
    previousProgress = loadProgress();
  } else if (hasFlag('resume')) {
    console.log(chalk.yellow(`\n  📂 Checking for previous progress...`));
    previousProgress = loadProgress();
    if (previousProgress) {
      console.log(chalk.green(`     Found! Resuming from ${previousProgress.processed}/${previousProgress.totalActors} actors`));
    }
  }
  
  // Fetch actors
  const actors = await fetchActors();
  
  if (actors.length === 0) {
    console.log(chalk.yellow('\n  No actors found matching criteria.'));
    return;
  }
  
  console.log(chalk.cyan(`\n  📋 Actors to process: ${actors.length}`));
  console.log(chalk.gray(`     Top 10 by movie count:`));
  for (let i = 0; i < Math.min(10, actors.length); i++) {
    const a = actors[i];
    console.log(chalk.gray(`       ${i + 1}. ${a.name} - ${a.movieCount} movies (${a.heroCount} hero, ${a.heroineCount} heroine)`));
  }
  
  // Filter actors based on resume point
  let actorsToProcess = actors;
  let alreadyProcessed: ProcessResult[] = previousProgress?.results || [];
  
  if (RESUME_FROM) {
    const resumeIndex = actors.findIndex(a => a.name === RESUME_FROM);
    if (resumeIndex === -1) {
      console.log(chalk.red(`\n  ❌ Actor "${RESUME_FROM}" not found in list.`));
      return;
    }
    actorsToProcess = actors.slice(resumeIndex);
    console.log(chalk.yellow(`\n  Resuming from position ${resumeIndex + 1}/${actors.length}`));
  } else if (previousProgress && hasFlag('resume')) {
    const processedNames = new Set(previousProgress.results.map(r => r.actor));
    actorsToProcess = actors.filter(a => !processedNames.has(a.name));
  }
  
  const summary: BatchSummary = {
    totalActors: actors.length,
    processed: alreadyProcessed.length,
    successful: alreadyProcessed.filter(r => r.success).length,
    failed: alreadyProcessed.filter(r => !r.success).length,
    skipped: 0,
    totalDuration_ms: 0,
    results: [...alreadyProcessed],
    startTime: new Date().toISOString(),
  };
  
  console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            STARTING BATCH PROCESSING                                 ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  // Process actors in batches
  let currentBatch = 1;
  const totalBatches = Math.ceil(actorsToProcess.length / BATCH_SIZE);
  
  for (let i = 0; i < actorsToProcess.length; i += BATCH_SIZE) {
    const batch = actorsToProcess.slice(i, i + BATCH_SIZE);
    
    console.log(chalk.blue.bold(`\n📦 Batch ${currentBatch}/${totalBatches} (${batch.length} actors)`));
    console.log(chalk.gray(`   Actors: ${batch.map(a => a.name).join(', ')}`));
    
    for (const actor of batch) {
      const result = await validateActor(actor.name, MODE);
      result.movieCount = actor.movieCount;
      
      summary.results.push(result);
      summary.processed++;
      
      if (result.success) {
        summary.successful++;
      } else {
        summary.failed++;
      }
      
      // Save progress after each actor
      saveProgress(summary);
      
      // Progress indicator
      const pct = Math.round((summary.processed / summary.totalActors) * 100);
      console.log(chalk.cyan(`  📊 Progress: ${summary.processed}/${summary.totalActors} (${pct}%) | ✅ ${summary.successful} | ❌ ${summary.failed}`));
      
      // Delay between actors (except for last one)
      if (i + batch.indexOf(actor) < actorsToProcess.length - 1) {
        console.log(chalk.gray(`     Waiting ${BATCH_DELAY_MS / 1000}s before next actor...`));
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }
    
    currentBatch++;
    
    // Longer delay between batches
    if (i + BATCH_SIZE < actorsToProcess.length) {
      console.log(chalk.yellow(`\n  ⏸️  Batch ${currentBatch - 1} complete. Taking a 10-second break...\n`));
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  summary.endTime = new Date().toISOString();
  summary.totalDuration_ms = Date.now() - startTime;
  
  // Save final summary
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf8');
  
  // Generate reports
  generateConsolidatedReport(summary);
  
  // Final summary
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            BATCH PROCESSING COMPLETE                                 ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Total actors: ${summary.totalActors}`);
  console.log(`  Processed: ${summary.processed}`);
  console.log(chalk.green(`  Successful: ${summary.successful} (${Math.round(summary.successful / summary.processed * 100)}%)`));
  console.log(chalk.red(`  Failed: ${summary.failed} (${Math.round(summary.failed / summary.processed * 100)}%)`));
  console.log(`  Duration: ${(summary.totalDuration_ms / 1000 / 60).toFixed(1)} minutes`);
  console.log(`  Average: ${(summary.totalDuration_ms / summary.processed / 1000).toFixed(1)}s per actor`);
  
  console.log(chalk.cyan(`\n  📁 Output files:`));
  console.log(chalk.gray(`     - ${summaryFile}`));
  console.log(chalk.gray(`     - ${path.join(OUTPUT_DIR, 'batch-validation-results.csv')}`));
  console.log(chalk.gray(`     - ${progressFile}`));
  
  if (summary.failed > 0) {
    console.log(chalk.yellow(`\n  ⚠️  ${summary.failed} actors failed. Review errors and retry:`));
    const failedActors = summary.results.filter(r => !r.success);
    for (const result of failedActors.slice(0, 10)) {
      console.log(chalk.red(`     - ${result.actor}: ${result.error || 'Unknown error'}`));
    }
    if (failedActors.length > 10) {
      console.log(chalk.gray(`     ... and ${failedActors.length - 10} more (see CSV report)`));
    }
  }
  
  console.log(chalk.green.bold(`\n✅ Batch validation complete!\n`));
}

main().catch(console.error);
