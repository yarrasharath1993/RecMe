#!/usr/bin/env npx tsx
/**
 * AUTOMATED DATA QUALITY MONITORING
 * 
 * Monitors database health and data quality:
 * - Tracks completeness metrics over time
 * - Detects anomalies (data regressions, suspicious patterns)
 * - Generates daily/weekly reports
 * - Sends alerts for critical issues
 * 
 * Can be run as:
 * - Cron job (daily at 6 AM)
 * - On-demand for manual checks
 * - CI/CD pipeline check
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QualityMetrics {
  timestamp: Date;
  total_movies: number;
  completeness: {
    hero_section: number;
    synopsis: number;
    cast_crew: number;
    genres: number;
    ratings: number;
    tags: number;
    editorial: number;
    media: number;
  };
  avg_confidence: number;
  critical_issues: Issue[];
  warnings: Issue[];
  recommendations: string[];
}

interface Issue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  affected_count: number;
  action_required: string;
}

interface HistoricalTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

async function getQualityMetrics(): Promise<QualityMetrics> {
  const metrics: QualityMetrics = {
    timestamp: new Date(),
    total_movies: 0,
    completeness: {
      hero_section: 0,
      synopsis: 0,
      cast_crew: 0,
      genres: 0,
      ratings: 0,
      tags: 0,
      editorial: 0,
      media: 0
    },
    avg_confidence: 0,
    critical_issues: [],
    warnings: [],
    recommendations: []
  };

  // Get total count
  const { count: totalCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });
  
  metrics.total_movies = totalCount || 0;

  // Hero Section completeness
  const { count: heroComplete } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('title_en', 'is', null)
    .not('poster_url', 'is', null)
    .not('release_year', 'is', null);
  
  metrics.completeness.hero_section = (heroComplete || 0) / metrics.total_movies * 100;

  // Synopsis completeness
  const { count: synopsisComplete } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('synopsis', 'is', null);
  
  metrics.completeness.synopsis = (synopsisComplete || 0) / metrics.total_movies * 100;

  // Cast & Crew completeness
  const { count: castComplete } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('director', 'is', null)
    .not('hero', 'is', null);
  
  metrics.completeness.cast_crew = (castComplete || 0) / metrics.total_movies * 100;

  // Genres completeness
  const { count: genresComplete } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('genres', 'is', null);
  
  metrics.completeness.genres = (genresComplete || 0) / metrics.total_movies * 100;

  // Ratings completeness
  const { count: ratingsComplete } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .or('our_rating.gt.0,avg_rating.gt.0');
  
  metrics.completeness.ratings = (ratingsComplete || 0) / metrics.total_movies * 100;

  // Tags completeness
  const { count: tagsComplete } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .or('is_blockbuster.eq.true,is_classic.eq.true,is_underrated.eq.true,is_featured.eq.true');
  
  metrics.completeness.tags = (tagsComplete || 0) / metrics.total_movies * 100;

  // Editorial completeness
  const { count: editorialComplete } = await supabase
    .from('movie_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');
  
  metrics.completeness.editorial = (editorialComplete || 0) / metrics.total_movies * 100;

  // Media completeness
  const { count: mediaComplete } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('trailer_url', 'is', null);
  
  metrics.completeness.media = (mediaComplete || 0) / metrics.total_movies * 100;

  // Average confidence (if column exists)
  try {
    const { data: confidenceData } = await supabase
      .from('movies')
      .select('data_confidence')
      .not('data_confidence', 'is', null);
    
    if (confidenceData && confidenceData.length > 0) {
      const sum = confidenceData.reduce((acc, row) => acc + (row.data_confidence || 0), 0);
      metrics.avg_confidence = sum / confidenceData.length * 100;
    }
  } catch (error) {
    // Column might not exist yet
    metrics.avg_confidence = 0;
  }

  return metrics;
}

async function detectIssues(metrics: QualityMetrics): Promise<void> {
  // Critical: Very low completeness
  if (metrics.completeness.hero_section < 70) {
    metrics.critical_issues.push({
      severity: 'critical',
      category: 'Completeness',
      description: 'Hero Section completeness below 70%',
      affected_count: Math.round(metrics.total_movies * (1 - metrics.completeness.hero_section / 100)),
      action_required: 'Run bulk TMDB enrichment immediately'
    });
  }

  if (metrics.completeness.genres < 95) {
    metrics.warnings.push({
      severity: 'warning',
      category: 'Completeness',
      description: 'Genre completeness below 95%',
      affected_count: Math.round(metrics.total_movies * (1 - metrics.completeness.genres / 100)),
      action_required: 'Review and fix missing genres'
    });
  }

  // Warning: Low editorial coverage
  if (metrics.completeness.editorial < 10) {
    metrics.warnings.push({
      severity: 'warning',
      category: 'Editorial',
      description: 'Very low editorial review coverage',
      affected_count: Math.round(metrics.total_movies * (1 - metrics.completeness.editorial / 100)),
      action_required: 'Increase editorial review pace'
    });
  }

  // Warning: Low media coverage
  if (metrics.completeness.media < 50) {
    metrics.warnings.push({
      severity: 'warning',
      category: 'Media',
      description: 'Low trailer coverage',
      affected_count: Math.round(metrics.total_movies * (1 - metrics.completeness.media / 100)),
      action_required: 'Integrate YouTube trailer search'
    });
  }

  // Detect anomalies: recent degradation
  await detectRegressions(metrics);

  // Generate recommendations
  generateRecommendations(metrics);
}

async function detectRegressions(metrics: QualityMetrics): Promise<void> {
  // Check for movies added in last 7 days with poor quality
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentMovies } = await supabase
    .from('movies')
    .select('id, title_en, poster_url, director, genres')
    .gte('created_at', sevenDaysAgo.toISOString());

  if (recentMovies) {
    const poorQualityRecent = recentMovies.filter(m => 
      !m.poster_url || !m.director || !m.genres || m.genres.length === 0
    );

    if (poorQualityRecent.length > 5) {
      metrics.warnings.push({
        severity: 'warning',
        category: 'Quality Regression',
        description: `${poorQualityRecent.length} recently added movies have poor data quality`,
        affected_count: poorQualityRecent.length,
        action_required: 'Review ingestion pipeline and enable enrichment'
      });
    }
  }

  // Check for duplicate entries (same title + year)
  const { data: duplicates } = await supabase
    .rpc('find_duplicate_movies', {}) // Would need to create this RPC function
    .catch(() => ({ data: null }));

  if (duplicates && duplicates.length > 0) {
    metrics.critical_issues.push({
      severity: 'critical',
      category: 'Data Integrity',
      description: 'Duplicate movie entries detected',
      affected_count: duplicates.length,
      action_required: 'Run duplicate detection and merge script'
    });
  }
}

function generateRecommendations(metrics: QualityMetrics): void {
  // Based on current state, suggest actions
  if (metrics.completeness.cast_crew < 50) {
    metrics.recommendations.push(
      'Enable disabled Telugu sources (Tupaki, Gulte, 123Telugu) for cast enrichment'
    );
  }

  if (metrics.completeness.synopsis < 70) {
    metrics.recommendations.push(
      'Run AI synopsis generation for movies missing descriptions'
    );
  }

  if (metrics.completeness.tags < 30) {
    metrics.recommendations.push(
      'Implement rule-based auto-tagging for blockbusters and classics'
    );
  }

  if (metrics.avg_confidence > 0 && metrics.avg_confidence < 70) {
    metrics.recommendations.push(
      'Prioritize manual review for low-confidence movies'
    );
  }

  // Always recommend ongoing editorial work
  if (metrics.completeness.editorial < 20) {
    metrics.recommendations.push(
      'Continue systematic editorial review of top 1,000 movies'
    );
  }
}

async function saveMetricsHistory(metrics: QualityMetrics): Promise<void> {
  // Save to file for historical tracking
  const historyFile = './monitoring/quality-history.jsonl';
  const entry = JSON.stringify({
    ...metrics,
    timestamp: metrics.timestamp.toISOString()
  }) + '\n';

  try {
    const { appendFileSync } = await import('fs');
    appendFileSync(historyFile, entry);
  } catch (error) {
    // File might not exist, create it
    writeFileSync(historyFile, entry);
  }
}

async function generateReport(metrics: QualityMetrics): Promise<string> {
  const overallHealth = 
    Object.values(metrics.completeness).reduce((a, b) => a + b, 0) / 
    Object.keys(metrics.completeness).length;

  let healthStatus = 'EXCELLENT ✅';
  if (overallHealth < 85) healthStatus = 'GOOD ✅';
  if (overallHealth < 70) healthStatus = 'FAIR ⚠️';
  if (overallHealth < 50) healthStatus = 'NEEDS IMPROVEMENT ❌';

  const report = `# Data Quality Monitoring Report
**Generated:** ${metrics.timestamp.toLocaleString()}  
**Database:** ${metrics.total_movies.toLocaleString()} movies  
**Overall Health:** ${healthStatus} (${overallHealth.toFixed(1)}%)

## Completeness Metrics

| Section | Percentage | Status |
|---------|------------|--------|
| Hero Section | ${metrics.completeness.hero_section.toFixed(1)}% | ${metrics.completeness.hero_section >= 85 ? '✅' : metrics.completeness.hero_section >= 70 ? '⚠️' : '❌'} |
| Synopsis | ${metrics.completeness.synopsis.toFixed(1)}% | ${metrics.completeness.synopsis >= 80 ? '✅' : metrics.completeness.synopsis >= 60 ? '⚠️' : '❌'} |
| Cast & Crew | ${metrics.completeness.cast_crew.toFixed(1)}% | ${metrics.completeness.cast_crew >= 70 ? '✅' : metrics.completeness.cast_crew >= 50 ? '⚠️' : '❌'} |
| Genres | ${metrics.completeness.genres.toFixed(1)}% | ${metrics.completeness.genres >= 95 ? '✅' : metrics.completeness.genres >= 90 ? '⚠️' : '❌'} |
| Ratings | ${metrics.completeness.ratings.toFixed(1)}% | ${metrics.completeness.ratings >= 85 ? '✅' : metrics.completeness.ratings >= 70 ? '⚠️' : '❌'} |
| Tags | ${metrics.completeness.tags.toFixed(1)}% | ${metrics.completeness.tags >= 50 ? '✅' : metrics.completeness.tags >= 20 ? '⚠️' : '❌'} |
| Editorial | ${metrics.completeness.editorial.toFixed(1)}% | ${metrics.completeness.editorial >= 20 ? '✅' : metrics.completeness.editorial >= 5 ? '⚠️' : '❌'} |
| Media | ${metrics.completeness.media.toFixed(1)}% | ${metrics.completeness.media >= 60 ? '✅' : metrics.completeness.media >= 30 ? '⚠️' : '❌'} |

${metrics.avg_confidence > 0 ? `**Average Data Confidence:** ${metrics.avg_confidence.toFixed(1)}%\n` : ''}

## Critical Issues (${metrics.critical_issues.length})

${metrics.critical_issues.length > 0 
  ? metrics.critical_issues.map(issue => `
### 🔴 ${issue.description}
- **Category:** ${issue.category}
- **Affected:** ${issue.affected_count.toLocaleString()} movies
- **Action Required:** ${issue.action_required}
`).join('\n')
  : '*No critical issues detected* ✅\n'}

## Warnings (${metrics.warnings.length})

${metrics.warnings.length > 0
  ? metrics.warnings.map(issue => `
### ⚠️ ${issue.description}
- **Category:** ${issue.category}
- **Affected:** ${issue.affected_count.toLocaleString()} movies
- **Action Required:** ${issue.action_required}
`).join('\n')
  : '*No warnings* ✅\n'}

## Recommendations

${metrics.recommendations.length > 0
  ? metrics.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')
  : '*Database is in good health. Continue regular maintenance.*'}

---

*Next monitoring: ${new Date(metrics.timestamp.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}*
`;

  return report;
}

async function monitorDataQuality() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           AUTOMATED DATA QUALITY MONITORING                           ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  const startTime = Date.now();

  console.log(chalk.white('  Collecting quality metrics...\n'));
  const metrics = await getQualityMetrics();

  console.log(chalk.white('  Analyzing for issues and anomalies...\n'));
  await detectIssues(metrics);

  console.log(chalk.white('  Generating report...\n'));
  const report = await generateReport(metrics);

  // Save report
  const reportPath = './monitoring/quality-report-latest.md';
  writeFileSync(reportPath, report);

  // Save to history
  await saveMetricsHistory(metrics);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Display summary in console
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   MONITORING COMPLETE                                 ║
╚═══════════════════════════════════════════════════════════════════════╝

  Total Movies:             ${metrics.total_movies.toLocaleString()}
  
  Completeness:
  - Hero Section:           ${metrics.completeness.hero_section.toFixed(1)}%
  - Synopsis:               ${metrics.completeness.synopsis.toFixed(1)}%
  - Cast & Crew:            ${metrics.completeness.cast_crew.toFixed(1)}%
  - Genres:                 ${metrics.completeness.genres.toFixed(1)}%
  - Editorial:              ${metrics.completeness.editorial.toFixed(1)}%
  
  Issues Detected:
  ${metrics.critical_issues.length > 0 ? chalk.red(`  🔴 Critical: ${metrics.critical_issues.length}`) : chalk.green('  ✅ No critical issues')}
  ${metrics.warnings.length > 0 ? chalk.yellow(`  ⚠️  Warnings: ${metrics.warnings.length}`) : chalk.green('  ✅ No warnings')}
  
  Report saved: ${reportPath}
  History saved: ./monitoring/quality-history.jsonl
  
  Duration: ${duration}s
  
  ✅ Monitoring complete!

`));

  // Alert if critical issues
  if (metrics.critical_issues.length > 0) {
    console.log(chalk.red.bold(`
⚠️  ALERT: ${metrics.critical_issues.length} CRITICAL ISSUE(S) DETECTED!

Please review the report and take immediate action.
`));
    process.exit(1); // Exit with error code for CI/CD
  }
}

monitorDataQuality().catch(console.error);
