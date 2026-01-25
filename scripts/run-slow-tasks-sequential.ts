#!/usr/bin/env npx tsx
/**
 * SEQUENTIAL SLOW TASKS RUNNER
 *
 * Runs slow enrichment tasks in sequence with progress tracking:
 * 1. Synopsis enrichment (50 movies, 10-20 min)
 * 2. Image enrichment (625 missing, 30-45 min)
 *
 * Total time: 40-65 minutes
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

interface TaskResult {
  name: string;
  success: boolean;
  duration: number;
  output?: string;
}

async function runTask(
  name: string,
  command: string,
  args: string[],
  description: string
): Promise<TaskResult> {
  return new Promise((resolve) => {
    console.log(chalk.cyan.bold(`\n╔══════════════════════════════════════════════════════════════════════╗`));
    console.log(chalk.cyan.bold(`║  TASK: ${name.padEnd(60)} ║`));
    console.log(chalk.cyan.bold(`╚══════════════════════════════════════════════════════════════════════╝`));
    console.log(chalk.gray(`  ${description}\n`));

    const startTime = Date.now();
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const durationMin = (duration / 1000 / 60).toFixed(1);

      if (code === 0) {
        console.log(chalk.green(`\n  ✅ ${name} completed in ${durationMin} minutes`));
      } else {
        console.log(chalk.red(`\n  ❌ ${name} failed after ${durationMin} minutes (exit code: ${code})`));
      }

      resolve({
        name,
        success: code === 0,
        duration,
      });
    });
  });
}

async function main() {
  console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           🐌 SLOW TASKS SEQUENTIAL RUNNER                            ║
║                                                                      ║
║   Task 1: Telugu Synopsis (50 movies, 10-20 min)                    ║
║   Task 2: Missing Images (625 movies, 30-45 min)                    ║
║                                                                      ║
║   Total estimated time: 40-65 minutes                               ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  const totalStart = Date.now();
  const results: TaskResult[] = [];

  // Task 1: Synopsis
  const synopsisResult = await runTask(
    'Telugu Synopsis',
    'npx',
    ['tsx', 'scripts/enrich-telugu-synopsis.ts', '--limit=50', '--execute'],
    'Enriching Telugu synopses using Telugu Wikipedia, translation, and Groq AI'
  );
  results.push(synopsisResult);

  // Task 2: Images (only if synopsis succeeded or user wants to continue)
  console.log(chalk.cyan('\n  Preparing image enrichment...'));
  
  const imageResult = await runTask(
    'Missing Images',
    'npx',
    ['tsx', 'scripts/enrich-images-fast.ts', '--only-empty', '--turbo', '--execute'],
    'Fetching missing poster images from TMDB, Wikipedia, and Archive.org'
  );
  results.push(imageResult);

  // Final summary
  const totalDuration = Date.now() - totalStart;
  const totalMin = (totalDuration / 1000 / 60).toFixed(1);

  console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           📊 FINAL SUMMARY                                           ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Total duration: ${chalk.cyan(totalMin + ' minutes')}`);
  console.log(`  Tasks completed: ${chalk.green(results.filter(r => r.success).length)}/${results.length}`);

  console.log(chalk.cyan('\n  Task breakdown:'));
  results.forEach((r) => {
    const status = r.success ? chalk.green('✅') : chalk.red('❌');
    const duration = (r.duration / 1000 / 60).toFixed(1);
    console.log(`    ${status} ${r.name.padEnd(20)} ${duration} minutes`);
  });

  const allSuccess = results.every((r) => r.success);
  
  if (allSuccess) {
    console.log(chalk.green.bold('\n  🎉 All slow tasks completed successfully!\n'));
  } else {
    console.log(chalk.yellow.bold('\n  ⚠️  Some tasks failed. Check logs above for details.\n'));
  }

  // Final status check
  console.log(chalk.cyan('  Running final status check...\n'));
  await runTask(
    'Status Check',
    'npx',
    ['tsx', 'scripts/enrich-master.ts', '--status'],
    'Checking final enrichment coverage'
  );
}

main().catch(console.error);
