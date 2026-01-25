#!/usr/bin/env npx tsx
/**
 * SMART FAST ENRICHMENT SYSTEM
 *
 * Intelligent enrichment that:
 * - ✅ Only processes missing data (no waste)
 * - ✅ Uses fast sources only (TMDB, Wikipedia, Wikidata)
 * - ⏭️  Skips slow tasks (images, AI translation, heavy API calls)
 * - 🚀 Runs in TURBO mode by default
 * - 📊 Shows clear progress and results
 *
 * Speed: ~2-5 minutes for ALL missing data
 *
 * Usage:
 *   npx tsx scripts/enrich-smart-fast.ts --execute
 *   npx tsx scripts/enrich-smart-fast.ts --actor="Actor Name" --execute
 */

import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse args
const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};

const EXECUTE = hasFlag('execute');
const ACTOR = getArg('actor', '');
const DIRECTOR = getArg('director', '');

// Fast phases configuration (skips slow tasks)
const FAST_PHASES = [
  {
    name: 'genres',
    script: 'scripts/enrich-genres-direct.ts',
    args: ['--only-empty', '--concurrency=100'],
    description: 'Fill missing genres (TMDB)',
    checkField: 'genres',
  },
  {
    name: 'cast-crew',
    script: 'scripts/enrich-cast-crew.ts',
    args: ['--extended', '--concurrency=100', '--fast-mode'],
    description: 'Fill missing cast/crew (TMDB, Wikipedia)',
    checkField: 'hero',
  },
  {
    name: 'tagline',
    script: 'scripts/enrich-tagline.ts',
    args: ['--min-confidence=0.7', '--no-ai', '--concurrency=100'],
    description: 'Fill missing taglines (TMDB, Wikipedia only)',
    checkField: 'tagline',
  },
  {
    name: 'classification',
    script: 'scripts/enrich-safe-classification.ts',
    args: ['--fields=primary_genre,age_rating', '--concurrency=100'],
    description: 'Fill missing classifications',
    checkField: 'primary_genre',
  },
  {
    name: 'taxonomy',
    script: 'scripts/enrich-taxonomy.ts',
    args: ['--concurrency=100'],
    description: 'Fill era, decade, tone',
    checkField: 'era',
  },
  {
    name: 'auto-tags',
    script: 'scripts/auto-tag-movies.ts',
    args: ['--v2', '--apply'],
    description: 'Quality tags (blockbuster, classic, hidden gem)',
    checkField: 'quality_tags',
  },
  {
    name: 'audience-fit',
    script: 'scripts/enrich-audience-fit.ts',
    args: ['--concurrency=100'],
    description: 'Family watch, date movie, group watch',
    checkField: 'audience_fit',
  },
  {
    name: 'governance',
    script: 'scripts/enrich-governance.ts',
    args: ['--entity=movies', '--concurrency=100'],
    description: 'Trust scoring and validation',
    checkField: 'trust_score',
  },
];

// Skipped slow phases (can be run manually later)
const SKIPPED_PHASES = [
  '🖼️  Images (30-45 min) - Use: npx tsx scripts/enrich-images-fast.ts --only-empty --execute',
  '📝 Telugu Synopsis (10-20 min with AI) - Use: npx tsx scripts/enrich-telugu-synopsis.ts --execute',
  '🎬 Trivia (10-15 min) - Use: npx tsx scripts/enrich-trivia.ts --execute',
];

interface PhaseResult {
  name: string;
  success: boolean;
  duration: number;
  beforeCount?: number;
  afterCount?: number;
  filled?: number;
}

async function countMissing(field: string, actor?: string, director?: string): Promise<number> {
  let query = supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Telugu')
    .eq('is_published', true);

  // Add filters
  if (actor) {
    query = query.or(`hero.ilike.%${actor}%,heroine.ilike.%${actor}%`);
  }
  if (director) {
    query = query.ilike('director', `%${director}%`);
  }

  // Check for null/empty
  if (field === 'genres') {
    query = query.or('genres.is.null,genres.eq.{}');
  } else if (field === 'quality_tags') {
    query = query.or('quality_tags.is.null,quality_tags.eq.{}');
  } else if (field === 'audience_fit') {
    query = query.or('audience_fit.is.null,audience_fit.eq.{}');
  } else {
    query = query.or(`${field}.is.null,${field}.eq.`);
  }

  const { count } = await query;
  return count || 0;
}

async function runPhase(phase: any, execute: boolean): Promise<PhaseResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    // Build command args
    const phaseArgs = [...phase.args];
    if (execute) phaseArgs.push('--execute');
    if (ACTOR) phaseArgs.push(`--actor=${ACTOR}`);
    if (DIRECTOR) phaseArgs.push(`--director=${DIRECTOR}`);

    console.log(chalk.cyan(`\n  Running: ${phase.name}...`));

    const child = spawn('npx', ['tsx', phase.script, ...phaseArgs], {
      stdio: 'pipe',
      shell: true,
    });

    let output = '';
    child.stdout?.on('data', (data) => {
      output += data.toString();
      // Show progress if available
      const match = data.toString().match(/(\d+)\/(\d+)/);
      if (match) {
        process.stdout.write(`\r    Progress: ${match[0]}`);
      }
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      process.stdout.write('\r'); // Clear progress line
      resolve({
        name: phase.name,
        success: code === 0,
        duration,
      });
    });
  });
}

async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           🚀 SMART FAST ENRICHMENT SYSTEM                            ║
║                                                                      ║
║   Strategy: Quick wins only, skip slow tasks                        ║
║   Speed: 2-5 minutes for all missing data                           ║
║   Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}                                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  if (ACTOR) console.log(chalk.yellow(`  🎭 Filter: Actor = "${ACTOR}"`));
  if (DIRECTOR) console.log(chalk.yellow(`  🎬 Filter: Director = "${DIRECTOR}"`));

  // Check what's missing
  console.log(chalk.cyan('\n📊 Checking for missing data...\n'));

  const missingCounts = new Map<string, number>();
  for (const phase of FAST_PHASES) {
    const count = await countMissing(phase.checkField, ACTOR, DIRECTOR);
    missingCounts.set(phase.name, count);
    if (count > 0) {
      console.log(`  ${phase.name.padEnd(15)} ${chalk.yellow(`${count} missing`)} - ${phase.description}`);
    } else {
      console.log(`  ${phase.name.padEnd(15)} ${chalk.green('✓ Complete')} - ${phase.description}`);
    }
  }

  const totalMissing = Array.from(missingCounts.values()).reduce((a, b) => a + b, 0);

  if (totalMissing === 0) {
    console.log(chalk.green('\n✅ All fast-enrichable data is complete!'));
    console.log(chalk.gray('\nSkipped slow tasks (run manually if needed):'));
    SKIPPED_PHASES.forEach((p) => console.log(chalk.gray(`  ${p}`)));
    return;
  }

  console.log(chalk.cyan(`\n📈 Total missing fields: ${totalMissing}`));

  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  DRY RUN mode. Add --execute to apply changes.'));
    console.log(chalk.gray('\nSkipped slow tasks (run manually if needed):'));
    SKIPPED_PHASES.forEach((p) => console.log(chalk.gray(`  ${p}`)));
    return;
  }

  // Run fast phases
  console.log(chalk.cyan.bold('\n🚀 Running fast enrichment phases...\n'));

  const results: PhaseResult[] = [];
  const totalStart = Date.now();

  for (const phase of FAST_PHASES) {
    const beforeCount = missingCounts.get(phase.name) || 0;
    if (beforeCount === 0) {
      console.log(chalk.gray(`\n  ⏭️  Skipping ${phase.name} (already complete)`));
      continue;
    }

    const result = await runPhase(phase, EXECUTE);
    
    // Check after count
    const afterCount = await countMissing(phase.checkField, ACTOR, DIRECTOR);
    result.beforeCount = beforeCount;
    result.afterCount = afterCount;
    result.filled = beforeCount - afterCount;

    if (result.success) {
      console.log(
        chalk.green(
          `  ✓ ${phase.name}: Filled ${result.filled}/${beforeCount} in ${(result.duration / 1000).toFixed(1)}s`
        )
      );
    } else {
      console.log(chalk.red(`  ✗ ${phase.name}: Failed after ${(result.duration / 1000).toFixed(1)}s`));
    }

    results.push(result);
  }

  const totalDuration = Date.now() - totalStart;

  // Final summary
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           📊 ENRICHMENT SUMMARY                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  const totalFilled = results.reduce((sum, r) => sum + (r.filled || 0), 0);
  const successCount = results.filter((r) => r.success).length;

  console.log(`  Total duration: ${chalk.cyan((totalDuration / 1000).toFixed(1) + 's')}`);
  console.log(`  Phases run: ${chalk.cyan(results.length)}`);
  console.log(`  Successful: ${chalk.green(successCount)}`);
  console.log(`  Fields filled: ${chalk.green(totalFilled)}`);

  console.log(chalk.cyan('\n  Phase breakdown:'));
  results.forEach((r) => {
    const status = r.success ? chalk.green('✓') : chalk.red('✗');
    const filled = r.filled || 0;
    const duration = (r.duration / 1000).toFixed(1);
    console.log(`    ${status} ${r.name.padEnd(15)} ${filled} filled in ${duration}s`);
  });

  // Show what was skipped
  console.log(chalk.gray('\n  Skipped slow tasks (run manually if needed):'));
  SKIPPED_PHASES.forEach((p) => console.log(chalk.gray(`    ${p}`)));

  // Final status check
  console.log(chalk.cyan('\n📊 Final coverage check...\n'));
  for (const phase of FAST_PHASES) {
    const count = await countMissing(phase.checkField, ACTOR, DIRECTOR);
    if (count === 0) {
      console.log(`  ${phase.name.padEnd(15)} ${chalk.green('✓ 100% Complete')}`);
    } else {
      console.log(`  ${phase.name.padEnd(15)} ${chalk.yellow(`${count} still missing`)}`);
    }
  }

  console.log(chalk.green('\n✅ Smart Fast Enrichment Complete!\n'));
}

// Help
if (hasFlag('help')) {
  console.log(chalk.yellow('Usage:'));
  console.log('  npx tsx scripts/enrich-smart-fast.ts --execute');
  console.log('  npx tsx scripts/enrich-smart-fast.ts --actor="Prabhas" --execute');
  console.log('  npx tsx scripts/enrich-smart-fast.ts --director="Rajamouli" --execute');
  console.log('\nOptions:');
  console.log('  --execute        Apply changes (default: dry run)');
  console.log('  --actor=NAME     Filter by actor');
  console.log('  --director=NAME  Filter by director');
  console.log('\nWhat it does:');
  console.log('  ✅ Fills missing genres, cast, crew, taglines');
  console.log('  ✅ Adds classifications, tags, audience fit');
  console.log('  ✅ Applies governance and trust scoring');
  console.log('  ⏭️  Skips: Images, AI synopsis, trivia (too slow)');
  console.log('\nSpeed: 2-5 minutes for all missing data');
  process.exit(0);
}

main().catch(console.error);
