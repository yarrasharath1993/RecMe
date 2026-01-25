#!/usr/bin/env npx tsx
/**
 * COMPREHENSIVE INTERNAL AUDIT
 * 
 * Phase 1 of Enhanced Data Validation - No external APIs
 * Runs: Timeline + Suspicious Entry + Attribution + Pattern checks
 * Fast (~2 min for full DB)
 * 
 * Usage: npx tsx scripts/audit-comprehensive-internal.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { validateTimelines, TimelineIssue } from './lib/validators/timeline-validator';
import { detectSuspiciousEntries, SuspiciousEntryResult } from './lib/validators/suspicious-entry-detector';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPES
// ============================================================

interface Movie {
  id: string;
  slug: string;
  title_en: string;
  title_te: string | null;
  release_year: number | null;
  hero: string | null;
  heroine: string | null;
  director: string | null;
  music_director: string | null;
  supporting_cast: string[] | null;
  genres: string[] | null;
  mood_tags: string[] | null;
  runtime_minutes: number | null;
  tmdb_id: number | null;
  poster_url: string | null;
  language: string | null;
}

interface AuditIssue {
  id: string;
  slug: string;
  title: string;
  year: number | null;
  category: string;
  issue_type: string;
  field: string;
  current_value: string;
  suggested_fix: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  auto_fixable: boolean;
  details: string;
}

// ============================================================
// FETCH ALL MOVIES
// ============================================================

async function fetchAllMovies(): Promise<Movie[]> {
  console.log(chalk.blue('\n📊 Fetching all movies...'));
  let all: Movie[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, slug, title_en, title_te, release_year, hero, heroine, director, music_director, supporting_cast, genres, mood_tags, runtime_minutes, tmdb_id, poster_url, language')
      .eq('is_published', true)
      .range(offset, offset + 999);
    
    if (error) {
      console.error(chalk.red(`Error fetching movies: ${error.message}`));
      break;
    }
    if (!data?.length) break;
    all = all.concat(data as Movie[]);
    if (data.length < 1000) break;
    offset += 1000;
  }
  
  console.log(`  Found ${all.length} published movies\n`);
  return all;
}

// ============================================================
// PHASE 1: TIMELINE VALIDATION
// ============================================================

async function runTimelineValidation(movies: Movie[]): Promise<AuditIssue[]> {
  console.log(chalk.blue('🕐 Phase 1: Timeline Validation'));
  console.log('   Checking actor career spans against movie years...\n');
  
  const issues: AuditIssue[] = [];
  
  try {
    const result = await validateTimelines(supabase, movies.map(m => ({
      id: m.id,
      title_en: m.title_en,
      release_year: m.release_year,
      hero: m.hero,
      heroine: m.heroine,
      director: m.director,
      supporting_cast: m.supporting_cast?.map(c => ({ name: c })) || null,
    })));
    
    for (const issue of result.timelineIssues) {
      issues.push({
        id: issue.movieId,
        slug: movies.find(m => m.id === issue.movieId)?.slug || '',
        title: issue.title,
        year: issue.movieYear,
        category: 'TIMELINE',
        issue_type: issue.issue.toUpperCase(),
        field: issue.role,
        current_value: issue.actor,
        suggested_fix: issue.reason,
        severity: issue.severity,
        auto_fixable: false,
        details: issue.reason,
      });
    }
    
    console.log(`   Found ${issues.length} timeline issues\n`);
  } catch (e: any) {
    console.error(chalk.red(`   Timeline validation error: ${e.message}\n`));
  }
  
  return issues;
}

// ============================================================
// PHASE 2: SUSPICIOUS ENTRY DETECTION
// ============================================================

async function runSuspiciousEntryDetection(movies: Movie[]): Promise<AuditIssue[]> {
  console.log(chalk.blue('🔍 Phase 2: Suspicious Entry Detection'));
  console.log('   Finding non-movies (award shows, TV, documentaries)...\n');
  
  const issues: AuditIssue[] = [];
  
  try {
    const result = await detectSuspiciousEntries(movies.map(m => ({
      id: m.id,
      slug: m.slug,
      title_en: m.title_en,
      title_te: m.title_te,
      release_year: m.release_year,
      language: m.language,
      director: m.director,
      hero: m.hero,
      heroine: m.heroine,
      genres: m.genres,
      mood_tags: m.mood_tags,
      runtime_minutes: m.runtime_minutes,
      tmdb_id: m.tmdb_id,
      poster_url: m.poster_url,
    })));
    
    // Unusual patterns (award ceremonies, TV shows, documentaries)
    for (const pattern of result.unusualPatterns) {
      const movie = movies.find(m => m.id === pattern.movieId);
      issues.push({
        id: pattern.movieId,
        slug: movie?.slug || '',
        title: pattern.title,
        year: movie?.release_year || null,
        category: 'SUSPICIOUS_ENTRY',
        issue_type: pattern.patternType.toUpperCase(),
        field: 'title_en',
        current_value: pattern.title,
        suggested_fix: `Detected ${pattern.patternType}: "${pattern.pattern}"`,
        severity: pattern.severity,
        auto_fixable: false,
        details: pattern.reason,
      });
    }
    
    // Data inconsistencies (missing titles, future years, etc.)
    for (const inconsistency of result.inconsistencies) {
      const movie = movies.find(m => m.id === inconsistency.movieId);
      issues.push({
        id: inconsistency.movieId,
        slug: movie?.slug || '',
        title: inconsistency.title,
        year: inconsistency.year,
        category: 'DATA_INCONSISTENCY',
        issue_type: inconsistency.issue.toUpperCase().replace(/\s+/g, '_'),
        field: inconsistency.field,
        current_value: String(inconsistency.currentValue || ''),
        suggested_fix: inconsistency.expectedPattern,
        severity: inconsistency.severity,
        auto_fixable: false,
        details: inconsistency.issue,
      });
    }
    
    console.log(`   Found ${result.unusualPatterns.length} unusual patterns`);
    console.log(`   Found ${result.inconsistencies.length} data inconsistencies\n`);
  } catch (e: any) {
    console.error(chalk.red(`   Suspicious entry detection error: ${e.message}\n`));
  }
  
  return issues;
}

// ============================================================
// PHASE 3: ATTRIBUTION VALIDATION
// ============================================================

async function runAttributionValidation(movies: Movie[]): Promise<AuditIssue[]> {
  console.log(chalk.blue('👥 Phase 3: Attribution Validation'));
  console.log('   Checking gender patterns and impossible pairings...\n');
  
  const issues: AuditIssue[] = [];
  
  // Known female actors who should never be in hero field
  const femaleActors = new Set([
    'sridevi', 'anushka shetty', 'kajal aggarwal', 'soundarya', 'jaya prada',
    'nayanthara', 'lavanya tripathi', 'shruti haasan', 'tamannaah', 'samantha',
    'ramya krishnan', 'meena', 'roja', 'savitri', 'silk smitha', 'vijayashanti',
    'trisha', 'nithya menen', 'rashmika mandanna', 'pooja hegde', 'keerthy suresh',
  ]);
  
  // Known male actors who should never be in heroine field
  const maleActors = new Set([
    'sobhan babu', 'chiranjeevi', 'prabhas', 'rana daggubati', 'naga chaitanya',
    'mahesh babu', 'allu arjun', 'mohan babu', 'ram charan', 'krishna',
    'krishnam raju', 'suman', 'ravi teja', 'sundeep kishan', 'jagapathi babu',
    'nagarjuna', 'venkatesh', 'balakrishna', 'jr ntr', 'pawan kalyan',
  ]);
  
  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  for (const movie of movies) {
    // Check hero field for female actors
    if (movie.hero) {
      const heroNorm = normalize(movie.hero);
      if (femaleActors.has(heroNorm)) {
        issues.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          category: 'ATTRIBUTION',
          issue_type: 'FEMALE_IN_HERO_FIELD',
          field: 'hero',
          current_value: movie.hero,
          suggested_fix: 'Move to heroine field',
          severity: 'high',
          auto_fixable: false,
          details: `${movie.hero} is a female actor incorrectly listed in hero field`,
        });
      }
    }
    
    // Check heroine field for male actors
    if (movie.heroine) {
      const heroineNorm = normalize(movie.heroine);
      if (maleActors.has(heroineNorm)) {
        issues.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          category: 'ATTRIBUTION',
          issue_type: 'MALE_IN_HEROINE_FIELD',
          field: 'heroine',
          current_value: movie.heroine,
          suggested_fix: 'Move to hero field',
          severity: 'high',
          auto_fixable: false,
          details: `${movie.heroine} is a male actor incorrectly listed in heroine field`,
        });
      }
    }
    
    // Check for same actor in hero and heroine
    if (movie.hero && movie.heroine && normalize(movie.hero) === normalize(movie.heroine)) {
      issues.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en,
        year: movie.release_year,
        category: 'ATTRIBUTION',
        issue_type: 'DUPLICATE_LEAD_CAST',
        field: 'hero/heroine',
        current_value: `${movie.hero} = ${movie.heroine}`,
        suggested_fix: 'Remove duplicate or correct one field',
        severity: 'high',
        auto_fixable: false,
        details: 'Same actor listed as both hero and heroine',
      });
    }
  }
  
  console.log(`   Found ${issues.length} attribution issues\n`);
  return issues;
}

// ============================================================
// PHASE 4: SLUG & DATA QUALITY
// ============================================================

async function runSlugAndQualityChecks(movies: Movie[]): Promise<AuditIssue[]> {
  console.log(chalk.blue('🔗 Phase 4: Slug & Data Quality Checks'));
  console.log('   Checking for bad slugs, placeholder data...\n');
  
  const issues: AuditIssue[] = [];
  
  for (const movie of movies) {
    // Bad slug patterns
    if (movie.slug) {
      // Wikidata ID as slug
      if (/^q\d+(-|$)/i.test(movie.slug)) {
        issues.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          category: 'SLUG_QUALITY',
          issue_type: 'WIKIDATA_ID_SLUG',
          field: 'slug',
          current_value: movie.slug,
          suggested_fix: 'Generate proper slug from title',
          severity: 'medium',
          auto_fixable: false,
          details: 'Slug appears to be a Wikidata ID',
        });
      }
      
      // Slug doesn't match title pattern
      const expectedSlugBase = movie.title_en.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30);
      
      if (!movie.slug.includes(expectedSlugBase.substring(0, 10)) && movie.slug.length > 5) {
        // Check if it might be a song title or unrelated
        const titleWords = movie.title_en.toLowerCase().split(/\s+/);
        const slugWords = movie.slug.replace(/-\d{4}$/, '').split('-');
        const overlap = titleWords.filter(w => slugWords.includes(w)).length;
        
        if (overlap < 1 && titleWords.length > 1) {
          issues.push({
            id: movie.id,
            slug: movie.slug,
            title: movie.title_en,
            year: movie.release_year,
            category: 'SLUG_QUALITY',
            issue_type: 'SLUG_TITLE_MISMATCH',
            field: 'slug',
            current_value: movie.slug,
            suggested_fix: `Expected slug based on: "${movie.title_en}"`,
            severity: 'low',
            auto_fixable: false,
            details: 'Slug does not match title',
          });
        }
      }
    }
    
    // Placeholder poster URLs
    if (movie.poster_url) {
      if (movie.poster_url.includes('placeholder') || 
          movie.poster_url.includes('no_poster') ||
          movie.poster_url.includes('default') ||
          movie.poster_url === '') {
        issues.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          category: 'DATA_QUALITY',
          issue_type: 'PLACEHOLDER_POSTER',
          field: 'poster_url',
          current_value: movie.poster_url,
          suggested_fix: 'Find actual poster',
          severity: 'low',
          auto_fixable: false,
          details: 'Poster URL is a placeholder',
        });
      }
    }
    
    // Music director duo incomplete
    if (movie.music_director) {
      const mdLower = movie.music_director.toLowerCase();
      if (mdLower === 'laxmikant' || mdLower === 'pyarelal') {
        issues.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          category: 'DATA_QUALITY',
          issue_type: 'INCOMPLETE_MUSIC_DUO',
          field: 'music_director',
          current_value: movie.music_director,
          suggested_fix: 'Laxmikant-Pyarelal',
          severity: 'low',
          auto_fixable: true,
          details: 'Music director duo is incomplete',
        });
      }
      
      // Anand-Milind
      if (mdLower === 'anand' || mdLower === 'milind') {
        issues.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          category: 'DATA_QUALITY',
          issue_type: 'INCOMPLETE_MUSIC_DUO',
          field: 'music_director',
          current_value: movie.music_director,
          suggested_fix: 'Anand-Milind',
          severity: 'low',
          auto_fixable: true,
          details: 'Music director duo is incomplete',
        });
      }
      
      // Nadeem-Shravan
      if (mdLower === 'nadeem' || mdLower === 'shravan') {
        issues.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          category: 'DATA_QUALITY',
          issue_type: 'INCOMPLETE_MUSIC_DUO',
          field: 'music_director',
          current_value: movie.music_director,
          suggested_fix: 'Nadeem-Shravan',
          severity: 'low',
          auto_fixable: true,
          details: 'Music director duo is incomplete',
        });
      }
    }
    
    // Name standardization checks
    if (movie.hero) {
      const nameVariants: Record<string, string> = {
        'jr ntr': 'Jr. NTR',
        'ntr jr': 'Jr. NTR',
        'n t rama rao jr': 'Jr. NTR',
        'nandamuri taraka rama rao jr': 'Jr. NTR',
        'akkineni nagarjuna': 'Nagarjuna',
        'tamannaah bhatia': 'Tamannaah',
        'samantha ruth prabhu': 'Samantha',
        'samantha akkineni': 'Samantha',
      };
      
      const heroNorm = movie.hero.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (nameVariants[heroNorm] && movie.hero !== nameVariants[heroNorm]) {
        issues.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          category: 'DATA_QUALITY',
          issue_type: 'NAME_VARIANT',
          field: 'hero',
          current_value: movie.hero,
          suggested_fix: nameVariants[heroNorm],
          severity: 'low',
          auto_fixable: true,
          details: 'Name variant should be standardized',
        });
      }
    }
    
    if (movie.heroine) {
      const nameVariants: Record<string, string> = {
        'tamannaah bhatia': 'Tamannaah',
        'samantha ruth prabhu': 'Samantha',
        'samantha akkineni': 'Samantha',
      };
      
      const heroineNorm = movie.heroine.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (nameVariants[heroineNorm] && movie.heroine !== nameVariants[heroineNorm]) {
        issues.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en,
          year: movie.release_year,
          category: 'DATA_QUALITY',
          issue_type: 'NAME_VARIANT',
          field: 'heroine',
          current_value: movie.heroine,
          suggested_fix: nameVariants[heroineNorm],
          severity: 'low',
          auto_fixable: true,
          details: 'Name variant should be standardized',
        });
      }
    }
  }
  
  console.log(`   Found ${issues.length} slug/quality issues\n`);
  return issues;
}

// ============================================================
// EXPORT TO CSV
// ============================================================

function exportToCSV(issues: AuditIssue[], filename: string) {
  const header = 'id,slug,title,year,category,issue_type,field,current_value,suggested_fix,severity,auto_fixable,details';
  const rows = issues.map(i => 
    `"${i.id}","${i.slug}","${i.title.replace(/"/g, '""')}",${i.year || 'null'},"${i.category}","${i.issue_type}","${i.field}","${String(i.current_value).replace(/"/g, '""')}","${i.suggested_fix.replace(/"/g, '""')}","${i.severity}",${i.auto_fixable},"${i.details.replace(/"/g, '""')}"`
  );
  
  writeFileSync(filename, [header, ...rows].join('\n'));
  console.log(chalk.cyan(`📄 Exported ${issues.length} issues to ${filename}`));
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(chalk.bold('\n🔍 COMPREHENSIVE INTERNAL AUDIT\n'));
  console.log('   No external APIs - Fast validation\n');
  console.log('='.repeat(60) + '\n');
  
  const startTime = Date.now();
  const movies = await fetchAllMovies();
  
  const allIssues: AuditIssue[] = [];
  
  // Phase 1: Timeline
  const timelineIssues = await runTimelineValidation(movies);
  allIssues.push(...timelineIssues);
  
  // Phase 2: Suspicious Entries
  const suspiciousIssues = await runSuspiciousEntryDetection(movies);
  allIssues.push(...suspiciousIssues);
  
  // Phase 3: Attribution
  const attributionIssues = await runAttributionValidation(movies);
  allIssues.push(...attributionIssues);
  
  // Phase 4: Slug & Quality
  const qualityIssues = await runSlugAndQualityChecks(movies);
  allIssues.push(...qualityIssues);
  
  // Summary
  console.log('='.repeat(60));
  console.log(chalk.bold('\n📊 AUDIT SUMMARY\n'));
  
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let autoFixable = 0;
  
  for (const issue of allIssues) {
    byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
    bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
    if (issue.auto_fixable) autoFixable++;
  }
  
  console.log('   By Category:');
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cat.padEnd(25)} ${count}`);
  }
  
  console.log('\n   By Severity:');
  for (const [sev, count] of Object.entries(bySeverity)) {
    const color = sev === 'critical' ? chalk.red : sev === 'high' ? chalk.yellow : sev === 'medium' ? chalk.blue : chalk.gray;
    console.log(`     ${color(sev.padEnd(15))} ${count}`);
  }
  
  console.log(`\n   Auto-fixable: ${autoFixable}`);
  console.log(`   Manual review: ${allIssues.length - autoFixable}`);
  console.log(`\n   Total issues: ${chalk.bold(allIssues.length)}`);
  console.log(`   Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);
  
  // Export
  exportToCSV(allIssues, 'COMPREHENSIVE-AUDIT-INTERNAL.csv');
  
  // Export auto-fixable separately
  const autoFixableIssues = allIssues.filter(i => i.auto_fixable);
  if (autoFixableIssues.length > 0) {
    exportToCSV(autoFixableIssues, 'AUTO-FIXABLE-ISSUES.csv');
  }
  
  // Export high severity separately
  const highSeverity = allIssues.filter(i => i.severity === 'critical' || i.severity === 'high');
  if (highSeverity.length > 0) {
    exportToCSV(highSeverity, 'HIGH-SEVERITY-ISSUES.csv');
  }
  
  console.log(chalk.green('\n✅ COMPREHENSIVE INTERNAL AUDIT COMPLETE\n'));
}

main().catch(console.error);
