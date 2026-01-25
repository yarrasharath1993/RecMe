#!/usr/bin/env npx tsx
/**
 * FULL ENRICHMENT PIPELINE
 * 
 * Orchestrates all critical gap enrichment in priority order:
 * 
 * Phase 1: Cast & Crew (4,787 producers + 4,354 music directors)
 *   - Uses multi-source validation (21 sources)
 *   - High confidence enrichment
 *   - Duration: ~15-20 minutes for 1,000 movies
 * 
 * Phase 2: Trailers (7,397 movies)
 *   - TMDB video API
 *   - Fast enrichment (< 5 minutes for 1,000 movies)
 * 
 * Phase 3: Synopsis Telugu (2,600 movies)
 *   - AI translation (Claude)
 *   - Medium confidence
 *   - Duration: ~10-15 minutes for 500 movies
 * 
 * Phase 4: Auto-Tags (6,805 movies)
 *   - Heuristic-based tagging
 *   - Instant (no API calls)
 * 
 * Total Duration: ~40-50 minutes for 1,000 movies
 * Expected Impact: +10-15% overall data completeness
 * 
 * Usage:
 *   npx tsx scripts/run-full-enrichment-pipeline.ts --limit=1000 --execute
 *   npx tsx scripts/run-full-enrichment-pipeline.ts --phase=1 --limit=500 --execute
 *   npx tsx scripts/run-full-enrichment-pipeline.ts --resume
 *   npx tsx scripts/run-full-enrichment-pipeline.ts --report
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, existsSync, readFileSync } from 'fs';

const execAsync = promisify(exec);

config({ path: resolve(process.cwd(), '.env.local') });

interface PhaseResult {
  phase: string;
  duration_ms: number;
  enriched: number;
  failed: number;
  status: 'completed' | 'failed' | 'skipped';
  error?: string;
}

interface PipelineState {
  started_at: string;
  completed_at?: string;
  phases: PhaseResult[];
  total_enriched: number;
  total_duration_ms: number;
}

const CHECKPOINT_FILE = './docs/manual-review/enrichment-checkpoint.json';

/**
 * Load pipeline state from checkpoint
 */
function loadCheckpoint(): PipelineState | null {
  if (existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save pipeline state to checkpoint
 */
function saveCheckpoint(state: PipelineState): void {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(state, null, 2));
}

/**
 * Run a single enrichment phase
 */
async function runPhase(
  phase: string,
  focus: string,
  limit: number,
  execute: boolean
): Promise<PhaseResult> {
  console.log(chalk.magenta.bold(`\n╔${'═'.repeat(70)}╗`));
  console.log(chalk.magenta.bold(`║  PHASE: ${phase.toUpperCase().padEnd(62)}║`));
  console.log(chalk.magenta.bold(`╚${'═'.repeat(70)}╝\n`));

  const startTime = Date.now();
  const result: PhaseResult = {
    phase,
    duration_ms: 0,
    enriched: 0,
    failed: 0,
    status: 'completed'
  };

  try {
    const cmd = execute
      ? `npx tsx scripts/enrich-critical-gaps-turbo.ts --focus=${focus} --limit=${limit} --execute`
      : `npx tsx scripts/enrich-critical-gaps-turbo.ts --focus=${focus} --limit=${limit}`;

    console.log(chalk.gray(`  Running: ${cmd}\n`));

    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });

    // Parse output to extract stats
    const enrichedMatch = stdout.match(/Total Enrichments:\s+(\d+)/);
    const failedMatch = stdout.match(/Failed:\s+(\d+)/);

    if (enrichedMatch) result.enriched = parseInt(enrichedMatch[1], 10);
    if (failedMatch) result.failed = parseInt(failedMatch[1], 10);

    result.duration_ms = Date.now() - startTime;
    result.status = 'completed';

    console.log(chalk.green(`  ✓ Phase completed: ${result.enriched} enriched, ${result.failed} failed`));
    console.log(chalk.gray(`  Duration: ${(result.duration_ms / 1000 / 60).toFixed(1)} minutes\n`));

  } catch (error: any) {
    result.duration_ms = Date.now() - startTime;
    result.status = 'failed';
    result.error = error.message;
    console.error(chalk.red(`  ✗ Phase failed: ${error.message}\n`));
  }

  return result;
}

/**
 * Generate final pipeline report
 */
function generatePipelineReport(state: PipelineState): string {
  const totalDuration = (state.total_duration_ms / 1000 / 60).toFixed(1);
  const successRate = state.phases.filter(p => p.status === 'completed').length / state.phases.length * 100;

  let report = `
╔═══════════════════════════════════════════════════════════════════════╗
║           FULL ENRICHMENT PIPELINE REPORT                             ║
╚═══════════════════════════════════════════════════════════════════════╝

Started:               ${state.started_at}
Completed:             ${state.completed_at || 'In Progress'}
Total Duration:        ${totalDuration} minutes
Total Enrichments:     ${state.total_enriched}
Success Rate:          ${successRate.toFixed(0)}%

PHASE BREAKDOWN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  for (const phase of state.phases) {
    const status = phase.status === 'completed' ? '✓' : phase.status === 'failed' ? '✗' : '-';
    const duration = (phase.duration_ms / 1000 / 60).toFixed(1);
    report += `${status} Phase: ${phase.phase.padEnd(20)} | Enriched: ${phase.enriched.toString().padStart(5)} | Duration: ${duration}m\n`;
    if (phase.error) {
      report += `  Error: ${phase.error}\n`;
    }
  }

  report += `\n`;
  report += `IMPACT ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Expected data completeness improvement: +10-15%

Before Pipeline:
  - Cast & Crew:  34.3% → Expected: 50%+
  - Synopsis:     64.7% → Expected: 75%+
  - Trailers:      0.0% → Expected: 60%+
  - Tags:          8.0% → Expected: 40%+

RECOMMENDATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Re-run audit to measure actual impact:
   npx tsx scripts/audit-movie-data-completeness.ts

2. Review manual review queue for conflicts:
   Check docs/manual-review/ for flagged items

3. Continue with medium-term improvements:
   - Enable disabled Telugu sources (Phase 2)
   - Implement AI-powered editorial reviews (Phase 3)
   - Build manual curation tools (Phase 4)

4. Schedule regular enrichment runs:
   - Weekly: New movies enrichment
   - Monthly: Full database re-enrichment
   - Quarterly: Comprehensive audit

`;

  return report;
}

/**
 * Main pipeline orchestrator
 */
async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string, defaultValue: string = '') => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };

  const LIMIT = parseInt(getArg('limit', '1000'), 10);
  const PHASE = getArg('phase', ''); // 1, 2, 3, 4, or empty for all
  const EXECUTE = args.includes('--execute');
  const RESUME = args.includes('--resume');
  const REPORT = args.includes('--report');

  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            FULL ENRICHMENT PIPELINE ORCHESTRATOR                     ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  // Show existing report if requested
  if (REPORT) {
    const state = loadCheckpoint();
    if (state) {
      const report = generatePipelineReport(state);
      console.log(report);
    } else {
      console.log(chalk.yellow(`  No previous pipeline run found.\n`));
    }
    return;
  }

  // Initialize or resume state
  let state: PipelineState;
  if (RESUME && existsSync(CHECKPOINT_FILE)) {
    state = loadCheckpoint()!;
    console.log(chalk.cyan(`  Resuming from checkpoint: ${state.started_at}\n`));
  } else {
    state = {
      started_at: new Date().toISOString(),
      phases: [],
      total_enriched: 0,
      total_duration_ms: 0
    };
    saveCheckpoint(state);
  }

  console.log(chalk.gray(`  Limit per phase: ${LIMIT} movies`));
  console.log(chalk.gray(`  Mode: ${EXECUTE ? 'EXECUTE' : 'DRY RUN'}\n`));

  if (!EXECUTE) {
    console.log(chalk.yellow(`  ⚠️  DRY RUN MODE - No changes will be made`));
    console.log(chalk.yellow(`  Add --execute to apply changes\n`));
  }

  // Define phases
  const phases = [
    { name: 'Cast & Crew', focus: 'cast-crew', order: 1 },
    { name: 'Trailers', focus: 'trailers', order: 2 },
    { name: 'Synopsis Telugu', focus: 'synopsis', order: 3 },
    { name: 'Auto-Tags', focus: 'tags', order: 4 },
  ];

  // Filter phases if specific phase requested
  const phasesToRun = PHASE
    ? phases.filter(p => p.order === parseInt(PHASE, 10))
    : phases;

  // Run phases
  for (const phase of phasesToRun) {
    // Skip if already completed in resumed run
    if (RESUME && state.phases.find(p => p.phase === phase.name && p.status === 'completed')) {
      console.log(chalk.gray(`  Skipping completed phase: ${phase.name}\n`));
      continue;
    }

    const result = await runPhase(phase.name, phase.focus, LIMIT, EXECUTE);
    
    // Remove old result if exists (resume case)
    state.phases = state.phases.filter(p => p.phase !== phase.name);
    state.phases.push(result);

    state.total_enriched += result.enriched;
    state.total_duration_ms += result.duration_ms;

    saveCheckpoint(state);

    // Stop if phase failed (unless resume mode)
    if (result.status === 'failed' && !RESUME) {
      console.log(chalk.red(`\n  ❌ Pipeline halted due to phase failure.`));
      console.log(chalk.yellow(`  Use --resume to continue from this point.\n`));
      return;
    }
  }

  // Mark as completed
  state.completed_at = new Date().toISOString();
  saveCheckpoint(state);

  // Generate and display final report
  const report = generatePipelineReport(state);
  console.log(report);

  // Save report to file
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = `./docs/manual-review/pipeline-report-${timestamp}.md`;
  writeFileSync(reportPath, report);
  console.log(chalk.green(`  ✓ Report saved: ${reportPath}\n`));

  console.log(chalk.green.bold('  ✅ PIPELINE COMPLETE!\n'));
}

main().catch(console.error);
