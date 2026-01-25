#!/usr/bin/env npx tsx
/**
 * SMART CONTINUOUS BATCH PROCESSOR
 * 
 * Tries TURBO mode first, automatically falls back to FAST mode on errors
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

interface BatchResult {
  batch: number;
  success: boolean;
  duration: number;
  mode: 'turbo' | 'fast';
  retried?: boolean;
}

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

async function runBatch(
  batchNum: number,
  mode: 'turbo' | 'fast' = 'turbo'
): Promise<{ success: boolean; duration: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const speedLabel = mode === 'turbo' ? '🚀 TURBO MODE (10x)' : '⚡ FAST MODE (5x)';
    const speedColor = mode === 'turbo' ? chalk.red.bold : chalk.yellow.bold;
    
    console.log(chalk.cyan.bold(`\n╔════════════════════════════════════════════════════════╗`));
    console.log(chalk.cyan.bold(`║          BATCH ${batchNum.toString().padStart(2)} - ${speedColor(speedLabel)}          ║`));
    console.log(chalk.cyan.bold(`╚════════════════════════════════════════════════════════╝\n`));

    const batchArgs = [
      'tsx',
      'scripts/batch-discover-all-actors.ts',
      `--batch=${batchNum}`,
      '--execute',
      mode === 'turbo' ? '--turbo' : '--fast'
    ];

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
║              SMART CONTINUOUS BATCH PROCESSOR                        ║
║              TURBO First → Auto-Fallback to FAST on Errors          ║
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
  
  console.log(`  Starting from batch: ${chalk.cyan(startBatch)}`);
  console.log(chalk.yellow(`  Strategy: Try TURBO → Fallback to FAST if errors → Retry failed batches\n`));

  const overallStartTime = Date.now();
  const results: BatchResult[] = [];
  let consecutiveFailures = 0;
  let currentMode: 'turbo' | 'fast' = 'turbo';

  // Run all batches
  for (let batch = startBatch; batch <= totalBatches; batch++) {
    const result = await runBatch(batch, currentMode);
    
    if (!result.success) {
      consecutiveFailures++;
      console.log(chalk.red(`\n❌ Batch ${batch} FAILED in ${currentMode.toUpperCase()} mode after ${(result.duration / 1000 / 60).toFixed(1)} minutes`));
      
      // Auto-switch to FAST mode after 2 consecutive failures
      if (currentMode === 'turbo' && consecutiveFailures >= 2) {
        console.log(chalk.yellow.bold(`\n⚠️  Switching to FAST mode due to repeated failures...`));
        currentMode = 'fast';
        consecutiveFailures = 0;
      }
      
      // Retry the failed batch
      console.log(chalk.yellow(`\n🔄 Retrying batch ${batch} in ${currentMode.toUpperCase()} mode...`));
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      
      const retryResult = await runBatch(batch, currentMode);
      
      results.push({
        batch,
        success: retryResult.success,
        duration: result.duration + retryResult.duration,
        mode: currentMode,
        retried: true
      });
      
      if (!retryResult.success) {
        console.log(chalk.red(`\n❌ Batch ${batch} failed again after retry. Stopping.`));
        console.log(chalk.yellow(`\nResume with:`));
        console.log(chalk.gray(`  npx tsx scripts/batch-discover-all-smart.ts --start-batch=${batch}\n`));
        break;
      }
      
      console.log(chalk.green(`\n✅ Batch ${batch} succeeded on retry in ${(retryResult.duration / 1000 / 60).toFixed(1)} minutes\n`));
      consecutiveFailures = 0;
    } else {
      // Success
      results.push({
        batch,
        success: true,
        duration: result.duration,
        mode: currentMode,
        retried: false
      });
      
      consecutiveFailures = 0;
      const minutes = (result.duration / 1000 / 60).toFixed(1);
      console.log(chalk.green(`\n✅ Batch ${batch} completed in ${minutes} min (${currentMode.toUpperCase()} mode)\n`));
    }

    // Brief pause between batches
    await new Promise(resolve => setTimeout(resolve, 3000));
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
  
  const successCount = results.filter(r => r.success).length;
  const successRate = Math.round((successCount / results.length) * 100);
  console.log(`  Success rate: ${chalk.cyan(successRate)}%`);
  
  const turboCount = results.filter(r => r.mode === 'turbo').length;
  const fastCount = results.filter(r => r.mode === 'fast').length;
  const retriedCount = results.filter(r => r.retried).length;
  
  console.log(`\n  Mode Distribution:`);
  console.log(`    🚀 TURBO: ${chalk.red(turboCount)} batches`);
  console.log(`    ⚡ FAST:  ${chalk.yellow(fastCount)} batches`);
  console.log(`    🔄 Retried: ${chalk.gray(retriedCount)} batches`);

  console.log(`\n  Batch Results:`);
  results.forEach(r => {
    const status = r.success ? chalk.green('✅') : chalk.red('❌');
    const modeIcon = r.mode === 'turbo' ? '🚀' : '⚡';
    const retryIcon = r.retried ? ' 🔄' : '';
    console.log(`    ${status} Batch ${r.batch}: ${(r.duration / 1000 / 60).toFixed(1)} min ${modeIcon}${retryIcon}`);
  });

  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    console.log(chalk.green.bold(`\n  🎉 All batches completed successfully!\n`));
    
    // Show time savings
    const avgMinutes = (totalDuration / 1000 / 60) / results.length;
    const oldEstimate = results.length * 15; // Old average: 15 min/batch
    const timeSaved = oldEstimate - (totalDuration / 1000 / 60);
    const speedup = (oldEstimate / (totalDuration / 1000 / 60)).toFixed(1);
    
    console.log(chalk.gray(`  Performance:`));
    console.log(chalk.gray(`    Average: ${avgMinutes.toFixed(1)} min/batch`));
    console.log(chalk.gray(`    Speedup: ${speedup}x faster than normal mode`));
    console.log(chalk.gray(`    Time saved: ${timeSaved.toFixed(0)} minutes\n`));
  } else {
    console.log(chalk.red.bold(`\n  ⚠️  Some batches failed. Check logs for details.\n`));
  }
}

main().catch(console.error);
