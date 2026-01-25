#!/usr/bin/env npx tsx
/**
 * DATABASE INTEGRITY AUDIT
 * 
 * Comprehensive movie database validation:
 * - Exact and fuzzy duplicates
 * - Suspicious entries (award ceremonies, missing fields, etc.)
 * - Cast attribution errors
 * - Timeline issues
 * 
 * Usage:
 *   npx tsx scripts/audit-database-integrity.ts [options]
 * 
 * Options:
 *   --validators=duplicates,suspicious,attribution,timeline
 *   --batch-size=500
 *   --output-dir=docs/audit-reports
 *   --fuzzy-matching (enable fuzzy duplicate detection - slower)
 *   --sample=50 (test with sample data first)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import * as path from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

// Import validators
import {
  detectAllDuplicates,
  type MovieSummary,
  type ExactDuplicate,
  type FuzzyDuplicate,
} from './lib/validators/duplicate-detector';

import {
  detectSuspiciousEntries,
  type MovieForValidation,
  type MissingFieldIssue,
  type UnusualPatternIssue,
  type InconsistencyIssue,
  type OutlierIssue,
} from './lib/validators/suspicious-entry-detector';

import {
  validateAttributions,
  type MovieForAttribution,
  type CastMismatch,
  type LanguageGenreMismatch,
} from './lib/validators/attribution-validator';

import {
  validateTimelines,
  type MovieForTimeline,
  type TimelineIssue,
} from './lib/validators/timeline-validator';

import {
  writeCSV,
  writeBatchCSV,
  formatConfidence,
  formatArrayField,
} from './lib/validators/csv-writer';

// ============================================================
// CONFIGURATION
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuditConfig {
  validators: Set<string>;
  batchSize: number;
  outputDir: string;
  enableFuzzyMatching: boolean;
  sampleSize: number | null;
}

// Parse CLI arguments
function parseArgs(): AuditConfig {
  const args = process.argv.slice(2);
  
  const getArg = (name: string, defaultValue: string = ''): string => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };

  const hasFlag = (name: string): boolean => args.includes(`--${name}`);

  const validators = getArg('validators', 'duplicates,suspicious,attribution,timeline')
    .split(',')
    .map(v => v.trim());

  return {
    validators: new Set(validators),
    batchSize: parseInt(getArg('batch-size', '500')),
    outputDir: getArg('output-dir', 'docs/audit-reports'),
    enableFuzzyMatching: hasFlag('fuzzy-matching'),
    sampleSize: hasFlag('sample') ? parseInt(getArg('sample', '50')) : null,
  };
}

// ============================================================
// DATA FETCHING
// ============================================================

async function fetchMovies(config: AuditConfig): Promise<any[]> {
  console.log(chalk.blue.bold('\n📥 Fetching movies from database...'));

  let query = supabase
    .from('movies')
    .select(`
      id,
      title_en,
      title_te,
      slug,
      release_year,
      language,
      director,
      hero,
      heroine,
      supporting_cast,
      genres,
      runtime_minutes,
      poster_url,
      synopsis_te,
      tmdb_id,
      imdb_id,
      mood_tags,
      avg_rating,
      total_reviews
    `)
    .order('release_year', { ascending: false });

  if (config.sampleSize) {
    console.log(chalk.yellow(`  (Using sample of ${config.sampleSize} movies for testing)`));
    query = query.limit(config.sampleSize);
  }

  const { data, error } = await query;

  if (error) {
    console.error(chalk.red('  ❌ Error fetching movies:'), error.message);
    throw error;
  }

  console.log(chalk.green(`  ✅ Fetched ${data?.length || 0} movies`));
  return data || [];
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

async function runDuplicateDetection(
  movies: any[],
  config: AuditConfig
): Promise<{ exact: ExactDuplicate[]; fuzzy: FuzzyDuplicate[] }> {
  console.log(chalk.magenta.bold('\n🔍 PHASE 1: DUPLICATE DETECTION'));
  console.log('='.repeat(70));

  const result = detectAllDuplicates(movies, {
    includeFuzzyMatching: config.enableFuzzyMatching,
    fuzzyOptions: {
      minSimilarity: 0.85,
      maxYearDiff: 1,
    },
  });

  console.log(chalk.green(`\n  ✅ Found ${result.exactDuplicates.length} exact duplicates`));
  console.log(chalk.green(`  ✅ Found ${result.fuzzyDuplicates.length} fuzzy duplicates`));

  return {
    exact: result.exactDuplicates,
    fuzzy: result.fuzzyDuplicates,
  };
}

// ============================================================
// SUSPICIOUS ENTRY DETECTION
// ============================================================

async function runSuspiciousEntryDetection(
  movies: any[],
  config: AuditConfig
): Promise<{
  missing: MissingFieldIssue[];
  patterns: UnusualPatternIssue[];
  inconsistencies: InconsistencyIssue[];
  outliers: OutlierIssue[];
}> {
  console.log(chalk.magenta.bold('\n🚨 PHASE 2: SUSPICIOUS ENTRY DETECTION'));
  console.log('='.repeat(70));

  const result = detectSuspiciousEntries(movies, {
    checkMissingFields: true,
    checkUnusualPatterns: true,
    checkInconsistencies: true,
    checkOutliers: true,
    outlierMetrics: ['runtime_minutes'],
  });

  console.log(chalk.green(`\n  ✅ Found ${result.missingFieldIssues.length} missing field issues`));
  console.log(chalk.green(`  ✅ Found ${result.unusualPatterns.length} unusual patterns`));
  console.log(chalk.green(`  ✅ Found ${result.inconsistencies.length} data inconsistencies`));
  console.log(chalk.green(`  ✅ Found ${result.outliers.length} statistical outliers`));

  return {
    missing: result.missingFieldIssues,
    patterns: result.unusualPatterns,
    inconsistencies: result.inconsistencies,
    outliers: result.outliers,
  };
}

// ============================================================
// ATTRIBUTION VALIDATION
// ============================================================

async function runAttributionValidation(
  movies: any[],
  config: AuditConfig
): Promise<{ castMismatches: CastMismatch[]; languageMismatches: LanguageGenreMismatch[] }> {
  console.log(chalk.magenta.bold('\n👥 PHASE 3: ATTRIBUTION VALIDATION'));
  console.log('='.repeat(70));

  const result = await validateAttributions(supabase, movies, {
    checkGender: true,
    checkImpossiblePairings: true,
    checkLanguage: false, // Requires external API
    checkGenres: false,   // Requires external API
  });

  console.log(chalk.green(`\n  ✅ Found ${result.castMismatches.length} cast attribution issues`));
  console.log(chalk.green(`  ✅ Found ${result.languageMismatches.length} language mismatches`));

  return {
    castMismatches: result.castMismatches,
    languageMismatches: result.languageMismatches,
  };
}

// ============================================================
// TIMELINE VALIDATION
// ============================================================

async function runTimelineValidation(
  movies: any[],
  config: AuditConfig
): Promise<{ timelineIssues: TimelineIssue[] }> {
  console.log(chalk.magenta.bold('\n⏰ PHASE 4: TIMELINE VALIDATION'));
  console.log('='.repeat(70));

  const result = await validateTimelines(supabase, movies, {
    checkDebut: true,
    checkDeath: true,
    checkAge: true,
  });

  console.log(chalk.green(`\n  ✅ Found ${result.timelineIssues.length} timeline issues`));
  console.log(chalk.gray(`  (Checked ${result.actorsChecked} actors)`));

  return {
    timelineIssues: result.timelineIssues,
  };
}

// ============================================================
// CSV REPORT GENERATION
// ============================================================

function generateExactDuplicatesCSV(duplicates: ExactDuplicate[], outputDir: string): void {
  const rows = duplicates.map(dup => ({
    ID1: dup.movie1.id,
    Title1: dup.movie1.title_en,
    Year1: dup.movie1.release_year || '',
    Slug1: dup.movie1.slug || '',
    ID2: dup.movie2.id,
    Title2: dup.movie2.title_en,
    Year2: dup.movie2.release_year || '',
    Slug2: dup.movie2.slug || '',
    MatchType: dup.matchType,
    Confidence: formatConfidence(dup.confidence),
    Action: dup.action,
  }));

  writeCSV(
    {
      outputDir,
      filename: 'exact-duplicates.csv',
      headers: ['ID1', 'Title1', 'Year1', 'Slug1', 'ID2', 'Title2', 'Year2', 'Slug2', 'MatchType', 'Confidence', 'Action'],
    },
    rows
  );
}

function generateFuzzyDuplicatesCSV(duplicates: FuzzyDuplicate[], outputDir: string): void {
  const rows = duplicates.map(dup => ({
    ID1: dup.movie1.id,
    Title1: dup.movie1.title_en,
    Year1: dup.movie1.release_year || '',
    ID2: dup.movie2.id,
    Title2: dup.movie2.title_en,
    Year2: dup.movie2.release_year || '',
    TitleSimilarity: formatConfidence(dup.titleSimilarity),
    YearDiff: dup.yearDiff,
    Confidence: formatConfidence(dup.confidence),
    LikelyReason: dup.likelyReason,
    ManualReview: dup.requiresManualReview ? 'yes' : 'no',
  }));

  writeCSV(
    {
      outputDir,
      filename: 'fuzzy-duplicates.csv',
      headers: ['ID1', 'Title1', 'Year1', 'ID2', 'Title2', 'Year2', 'TitleSimilarity', 'YearDiff', 'Confidence', 'LikelyReason', 'ManualReview'],
    },
    rows
  );
}

function generateSuspiciousEntriesCSV(
  missing: MissingFieldIssue[],
  patterns: UnusualPatternIssue[],
  inconsistencies: InconsistencyIssue[],
  outputDir: string
): void {
  const rows: any[] = [];

  // Add missing field issues
  for (const issue of missing) {
    rows.push({
      MovieID: issue.movieId,
      Title: issue.title,
      Year: issue.year || '',
      IssueType: 'missing_fields',
      Severity: issue.severity,
      Details: issue.impact,
      MissingFields: formatArrayField(issue.missingFields),
      UnusualPattern: '',
    });
  }

  // Add unusual patterns
  for (const issue of patterns) {
    rows.push({
      MovieID: issue.movieId,
      Title: issue.title,
      Year: issue.year || '',
      IssueType: issue.patternType,
      Severity: 'critical',
      Details: `Pattern detected: ${issue.pattern}`,
      MissingFields: '',
      UnusualPattern: issue.pattern,
    });
  }

  // Add inconsistencies
  for (const issue of inconsistencies) {
    rows.push({
      MovieID: issue.movieId,
      Title: issue.title,
      Year: issue.year || '',
      IssueType: 'inconsistency',
      Severity: issue.severity,
      Details: `${issue.issue} (${issue.field})`,
      MissingFields: '',
      UnusualPattern: '',
    });
  }

  writeCSV(
    {
      outputDir,
      filename: 'suspicious-entries.csv',
      headers: ['MovieID', 'Title', 'Year', 'IssueType', 'Severity', 'Details', 'MissingFields', 'UnusualPattern'],
    },
    rows
  );
}

function generateCastAttributionCSV(mismatches: CastMismatch[], outputDir: string): void {
  const rows = mismatches.map(m => ({
    MovieID: m.movieId,
    Title: m.title,
    Year: m.year || '',
    Actor: m.actor,
    Role: m.role,
    Issue: m.issue,
    Reason: m.reason,
    Confidence: formatConfidence(m.confidence),
    RecommendedFix: m.recommendedFix,
  }));

  writeCSV(
    {
      outputDir,
      filename: 'wrong-cast-attribution.csv',
      headers: ['MovieID', 'Title', 'Year', 'Actor', 'Role', 'Issue', 'Reason', 'Confidence', 'RecommendedFix'],
    },
    rows
  );
}

function generateTimelineIssuesCSV(issues: TimelineIssue[], outputDir: string): void {
  const rows = issues.map(i => ({
    MovieID: i.movieId,
    Title: i.title,
    MovieYear: i.movieYear,
    Actor: i.actor,
    Role: i.role,
    Issue: i.issue,
    ActorDebutYear: i.actorDebutYear || '',
    ActorDeathYear: i.actorDeathYear || '',
    Reason: i.reason,
    Confidence: formatConfidence(i.confidence),
    Severity: i.severity,
  }));

  writeCSV(
    {
      outputDir,
      filename: 'timeline-issues.csv',
      headers: ['MovieID', 'Title', 'MovieYear', 'Actor', 'Role', 'Issue', 'ActorDebutYear', 'ActorDeathYear', 'Reason', 'Confidence', 'Severity'],
    },
    rows
  );
}

function generateStatisticalOutliersCSV(outliers: OutlierIssue[], outputDir: string): void {
  const rows = outliers.map(o => ({
    MovieID: o.movieId,
    Title: o.title,
    Year: o.year || '',
    Metric: o.metric,
    Value: o.value,
    Mean: o.mean.toFixed(2),
    StdDev: o.stdDev.toFixed(2),
    ZScore: o.zScore.toFixed(2),
    Category: o.category,
  }));

  writeCSV(
    {
      outputDir,
      filename: 'statistical-outliers.csv',
      headers: ['MovieID', 'Title', 'Year', 'Metric', 'Value', 'Mean', 'StdDev', 'ZScore', 'Category'],
    },
    rows
  );
}

// ============================================================
// SUMMARY REPORT
// ============================================================

function generateSummaryReport(
  results: any,
  config: AuditConfig,
  outputDir: string
): void {
  const fs = require('fs');
  const summaryPath = path.join(outputDir, 'DATABASE-AUDIT-SUMMARY.md');

  const content = `# Database Integrity Audit Summary

**Generated**: ${new Date().toISOString()}  
**Total Movies Checked**: ${results.totalMovies}

---

## 🔍 DUPLICATE DETECTION

### Exact Duplicates: **${results.duplicates.exact.length}**
- Same title + year: High priority for merge
- Same slug: Immediate merge recommended
- Same TMDB/IMDb ID: Verify and merge

${results.duplicates.exact.length > 0 ? `
**Top 10 Exact Duplicates:**
${results.duplicates.exact.slice(0, 10).map((d: ExactDuplicate, i: number) => 
  `${i + 1}. "${d.movie1.title_en}" (${d.movie1.release_year}) vs "${d.movie2.title_en}" (${d.movie2.release_year}) - ${d.matchType}`
).join('\n')}
` : ''}

### Fuzzy Duplicates: **${results.duplicates.fuzzy.length}**
- Likely transliteration variants, typos, or subtitle additions
- Manual review recommended

---

## 🚨 SUSPICIOUS ENTRIES

### Missing Fields: **${results.suspicious.missing.length}**
- Critical: ${results.suspicious.missing.filter((m: MissingFieldIssue) => m.severity === 'critical').length}
- High: ${results.suspicious.missing.filter((m: MissingFieldIssue) => m.severity === 'high').length}
- Medium: ${results.suspicious.missing.filter((m: MissingFieldIssue) => m.severity === 'medium').length}

### Unusual Patterns: **${results.suspicious.patterns.length}**
- Award ceremonies: ${results.suspicious.patterns.filter((p: UnusualPatternIssue) => p.patternType === 'award_ceremony').length}
- TV shows: ${results.suspicious.patterns.filter((p: UnusualPatternIssue) => p.patternType === 'tv_show').length}
- Documentaries: ${results.suspicious.patterns.filter((p: UnusualPatternIssue) => p.patternType === 'documentary').length}
- Other non-movies: ${results.suspicious.patterns.filter((p: UnusualPatternIssue) => 
  !['award_ceremony', 'tv_show', 'documentary'].includes(p.patternType)
).length}

### Data Inconsistencies: **${results.suspicious.inconsistencies.length}**

### Statistical Outliers: **${results.suspicious.outliers.length}**

---

## 👥 ATTRIBUTION VALIDATION

### Cast Mismatches: **${results.attribution.castMismatches.length}**
- Wrong gender: ${results.attribution.castMismatches.filter((c: CastMismatch) => c.issue === 'wrong_gender').length}
- Impossible pairings: ${results.attribution.castMismatches.filter((c: CastMismatch) => c.issue === 'impossible_pairing').length}
- Deceased actors: ${results.attribution.castMismatches.filter((c: CastMismatch) => c.issue === 'deceased_actor').length}

---

## ⏰ TIMELINE VALIDATION

### Timeline Issues: **${results.timeline.timelineIssues.length}**
- Before debut: ${results.timeline.timelineIssues.filter((t: TimelineIssue) => t.issue === 'before_debut').length}
- After death: ${results.timeline.timelineIssues.filter((t: TimelineIssue) => t.issue === 'after_death').length}
- Impossible age: ${results.timeline.timelineIssues.filter((t: TimelineIssue) => t.issue === 'impossible_age').length}

---

## 📊 SUMMARY STATISTICS

| Category | Issues Found | Severity Breakdown |
|----------|--------------|-------------------|
| Exact Duplicates | ${results.duplicates.exact.length} | Critical: ${results.duplicates.exact.length} |
| Fuzzy Duplicates | ${results.duplicates.fuzzy.length} | Review: ${results.duplicates.fuzzy.length} |
| Suspicious Entries | ${results.suspicious.missing.length + results.suspicious.patterns.length + results.suspicious.inconsistencies.length} | Critical: ${results.suspicious.patterns.length}, High: ${results.suspicious.missing.filter((m: MissingFieldIssue) => m.severity === 'critical' || m.severity === 'high').length} |
| Cast Attribution | ${results.attribution.castMismatches.length} | High: ${results.attribution.castMismatches.length} |
| Timeline Issues | ${results.timeline.timelineIssues.length} | High: ${results.timeline.timelineIssues.filter((t: TimelineIssue) => t.severity === 'high').length} |

**Total Issues Found**: ${
  results.duplicates.exact.length +
  results.duplicates.fuzzy.length +
  results.suspicious.missing.length +
  results.suspicious.patterns.length +
  results.suspicious.inconsistencies.length +
  results.suspicious.outliers.length +
  results.attribution.castMismatches.length +
  results.timeline.timelineIssues.length
}

---

## 📁 GENERATED FILES

- \`exact-duplicates.csv\` - ${results.duplicates.exact.length} exact duplicates
- \`fuzzy-duplicates.csv\` - ${results.duplicates.fuzzy.length} fuzzy duplicates
- \`suspicious-entries.csv\` - ${results.suspicious.missing.length + results.suspicious.patterns.length + results.suspicious.inconsistencies.length} suspicious entries
- \`wrong-cast-attribution.csv\` - ${results.attribution.castMismatches.length} cast issues
- \`timeline-issues.csv\` - ${results.timeline.timelineIssues.length} timeline issues
- \`statistical-outliers.csv\` - ${results.suspicious.outliers.length} outliers

---

## 🎯 RECOMMENDED ACTIONS

### High Priority (Immediate Action)
1. **Delete Award Ceremonies**: ${results.suspicious.patterns.filter((p: UnusualPatternIssue) => p.patternType === 'award_ceremony').length} entries
2. **Merge Exact Duplicates**: ${results.duplicates.exact.length} pairs
3. **Fix Gender Mismatches**: ${results.attribution.castMismatches.filter((c: CastMismatch) => c.issue === 'wrong_gender').length} issues
4. **Investigate Timeline Issues**: ${results.timeline.timelineIssues.filter((t: TimelineIssue) => t.severity === 'high').length} high severity issues

### Medium Priority (Review & Fix)
1. **Review Fuzzy Duplicates**: ${results.duplicates.fuzzy.length} potential duplicates
2. **Enrich Missing Data**: ${results.suspicious.missing.length} movies with missing fields
3. **Fix Data Inconsistencies**: ${results.suspicious.inconsistencies.length} issues

### Low Priority (Optional)
1. **Review Statistical Outliers**: ${results.suspicious.outliers.length} outliers
2. **Age-related Timeline Issues**: ${results.timeline.timelineIssues.filter((t: TimelineIssue) => t.severity === 'low').length} low severity

---

**Audit Complete!** ✅
`;

  fs.writeFileSync(summaryPath, content, 'utf-8');
  console.log(chalk.cyan(`\n  📋 Summary report: ${summaryPath}`));
}

// ============================================================
// MAIN AUDIT FUNCTION
// ============================================================

async function runAudit(): Promise<void> {
  const config = parseArgs();

  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            DATABASE INTEGRITY AUDIT                                  ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝'));

  console.log(chalk.gray(`\n  Validators: ${Array.from(config.validators).join(', ')}`));
  console.log(chalk.gray(`  Output directory: ${config.outputDir}`));
  console.log(chalk.gray(`  Fuzzy matching: ${config.enableFuzzyMatching ? 'enabled' : 'disabled'}`));
  if (config.sampleSize) {
    console.log(chalk.yellow(`  Sample mode: ${config.sampleSize} movies`));
  }

  const startTime = Date.now();

  // Fetch movies
  const movies = await fetchMovies(config);
  
  if (movies.length === 0) {
    console.log(chalk.red('\n  ❌ No movies found. Exiting.'));
    return;
  }

  const results: any = {
    totalMovies: movies.length,
    duplicates: { exact: [], fuzzy: [] },
    suspicious: { missing: [], patterns: [], inconsistencies: [], outliers: [] },
    attribution: { castMismatches: [], languageMismatches: [] },
    timeline: { timelineIssues: [] },
  };

  // Run validators
  if (config.validators.has('duplicates')) {
    const duplicates = await runDuplicateDetection(movies, config);
    results.duplicates = duplicates;
  }

  if (config.validators.has('suspicious')) {
    const suspicious = await runSuspiciousEntryDetection(movies, config);
    results.suspicious = suspicious;
  }

  if (config.validators.has('attribution')) {
    const attribution = await runAttributionValidation(movies, config);
    results.attribution = attribution;
  }

  if (config.validators.has('timeline')) {
    const timeline = await runTimelineValidation(movies, config);
    results.timeline = timeline;
  }

  // Generate CSV reports
  console.log(chalk.magenta.bold('\n📝 GENERATING CSV REPORTS'));
  console.log('='.repeat(70));

  if (results.duplicates.exact.length > 0) {
    generateExactDuplicatesCSV(results.duplicates.exact, config.outputDir);
    console.log(chalk.cyan(`  ✅ exact-duplicates.csv (${results.duplicates.exact.length} rows)`));
  }

  if (results.duplicates.fuzzy.length > 0) {
    generateFuzzyDuplicatesCSV(results.duplicates.fuzzy, config.outputDir);
    console.log(chalk.cyan(`  ✅ fuzzy-duplicates.csv (${results.duplicates.fuzzy.length} rows)`));
  }

  const totalSuspicious = 
    results.suspicious.missing.length +
    results.suspicious.patterns.length +
    results.suspicious.inconsistencies.length;

  if (totalSuspicious > 0) {
    generateSuspiciousEntriesCSV(
      results.suspicious.missing,
      results.suspicious.patterns,
      results.suspicious.inconsistencies,
      config.outputDir
    );
    console.log(chalk.cyan(`  ✅ suspicious-entries.csv (${totalSuspicious} rows)`));
  }

  if (results.attribution.castMismatches.length > 0) {
    generateCastAttributionCSV(results.attribution.castMismatches, config.outputDir);
    console.log(chalk.cyan(`  ✅ wrong-cast-attribution.csv (${results.attribution.castMismatches.length} rows)`));
  }

  if (results.timeline.timelineIssues.length > 0) {
    generateTimelineIssuesCSV(results.timeline.timelineIssues, config.outputDir);
    console.log(chalk.cyan(`  ✅ timeline-issues.csv (${results.timeline.timelineIssues.length} rows)`));
  }

  if (results.suspicious.outliers.length > 0) {
    generateStatisticalOutliersCSV(results.suspicious.outliers, config.outputDir);
    console.log(chalk.cyan(`  ✅ statistical-outliers.csv (${results.suspicious.outliers.length} rows)`));
  }

  // Generate summary report
  generateSummaryReport(results, config, config.outputDir);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║            AUDIT COMPLETE!                                           ║'));
  console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════════════════╝'));
  console.log(chalk.gray(`\n  Total duration: ${duration}s`));
  console.log(chalk.gray(`  Movies checked: ${results.totalMovies}`));
  console.log(chalk.gray(`  Reports saved to: ${config.outputDir}\n`));
}

// Run the audit
runAudit().catch(error => {
  console.error(chalk.red('\n❌ Audit failed:'), error);
  process.exit(1);
});
