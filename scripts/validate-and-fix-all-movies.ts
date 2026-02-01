#!/usr/bin/env npx tsx
/**
 * VALIDATE AND FIX ALL MOVIES — Orchestrator
 *
 * Chains existing scripts for:
 * 1. Audit: actor filmography (missing + wrong attribution), data health, duplicates
 * 2. Fix (optional): batch discovery, batch validation, merge duplicates (manual handoff)
 * 3. Re-validate: batch-validate-all-actors
 *
 * Uses actor-as-entity flows: audit-all-actors-filmography, comprehensive-data-health-audit,
 * audit-database-integrity (duplicates), batch-discover-all-actors, batch-validate-all-actors.
 *
 * Usage:
 *   npx tsx scripts/validate-and-fix-all-movies.ts --phase=audit
 *   npx tsx scripts/validate-and-fix-all-movies.ts --phase=audit --top=50
 *   npx tsx scripts/validate-and-fix-all-movies.ts --phase=all --report-only
 *   npx tsx scripts/validate-and-fix-all-movies.ts --phase=all --execute
 *   npx tsx scripts/validate-and-fix-all-movies.ts --phase=fix --execute
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const args = process.argv.slice(2);
const getArg = (name: string, defaultValue = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const PHASE = getArg('phase', 'audit'); // audit | fix | all
const REPORT_ONLY = hasFlag('report-only');
const EXECUTE = hasFlag('execute');
const TOP = getArg('top', '');
const LIMIT = getArg('limit', '');
const OUTPUT_DIR = getArg('output-dir', path.join(process.cwd(), 'reports'));
const SKIP_DUPLICATES = hasFlag('skip-duplicates');
const SKIP_HEALTH = hasFlag('skip-health');
const BATCH_SIZE = getArg('batch-size', '10');

function runScript(
  scriptPath: string,
  scriptArgs: string[],
  label: string
): Promise<{ success: boolean; durationMs: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    console.log(chalk.cyan(`\n▶ ${label}`));
    console.log(chalk.gray(`   npx tsx ${scriptPath} ${scriptArgs.join(' ')}`));
    const child = spawn('npx', ['tsx', scriptPath, ...scriptArgs], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
    });
    child.on('close', (code) => {
      const durationMs = Date.now() - start;
      const success = code === 0;
      if (success) {
        console.log(chalk.green(`   ✅ ${label} completed in ${(durationMs / 1000).toFixed(1)}s`));
      } else {
        console.log(chalk.red(`   ❌ ${label} failed (exit ${code}) after ${(durationMs / 1000).toFixed(1)}s`));
      }
      resolve({ success, durationMs });
    });
    child.on('error', (err) => {
      const durationMs = Date.now() - start;
      console.log(chalk.red(`   ❌ ${label} error: ${err.message}`));
      resolve({ success: false, durationMs });
    });
  });
}

interface RunSummary {
  phase: string;
  reportOnly: boolean;
  execute: boolean;
  steps: { name: string; success: boolean; durationMs: number }[];
  outputs: string[];
  timestamp: string;
}

async function main(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const summary: RunSummary = {
    phase: PHASE,
    reportOnly: REPORT_ONLY,
    execute: EXECUTE,
    steps: [],
    outputs: [],
    timestamp: new Date().toISOString(),
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║         VALIDATE AND FIX ALL MOVIES — Orchestrator                    ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝'));
  console.log(chalk.gray(`\n  Phase: ${PHASE} | Report-only: ${REPORT_ONLY} | Execute: ${EXECUTE}`));
  if (TOP) console.log(chalk.gray(`  Top actors: ${TOP}`));
  if (LIMIT) console.log(chalk.gray(`  Limit (audit): ${LIMIT}`));
  console.log(chalk.gray(`  Output dir: ${OUTPUT_DIR}\n`));

  const runAudit = PHASE === 'audit' || PHASE === 'all';
  const runFix = (PHASE === 'fix' || PHASE === 'all') && (EXECUTE || REPORT_ONLY);

  // ——— Phase 1: Audit ———
  if (runAudit) {
    // 1a. All-actors filmography audit (missing movies + wrong attribution)
    const auditArgs: string[] = [];
    if (TOP) auditArgs.push(`--top=${TOP}`);
    if (LIMIT) auditArgs.push(`--limit=${LIMIT}`);
    const r1 = await runScript(
      'scripts/audit-all-actors-filmography.ts',
      auditArgs,
      'Audit all actors filmography (missing + wrong attribution)'
    );
    summary.steps.push({ name: 'audit-all-actors-filmography', success: r1.success, durationMs: r1.durationMs });
    summary.outputs.push(
      'ALL-ACTORS-MISSING-MOVIES-*.csv, ALL-ACTORS-ATTRIBUTION-ISSUES-*.csv, ALL-ACTORS-AUDIT-SUMMARY-*.csv (cwd)'
    );

    // 1b. Data health audit
    if (!SKIP_HEALTH) {
      const r2 = await runScript(
        'scripts/comprehensive-data-health-audit.ts',
        [],
        'Comprehensive data health audit'
      );
      summary.steps.push({ name: 'comprehensive-data-health-audit', success: r2.success, durationMs: r2.durationMs });
      summary.outputs.push('DATA-HEALTH-AUDIT-REPORT-*.md (cwd)');
    }

    // 1c. Duplicate audit (exact-duplicates.csv for merge-duplicate-movies)
    if (!SKIP_DUPLICATES) {
      const dupArgs = [`--output-dir=${OUTPUT_DIR}`];
      const r3 = await runScript(
        'scripts/audit-database-integrity.ts',
        dupArgs,
        'Database integrity audit (duplicates, suspicious, attribution)'
      );
      summary.steps.push({ name: 'audit-database-integrity', success: r3.success, durationMs: r3.durationMs });
      const dupCsv = path.join(OUTPUT_DIR, 'exact-duplicates.csv');
      if (fs.existsSync(dupCsv)) summary.outputs.push(dupCsv);
    }
  }

  // ——— Phase 2: Fix (optional) ———
  if (runFix && EXECUTE) {
    // 2a. Batch discover missing films per actor (--batch=N is batch number, not size)
    const discoverArgs = ['--execute', '--batch=1'];
    if (TOP) discoverArgs.push(`--batch=${Math.min(parseInt(TOP, 10) || 1, 50)}`);
    const r4 = await runScript(
      'scripts/batch-discover-all-actors.ts',
      discoverArgs,
      'Batch discover missing films (all actors)'
    );
    summary.steps.push({ name: 'batch-discover-all-actors', success: r4.success, durationMs: r4.durationMs });

    // 2b. Batch validate and fix per actor
    const validateArgs = ['--mode=full', `--batch-size=${BATCH_SIZE}`];
    const r5 = await runScript(
      'scripts/batch-validate-all-actors.ts',
      validateArgs,
      'Batch validate and fix actor filmographies'
    );
    summary.steps.push({ name: 'batch-validate-all-actors', success: r5.success, durationMs: r5.durationMs });
  } else if (runFix && REPORT_ONLY) {
    // Report-only fix phase: run batch-validate in report mode
    const validateArgs = ['--mode=report', `--batch-size=${BATCH_SIZE}`];
    if (TOP) validateArgs.push(`--limit=${TOP}`);
    const r5 = await runScript(
      'scripts/batch-validate-all-actors.ts',
      validateArgs,
      'Batch validate (report only)'
    );
    summary.steps.push({ name: 'batch-validate-all-actors-report', success: r5.success, durationMs: r5.durationMs });
  }

  // ——— Save summary ———
  const summaryPath = path.join(OUTPUT_DIR, `validate-and-fix-all-movies-${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(chalk.cyan(`\n📋 Summary: ${summaryPath}`));

  // ——— Next steps ———
  console.log(chalk.blue.bold('\n══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  NEXT STEPS (manual)'));
  console.log(chalk.blue.bold('══════════════════════════════════════════════════════════════════════\n'));
  console.log(chalk.white('  1. Review ALL-ACTORS-ATTRIBUTION-ISSUES-*.csv and feed into apply-manual-review-decisions.ts'));
  console.log(chalk.white('  2. To merge duplicates: npx tsx scripts/merge-duplicate-movies.ts --input=<exact-duplicates.csv> --execute'));
  console.log(chalk.white('  3. To fix data quality: npx tsx scripts/validate-data-quality.ts --all --auto-fix (or use identify-movies-for-manual-review.ts)'));
  console.log(chalk.blue.bold('\n══════════════════════════════════════════════════════════════════════\n'));

  const failed = summary.steps.some((s) => !s.success);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
