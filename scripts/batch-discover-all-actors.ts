#!/usr/bin/env npx tsx
/**
 * BATCH ACTOR DISCOVERY & ENRICHMENT
 * 
 * Processes multiple actors in batches:
 * 1. Film Discovery (find missing films)
 * 2. Validation (check data quality)
 * 3. Enrichment (enrich cast/crew)
 * 4. Export (generate reports)
 * 
 * Usage:
 *   npx tsx scripts/batch-discover-all-actors.ts --batch=1 --execute
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name: string): string => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : '';
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const BATCH_NUM = parseInt(getArg('batch') || '1');
const EXECUTE = hasFlag('execute');
const FAST = hasFlag('fast');
const TURBO = hasFlag('turbo');
const ACTORS_PER_BATCH = 5;

// Fetch all actors dynamically from database
async function getAllActors(): Promise<string[]> {
  const { data: movies } = await supabase
    .from('movies')
    .select('hero, heroine')
    .eq('language', 'Telugu')
    .not('hero', 'is', null)
    .not('hero', 'eq', 'Unknown');

  // Extract unique actors and count films
  const actorCounts: Record<string, number> = {};
  
  for (const movie of movies || []) {
    if (movie.hero && movie.hero !== 'Unknown') {
      const heroes = movie.hero.split(',').map((h: string) => h.trim());
      heroes.forEach((h: string) => {
        if (h) actorCounts[h] = (actorCounts[h] || 0) + 1;
      });
    }
    if (movie.heroine && movie.heroine !== 'Unknown') {
      const heroines = movie.heroine.split(',').map((h: string) => h.trim());
      heroines.forEach((h: string) => {
        if (h) actorCounts[h] = (actorCounts[h] || 0) + 1;
      });
    }
  }

  // Sort by film count (descending), only actors with 3+ films
  const sortedActors = Object.entries(actorCounts)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([actor]) => actor);

  return sortedActors;
}

async function runCommand(cmd: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
    });
    
    child.on('close', (code) => {
      resolve(code === 0);
    });
    
    child.on('error', () => {
      resolve(false);
    });
  });
}

async function processActor(actor: string, execute: boolean): Promise<{
  actor: string;
  discovered: boolean;
  validated: boolean;
  enriched: boolean;
}> {
  console.log(chalk.cyan.bold(`\n${'='.repeat(80)}`));
  console.log(chalk.cyan.bold(`  Processing: ${actor}`));
  console.log(chalk.cyan.bold(`${'='.repeat(80)}\n`));
  
  const result = {
    actor,
    discovered: false,
    validated: false,
    enriched: false,
  };
  
  // Step 1: Discovery
  console.log(chalk.magenta(`\n[1/3] Film Discovery...`));
  const discoveryArgs = [
    'tsx',
    'scripts/discover-add-actor-films.ts',
    `--actor="${actor}"`,
    execute ? '--execute' : '--report-only',
  ];
  result.discovered = await runCommand('npx', discoveryArgs);
  
  if (!result.discovered) {
    console.log(chalk.red(`❌ Discovery failed for ${actor}`));
    return result;
  }
  
  // Step 2: Validation (light version - just audit, no full enrichment)
  console.log(chalk.magenta(`\n[2/3] Data Validation...`));
  result.validated = await runCommand('npx', [
    'tsx',
    'scripts/actor-filmography-audit.ts',
    `--actor="${actor}"`,
  ]);
  
  // Step 3: Quick enrichment (cast/crew only)
  if (execute) {
    console.log(chalk.magenta(`\n[3/3] Quick Enrichment (Cast/Crew)...`));
    const enrichArgs = [
      'tsx',
      'scripts/enrich-cast-crew.ts',
      `--actor="${actor}"`,
      '--execute',
      '--limit=100',
    ];
    
    // Add speed flags for faster processing
    if (TURBO) {
      enrichArgs.push('--concurrency=100', '--rate-limit=25');
    } else if (FAST) {
      enrichArgs.push('--concurrency=50', '--rate-limit=50');
    } else {
      enrichArgs.push('--concurrency=50', '--rate-limit=100'); // Default faster
    }
    
    result.enriched = await runCommand('npx', enrichArgs);
  } else {
    result.enriched = true; // Skip in dry run
  }
  
  return result;
}

async function main() {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║       BATCH ACTOR DISCOVERY & ENRICHMENT                             ║
║       Process all actors with full pipeline                          ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  // Fetch all actors from database
  console.log(chalk.gray('  Fetching actors from database...\n'));
  const ALL_ACTORS = await getAllActors();
  
  const startIdx = (BATCH_NUM - 1) * ACTORS_PER_BATCH;
  const endIdx = Math.min(startIdx + ACTORS_PER_BATCH, ALL_ACTORS.length);
  const batchActors = ALL_ACTORS.slice(startIdx, endIdx);
  
  const speedMode = TURBO ? '🚀 TURBO (10x)' : FAST ? '⚡ FAST (5x)' : '📋 NORMAL';
  const speedColor = TURBO ? chalk.red : FAST ? chalk.yellow : chalk.gray;
  
  console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')} | Speed: ${speedColor(speedMode)}`);
  console.log(`  Batch: ${BATCH_NUM} (actors ${startIdx + 1}-${endIdx} of ${ALL_ACTORS.length})`);
  console.log(`  Actors in this batch: ${batchActors.length}\n`);
  
  for (let i = 0; i < batchActors.length; i++) {
    console.log(`  ${i + 1}. ${batchActors[i]}`);
  }
  
  const results = [];
  const startTime = Date.now();
  
  // Process each actor in the batch
  for (const actor of batchActors) {
    const result = await processActor(actor, EXECUTE);
    results.push(result);
  }
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  // Summary
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║                       BATCH SUMMARY                                  ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Batch: ${BATCH_NUM}`);
  console.log(`  Duration: ${duration} minutes`);
  console.log(`  Actors processed: ${results.length}\n`);
  
  console.log(`  Results:\n`);
  for (const result of results) {
    const status = result.discovered && result.validated && result.enriched ? '✅' : '⚠️';
    console.log(`    ${status} ${result.actor.padEnd(30)} - ` +
      `Discovery: ${result.discovered ? '✅' : '❌'} | ` +
      `Validation: ${result.validated ? '✅' : '❌'} | ` +
      `Enrichment: ${result.enriched ? '✅' : '❌'}`);
  }
  
  const successCount = results.filter(r => r.discovered && r.validated && r.enriched).length;
  console.log(`\n  Success rate: ${Math.round((successCount / results.length) * 100)}%`);
  
  // Next batch info
  if (endIdx < ALL_ACTORS.length) {
    const nextBatch = BATCH_NUM + 1;
    console.log(chalk.yellow(`\n  💡 To process next batch (${endIdx + 1}-${Math.min(endIdx + ACTORS_PER_BATCH, ALL_ACTORS.length)}):`));
    console.log(chalk.gray(`     npx tsx scripts/batch-discover-all-actors.ts --batch=${nextBatch} ${EXECUTE ? '--execute' : ''}`));
  } else {
    console.log(chalk.green(`\n  🎉 All actors processed!`));
  }
}

main().catch(console.error);
