#!/usr/bin/env npx tsx
/**
 * GENERATE CHANGES SUMMARY SCRIPT
 *
 * Generates comprehensive reports of enrichment changes with
 * governance trust scores and validation results.
 *
 * Features:
 * - Query changes from database
 * - Generate summary with trust scores
 * - Export to CSV and Markdown
 * - Filter by actor, session, or time range
 * - Trust score distribution analysis
 *
 * Usage:
 *   npx tsx scripts/generate-changes-summary.ts --actor="Actor Name"
 *   npx tsx scripts/generate-changes-summary.ts --session="session-id"
 *   npx tsx scripts/generate-changes-summary.ts --last-24h
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { queryRecentChanges, type ChangeRecord } from './lib/changes-tracker';

// ============================================================
// COMMAND LINE ARGUMENTS
// ============================================================

const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const ACTOR = getArg('actor', '');
const SESSION = getArg('session', '');
const LAST_24H = hasFlag('last-24h');
const LAST_7D = hasFlag('last-7d');
const OUTPUT = getArg('output', 'docs');
const FORMAT = getArg('format', 'all'); // 'csv', 'md', 'all'

// ============================================================
// SUMMARY GENERATION
// ============================================================

interface ChangeSummary {
  total_changes: number;
  by_action: Record<string, number>;
  by_entity: Record<string, number>;
  avg_confidence: number;
  avg_trust_score: number;
  high_confidence_changes: number;
  manual_review_required: number;
  actor_breakdown: Array<{ actor_name: string; changes: number }>;
  trust_distribution: {
    verified: number;
    high: number;
    medium: number;
    low: number;
    unverified: number;
  };
}

function analyzeTrustDistribution(changes: ChangeRecord[]): ChangeSummary['trust_distribution'] {
  const distribution = {
    verified: 0,   // 90-100
    high: 0,       // 75-89
    medium: 0,     // 60-74
    low: 0,        // 40-59
    unverified: 0, // 0-39
  };

  changes.forEach((change) => {
    const trustScore = change.trust_score || 0;
    if (trustScore >= 90) distribution.verified++;
    else if (trustScore >= 75) distribution.high++;
    else if (trustScore >= 60) distribution.medium++;
    else if (trustScore >= 40) distribution.low++;
    else distribution.unverified++;
  });

  return distribution;
}

function generateSummary(changes: ChangeRecord[]): ChangeSummary {
  // Count by action
  const by_action: Record<string, number> = {};
  changes.forEach((c) => {
    by_action[c.action] = (by_action[c.action] || 0) + 1;
  });

  // Count by entity
  const by_entity: Record<string, number> = {};
  changes.forEach((c) => {
    by_entity[c.entity_type] = (by_entity[c.entity_type] || 0) + 1;
  });

  // Average confidence
  const changesWithConfidence = changes.filter((c) => c.confidence !== undefined);
  const avg_confidence = changesWithConfidence.length > 0
    ? changesWithConfidence.reduce((sum, c) => sum + (c.confidence || 0), 0) / changesWithConfidence.length
    : 0;

  // Average trust score
  const changesWithTrust = changes.filter((c) => c.trust_score !== undefined);
  const avg_trust_score = changesWithTrust.length > 0
    ? changesWithTrust.reduce((sum, c) => sum + (c.trust_score || 0), 0) / changesWithTrust.length
    : 0;

  // High confidence
  const high_confidence_changes = changes.filter((c) => (c.confidence || 0) >= 0.9).length;

  // Manual review
  const manual_review_required = changes.filter((c) => c.requires_manual_review).length;

  // Actor breakdown
  const actorChanges = new Map<string, number>();
  changes.forEach((c) => {
    if (c.actor_name) {
      actorChanges.set(c.actor_name, (actorChanges.get(c.actor_name) || 0) + 1);
    }
  });

  const actor_breakdown = Array.from(actorChanges.entries())
    .map(([actor_name, changes]) => ({ actor_name, changes }))
    .sort((a, b) => b.changes - a.changes);

  // Trust distribution
  const trust_distribution = analyzeTrustDistribution(changes);

  return {
    total_changes: changes.length,
    by_action,
    by_entity,
    avg_confidence,
    avg_trust_score,
    high_confidence_changes,
    manual_review_required,
    actor_breakdown,
    trust_distribution,
  };
}

// ============================================================
// CSV EXPORT
// ============================================================

function exportToCSV(changes: ChangeRecord[], filename: string): void {
  const headers = [
    'timestamp',
    'actor_name',
    'action',
    'entity_type',
    'entity_title',
    'source',
    'confidence',
    'trust_score',
    'requires_manual_review',
    'change_reason',
  ];

  const rows = changes.map((c) => [
    c.timestamp,
    c.actor_name || '',
    c.action,
    c.entity_type,
    c.entity_title,
    c.source || '',
    c.confidence?.toFixed(2) || '',
    c.trust_score?.toString() || '',
    c.requires_manual_review ? 'true' : 'false',
    c.change_reason || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  const filepath = path.join(OUTPUT, filename);
  fs.writeFileSync(filepath, csv);
  console.log(chalk.green(`✓ CSV exported: ${filepath}`));
}

// ============================================================
// MARKDOWN EXPORT
// ============================================================

function exportToMarkdown(changes: ChangeRecord[], summary: ChangeSummary, filename: string): void {
  const lines: string[] = [];

  // Header
  lines.push('# Enrichment Changes Summary\n');
  lines.push(`**Generated**: ${new Date().toISOString()}\n`);
  lines.push(`**Total Changes**: ${summary.total_changes}\n`);
  lines.push('---\n');

  // Summary statistics
  lines.push('## 📊 Summary Statistics\n');
  lines.push(`- **Average Confidence**: ${(summary.avg_confidence * 100).toFixed(1)}%`);
  lines.push(`- **Average Trust Score**: ${summary.avg_trust_score.toFixed(1)}/100`);
  lines.push(`- **High Confidence Changes**: ${summary.high_confidence_changes} (${((summary.high_confidence_changes / summary.total_changes) * 100).toFixed(1)}%)`);
  lines.push(`- **Manual Review Required**: ${summary.manual_review_required} (${((summary.manual_review_required / summary.total_changes) * 100).toFixed(1)}%)\n`);

  // By action
  lines.push('## 📝 Changes by Action\n');
  lines.push('| Action | Count | Percentage |');
  lines.push('|--------|-------|------------|');
  Object.entries(summary.by_action).forEach(([action, count]) => {
    const percentage = ((count / summary.total_changes) * 100).toFixed(1);
    lines.push(`| ${action} | ${count} | ${percentage}% |`);
  });
  lines.push('');

  // By entity
  lines.push('## 🎬 Changes by Entity Type\n');
  lines.push('| Entity Type | Count | Percentage |');
  lines.push('|-------------|-------|------------|');
  Object.entries(summary.by_entity).forEach(([entity, count]) => {
    const percentage = ((count / summary.total_changes) * 100).toFixed(1);
    lines.push(`| ${entity} | ${count} | ${percentage}% |`);
  });
  lines.push('');

  // Trust distribution
  lines.push('## 🔒 Trust Score Distribution\n');
  lines.push('| Trust Level | Count | Percentage |');
  lines.push('|-------------|-------|------------|');
  lines.push(`| Verified (90-100) | ${summary.trust_distribution.verified} | ${((summary.trust_distribution.verified / summary.total_changes) * 100).toFixed(1)}% |`);
  lines.push(`| High (75-89) | ${summary.trust_distribution.high} | ${((summary.trust_distribution.high / summary.total_changes) * 100).toFixed(1)}% |`);
  lines.push(`| Medium (60-74) | ${summary.trust_distribution.medium} | ${((summary.trust_distribution.medium / summary.total_changes) * 100).toFixed(1)}% |`);
  lines.push(`| Low (40-59) | ${summary.trust_distribution.low} | ${((summary.trust_distribution.low / summary.total_changes) * 100).toFixed(1)}% |`);
  lines.push(`| Unverified (0-39) | ${summary.trust_distribution.unverified} | ${((summary.trust_distribution.unverified / summary.total_changes) * 100).toFixed(1)}% |`);
  lines.push('');

  // Actor breakdown
  if (summary.actor_breakdown.length > 0) {
    lines.push('## 🎭 Changes by Actor\n');
    lines.push('| Actor | Changes |');
    lines.push('|-------|---------|');
    summary.actor_breakdown.slice(0, 20).forEach(({ actor_name, changes }) => {
      lines.push(`| ${actor_name} | ${changes} |`);
    });
    if (summary.actor_breakdown.length > 20) {
      lines.push(`| ... and ${summary.actor_breakdown.length - 20} more | |`);
    }
    lines.push('');
  }

  // Recent changes (top 50)
  lines.push('## 📋 Recent Changes (Top 50)\n');
  lines.push('| Timestamp | Actor | Action | Entity | Title | Trust Score |');
  lines.push('|-----------|-------|--------|--------|-------|-------------|');
  changes.slice(0, 50).forEach((c) => {
    const timestamp = new Date(c.timestamp).toLocaleString();
    const trustScore = c.trust_score !== undefined ? c.trust_score.toString() : 'N/A';
    lines.push(`| ${timestamp} | ${c.actor_name || 'N/A'} | ${c.action} | ${c.entity_type} | ${c.entity_title} | ${trustScore} |`);
  });
  lines.push('');

  // Manual review section
  const manualReviewChanges = changes.filter((c) => c.requires_manual_review);
  if (manualReviewChanges.length > 0) {
    lines.push('## ⚠️ Changes Requiring Manual Review\n');
    lines.push('| Actor | Action | Entity | Title | Confidence | Reason |');
    lines.push('|-------|--------|--------|-------|------------|--------|');
    manualReviewChanges.slice(0, 50).forEach((c) => {
      const confidence = c.confidence !== undefined ? `${(c.confidence * 100).toFixed(0)}%` : 'N/A';
      lines.push(`| ${c.actor_name || 'N/A'} | ${c.action} | ${c.entity_type} | ${c.entity_title} | ${confidence} | ${c.change_reason || 'N/A'} |`);
    });
    if (manualReviewChanges.length > 50) {
      lines.push(`| ... and ${manualReviewChanges.length - 50} more | | | | | |`);
    }
    lines.push('');
  }

  const markdown = lines.join('\n');
  const filepath = path.join(OUTPUT, filename);
  fs.writeFileSync(filepath, markdown);
  console.log(chalk.green(`✓ Markdown exported: ${filepath}`));
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           ENRICHMENT CHANGES SUMMARY GENERATOR                       ║
║           Trust Scores & Validation Analysis                         ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  // Build query options
  const queryOptions: any = {};

  if (ACTOR) {
    queryOptions.actorName = ACTOR;
    console.log(chalk.gray(`  Actor filter: ${ACTOR}`));
  }

  if (SESSION) {
    queryOptions.sessionId = SESSION;
    console.log(chalk.gray(`  Session filter: ${SESSION}`));
  }

  if (LAST_24H) {
    queryOptions.sinceHours = 24;
    console.log(chalk.gray('  Time range: Last 24 hours'));
  } else if (LAST_7D) {
    queryOptions.sinceHours = 168;
    console.log(chalk.gray('  Time range: Last 7 days'));
  }

  queryOptions.limit = 5000;

  console.log(chalk.cyan('\n🔍 Querying changes from database...\n'));

  // Query changes
  const changes = await queryRecentChanges(queryOptions);

  if (changes.length === 0) {
    console.log(chalk.yellow('No changes found with the specified filters.'));
    return;
  }

  console.log(chalk.green(`✓ Found ${changes.length} changes\n`));

  // Generate summary
  console.log(chalk.cyan('📊 Analyzing changes...\n'));
  const summary = generateSummary(changes);

  // Display summary
  console.log(chalk.cyan.bold('Summary:'));
  console.log(chalk.gray(`  Total Changes: ${summary.total_changes}`));
  console.log(chalk.gray(`  Average Confidence: ${(summary.avg_confidence * 100).toFixed(1)}%`));
  console.log(chalk.gray(`  Average Trust Score: ${summary.avg_trust_score.toFixed(1)}/100`));
  console.log(chalk.gray(`  High Confidence: ${summary.high_confidence_changes} (${((summary.high_confidence_changes / summary.total_changes) * 100).toFixed(1)}%)`));
  console.log(chalk.gray(`  Manual Review: ${summary.manual_review_required} (${((summary.manual_review_required / summary.total_changes) * 100).toFixed(1)}%)`));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT)) {
    fs.mkdirSync(OUTPUT, { recursive: true });
  }

  // Generate filename base
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filenameBase = ACTOR
    ? `${ACTOR.toLowerCase().replace(/\s+/g, '-')}-changes-${timestamp}`
    : SESSION
      ? `session-${SESSION}-changes`
      : `all-changes-${timestamp}`;

  // Export
  console.log(chalk.cyan('\n📤 Exporting reports...\n'));

  if (FORMAT === 'csv' || FORMAT === 'all') {
    exportToCSV(changes, `${filenameBase}.csv`);
  }

  if (FORMAT === 'md' || FORMAT === 'all') {
    exportToMarkdown(changes, summary, `${filenameBase}.md`);
  }

  console.log(chalk.green('\n✅ Done!\n'));
}

// Show help if no arguments
if (args.length === 0) {
  console.log(chalk.yellow('Usage:'));
  console.log('  --actor="Actor Name"  Filter by actor');
  console.log('  --session="session-id" Filter by session');
  console.log('  --last-24h            Last 24 hours');
  console.log('  --last-7d             Last 7 days');
  console.log('  --output=DIRECTORY    Output directory (default: docs)');
  console.log('  --format=FORMAT       Export format: csv, md, all (default: all)');
  console.log('\nExamples:');
  console.log('  npx tsx scripts/generate-changes-summary.ts --actor="Prabhas"');
  console.log('  npx tsx scripts/generate-changes-summary.ts --last-24h');
  console.log('  npx tsx scripts/generate-changes-summary.ts --session="enrich-12345"');
  process.exit(0);
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
