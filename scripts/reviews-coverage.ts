#!/usr/bin/env npx tsx
/**
 * MOVIE REVIEWS COVERAGE CLI
 * 
 * NON-NEGOTIABLE EXECUTION RULE:
 * This command MUST achieve the target coverage or EXIT 1.
 * Partial completion is NOT allowed.
 * Coverage is a hard contract, not a best-effort metric.
 * 
 * Usage:
 *   pnpm run reviews:coverage --target=0.95
 *   pnpm run reviews:coverage --target=0.95 --dry-run
 *   pnpm run reviews:coverage --status
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env if exists
import chalk from 'chalk';
import {
  calculateCoverage,
  enforceCoverage,
  logCoverageHistory,
  getCoverageStats,
  type CoverageResult,
} from '../lib/reviews/coverage-engine';
import {
  generateFallbackReviews,
  generateTemplateReview,
} from '../lib/reviews/template-reviews';

// ============================================================
// CLI ARGUMENT PARSING
// ============================================================

interface CLIArgs {
  target: number;
  dryRun: boolean;
  status: boolean;
  verbose: boolean;
  help: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {
    target: 0.95,
    dryRun: false,
    status: false,
    verbose: false,
    help: false,
  };
  
  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      parsed.target = parseFloat(arg.split('=')[1]);
    } else if (arg === '--dry-run' || arg === '-d') {
      parsed.dryRun = true;
    } else if (arg === '--status' || arg === '-s') {
      parsed.status = true;
    } else if (arg === '--verbose' || arg === '-v') {
      parsed.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
  }
  
  // Validate target
  if (parsed.target < 0 || parsed.target > 1) {
    console.error(chalk.red('Error: --target must be between 0 and 1 (e.g., 0.95 for 95%)'));
    process.exit(1);
  }
  
  return parsed;
}

function showHelp(): void {
  console.log(`
${chalk.bold('Movie Reviews Coverage CLI')}

${chalk.yellow('NON-NEGOTIABLE:')} This command enforces minimum coverage.
If coverage < target after all fallback generation, it FAILS with exit code 1.

${chalk.bold('Usage:')}
  pnpm run reviews:coverage [options]

${chalk.bold('Options:')}
  --target=<n>    Target coverage (0.0-1.0, default: 0.95)
  --dry-run, -d   Show what would be generated without saving
  --status, -s    Show current coverage status only
  --verbose, -v   Show detailed output
  --help, -h      Show this help message

${chalk.bold('Examples:')}
  pnpm run reviews:coverage --target=0.95
  pnpm run reviews:coverage --target=0.90 --dry-run
  pnpm run reviews:coverage --status
`);
}

// ============================================================
// DISPLAY FUNCTIONS
// ============================================================

function printHeader(): void {
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║              MOVIE REVIEWS COVERAGE REPORT                    ║
╚══════════════════════════════════════════════════════════════╝
`));
}

function printCoverageAnalysis(coverage: CoverageResult): void {
  const coveragePct = (coverage.currentCoverage * 100).toFixed(1);
  const targetPct = (coverage.targetCoverage * 100).toFixed(1);
  const gapPct = (coverage.gap * 100).toFixed(1);
  
  console.log(chalk.bold('📊 COVERAGE ANALYSIS'));
  console.log(`   Total Movies: ${coverage.totalMovies.toLocaleString()}`);
  console.log(`   With Reviews: ${coverage.moviesWithReviews.toLocaleString()} (${coveragePct}%)`);
  console.log(`   Missing: ${coverage.moviesWithoutReviews.length}`);
  console.log(`   Target: ${targetPct}%`);
  console.log(`   Gap: ${gapPct}%`);
  console.log();
  
  // Breakdown
  console.log(chalk.bold('📋 SOURCE BREAKDOWN'));
  console.log(`   Human Reviews: ${coverage.breakdown.human}`);
  console.log(`   AI Reviews: ${coverage.breakdown.ai}`);
  console.log(`   Template Reviews: ${coverage.breakdown.template}`);
  console.log();
}

function printProgressBar(current: number, total: number, width: number = 40): string {
  const percentage = current / total;
  const filled = Math.round(width * percentage);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${current}/${total}`;
}

function printFinalResult(coverage: CoverageResult): void {
  const coveragePct = (coverage.currentCoverage * 100).toFixed(1);
  const targetPct = (coverage.targetCoverage * 100).toFixed(1);
  
  console.log(chalk.bold('📈 FINAL COVERAGE'));
  console.log(`   With Reviews: ${coverage.moviesWithReviews.toLocaleString()} (${coveragePct}%)`);
  console.log(`   Target: ${targetPct}%`);
  
  if (coverage.meetsTarget) {
    console.log(`   Status: ${chalk.green('✅ PASSED')}`);
  } else {
    console.log(`   Status: ${chalk.red('❌ FAILED')}`);
  }
  console.log();
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function showStatus(): Promise<void> {
  printHeader();
  
  console.log(chalk.dim('Fetching coverage stats...\n'));
  
  const stats = await getCoverageStats();
  printCoverageAnalysis(stats.current);
  
  // Show recent history if available
  if (stats.history.length > 0) {
    console.log(chalk.bold('📅 RECENT HISTORY'));
    for (const h of stats.history.slice(-5)) {
      const coveragePct = (h.coverage * 100).toFixed(1);
      console.log(`   ${h.date}: ${coveragePct}% (${h.withReviews}/${h.totalMovies})`);
    }
    console.log();
  }
  
  console.log(chalk.dim(`Last updated: ${stats.lastUpdated}`));
}

async function runCoverageEnforcement(args: CLIArgs): Promise<void> {
  printHeader();
  
  const modeLabel = args.dryRun ? chalk.yellow('[DRY RUN] ') : '';
  console.log(`${modeLabel}${chalk.dim('Calculating coverage...')}\n`);
  
  // Step 1: Calculate initial coverage
  const initialCoverage = await calculateCoverage(args.target);
  printCoverageAnalysis(initialCoverage);
  
  // Step 2: Check if we already meet target
  if (initialCoverage.meetsTarget) {
    console.log(chalk.green('✅ Target already met! No fallback generation needed.\n'));
    await logCoverageHistory(initialCoverage);
    printFinalResult(initialCoverage);
    process.exit(0);
  }
  
  // Step 3: Generate fallback reviews
  const missingCount = initialCoverage.moviesWithoutReviews.length;
  console.log(chalk.yellow(`🔄 GENERATING FALLBACK REVIEWS (${missingCount} movies)`));
  console.log(chalk.dim('   This may take a while...\n'));
  
  let progressLine = '';
  const result = await generateFallbackReviews(
    initialCoverage.moviesWithoutReviews,
    {
      dryRun: args.dryRun,
      onProgress: (current, total, movie) => {
        // Clear previous line and print progress
        if (progressLine) {
          process.stdout.write('\r' + ' '.repeat(progressLine.length) + '\r');
        }
        progressLine = `   ${printProgressBar(current, total)} ${movie.substring(0, 30)}...`;
        process.stdout.write(progressLine);
      },
    }
  );
  
  // Clear progress line
  if (progressLine) {
    process.stdout.write('\r' + ' '.repeat(progressLine.length) + '\r');
  }
  
  console.log(`   ${chalk.green('✓')} Generated: ${result.generated}`);
  if (result.failed > 0) {
    console.log(`   ${chalk.red('✗')} Failed: ${result.failed}`);
  }
  if (result.skipped > 0) {
    console.log(`   ${chalk.yellow('⊘')} Skipped: ${result.skipped}`);
  }
  console.log();
  
  // Show errors if verbose
  if (args.verbose && result.errors.length > 0) {
    console.log(chalk.red('⚠️ ERRORS:'));
    for (const err of result.errors.slice(0, 10)) {
      console.log(`   ${err}`);
    }
    if (result.errors.length > 10) {
      console.log(`   ... and ${result.errors.length - 10} more`);
    }
    console.log();
  }
  
  // Step 4: Re-calculate coverage
  console.log(chalk.dim('Re-calculating coverage...\n'));
  const finalCoverage = await calculateCoverage(args.target);
  
  // Step 5: Log to history
  if (!args.dryRun) {
    await logCoverageHistory(finalCoverage);
  }
  
  // Step 6: Print final result
  printFinalResult(finalCoverage);
  
  // Step 7: HARD ENFORCEMENT - Exit with error if target not met
  const enforcement = await enforceCoverage(args.target, finalCoverage);
  
  if (!enforcement.passed) {
    console.log(chalk.red.bold('═══════════════════════════════════════════════════════════════'));
    console.log(chalk.red.bold('                    ❌ COVERAGE ENFORCEMENT FAILED              '));
    console.log(chalk.red.bold('═══════════════════════════════════════════════════════════════'));
    console.log();
    console.log(chalk.red(enforcement.message));
    console.log();
    console.log(chalk.red('This is a NON-NEGOTIABLE failure. Coverage target MUST be met.'));
    console.log(chalk.red('Partial completion is NOT allowed.'));
    console.log();
    process.exit(1);
  }
  
  console.log(chalk.green.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('                    ✅ COVERAGE ENFORCEMENT PASSED              '));
  console.log(chalk.green.bold('═══════════════════════════════════════════════════════════════'));
  console.log();
  process.exit(0);
}

// ============================================================
// ENTRY POINT
// ============================================================

async function main(): Promise<void> {
  try {
    const args = parseArgs();
    
    if (args.help) {
      showHelp();
      process.exit(0);
    }
    
    if (args.status) {
      await showStatus();
      process.exit(0);
    }
    
    await runCoverageEnforcement(args);
  } catch (error) {
    console.error(chalk.red('\n❌ FATAL ERROR:'), error);
    console.error(chalk.red('\nCoverage enforcement FAILED due to unexpected error.'));
    process.exit(1);
  }
}

main();

