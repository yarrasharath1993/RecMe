#!/usr/bin/env tsx
/**
 * Data Quality Validation CLI
 * 
 * Comprehensive validator for Telugu movies database
 * 
 * Usage:
 *   npx tsx scripts/validate-data-quality.ts --all
 *   npx tsx scripts/validate-data-quality.ts --check images
 *   npx tsx scripts/validate-data-quality.ts --all --auto-fix
 *   npx tsx scripts/validate-data-quality.ts --all --report-only
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { parseArgs } from 'util';

import {
  runDataQualityValidation,
  applyAutoFixes,
  printQualityReport,
  exportReportToJson,
  exportManualReviewCsv,
  QualityReport,
} from './lib/data-quality-validator';

// Load environment variables
dotenv.config({ path: '.env.local' });

// ============================================================
// CLI CONFIGURATION
// ============================================================

interface CLIOptions {
  all: boolean;
  check: string | undefined;
  autoFix: boolean;
  reportOnly: boolean;
  verbose: boolean;
  limit: number;
  output: string;
}

function parseCliArgs(): CLIOptions {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      all: { type: 'boolean', default: false },
      check: { type: 'string' },
      'auto-fix': { type: 'boolean', default: false },
      'report-only': { type: 'boolean', default: false },
      verbose: { type: 'boolean', short: 'v', default: false },
      limit: { type: 'string', default: '5000' },
      output: { type: 'string', short: 'o', default: 'docs' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  return {
    all: values.all as boolean,
    check: values.check as string | undefined,
    autoFix: values['auto-fix'] as boolean,
    reportOnly: values['report-only'] as boolean,
    verbose: values.verbose as boolean,
    limit: parseInt(values.limit as string, 10),
    output: values.output as string,
  };
}

function printUsage(): void {
  console.log(`
${chalk.cyan.bold('Data Quality Validation CLI')}

${chalk.yellow('Usage:')}
  npx tsx scripts/validate-data-quality.ts [options]

${chalk.yellow('Options:')}
  --all              Run all validation checks
  --check <type>     Run specific check (images, fields, duplicates, names, tmdb)
  --auto-fix         Apply auto-fixes for high-confidence issues
  --report-only      Generate report without applying fixes
  --verbose, -v      Show detailed progress
  --limit <n>        Maximum records to scan (default: 5000)
  --output, -o <dir> Output directory for reports (default: docs)
  --help, -h         Show this help message

${chalk.yellow('Examples:')}
  ${chalk.gray('# Run all checks')}
  npx tsx scripts/validate-data-quality.ts --all

  ${chalk.gray('# Check only broken image URLs')}
  npx tsx scripts/validate-data-quality.ts --check images

  ${chalk.gray('# Run all checks and auto-fix issues')}
  npx tsx scripts/validate-data-quality.ts --all --auto-fix

  ${chalk.gray('# Generate report without changes')}
  npx tsx scripts/validate-data-quality.ts --all --report-only --verbose

${chalk.yellow('Check Types:')}
  images     - Broken poster URLs and actor images
  fields     - Missing hero, director, poster
  duplicates - Duplicate movie entries
  names      - Name spelling inconsistencies
  tmdb       - Missing TMDB linkage
`);
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const options = parseCliArgs();

  // Validate options
  if (!options.all && !options.check) {
    console.log(chalk.red('\n  Error: Must specify --all or --check <type>\n'));
    printUsage();
    process.exit(1);
  }

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(chalk.red('\n  Error: Missing Supabase credentials in environment\n'));
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Determine which checks to run
  const checks = {
    brokenUrls: options.all || options.check === 'images',
    missingFields: options.all || options.check === 'fields',
    duplicates: options.all || options.check === 'duplicates',
    nameConsistency: options.all || options.check === 'names',
    tmdbLinkage: options.all || options.check === 'tmdb' || options.check === 'fields',
  };

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  TELUGU PORTAL DATA QUALITY VALIDATOR'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════'));
  
  console.log(chalk.gray(`\n  Checks: ${options.all ? 'ALL' : options.check}`));
  console.log(chalk.gray(`  Limit: ${options.limit} records`));
  console.log(chalk.gray(`  Mode: ${options.autoFix ? 'AUTO-FIX' : options.reportOnly ? 'REPORT-ONLY' : 'INTERACTIVE'}`));

  // Run validation
  let report: QualityReport;
  
  try {
    report = await runDataQualityValidation({
      supabase,
      checks,
      limit: options.limit,
      verbose: options.verbose,
    });
  } catch (error) {
    console.error(chalk.red(`\n  Error during validation: ${error}\n`));
    process.exit(1);
  }

  // Print report
  printQualityReport(report);

  // Ensure output directory exists
  const outputDir = path.resolve(process.cwd(), options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Export reports
  const timestamp = new Date().toISOString().split('T')[0];
  const jsonPath = path.join(outputDir, `data-quality-report-${timestamp}.json`);
  const csvPath = path.join(outputDir, `manual-review-${timestamp}.csv`);

  exportReportToJson(report, jsonPath);
  
  if (report.summary.manualReview > 0) {
    exportManualReviewCsv(report, csvPath);
  }

  // Apply auto-fixes if requested
  if (options.autoFix && !options.reportOnly && report.summary.autoFixable > 0) {
    console.log(chalk.cyan('\n  ─────────────────────────────────────────────────────'));
    console.log(chalk.cyan('  APPLYING AUTO-FIXES'));
    console.log(chalk.cyan('  ─────────────────────────────────────────────────────'));

    const { applied, failed } = await applyAutoFixes(
      supabase,
      report.issues,
      options.verbose
    );

    console.log(chalk.green(`\n  ✓ Applied ${applied} fixes`));
    if (failed > 0) {
      console.log(chalk.red(`  ✗ Failed ${failed} fixes`));
    }
  } else if (!options.reportOnly && report.summary.autoFixable > 0) {
    console.log(chalk.yellow(`\n  Tip: Run with --auto-fix to apply ${report.summary.autoFixable} auto-fixable issues`));
  }

  // Final summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  VALIDATION COMPLETE'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  if (report.summary.totalIssues === 0) {
    console.log(chalk.green('  ✓ No data quality issues found!\n'));
  } else {
    const pctAutoFixable = Math.round((report.summary.autoFixable / report.summary.totalIssues) * 100);
    console.log(`  Issues Found:      ${report.summary.totalIssues}`);
    console.log(`  Auto-fixable:      ${report.summary.autoFixable} (${pctAutoFixable}%)`);
    console.log(`  Manual Review:     ${report.summary.manualReview}`);
    console.log(`\n  Reports saved to: ${outputDir}\n`);
  }

  // Exit with error code if issues found
  process.exit(report.summary.manualReview > 0 ? 1 : 0);
}

// Run
main().catch(error => {
  console.error(chalk.red(`\n  Fatal error: ${error}\n`));
  process.exit(1);
});
