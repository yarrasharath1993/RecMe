#!/usr/bin/env npx tsx
/**
 * WEEKLY AUDIT JOB
 * 
 * Automated weekly data quality checks:
 * 1. Recalculate confidence scores for movies updated in last week
 * 2. Validate entity relations integrity
 * 3. Generate inference review reminder
 * 4. Create data quality report
 * 5. Identify low-confidence movies
 * 
 * Schedule: Run every Sunday at 2 AM
 * Usage: npx tsx scripts/weekly-audit.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import chalk from 'chalk';
import { calculateConfidence, extractConfidenceInputs } from '../lib/confidence/confidence-calculator';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(chalk.blue.bold('\n📋 WEEKLY AUDIT JOB\n'));
  console.log(chalk.gray(`Started: ${new Date().toISOString()}\n`));
  
  const report = {
    date: new Date().toISOString(),
    checks: [] as any[],
    summary: {} as any,
  };
  
  // 1. Confidence Score Recalculation
  console.log(chalk.cyan('1. Recalculating confidence scores...'));
  const confidenceResult = await recalculateConfidenceScores();
  report.checks.push({ name: 'Confidence Recalculation', ...confidenceResult });
  
  // 2. Entity Relations Validation
  console.log(chalk.cyan('\n2. Validating entity relations...'));
  const relationsResult = await validateEntityRelations();
  report.checks.push({ name: 'Entity Relations Validation', ...relationsResult });
  
  // 3. Inference Review Reminder
  console.log(chalk.cyan('\n3. Checking pending inferences...'));
  const inferenceResult = await checkPendingInferences();
  report.checks.push({ name: 'Pending Inferences', ...inferenceResult });
  
  // 4. Data Quality Metrics
  console.log(chalk.cyan('\n4. Calculating data quality metrics...'));
  const qualityResult = await calculateQualityMetrics();
  report.checks.push({ name: 'Data Quality Metrics', ...qualityResult });
  
  // 5. Low Confidence Movies
  console.log(chalk.cyan('\n5. Identifying low confidence movies...'));
  const lowConfResult = await identifyLowConfidenceMovies();
  report.checks.push({ name: 'Low Confidence Movies', ...lowConfResult });
  
  // Generate summary
  report.summary = {
    total_checks: report.checks.length,
    passed: report.checks.filter(c => c.status === 'success').length,
    warnings: report.checks.filter(c => c.status === 'warning').length,
    errors: report.checks.filter(c => c.status === 'error').length,
  };
  
  // Save report
  const reportPath = `docs/reports/weekly-audit-${new Date().toISOString().split('T')[0]}.md`;
  await saveReport(report, reportPath);
  
  // Print summary
  printSummary(report);
  
  console.log(chalk.green(`\n✓ Weekly audit completed`));
  console.log(chalk.gray(`Report saved: ${reportPath}\n`));
}

// ============================================================
// AUDIT FUNCTIONS
// ============================================================

async function recalculateConfidenceScores() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Get movies updated in last week
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, updated_at, *')
    .gte('updated_at', sevenDaysAgo.toISOString())
    .limit(500);
  
  if (error || !movies) {
    return { status: 'error', message: error?.message || 'Failed to fetch movies', count: 0 };
  }
  
  let updated = 0;
  let failed = 0;
  
  for (const movie of movies) {
    try {
      const inputs = extractConfidenceInputs(movie);
      const result = calculateConfidence(inputs);
      
      if (EXECUTE) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({
            confidence_score: result.confidence_score,
            confidence_breakdown: result.confidence_breakdown as any,
            last_confidence_calc: new Date().toISOString(),
          })
          .eq('id', movie.id);
        
        if (updateError) {
          failed++;
        } else {
          updated++;
        }
      } else {
        updated++;
      }
    } catch (err) {
      failed++;
    }
  }
  
  return {
    status: failed === 0 ? 'success' : 'warning',
    message: `Recalculated ${updated} movies, ${failed} failed`,
    count: updated,
    failed,
  };
}

async function validateEntityRelations() {
  // Check for broken relations (movie doesn't exist)
  const { data: brokenRelations, error } = await supabase
    .from('entity_relations')
    .select('id, movie_id, entity_name')
    .is('movie_id', null)
    .limit(100);
  
  if (error) {
    return { status: 'error', message: error.message, count: 0 };
  }
  
  const brokenCount = brokenRelations?.length || 0;
  
  // Get total relations count
  const { count: totalCount } = await supabase
    .from('entity_relations')
    .select('*', { count: 'exact', head: true });
  
  return {
    status: brokenCount === 0 ? 'success' : 'warning',
    message: `${brokenCount} broken relations out of ${totalCount} total`,
    count: totalCount,
    broken: brokenCount,
  };
}

async function checkPendingInferences() {
  const { data: pending, error } = await supabase
    .from('inference_audit_log')
    .select('id, entity_identifier, confidence, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  if (error) {
    return { status: 'error', message: error.message, count: 0 };
  }
  
  const pendingCount = pending?.length || 0;
  const highPriority = pending?.filter(p => p.confidence >= 0.65).length || 0;
  const oldPending = pending?.filter(p => {
    const created = new Date(p.created_at);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return created < thirtyDaysAgo;
  }).length || 0;
  
  return {
    status: pendingCount > 200 ? 'warning' : 'success',
    message: `${pendingCount} pending inferences (${highPriority} high priority, ${oldPending} >30 days old)`,
    count: pendingCount,
    high_priority: highPriority,
    old_pending: oldPending,
  };
}

async function calculateQualityMetrics() {
  // Get movies with various completeness levels
  const { data: movies } = await supabase
    .from('movies')
    .select('id, hero, director, heroine, music_director, producer, synopsis, poster_url, genres')
    .eq('is_published', true);
  
  if (!movies) {
    return { status: 'error', message: 'Failed to fetch movies', metrics: {} };
  }
  
  const metrics = {
    total: movies.length,
    with_hero: movies.filter(m => m.hero).length,
    with_director: movies.filter(m => m.director).length,
    with_heroine: movies.filter(m => m.heroine).length,
    with_music: movies.filter(m => m.music_director).length,
    with_producer: movies.filter(m => m.producer).length,
    with_synopsis: movies.filter(m => m.synopsis).length,
    with_poster: movies.filter(m => m.poster_url).length,
    with_genres: movies.filter(m => m.genres && m.genres.length > 0).length,
  };
  
  const completeness = {
    hero: Math.round((metrics.with_hero / metrics.total) * 100),
    director: Math.round((metrics.with_director / metrics.total) * 100),
    heroine: Math.round((metrics.with_heroine / metrics.total) * 100),
    music: Math.round((metrics.with_music / metrics.total) * 100),
    producer: Math.round((metrics.with_producer / metrics.total) * 100),
    synopsis: Math.round((metrics.with_synopsis / metrics.total) * 100),
    poster: Math.round((metrics.with_poster / metrics.total) * 100),
    genres: Math.round((metrics.with_genres / metrics.total) * 100),
  };
  
  return {
    status: 'success',
    message: `Data completeness: Hero ${completeness.hero}%, Director ${completeness.director}%, Music ${completeness.music}%`,
    metrics,
    completeness,
  };
}

async function identifyLowConfidenceMovies() {
  const { data: lowConfMovies, error } = await supabase
    .from('movies')
    .select('id, title_en, slug, confidence_score, release_year')
    .lt('confidence_score', 0.60)
    .eq('is_published', true)
    .order('confidence_score', { ascending: true })
    .limit(50);
  
  if (error) {
    return { status: 'error', message: error.message, count: 0 };
  }
  
  return {
    status: (lowConfMovies?.length || 0) > 100 ? 'warning' : 'success',
    message: `${lowConfMovies?.length || 0} movies with confidence < 0.60`,
    count: lowConfMovies?.length || 0,
    samples: lowConfMovies?.slice(0, 10).map(m => `${m.title_en} (${m.confidence_score.toFixed(2)})`),
  };
}

// ============================================================
// REPORT GENERATION
// ============================================================

async function saveReport(report: any, path: string) {
  const markdown = `# Weekly Audit Report

**Date:** ${new Date(report.date).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

## Summary

- **Total Checks:** ${report.summary.total_checks}
- **Passed:** ${report.summary.passed}
- **Warnings:** ${report.summary.warnings}
- **Errors:** ${report.summary.errors}

## Detailed Results

${report.checks.map((check: any, idx: number) => `
### ${idx + 1}. ${check.name}

- **Status:** ${check.status.toUpperCase()}
- **Message:** ${check.message}
${check.count !== undefined ? `- **Count:** ${check.count}` : ''}
${check.failed !== undefined ? `- **Failed:** ${check.failed}` : ''}
${check.broken !== undefined ? `- **Broken Relations:** ${check.broken}` : ''}
${check.high_priority !== undefined ? `- **High Priority:** ${check.high_priority}` : ''}
${check.old_pending !== undefined ? `- **Old Pending:** ${check.old_pending}` : ''}
${check.completeness ? `
**Completeness:**
- Hero: ${check.completeness.hero}%
- Director: ${check.completeness.director}%
- Heroine: ${check.completeness.heroine}%
- Music Director: ${check.completeness.music}%
- Producer: ${check.completeness.producer}%
- Synopsis: ${check.completeness.synopsis}%
- Poster: ${check.completeness.poster}%
- Genres: ${check.completeness.genres}%
` : ''}
${check.samples ? `
**Low Confidence Samples:**
${check.samples.map((s: string) => `- ${s}`).join('\n')}
` : ''}
`).join('\n')}

## Recommendations

${getRecommendations(report)}

---

*Generated by weekly-audit.ts on ${new Date(report.date).toISOString()}*
`;
  
  // Ensure directory exists
  const dir = path.split('/').slice(0, -1).join('/');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(path, markdown);
}

function getRecommendations(report: any): string {
  const recommendations: string[] = [];
  
  const pendingCheck = report.checks.find((c: any) => c.name === 'Pending Inferences');
  if (pendingCheck && pendingCheck.high_priority > 50) {
    recommendations.push(`- **Action Required:** Review ${pendingCheck.high_priority} high-priority inferences in admin panel`);
  }
  
  const qualityCheck = report.checks.find((c: any) => c.name === 'Data Quality Metrics');
  if (qualityCheck) {
    if (qualityCheck.completeness.music < 50) {
      recommendations.push(`- **Data Gap:** Music Director coverage at ${qualityCheck.completeness.music}%. Run auto-fill job.`);
    }
    if (qualityCheck.completeness.producer < 40) {
      recommendations.push(`- **Data Gap:** Producer coverage at ${qualityCheck.completeness.producer}%. Run auto-fill job.`);
    }
  }
  
  const lowConfCheck = report.checks.find((c: any) => c.name === 'Low Confidence Movies');
  if (lowConfCheck && lowConfCheck.count > 100) {
    recommendations.push(`- **Quality Issue:** ${lowConfCheck.count} movies have low confidence. Run enrichment scripts.`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('- ✅ All systems healthy. No actions required.');
  }
  
  return recommendations.join('\n');
}

function printSummary(report: any) {
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('WEEKLY AUDIT SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Checks:    ${report.summary.total_checks}`));
  console.log(chalk.green(`Passed:          ${report.summary.passed}`));
  console.log(chalk.yellow(`Warnings:        ${report.summary.warnings}`));
  console.log(chalk.red(`Errors:          ${report.summary.errors}`));
  
  console.log(chalk.gray('\nRecommendations:'));
  const recs = getRecommendations(report).split('\n');
  recs.forEach(rec => console.log(chalk.gray(rec)));
  
  console.log(chalk.blue('\n' + '='.repeat(60)));
}

// ============================================================
// RUN
// ============================================================

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red('✗ Weekly audit failed:'), error);
    process.exit(1);
  });
