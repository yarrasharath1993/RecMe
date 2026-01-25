#!/usr/bin/env npx tsx
/**
 * Audit Runner Script
 * 
 * Runs comprehensive audit checks and generates reports.
 * Part of Phase 7: Ops, Audit & Future Safety.
 * 
 * Usage:
 *   npx tsx scripts/run-audit.ts --report          Generate full data quality report
 *   npx tsx scripts/run-audit.ts --freshness       Check data freshness
 *   npx tsx scripts/run-audit.ts --revalidation    List items needing revalidation
 *   npx tsx scripts/run-audit.ts --summary         Quick summary report
 *   npx tsx scripts/run-audit.ts --all             Run all checks
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import {
  generateDataQualityReport,
  generateQuickReport,
} from '../lib/audit/quality-reporter';
import {
  checkMoviesFreshness,
  checkCelebritiesFreshness,
  getRevalidationTargets,
  updateFreshnessScores,
  getDisputedBoxOffice,
} from '../lib/audit/freshness-checker';
import { getAuditSummary } from '../lib/audit/logger';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + '═'.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('═'.repeat(60));
}

function subheader(title: string) {
  console.log('\n' + '-'.repeat(40));
  log(`  ${title}`, 'blue');
  console.log('-'.repeat(40));
}

async function runFullReport() {
  header('📊 DATA QUALITY REPORT');
  
  log('\nGenerating comprehensive report...', 'yellow');
  const report = await generateDataQualityReport();
  
  // Overall Score
  subheader('Overall Score');
  const scoreColor = report.overall_score >= 80 ? 'green' : report.overall_score >= 50 ? 'yellow' : 'red';
  log(`  Score: ${report.overall_score}/100`, scoreColor);
  
  // Movie Statistics
  subheader('Movie Statistics');
  console.log(`  Total Movies: ${report.movies.total}`);
  log(`  High Confidence: ${report.movies.high_confidence} (${Math.round(report.movies.high_confidence / report.movies.total * 100)}%)`, 'green');
  log(`  Medium Confidence: ${report.movies.medium_confidence} (${Math.round(report.movies.medium_confidence / report.movies.total * 100)}%)`, 'yellow');
  log(`  Low Confidence: ${report.movies.low_confidence} (${Math.round(report.movies.low_confidence / report.movies.total * 100)}%)`, 'red');
  console.log(`  Stale Data: ${report.movies.stale}`);
  console.log(`  Disputed: ${report.movies.disputed}`);
  console.log(`  Missing Critical Fields: ${report.movies.missing_critical_fields}`);
  
  // Celebrity Statistics
  subheader('Celebrity Statistics');
  console.log(`  Total Celebrities: ${report.celebrities.total}`);
  log(`  High Confidence: ${report.celebrities.high_confidence}`, 'green');
  log(`  Medium Confidence: ${report.celebrities.medium_confidence}`, 'yellow');
  log(`  Low Confidence: ${report.celebrities.low_confidence}`, 'red');
  console.log(`  Stale Profiles: ${report.celebrities.stale}`);
  console.log(`  Incomplete Profiles: ${report.celebrities.incomplete_profiles}`);
  
  // Top Issues
  if (report.top_issues.length > 0) {
    subheader('Top Issues');
    for (const issue of report.top_issues) {
      const issueColor = issue.severity === 'critical' ? 'red' : issue.severity === 'error' ? 'red' : issue.severity === 'warning' ? 'yellow' : 'white';
      log(`  [${issue.severity.toUpperCase()}] ${issue.issue_type}: ${issue.count} entities`, issueColor);
      console.log(`    Examples: ${issue.examples.slice(0, 3).join(', ')}`);
    }
  }
  
  // Recommendations
  subheader('Recommendations');
  for (const rec of report.recommendations) {
    console.log(`  ${rec}`);
  }
  
  console.log(`\n  Report generated at: ${report.generated_at}`);
}

async function runFreshnessCheck() {
  header('🕐 FRESHNESS CHECK');
  
  // Check movies
  subheader('Stale Movies');
  const staleMovies = await checkMoviesFreshness(20, true);
  
  if (staleMovies.length === 0) {
    log('  ✅ No stale movies found!', 'green');
  } else {
    for (const movie of staleMovies) {
      const color = movie.is_stale ? 'red' : movie.freshness_score < 70 ? 'yellow' : 'green';
      console.log(`  ${movie.entity_name}`);
      log(`    Freshness: ${movie.freshness_score}/100, Days: ${movie.days_since_verification}, Action: ${movie.recommended_action}`, color);
    }
  }
  
  // Check celebrities
  subheader('Stale Celebrity Profiles');
  const staleCelebs = await checkCelebritiesFreshness(20, true);
  
  if (staleCelebs.length === 0) {
    log('  ✅ No stale celebrity profiles found!', 'green');
  } else {
    for (const celeb of staleCelebs) {
      const color = celeb.is_stale ? 'red' : celeb.freshness_score < 70 ? 'yellow' : 'green';
      console.log(`  ${celeb.entity_name}`);
      log(`    Freshness: ${celeb.freshness_score}/100, Days: ${celeb.days_since_verification}, Action: ${celeb.recommended_action}`, color);
    }
  }
  
  // Disputed box office
  subheader('Disputed Box Office Data');
  const disputed = await getDisputedBoxOffice();
  
  if (disputed.length === 0) {
    log('  ✅ No disputed box office data found!', 'green');
  } else {
    for (const item of disputed) {
      console.log(`  ${item.movie_title}`);
      console.log(`    ${JSON.stringify(item.dispute_details)}`);
    }
  }
}

async function runRevalidationCheck() {
  header('🔄 REVALIDATION TARGETS');
  
  const targets = await getRevalidationTargets(30);
  
  if (targets.length === 0) {
    log('  ✅ No items need revalidation!', 'green');
    return;
  }
  
  const highPriority = targets.filter(t => t.priority === 'high');
  const mediumPriority = targets.filter(t => t.priority === 'medium');
  const lowPriority = targets.filter(t => t.priority === 'low');
  
  if (highPriority.length > 0) {
    subheader('🔴 High Priority');
    for (const target of highPriority.slice(0, 10)) {
      log(`  ${target.entity_name}`, 'red');
      console.log(`    Reason: ${target.reason}`);
      console.log(`    Fields: ${target.fields_to_check.join(', ')}`);
      console.log(`    Effort: ${target.estimated_effort}`);
    }
  }
  
  if (mediumPriority.length > 0) {
    subheader('🟡 Medium Priority');
    for (const target of mediumPriority.slice(0, 10)) {
      log(`  ${target.entity_name}`, 'yellow');
      console.log(`    Reason: ${target.reason}`);
    }
  }
  
  if (lowPriority.length > 0) {
    subheader('🟢 Low Priority');
    console.log(`  ${lowPriority.length} items (showing first 5)`);
    for (const target of lowPriority.slice(0, 5)) {
      console.log(`  - ${target.entity_name}: ${target.reason}`);
    }
  }
  
  console.log(`\nTotal: ${targets.length} items need revalidation`);
  console.log(`  High: ${highPriority.length}, Medium: ${mediumPriority.length}, Low: ${lowPriority.length}`);
}

async function runQuickSummary() {
  header('📋 QUICK SUMMARY');
  
  const summary = await generateQuickReport();
  
  const scoreColor = summary.overall_score >= 80 ? 'green' : summary.overall_score >= 50 ? 'yellow' : 'red';
  
  log(`\n  Overall Score: ${summary.overall_score}/100`, scoreColor);
  console.log(`  Movies: ${summary.movies_total} (${summary.movies_high_confidence_pct}% high confidence)`);
  console.log(`  Celebrities: ${summary.celebrities_total}`);
  
  if (summary.top_issue) {
    log(`  Top Issue: ${summary.top_issue}`, 'yellow');
  } else {
    log('  No critical issues!', 'green');
  }
  
  // Get audit events from last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const auditSummary = await getAuditSummary(weekAgo, new Date());
  
  if (auditSummary) {
    subheader('Audit Events (Last 7 Days)');
    console.log(`  Pending Reviews: ${auditSummary.pending_reviews}`);
    console.log(`  Critical Issues: ${auditSummary.critical_issues}`);
    
    if (Object.keys(auditSummary.events_by_type).length > 0) {
      console.log('  Events by Type:');
      for (const [type, count] of Object.entries(auditSummary.events_by_type)) {
        console.log(`    - ${type}: ${count}`);
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  log('\n🔍 Telugu Portal Audit System', 'bold');
  log('═'.repeat(60));
  
  if (args.includes('--all') || args.length === 0) {
    await runQuickSummary();
    await runFullReport();
    await runFreshnessCheck();
    await runRevalidationCheck();
  } else {
    if (args.includes('--summary')) {
      await runQuickSummary();
    }
    if (args.includes('--report')) {
      await runFullReport();
    }
    if (args.includes('--freshness')) {
      await runFreshnessCheck();
    }
    if (args.includes('--revalidation')) {
      await runRevalidationCheck();
    }
    if (args.includes('--update-freshness')) {
      header('🔄 UPDATING FRESHNESS SCORES');
      log('\nUpdating freshness scores for all movies...', 'yellow');
      const updated = await updateFreshnessScores(100, true);
      log(`\n✅ Updated ${updated} movie freshness scores`, 'green');
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  log('  Audit complete!', 'green');
  console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
