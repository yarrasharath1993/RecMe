/**
 * VALIDATION SCRIPT: Archival Visuals
 * 
 * Validates and categorizes existing movie posters.
 * Generates a report of visual quality across the catalogue.
 * 
 * This script:
 * 1. Analyzes all movies for visual quality
 * 2. Identifies movies needing archive cards
 * 3. Validates URL accessibility (optional)
 * 4. Generates a comprehensive report
 * 
 * Usage:
 *   npx tsx scripts/validate-archival-visuals.ts [--validate-urls] [--export-csv]
 * 
 * Options:
 *   --validate-urls   Check if poster URLs return 200 (slower)
 *   --export-csv      Export results to CSV file
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import {
  calculateVisualConfidence,
  isPlaceholderUrl,
  isTMDBUrl,
  needsArchiveCard,
} from '../lib/visual-intelligence/visual-confidence';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// CLI ARGUMENTS
// ============================================================

const args = process.argv.slice(2);
const validateUrls = args.includes('--validate-urls');
const exportCsv = args.includes('--export-csv');

// ============================================================
// TYPES
// ============================================================

interface ValidationResult {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  posterSource: string | null;
  tier: number;
  confidence: number;
  visualType: string;
  needsArchiveCard: boolean;
  urlValid: boolean | null;
  issues: string[];
}

interface ValidationSummary {
  total: number;
  byTier: { tier1: number; tier2: number; tier3: number };
  byDecade: Record<string, { total: number; tier1: number; tier2: number; tier3: number }>;
  needsArchiveCard: number;
  hasPlaceholder: number;
  hasTMDB: number;
  brokenUrls: number;
  issues: { type: string; count: number }[];
}

// ============================================================
// VALIDATION LOGIC
// ============================================================

async function validateMovie(movie: any): Promise<ValidationResult> {
  const issues: string[] = [];
  
  // Calculate confidence
  const confidenceResult = await calculateVisualConfidence({
    posterUrl: movie.poster_url,
    posterSource: movie.poster_source,
    releaseYear: movie.release_year,
    validateUrl: validateUrls,
  });

  // Check for issues
  if (!movie.poster_url) {
    issues.push('no_poster');
  } else if (isPlaceholderUrl(movie.poster_url)) {
    issues.push('placeholder');
  }

  if (movie.release_year && movie.release_year < 1970 && !isTMDBUrl(movie.poster_url)) {
    issues.push('classic_no_tmdb');
  }

  if (validateUrls && !confidenceResult.urlValidated) {
    issues.push('broken_url');
  }

  const needsCard = needsArchiveCard({
    posterUrl: movie.poster_url,
    posterSource: movie.poster_source,
    releaseYear: movie.release_year,
  });

  if (needsCard) {
    issues.push('needs_archive_card');
  }

  return {
    id: movie.id,
    title: movie.title_en,
    year: movie.release_year,
    posterUrl: movie.poster_url,
    posterSource: movie.poster_source,
    tier: confidenceResult.tier,
    confidence: confidenceResult.confidence,
    visualType: confidenceResult.visualType,
    needsArchiveCard: needsCard,
    urlValid: validateUrls ? confidenceResult.urlValidated : null,
    issues,
  };
}

async function runValidation(): Promise<{ results: ValidationResult[]; summary: ValidationSummary }> {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('ARCHIVAL VISUAL VALIDATION');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`URL Validation: ${validateUrls ? 'ENABLED' : 'DISABLED'}`);
  console.log(`CSV Export: ${exportCsv ? 'ENABLED' : 'DISABLED'}`);
  console.log('');

  // Fetch all movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, poster_url, poster_source, language')
    .eq('is_published', true)
    .order('release_year', { ascending: true });

  if (error || !movies) {
    console.error('❌ Failed to fetch movies:', error?.message);
    return { results: [], summary: createEmptySummary() };
  }

  console.log(`📊 Validating ${movies.length} movies...\n`);

  const results: ValidationResult[] = [];
  const summary: ValidationSummary = createEmptySummary();
  summary.total = movies.length;

  // Process in batches
  const batchSize = validateUrls ? 10 : 50;

  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(batch.map(validateMovie));
    results.push(...batchResults);

    // Update summary
    for (const result of batchResults) {
      // By tier
      if (result.tier === 1) summary.byTier.tier1++;
      else if (result.tier === 2) summary.byTier.tier2++;
      else summary.byTier.tier3++;

      // By decade
      const decade = result.year ? `${Math.floor(result.year / 10) * 10}s` : 'Unknown';
      if (!summary.byDecade[decade]) {
        summary.byDecade[decade] = { total: 0, tier1: 0, tier2: 0, tier3: 0 };
      }
      summary.byDecade[decade].total++;
      if (result.tier === 1) summary.byDecade[decade].tier1++;
      else if (result.tier === 2) summary.byDecade[decade].tier2++;
      else summary.byDecade[decade].tier3++;

      // Other counts
      if (result.needsArchiveCard) summary.needsArchiveCard++;
      if (result.issues.includes('placeholder')) summary.hasPlaceholder++;
      if (result.posterUrl && isTMDBUrl(result.posterUrl)) summary.hasTMDB++;
      if (result.urlValid === false) summary.brokenUrls++;

      // Issue counts
      for (const issue of result.issues) {
        const existing = summary.issues.find(i => i.type === issue);
        if (existing) {
          existing.count++;
        } else {
          summary.issues.push({ type: issue, count: 1 });
        }
      }
    }

    // Progress
    process.stdout.write(`\r  Processing: ${Math.min(i + batchSize, movies.length)}/${movies.length}`);
  }

  console.log('\n');

  return { results, summary };
}

function createEmptySummary(): ValidationSummary {
  return {
    total: 0,
    byTier: { tier1: 0, tier2: 0, tier3: 0 },
    byDecade: {},
    needsArchiveCard: 0,
    hasPlaceholder: 0,
    hasTMDB: 0,
    brokenUrls: 0,
    issues: [],
  };
}

// ============================================================
// REPORTING
// ============================================================

function printReport(summary: ValidationSummary, results: ValidationResult[]) {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════════════════════════');
  
  // Overall stats
  console.log('\n📊 OVERALL STATISTICS');
  console.log('───────────────────────────────────────────────────────────────────────');
  console.log(`Total movies:         ${summary.total}`);
  console.log(`With TMDB poster:     ${summary.hasTMDB} (${pct(summary.hasTMDB, summary.total)})`);
  console.log(`With placeholder:     ${summary.hasPlaceholder} (${pct(summary.hasPlaceholder, summary.total)})`);
  console.log(`Needs archive card:   ${summary.needsArchiveCard} (${pct(summary.needsArchiveCard, summary.total)})`);
  if (validateUrls) {
    console.log(`Broken URLs:          ${summary.brokenUrls} (${pct(summary.brokenUrls, summary.total)})`);
  }

  // By tier
  console.log('\n🎯 BY VISUAL TIER');
  console.log('───────────────────────────────────────────────────────────────────────');
  console.log(`Tier 1 (Original):    ${summary.byTier.tier1} (${pct(summary.byTier.tier1, summary.total)})`);
  console.log(`Tier 2 (Archival):    ${summary.byTier.tier2} (${pct(summary.byTier.tier2, summary.total)})`);
  console.log(`Tier 3 (Cards):       ${summary.byTier.tier3} (${pct(summary.byTier.tier3, summary.total)})`);

  // By decade
  console.log('\n📅 BY DECADE');
  console.log('───────────────────────────────────────────────────────────────────────');
  const decades = Object.entries(summary.byDecade)
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  for (const [decade, data] of decades) {
    const tier1Pct = pct(data.tier1, data.total);
    console.log(
      `${decade.padEnd(10)} Total: ${data.total.toString().padStart(4)} | ` +
      `T1: ${data.tier1.toString().padStart(3)} (${tier1Pct.padStart(5)}) | ` +
      `T2: ${data.tier2.toString().padStart(3)} | ` +
      `T3: ${data.tier3.toString().padStart(3)}`
    );
  }

  // Issues breakdown
  console.log('\n⚠️  ISSUES BREAKDOWN');
  console.log('───────────────────────────────────────────────────────────────────────');
  const sortedIssues = summary.issues.sort((a, b) => b.count - a.count);
  for (const issue of sortedIssues) {
    console.log(`${issue.type.padEnd(20)} ${issue.count}`);
  }

  // Sample movies needing attention
  console.log('\n🔍 SAMPLE MOVIES NEEDING ARCHIVE CARDS (first 10)');
  console.log('───────────────────────────────────────────────────────────────────────');
  const needingCards = results
    .filter(r => r.needsArchiveCard)
    .slice(0, 10);
  
  for (const movie of needingCards) {
    console.log(`${movie.year || '????'} | ${movie.title.substring(0, 40).padEnd(40)} | ${movie.issues.join(', ')}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
}

function pct(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function exportToCsv(results: ValidationResult[]) {
  const headers = [
    'ID', 'Title', 'Year', 'Tier', 'Confidence', 'Visual Type',
    'Needs Archive Card', 'URL Valid', 'Poster URL', 'Issues'
  ].join(',');

  const rows = results.map(r => [
    r.id,
    `"${r.title.replace(/"/g, '""')}"`,
    r.year || '',
    r.tier,
    r.confidence,
    r.visualType,
    r.needsArchiveCard,
    r.urlValid ?? '',
    r.posterUrl ? `"${r.posterUrl}"` : '',
    `"${r.issues.join('; ')}"`,
  ].join(','));

  const csv = [headers, ...rows].join('\n');
  const filename = `visual-validation-${new Date().toISOString().split('T')[0]}.csv`;
  
  fs.writeFileSync(filename, csv);
  console.log(`\n📄 CSV exported to: ${filename}`);
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  const startTime = Date.now();

  try {
    const { results, summary } = await runValidation();
    
    printReport(summary, results);

    if (exportCsv && results.length > 0) {
      exportToCsv(results);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Completed in ${duration}s`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

