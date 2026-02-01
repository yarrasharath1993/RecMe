#!/usr/bin/env tsx
/**
 * ClawDBot Database Wrapper
 * 
 * Queries database directly, runs validation, converts to ClawDBot format,
 * and feeds to ClawDBot automatically.
 * 
 * Usage:
 *   npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Chiranjeevi" --generate-ideas --generate-drafts
 *   npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Daggubati Venkatesh" --output=reports/venkatesh-analysis.json
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

import { runActorValidation, type ValidationResult } from '../validate-actor-movies';
import { convertValidationResultToClawDBot } from '../../lib/clawdbot/converters/validation-converter';

dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);

const { values } = parseArgs({
  options: {
    'actor': { type: 'string' },
    'generate-ideas': { type: 'boolean' },
    'generate-drafts': { type: 'boolean' },
    'playbook': { type: 'boolean', default: true },
    'output': { type: 'string', default: 'stdout' },
    'help': { type: 'boolean', short: 'h' },
    'verbose': { type: 'boolean', short: 'v' }
  },
  allowPositionals: true
});

const PLAYBOOK_PATH = 'docs/clawdbot/ACTOR_FILMOGRAPHY_CORRECTION_PLAYBOOK.md';
const LESSONS_PATH = 'lib/clawdbot/learnings/actor-filmography-lessons.json';

function showHelp() {
  console.log(`
ClawDBot Database Wrapper

Queries database directly and feeds fresh data to ClawDBot.

USAGE:
  npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Actor Name" [OPTIONS]

OPTIONS:
  --actor <name>              Actor name to analyze (required)
  --generate-ideas            Generate editorial ideas from analyses
  --generate-drafts           Generate social media drafts from analyses
  --playbook                  Include actor filmography correction playbook for reuse (default: on)
  --no-playbook               Omit playbook reference
  --output <path>             Output file path (default: stdout)
  --verbose, -v               Show detailed progress
  --help, -h                  Show this help message

EXAMPLES:
  # Analyze Chiranjeevi with fresh database data
  npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Chiranjeevi" --generate-ideas --generate-drafts

  # Analyze Venkatesh and save to file
  npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Daggubati Venkatesh" --output=reports/venkatesh-analysis.json

  # Quick validation analysis only
  npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Mahesh Babu"

NOTES:
  - This script queries the database directly for fresh data
  - No need to generate validation reports manually
  - Results are always current (not from old reports)
  - With --playbook (default), summary includes playbook path for reusing Chiranjeevi correction workflow on this actor
`);
}

async function main() {
  if (values.help || !values.actor) {
    showHelp();
    if (!values.actor && !values.help) {
      console.error(chalk.red('\nError: --actor is required\n'));
      process.exit(1);
    }
    process.exit(0);
  }

  const actor = values.actor as string;
  const verbose = values.verbose || false;

  try {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           ClawDBot Database Wrapper                                  ║
║           Fresh Data → ClawDBot Analysis                              ║
╚══════════════════════════════════════════════════════════════════════╝
`));
    console.log(`  Actor: ${chalk.yellow(actor)}`);
    console.log(`  Mode: ${chalk.green('Fresh Database Query')}\n`);

    // Step 1: Query database and run validation
    if (verbose) console.log(chalk.gray('Step 1: Querying database and running validation...\n'));
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(chalk.cyan(`📥 Fetching filmography for ${actor}...`));
    
    const validationResult = await runActorValidation(actor, {
      verbose: verbose,
      rateLimit: 100,
      supabase,
    });

    console.log(chalk.green(`✓ Found ${validationResult.totalMovies} movies`));
    console.log(chalk.gray(`  Issues: ${validationResult.issues.length} (${validationResult.duplicates.length} duplicates, ${validationResult.wrongAttributions.length} wrong attributions, ${validationResult.noVerification.length} no verification)\n`));

    // Step 2: Convert to ClawDBot format
    if (verbose) console.log(chalk.gray('Step 2: Converting to ClawDBot format...\n'));
    
    const clawdbotInput = convertValidationResultToClawDBot(actor, validationResult);
    
    // Save converted input temporarily
    const tempInputPath = join(process.cwd(), 'reports', `.clawdbot-input-${Date.now()}.json`);
    const tempDir = join(process.cwd(), 'reports');
    try {
      const fs = await import('fs');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(tempInputPath, JSON.stringify(clawdbotInput, null, 2));
    } catch (err) {
      console.error(chalk.red('Failed to create temp file:'), err);
      process.exit(1);
    }

    if (verbose) {
      console.log(chalk.gray(`  Converted ${clawdbotInput.total_issues} issues to ClawDBot format`));
      console.log(chalk.gray(`  Temp input file: ${tempInputPath}\n`));
    }

    // Step 3: Invoke ClawDBot
    if (verbose) console.log(chalk.gray('Step 3: Invoking ClawDBot...\n'));
    
    const clawdbotArgs: string[] = [
      '--validation-report=' + tempInputPath
    ];

    if (values['generate-ideas']) {
      clawdbotArgs.push('--generate-ideas');
    }

    if (values['generate-drafts']) {
      clawdbotArgs.push('--generate-drafts');
    }

    if (values.output && values.output !== 'stdout') {
      clawdbotArgs.push('--output=' + values.output);
    }

    const clawdbotCmd = `npx tsx scripts/intel/clawdbot.ts ${clawdbotArgs.join(' ')}`;
    
    if (verbose) {
      console.log(chalk.gray(`  Command: ${clawdbotCmd}\n`));
    }

    const { stdout, stderr } = await execAsync(clawdbotCmd, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    if (stderr && !stderr.includes('ExperimentalWarning')) {
      console.error(chalk.yellow('ClawDBot warnings:'), stderr);
    }

    // Step 4: Output results
    if (values.output && values.output !== 'stdout') {
      console.log(chalk.green(`\n✓ Analysis complete! Results saved to: ${chalk.cyan(values.output)}`));
    } else {
      console.log(chalk.green('\n✓ Analysis complete! Results:\n'));
      console.log(stdout);
    }

    // Cleanup temp file
    try {
      const fs = await import('fs');
      if (fs.existsSync(tempInputPath)) {
        fs.unlinkSync(tempInputPath);
        if (verbose) {
          console.log(chalk.gray(`\n  Cleaned up temp file: ${tempInputPath}`));
        }
      }
    } catch (err) {
      // Ignore cleanup errors
    }

    console.log(chalk.cyan('\n═══════════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('  SUMMARY'));
    console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
    console.log(`  Actor: ${chalk.yellow(actor)}`);
    console.log(`  Movies analyzed: ${chalk.yellow(validationResult.totalMovies)}`);
    console.log(`  Issues found: ${chalk.yellow(validationResult.issues.length)}`);
    console.log(`    - Duplicates: ${chalk.yellow(validationResult.duplicates.length)}`);
    console.log(`    - Wrong attributions: ${chalk.red(validationResult.wrongAttributions.length)}`);
    console.log(`    - No verification: ${chalk.gray(validationResult.noVerification.length)}`);
    console.log(`  ClawDBot analysis: ${chalk.green('Complete')}`);
    if (values['generate-ideas']) {
      console.log(`  Editorial ideas: ${chalk.green('Generated')}`);
    }
    if (values['generate-drafts']) {
      console.log(`  Social drafts: ${chalk.green('Generated')}`);
    }
    if (values.playbook !== false) {
      console.log(chalk.cyan('  Reuse playbook for this actor:'));
      console.log(chalk.gray(`    Playbook: ${PLAYBOOK_PATH}`));
      console.log(chalk.gray(`    Lessons: ${LESSONS_PATH}`));
      console.log(chalk.gray('    Run: npx tsx scripts/intel/clawdbot-analyze-correction-playbook.ts'));
    }
    console.log('');

  } catch (error: any) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    if (verbose && error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

main();
