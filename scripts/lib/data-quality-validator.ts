/**
 * Comprehensive Data Quality Validator
 * 
 * Validates and fixes data quality issues:
 * - Wrong/broken images
 * - Missing cast/crew fields
 * - Duplicate entries
 * - Name inconsistencies
 * - Missing TMDB linkage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import { 
  validateImageUrl, 
  getTMDBPosterUrl, 
  getTMDBPersonImage,
  isPlaceholderUrl,
  ValidationIssue,
} from './image-validator';
import {
  batchCheckUrlHealth,
  generateHealthSummary,
  getBrokenUrls,
  UrlHealthResult,
} from './url-health-checker';
import { 
  getStandardHeroName, 
  HERO_NAME_MAPPINGS 
} from './hero-name-standardizer';
import {
  detectSpellingDuplicates,
  calculateSimilarity,
} from './filmography-cross-validator';

// ============================================================
// TYPES
// ============================================================

export type IssueType = 
  | 'broken_poster_url'
  | 'broken_actor_image'
  | 'missing_poster'
  | 'missing_hero'
  | 'missing_heroine'
  | 'missing_director'
  | 'missing_tmdb_id'
  | 'duplicate_movie'
  | 'name_inconsistency'
  | 'placeholder_image'
  | 'wrong_attribution';

export interface QualityIssue {
  id: string;
  type: IssueType;
  entityType: 'movie' | 'celebrity';
  entityId: string;
  entityName: string;
  field: string;
  currentValue: string | number | null;
  suggestedValue?: string | number | null;
  confidence: number;
  autoFixable: boolean;
  details: string;
}

export interface QualityReport {
  timestamp: Date;
  duration: number;
  summary: {
    moviesScanned: number;
    celebritiesScanned: number;
    totalIssues: number;
    autoFixable: number;
    manualReview: number;
    byType: Record<IssueType, number>;
  };
  issues: QualityIssue[];
}

export interface ValidatorOptions {
  supabase: SupabaseClient;
  checks?: {
    brokenUrls?: boolean;
    missingFields?: boolean;
    duplicates?: boolean;
    nameConsistency?: boolean;
    tmdbLinkage?: boolean;
  };
  limit?: number;
  verbose?: boolean;
  autoFix?: boolean;
}

// ============================================================
// VALIDATORS
// ============================================================

/**
 * Check for broken image URLs in movies
 */
async function validateMovieImageUrls(
  supabase: SupabaseClient,
  limit: number,
  verbose: boolean
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  if (verbose) console.log(chalk.gray('\n  [1/5] Checking movie poster URLs...'));

  // Get movies with poster URLs
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, poster_url')
    .not('poster_url', 'is', null)
    .eq('is_published', true)
    .limit(limit);

  if (!movies || movies.length === 0) return issues;

  const urls = movies.map(m => m.poster_url).filter(Boolean) as string[];
  
  // Batch check all URLs
  let checked = 0;
  const results = await batchCheckUrlHealth(urls, {
    concurrency: 20,
    timeout: 8000,
    onProgress: (completed, total) => {
      if (verbose && completed % 100 === 0) {
        console.log(chalk.gray(`    Checked ${completed}/${total} URLs`));
      }
    },
  });

  const brokenUrls = getBrokenUrls(results);
  
  for (const movie of movies) {
    if (!movie.poster_url) continue;
    
    const result = results.get(movie.poster_url);
    if (result && (result.status === 'broken' || result.status === 'invalid')) {
      // Try to get replacement from TMDB
      const tmdbPoster = await getTMDBPosterUrl(movie.title_en, movie.release_year);
      
      issues.push({
        id: `broken-poster-${movie.id}`,
        type: 'broken_poster_url',
        entityType: 'movie',
        entityId: movie.id,
        entityName: movie.title_en,
        field: 'poster_url',
        currentValue: movie.poster_url,
        suggestedValue: tmdbPoster,
        confidence: 0.95,
        autoFixable: !!tmdbPoster,
        details: `URL returns ${result.error || 'error'}`,
      });
    } else if (movie.poster_url && isPlaceholderUrl(movie.poster_url)) {
      const tmdbPoster = await getTMDBPosterUrl(movie.title_en, movie.release_year);
      
      issues.push({
        id: `placeholder-poster-${movie.id}`,
        type: 'placeholder_image',
        entityType: 'movie',
        entityId: movie.id,
        entityName: movie.title_en,
        field: 'poster_url',
        currentValue: movie.poster_url,
        suggestedValue: tmdbPoster,
        confidence: 0.9,
        autoFixable: !!tmdbPoster,
        details: 'Placeholder image detected',
      });
    }
  }

  if (verbose) {
    console.log(chalk.gray(`    Found ${issues.length} broken/placeholder poster URLs`));
  }

  return issues;
}

/**
 * Check for broken celebrity profile images
 */
async function validateCelebrityImageUrls(
  supabase: SupabaseClient,
  limit: number,
  verbose: boolean
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  if (verbose) console.log(chalk.gray('\n  [2/5] Checking celebrity profile images...'));

  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name_en, profile_image')
    .not('profile_image', 'is', null)
    .eq('is_published', true)
    .limit(limit);

  if (!celebrities || celebrities.length === 0) return issues;

  const urls = celebrities.map(c => c.profile_image).filter(Boolean) as string[];
  
  const results = await batchCheckUrlHealth(urls, {
    concurrency: 20,
    timeout: 8000,
  });

  for (const celeb of celebrities) {
    if (!celeb.profile_image) continue;
    
    const result = results.get(celeb.profile_image);
    if (result && (result.status === 'broken' || result.status === 'invalid')) {
      const tmdbImage = await getTMDBPersonImage(celeb.name_en);
      
      issues.push({
        id: `broken-profile-${celeb.id}`,
        type: 'broken_actor_image',
        entityType: 'celebrity',
        entityId: celeb.id,
        entityName: celeb.name_en,
        field: 'profile_image',
        currentValue: celeb.profile_image,
        suggestedValue: tmdbImage,
        confidence: 0.95,
        autoFixable: !!tmdbImage,
        details: `URL returns ${result.error || 'error'}`,
      });
    }
  }

  if (verbose) {
    console.log(chalk.gray(`    Found ${issues.length} broken celebrity images`));
  }

  return issues;
}

/**
 * Check for missing required fields
 */
async function validateMissingFields(
  supabase: SupabaseClient,
  limit: number,
  verbose: boolean
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  if (verbose) console.log(chalk.gray('\n  [3/5] Checking for missing fields...'));

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, heroine, director, poster_url, tmdb_id')
    .eq('is_published', true)
    .limit(limit);

  if (!movies) return issues;

  for (const movie of movies) {
    // Missing poster
    if (!movie.poster_url) {
      const tmdbPoster = await getTMDBPosterUrl(movie.title_en, movie.release_year);
      issues.push({
        id: `missing-poster-${movie.id}`,
        type: 'missing_poster',
        entityType: 'movie',
        entityId: movie.id,
        entityName: movie.title_en,
        field: 'poster_url',
        currentValue: null,
        suggestedValue: tmdbPoster,
        confidence: tmdbPoster ? 0.85 : 0.5,
        autoFixable: !!tmdbPoster,
        details: 'Movie has no poster image',
      });
    }

    // Missing hero (skip documentaries and special films)
    if (!movie.hero || movie.hero === 'Unknown') {
      issues.push({
        id: `missing-hero-${movie.id}`,
        type: 'missing_hero',
        entityType: 'movie',
        entityId: movie.id,
        entityName: movie.title_en,
        field: 'hero',
        currentValue: movie.hero,
        confidence: 0.7,
        autoFixable: false, // Needs TMDB lookup
        details: 'Missing or unknown hero',
      });
    }

    // Missing director
    if (!movie.director || movie.director === 'Unknown') {
      issues.push({
        id: `missing-director-${movie.id}`,
        type: 'missing_director',
        entityType: 'movie',
        entityId: movie.id,
        entityName: movie.title_en,
        field: 'director',
        currentValue: movie.director,
        confidence: 0.7,
        autoFixable: false,
        details: 'Missing or unknown director',
      });
    }

    // Missing TMDB ID
    if (!movie.tmdb_id) {
      issues.push({
        id: `missing-tmdb-${movie.id}`,
        type: 'missing_tmdb_id',
        entityType: 'movie',
        entityId: movie.id,
        entityName: movie.title_en,
        field: 'tmdb_id',
        currentValue: null,
        confidence: 0.6,
        autoFixable: false, // Needs search
        details: 'No TMDB linkage',
      });
    }
  }

  if (verbose) {
    console.log(chalk.gray(`    Found ${issues.length} missing fields`));
  }

  return issues;
}

/**
 * Check for duplicate movies
 */
async function validateDuplicates(
  supabase: SupabaseClient,
  limit: number,
  verbose: boolean
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  if (verbose) console.log(chalk.gray('\n  [4/5] Checking for duplicates...'));

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, hero, tmdb_id, poster_url, is_published')
    .eq('is_published', true)
    .order('release_year', { ascending: true })
    .limit(limit);

  if (!movies) return issues;

  // Detect spelling duplicates using existing logic
  const spellingDupes = detectSpellingDuplicates(movies);

  for (const dupe of spellingDupes) {
    // Determine which to keep (prefer one with TMDB ID, then poster, then published)
    const score = (movie: typeof movies[0]) =>
      (movie.tmdb_id ? 3 : 0) +
      (movie.poster_url && !movie.poster_url.includes('placeholder') ? 2 : 0) +
      (movie.is_published ? 1 : 0);

    const [keep, remove] = score(dupe.movie1) >= score(dupe.movie2)
      ? [dupe.movie1, dupe.movie2]
      : [dupe.movie2, dupe.movie1];

    issues.push({
      id: `duplicate-${remove.id}`,
      type: 'duplicate_movie',
      entityType: 'movie',
      entityId: remove.id,
      entityName: remove.title_en,
      field: 'title_en',
      currentValue: remove.title_en,
      suggestedValue: `Keep: ${keep.title_en} (${keep.id})`,
      confidence: dupe.similarity,
      autoFixable: dupe.similarity >= 0.95,
      details: `${Math.round(dupe.similarity * 100)}% similar to "${keep.title_en}"`,
    });
  }

  if (verbose) {
    console.log(chalk.gray(`    Found ${issues.length} potential duplicates`));
  }

  return issues;
}

/**
 * Check for name inconsistencies
 */
async function validateNameConsistency(
  supabase: SupabaseClient,
  limit: number,
  verbose: boolean
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  if (verbose) console.log(chalk.gray('\n  [5/5] Checking name consistency...'));

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, hero, heroine, director')
    .eq('is_published', true)
    .limit(limit);

  if (!movies) return issues;

  const nameFields = ['hero', 'heroine', 'director'] as const;

  for (const movie of movies) {
    for (const field of nameFields) {
      const value = movie[field];
      if (!value || value === 'Unknown' || value === 'Various') continue;

      const standardName = getStandardHeroName(value);
      
      if (standardName !== value) {
        issues.push({
          id: `name-${field}-${movie.id}`,
          type: 'name_inconsistency',
          entityType: 'movie',
          entityId: movie.id,
          entityName: movie.title_en,
          field,
          currentValue: value,
          suggestedValue: standardName,
          confidence: 0.95,
          autoFixable: true,
          details: `"${value}" should be "${standardName}"`,
        });
      }
    }
  }

  if (verbose) {
    console.log(chalk.gray(`    Found ${issues.length} name inconsistencies`));
  }

  return issues;
}

// ============================================================
// MAIN VALIDATOR
// ============================================================

/**
 * Run comprehensive data quality validation
 */
export async function runDataQualityValidation(
  options: ValidatorOptions
): Promise<QualityReport> {
  const {
    supabase,
    checks = {
      brokenUrls: true,
      missingFields: true,
      duplicates: true,
      nameConsistency: true,
      tmdbLinkage: true,
    },
    limit = 5000,
    verbose = false,
  } = options;

  const startTime = Date.now();
  const allIssues: QualityIssue[] = [];

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  DATA QUALITY VALIDATION'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════'));

  // Run validators based on options
  if (checks.brokenUrls) {
    const posterIssues = await validateMovieImageUrls(supabase, limit, verbose);
    allIssues.push(...posterIssues);

    const celebIssues = await validateCelebrityImageUrls(supabase, Math.min(limit, 1000), verbose);
    allIssues.push(...celebIssues);
  }

  if (checks.missingFields || checks.tmdbLinkage) {
    const fieldIssues = await validateMissingFields(supabase, limit, verbose);
    allIssues.push(...fieldIssues);
  }

  if (checks.duplicates) {
    const dupeIssues = await validateDuplicates(supabase, limit, verbose);
    allIssues.push(...dupeIssues);
  }

  if (checks.nameConsistency) {
    const nameIssues = await validateNameConsistency(supabase, limit, verbose);
    allIssues.push(...nameIssues);
  }

  const duration = Date.now() - startTime;

  // Build summary
  const byType: Record<IssueType, number> = {
    broken_poster_url: 0,
    broken_actor_image: 0,
    missing_poster: 0,
    missing_hero: 0,
    missing_heroine: 0,
    missing_director: 0,
    missing_tmdb_id: 0,
    duplicate_movie: 0,
    name_inconsistency: 0,
    placeholder_image: 0,
    wrong_attribution: 0,
  };

  allIssues.forEach(issue => {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
  });

  const autoFixable = allIssues.filter(i => i.autoFixable).length;

  const report: QualityReport = {
    timestamp: new Date(),
    duration,
    summary: {
      moviesScanned: limit,
      celebritiesScanned: Math.min(limit, 1000),
      totalIssues: allIssues.length,
      autoFixable,
      manualReview: allIssues.length - autoFixable,
      byType,
    },
    issues: allIssues,
  };

  return report;
}

/**
 * Apply auto-fixes for high-confidence issues
 */
export async function applyAutoFixes(
  supabase: SupabaseClient,
  issues: QualityIssue[],
  verbose: boolean = false
): Promise<{ applied: number; failed: number }> {
  let applied = 0;
  let failed = 0;

  const autoFixableIssues = issues.filter(i => i.autoFixable && i.confidence >= 0.9);

  console.log(chalk.cyan(`\n  Applying ${autoFixableIssues.length} auto-fixes...\n`));

  for (const issue of autoFixableIssues) {
    try {
      const table = issue.entityType === 'movie' ? 'movies' : 'celebrities';
      
      if (issue.type === 'duplicate_movie') {
        // Delete duplicate
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', issue.entityId);

        if (error) throw error;
        if (verbose) console.log(chalk.green(`  ✓ Deleted duplicate: ${issue.entityName}`));
      } else if (issue.suggestedValue) {
        // Update field
        const { error } = await supabase
          .from(table)
          .update({ [issue.field]: issue.suggestedValue })
          .eq('id', issue.entityId);

        if (error) throw error;
        if (verbose) console.log(chalk.green(`  ✓ Updated ${issue.field} for: ${issue.entityName}`));
      } else {
        // Clear broken URL
        const { error } = await supabase
          .from(table)
          .update({ [issue.field]: null })
          .eq('id', issue.entityId);

        if (error) throw error;
        if (verbose) console.log(chalk.green(`  ✓ Cleared ${issue.field} for: ${issue.entityName}`));
      }

      applied++;
    } catch (error) {
      failed++;
      if (verbose) {
        console.log(chalk.red(`  ✗ Failed to fix: ${issue.entityName} - ${error}`));
      }
    }
  }

  return { applied, failed };
}

/**
 * Print quality report
 */
export function printQualityReport(report: QualityReport): void {
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  DATA QUALITY VALIDATION REPORT'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  console.log(`  Movies Scanned:     ${report.summary.moviesScanned}`);
  console.log(`  Celebrities:        ${report.summary.celebritiesScanned}`);
  console.log(`  Total Issues:       ${report.summary.totalIssues}`);
  const autoFixPct = report.summary.totalIssues > 0 
    ? Math.round(report.summary.autoFixable / report.summary.totalIssues * 100) 
    : 0;
  const manualPct = report.summary.totalIssues > 0 
    ? Math.round(report.summary.manualReview / report.summary.totalIssues * 100) 
    : 0;
  console.log(`  Auto-fixable:       ${chalk.green(report.summary.autoFixable.toString())} (${autoFixPct}%)`);
  console.log(`  Manual Review:      ${chalk.yellow(report.summary.manualReview.toString())} (${manualPct}%)`);
  console.log(`  Duration:           ${(report.duration / 1000).toFixed(1)}s`);

  console.log(chalk.cyan('\n  ─────────────────────────────────────────────────────'));
  console.log(chalk.cyan('  ISSUE BREAKDOWN'));
  console.log(chalk.cyan('  ─────────────────────────────────────────────────────\n'));

  const typeLabels: Record<IssueType, string> = {
    broken_poster_url: 'Broken Poster URLs',
    broken_actor_image: 'Broken Actor Images',
    missing_poster: 'Missing Posters',
    missing_hero: 'Missing Hero',
    missing_heroine: 'Missing Heroine',
    missing_director: 'Missing Director',
    missing_tmdb_id: 'Missing TMDB ID',
    duplicate_movie: 'Duplicate Movies',
    name_inconsistency: 'Name Inconsistencies',
    placeholder_image: 'Placeholder Images',
    wrong_attribution: 'Wrong Attributions',
  };

  Object.entries(report.summary.byType)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const label = typeLabels[type as IssueType] || type;
      const autoFixable = report.issues.filter(i => i.type === type && i.autoFixable).length;
      const badge = autoFixable === count ? chalk.green('[AUTO-FIX]') : 
                   autoFixable > 0 ? chalk.yellow(`[${autoFixable} AUTO]`) : 
                   chalk.red('[REVIEW]');
      console.log(`  ${label.padEnd(25)} ${String(count).padStart(5)}  ${badge}`);
    });

  console.log('');
}

/**
 * Export report to JSON file
 */
export function exportReportToJson(report: QualityReport, filePath: string): void {
  const fs = require('fs');
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  console.log(chalk.gray(`  Report saved to: ${filePath}`));
}

/**
 * Export manual review items to CSV
 */
export function exportManualReviewCsv(report: QualityReport, filePath: string): void {
  const fs = require('fs');
  const manualReview = report.issues.filter(i => !i.autoFixable || i.confidence < 0.9);
  
  const csv = [
    'ID,Type,Entity,Name,Field,Current Value,Suggested Value,Confidence,Details',
    ...manualReview.map(i => 
      `"${i.entityId}","${i.type}","${i.entityType}","${i.entityName}","${i.field}","${i.currentValue || ''}","${i.suggestedValue || ''}",${i.confidence},"${i.details}"`
    ),
  ].join('\n');

  fs.writeFileSync(filePath, csv);
  console.log(chalk.gray(`  Manual review list saved to: ${filePath}`));
}
