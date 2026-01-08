/**
 * BATCH VERIFICATION CLI
 * 
 * Cross-reference verification pipeline for movie data.
 * Compares data from multiple sources and produces verified facts.
 * 
 * Usage:
 *   npx tsx scripts/verify-batch.ts --limit=50
 *   npx tsx scripts/verify-batch.ts --ids=id1,id2,id3
 *   npx tsx scripts/verify-batch.ts --batch --limit=100 --year-min=2020
 *   npx tsx scripts/verify-batch.ts --low-confidence --threshold=0.7
 *   npx tsx scripts/verify-batch.ts --batch --limit=50 --dry-run
 *   npx tsx scripts/verify-batch.ts --batch --execute --auto-apply-above=0.9
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

import { 
  runVerificationPipeline, 
  verifySingleMovie,
  type VerificationPipelineConfig 
} from '../lib/verification';

// ============================================================
// CLI ARGUMENT PARSING
// ============================================================

function parseArgs(): {
  ids?: string[];
  batch: boolean;
  limit: number;
  yearMin?: number;
  yearMax?: number;
  lowConfidence: boolean;
  threshold: number;
  dryRun: boolean;
  execute: boolean;
  autoApplyAbove: number;
  outputDir: string;
  verbose: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    ids: undefined as string[] | undefined,
    batch: false,
    limit: 50,
    yearMin: undefined as number | undefined,
    yearMax: undefined as number | undefined,
    lowConfidence: false,
    threshold: 0.7,
    dryRun: false,
    execute: false,
    autoApplyAbove: 0.9,
    outputDir: './verification-reports',
    verbose: false,
  };

  args.forEach(arg => {
    if (arg.startsWith('--ids=')) {
      result.ids = arg.split('=')[1].split(',');
    } else if (arg === '--batch') {
      result.batch = true;
    } else if (arg.startsWith('--limit=')) {
      result.limit = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--year-min=')) {
      result.yearMin = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--year-max=')) {
      result.yearMax = parseInt(arg.split('=')[1]);
    } else if (arg === '--low-confidence') {
      result.lowConfidence = true;
    } else if (arg.startsWith('--threshold=')) {
      result.threshold = parseFloat(arg.split('=')[1]);
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--execute') {
      result.execute = true;
    } else if (arg.startsWith('--auto-apply-above=')) {
      result.autoApplyAbove = parseFloat(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
      result.outputDir = arg.split('=')[1];
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    }
  });

  return result;
}

// ============================================================
// DATABASE CLIENT
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// MOVIE FETCHING
// ============================================================

async function getMoviesByIds(ids: string[]): Promise<Array<{
  id: string;
  title: string;
  year: number;
  imdb_id?: string;
}>> {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, imdb_id')
    .in('id', ids);

  if (error) throw error;

  return (data || []).map(m => ({
    id: m.id,
    title: m.title_en,
    year: m.release_year,
    imdb_id: m.imdb_id || undefined,
  }));
}

async function getMoviesBatch(options: {
  limit: number;
  yearMin?: number;
  yearMax?: number;
  lowConfidence?: boolean;
  threshold?: number;
}): Promise<Array<{
  id: string;
  title: string;
  year: number;
  imdb_id?: string;
}>> {
  let query = supabase
    .from('movies')
    .select('id, title_en, release_year, imdb_id')
    .order('release_year', { ascending: false })
    .limit(options.limit);

  if (options.yearMin) {
    query = query.gte('release_year', options.yearMin);
  }
  if (options.yearMax) {
    query = query.lte('release_year', options.yearMax);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(m => ({
    id: m.id,
    title: m.title_en,
    year: m.release_year,
    imdb_id: m.imdb_id || undefined,
  }));
}

// ============================================================
// REPORT OUTPUT
// ============================================================

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function saveReport(outputDir: string, report: any, filename: string): void {
  ensureDir(outputDir);
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved: ${filePath}`);
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main(): Promise<void> {
  console.log('🔍 Cross-Reference Verification Pipeline');
  console.log('=========================================\n');

  const args = parseArgs();

  // Validate args
  if (!args.ids && !args.batch) {
    console.log('Usage:');
    console.log('  npx tsx scripts/verify-batch.ts --ids=id1,id2,id3');
    console.log('  npx tsx scripts/verify-batch.ts --batch --limit=100');
    console.log('  npx tsx scripts/verify-batch.ts --batch --year-min=2020');
    console.log('  npx tsx scripts/verify-batch.ts --low-confidence --threshold=0.7');
    console.log('  npx tsx scripts/verify-batch.ts --batch --execute --auto-apply-above=0.9');
    console.log('');
    console.log('Options:');
    console.log('  --ids=id1,id2    Verify specific movie IDs');
    console.log('  --batch          Batch mode');
    console.log('  --limit=N        Number of movies to process (default: 50)');
    console.log('  --year-min=YYYY  Filter movies from year');
    console.log('  --year-max=YYYY  Filter movies up to year');
    console.log('  --low-confidence Find movies with low confidence data');
    console.log('  --threshold=N    Confidence threshold (default: 0.7)');
    console.log('  --dry-run        Don\'t apply changes');
    console.log('  --execute        Apply changes to database');
    console.log('  --auto-apply-above=N  Auto-apply threshold (default: 0.9)');
    console.log('  --output=DIR     Output directory for reports');
    console.log('  --verbose        Verbose output');
    process.exit(0);
  }

  // Fetch movies
  let movies: Array<{ id: string; title: string; year: number; imdb_id?: string }>;

  if (args.ids) {
    console.log(`📋 Fetching ${args.ids.length} specific movies...`);
    movies = await getMoviesByIds(args.ids);
  } else {
    console.log(`📋 Fetching up to ${args.limit} movies...`);
    movies = await getMoviesBatch({
      limit: args.limit,
      yearMin: args.yearMin,
      yearMax: args.yearMax,
      lowConfidence: args.lowConfidence,
      threshold: args.threshold,
    });
  }

  console.log(`   Found ${movies.length} movies to verify\n`);

  if (movies.length === 0) {
    console.log('No movies found matching criteria.');
    process.exit(0);
  }

  // Single movie mode
  if (args.ids && args.ids.length === 1) {
    console.log(`\n🎬 Verifying single movie: ${movies[0].title} (${movies[0].year})`);
    
    const { consensus, report } = await verifySingleMovie(movies[0]);
    
    console.log('\n' + report.summary);
    
    if (args.verbose) {
      console.log('\n📊 Raw Consensus Data:');
      console.log(JSON.stringify(consensus.consensus, null, 2));
    }
    
    saveReport(args.outputDir, report, `${movies[0].id}.json`);
    process.exit(0);
  }

  // Batch mode
  const config: VerificationPipelineConfig = {
    dryRun: args.dryRun || !args.execute,
    autoApplyThreshold: args.autoApplyAbove,
    batchSize: 25,
    delayBetweenBatches: 2000,
  };

  console.log(`⚙️  Configuration:`);
  console.log(`   - Mode: ${config.dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log(`   - Auto-apply threshold: ${args.autoApplyAbove}`);
  console.log(`   - Batch size: ${config.batchSize}`);
  console.log('');

  const result = await runVerificationPipeline(movies, config, (msg) => {
    console.log(`   ${msg}`);
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Total movies processed: ${result.batchReport.totalMovies}`);
  console.log(`Average confidence: ${(result.batchReport.metrics.avgConfidence * 100).toFixed(1)}%`);
  console.log('');
  console.log('Grade Distribution:');
  console.log(`   A (Excellent): ${result.batchReport.metrics.gradeDistribution.A}`);
  console.log(`   B (Good):      ${result.batchReport.metrics.gradeDistribution.B}`);
  console.log(`   C (Fair):      ${result.batchReport.metrics.gradeDistribution.C}`);
  console.log(`   D (Poor):      ${result.batchReport.metrics.gradeDistribution.D}`);
  console.log(`   F (Fail):      ${result.batchReport.metrics.gradeDistribution.F}`);
  console.log('');
  console.log(`Movies needing review: ${result.batchReport.metrics.moviesNeedingReview}`);
  console.log(`Auto-applicable:       ${result.batchReport.metrics.autoApplicable}`);
  console.log('');
  
  if (result.batchReport.commonIssues.length > 0) {
    console.log('Most Common Discrepancies:');
    result.batchReport.commonIssues.slice(0, 5).forEach(issue => {
      const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
      console.log(`   ${icon} ${issue.field}: ${issue.count} movies`);
    });
    console.log('');
  }

  console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
  console.log('');

  // Save batch report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveReport(args.outputDir, result.batchReport, `batch-report-${timestamp}.json`);

  // Save summary for easy review
  const summaryReport = {
    timestamp: new Date().toISOString(),
    totalMovies: result.batchReport.totalMovies,
    metrics: result.batchReport.metrics,
    commonIssues: result.batchReport.commonIssues,
    moviesByStatus: result.batchReport.moviesByStatus,
    duration: result.duration,
  };
  saveReport(args.outputDir, summaryReport, `summary-${timestamp}.json`);

  // Print movies needing review
  if (result.batchReport.moviesByStatus.needsReview.length > 0) {
    console.log('\n⚠️  Movies requiring manual review:');
    const reviewMovies = movies.filter(m => 
      result.batchReport.moviesByStatus.needsReview.includes(m.id)
    );
    reviewMovies.slice(0, 10).forEach(m => {
      console.log(`   - ${m.title} (${m.year})`);
    });
    if (reviewMovies.length > 10) {
      console.log(`   ... and ${reviewMovies.length - 10} more`);
    }
  }

  if (config.dryRun) {
    console.log('\n📝 DRY RUN complete. No changes applied.');
    console.log('   Run with --execute to apply changes.');
  } else {
    console.log(`\n✅ Applied ${result.autoApplied} updates, skipped ${result.skipped}`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

