#!/usr/bin/env npx tsx
/**
 * CONTINUOUS BATCH PROCESSOR
 * 
 * Runs all actor batches continuously until completion
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

async function getActorCount(): Promise<number> {
  const { data } = await supabase
    .from('movies')
    .select('hero')
    .eq('language', 'Telugu')
    .not('hero', 'is', null)
    .not('hero', 'eq', 'Unknown');

  if (!data) return 0;

  const uniqueActors = new Set<string>();
  data.forEach((movie: any) => {
    if (movie.hero) {
      const actors = movie.hero.split(',').map((a: string) => a.trim());
      actors.forEach((actor: string) => uniqueActors.add(actor));
    }
  });

  return uniqueActors.size;
}

async function runBatch(batchNum: number, useTurbo: boolean = true): Promise<{ success: boolean; duration: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const speedLabel = useTurbo ? '🚀 TURBO MODE' : '⚡ FAST MODE';
    console.log(chalk.cyan.bold(`\n╔════════════════════════════════════════════════════════╗`));
    console.log(chalk.cyan.bold(`║          STARTING BATCH ${batchNum} ${speedLabel}          ║`));
    console.log(chalk.cyan.bold(`╚════════════════════════════════════════════════════════╝\n`));

    const batchArgs = [
      'tsx',
      'scripts/batch-discover-all-actors.ts',
      `--batch=${batchNum}`,
      '--execute'
    ];
    
    // Add speed flag
    if (useTurbo) {
      batchArgs.push('--turbo');
    } else {
      batchArgs.push('--fast');
    }

    const child = spawn('npx', batchArgs, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        success: code === 0,
        duration,
      });
    });

    child.on('error', () => {
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        duration,
      });
    });
  });
}

async function main() {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║              CONTINUOUS BATCH PROCESSOR                              ║
║              Processing All Remaining Actors                         ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  // Get total actors
  const totalActors = await getActorCount();
  const batchSize = 5;
  const totalBatches = Math.ceil(totalActors / batchSize);
  
  console.log(`  Total actors: ${chalk.cyan(totalActors)}`);
  console.log(`  Batch size: ${chalk.cyan(batchSize)}`);
  console.log(`  Total batches: ${chalk.cyan(totalBatches)}`);
  
  // Parse start batch from args
  const args = process.argv.slice(2);
  const startBatchArg = args.find(a => a.startsWith('--start-batch='));
  const startBatch = startBatchArg ? parseInt(startBatchArg.split('=')[1]) : 1;
  const useTurbo = args.includes('--turbo');
  const useFast = args.includes('--fast');
  
  const speedMode = useTurbo ? '🚀 TURBO (10x faster)' : useFast ? '⚡ FAST (5x faster)' : '📋 NORMAL';
  const speedColor = useTurbo ? chalk.red : useFast ? chalk.yellow : chalk.gray;
  
  console.log(`  Starting from batch: ${chalk.cyan(startBatch)}`);
  console.log(`  Speed mode: ${speedColor(speedMode)}\n`);

  const overallStartTime = Date.now();
  const results: Array<{ batch: number; success: boolean; duration: number }> = [];

  // Run all batches
  for (let batch = startBatch; batch <= totalBatches; batch++) {
    const result = await runBatch(batch, useTurbo || useFast);
    results.push({ batch, success: result.success, duration: result.duration });

    if (!result.success) {
      console.log(chalk.red(`\n❌ Batch ${batch} failed after ${(result.duration / 1000 / 60).toFixed(1)} minutes`));
      console.log(chalk.yellow(`\nStopping at batch ${batch}. Fix issues and resume with:`));
      console.log(chalk.gray(`  npx tsx scripts/batch-discover-all-continuous.ts --start-batch=${batch + 1}\n`));
      break;
    }

    console.log(chalk.green(`\n✅ Batch ${batch} completed in ${(result.duration / 1000 / 60).toFixed(1)} minutes\n`));

    // Brief pause between batches
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const totalDuration = Date.now() - overallStartTime;

  // Final summary
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║                    FINAL SUMMARY                                     ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Total duration: ${chalk.cyan((totalDuration / 1000 / 60).toFixed(1))} minutes`);
  console.log(`  Batches processed: ${chalk.cyan(results.length)}`);
  console.log(`  Success rate: ${chalk.cyan(Math.round((results.filter(r => r.success).length / results.length) * 100))}%\n`);

  console.log(`  Batch Results:`);
  results.forEach(r => {
    const status = r.success ? chalk.green('✅') : chalk.red('❌');
    console.log(`    ${status} Batch ${r.batch}: ${(r.duration / 1000 / 60).toFixed(1)} min`);
  });

  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    console.log(chalk.green.bold(`\n  🎉 All batches completed successfully!\n`));
  } else {
    console.log(chalk.red.bold(`\n  ⚠️  Some batches failed. Check logs for details.\n`));
  }
}

main().catch(console.error);
