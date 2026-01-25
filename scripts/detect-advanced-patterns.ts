#!/usr/bin/env npx tsx
/**
 * Advanced Pattern Detection for Data Quality Issues
 * 
 * Detects complex patterns:
 * 1. Wrong hero attribution (female names in hero field)
 * 2. Duplicate/similar movies
 * 3. Movies with mismatched year/release_date
 * 4. Movies with suspicious cast (all same person)
 * 5. Movies with placeholder content
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import chalk from 'chalk';
import Groq from 'groq-sdk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Common female names/actresses patterns
const FEMALE_NAMES_PATTERNS = [
  'Sridevi', 'Soundarya', 'Ramya', 'Radhika', 'Lakshmi', 'Jayasudha', 'Jayaprada',
  'Suhasini', 'Revathi', 'Bhanupriya', 'Meena', 'Roja', 'Nagma', 'Simran',
  'Aishwarya', 'Trisha', 'Nayanthara', 'Anushka', 'Samantha', 'Kajal',
  'Tamannaah', 'Shruti', 'Hansika', 'Rakul', 'Pooja', 'Sneha', 'Priyamani',
  'Anushka Shetty', 'Kajal Aggarwal', 'Shriya Saran', 'Ileana', 'Taapsee',
];

interface Issue {
  id: string;
  slug: string;
  title: string;
  issue_type: string;
  details: any;
  confidence: 'high' | 'medium' | 'low';
}

async function detectWrongHeroAttribution(): Promise<Issue[]> {
  console.log(chalk.cyan('🔍 Detecting wrong hero attribution...'));
  
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, hero, heroine, director')
    .eq('language', 'Telugu')
    .not('hero', 'is', null);
  
  const issues: Issue[] = [];
  
  for (const movie of data || []) {
    // Check if hero matches known female names
    const matchesFemale = FEMALE_NAMES_PATTERNS.some(pattern => 
      movie.hero?.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (matchesFemale) {
      issues.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en,
        issue_type: 'wrong_hero_gender',
        details: {
          current_hero: movie.hero,
          heroine: movie.heroine,
          reason: 'Hero name matches known female actress',
        },
        confidence: 'high',
      });
    }
    
    // Check if hero and heroine are same
    if (movie.hero === movie.heroine && movie.hero) {
      issues.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en,
        issue_type: 'hero_heroine_same',
        details: {
          name: movie.hero,
          reason: 'Hero and heroine are identical',
        },
        confidence: 'high',
      });
    }
  }
  
  console.log(chalk.green(`   Found ${issues.length} potential attribution issues`));
  return issues;
}

async function detectYearMismatches(): Promise<Issue[]> {
  console.log(chalk.cyan('🔍 Detecting year/release date mismatches...'));
  
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, release_date')
    .eq('language', 'Telugu')
    .not('release_year', 'is', null)
    .not('release_date', 'is', null);
  
  const issues: Issue[] = [];
  
  for (const movie of data || []) {
    const releaseYear = new Date(movie.release_date).getFullYear();
    const storedYear = movie.release_year;
    
    if (Math.abs(releaseYear - storedYear) > 1) {
      issues.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en,
        issue_type: 'year_mismatch',
        details: {
          release_year_field: storedYear,
          release_date_year: releaseYear,
          release_date: movie.release_date,
          difference: Math.abs(releaseYear - storedYear),
        },
        confidence: 'high',
      });
    }
  }
  
  console.log(chalk.green(`   Found ${issues.length} year mismatches`));
  return issues;
}

async function detectSuspiciousContent(): Promise<Issue[]> {
  console.log(chalk.cyan('🔍 Detecting suspicious content...'));
  
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, synopsis, synopsis_te')
    .eq('language', 'Telugu')
    .or('synopsis.ilike.%placeholder%,synopsis.ilike.%lorem ipsum%,synopsis.ilike.%test%');
  
  const issues: Issue[] = [];
  
  for (const movie of data || []) {
    issues.push({
      id: movie.id,
      slug: movie.slug,
      title: movie.title_en,
      issue_type: 'placeholder_content',
      details: {
        synopsis_sample: movie.synopsis?.substring(0, 100),
        reason: 'Contains placeholder text',
      },
      confidence: 'high',
    });
  }
  
  console.log(chalk.green(`   Found ${issues.length} movies with placeholder content`));
  return issues;
}

async function detectMissingCriticalFields(): Promise<Issue[]> {
  console.log(chalk.cyan('🔍 Detecting movies with multiple missing critical fields...'));
  
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, director, hero, heroine, genres, synopsis, poster_url')
    .eq('language', 'Telugu')
    .gte('release_year', 2000)
    .lte('release_year', 2024);
  
  const issues: Issue[] = [];
  
  for (const movie of data || []) {
    const missing: string[] = [];
    
    if (!movie.director || movie.director === 'Unknown') missing.push('director');
    if (!movie.hero) missing.push('hero');
    if (!movie.heroine) missing.push('heroine');
    if (!movie.genres || movie.genres.length === 0) missing.push('genres');
    if (!movie.synopsis) missing.push('synopsis');
    if (!movie.poster_url) missing.push('poster');
    
    // Flag if 3+ critical fields missing
    if (missing.length >= 3) {
      issues.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en,
        issue_type: 'incomplete_data',
        details: {
          missing_fields: missing,
          missing_count: missing.length,
          reason: `${missing.length} critical fields missing`,
        },
        confidence: missing.length >= 4 ? 'high' : 'medium',
      });
    }
  }
  
  console.log(chalk.green(`   Found ${issues.length} incomplete movies`));
  return issues;
}

async function detectPotentialDuplicates(): Promise<Issue[]> {
  console.log(chalk.cyan('🔍 Detecting potential duplicate entries...'));
  
  const { data } = await supabase
    .from('movies')
    .select('id, slug, title_en, title_te, release_year, director, hero')
    .eq('language', 'Telugu')
    .order('title_en');
  
  const issues: Issue[] = [];
  const seen = new Map<string, any[]>();
  
  // Group by title + year
  for (const movie of data || []) {
    const key = `${movie.title_en?.toLowerCase()}-${movie.release_year}`;
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(movie);
  }
  
  // Find groups with 2+ entries
  for (const [key, movies] of seen.entries()) {
    if (movies.length > 1) {
      // Check if they're truly duplicates (same director/hero)
      const directors = new Set(movies.map(m => m.director).filter(Boolean));
      const heroes = new Set(movies.map(m => m.hero).filter(Boolean));
      
      const confidence = 
        directors.size === 1 && heroes.size === 1 ? 'high' :
        directors.size <= 2 || heroes.size <= 2 ? 'medium' : 'low';
      
      for (let i = 1; i < movies.length; i++) {
        issues.push({
          id: movies[i].id,
          slug: movies[i].slug,
          title: movies[i].title_en,
          issue_type: 'potential_duplicate',
          details: {
            duplicate_of: movies[0].slug,
            duplicate_title: movies[0].title_en,
            year: movies[i].release_year,
            reason: 'Same title and year',
          },
          confidence,
        });
      }
    }
  }
  
  console.log(chalk.green(`   Found ${issues.length} potential duplicates`));
  return issues;
}

async function main() {
  const args = process.argv.slice(2);
  const outputFormat = args.includes('--csv') ? 'csv' : 'json';

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            ADVANCED PATTERN DETECTION                                ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  const allIssues: Issue[] = [];
  
  // Run all detections
  allIssues.push(...await detectWrongHeroAttribution());
  allIssues.push(...await detectYearMismatches());
  allIssues.push(...await detectSuspiciousContent());
  allIssues.push(...await detectMissingCriticalFields());
  allIssues.push(...await detectPotentialDuplicates());

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY BY ISSUE TYPE                                     ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  const byType = allIssues.reduce((acc, issue) => {
    acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [type, count] of Object.entries(byType)) {
    console.log(chalk.cyan(`  ${type}: ${count}`));
  }

  console.log(chalk.blue.bold(`\n  Total issues found: ${allIssues.length}\n`));

  // By confidence
  const byConfidence = {
    high: allIssues.filter(i => i.confidence === 'high').length,
    medium: allIssues.filter(i => i.confidence === 'medium').length,
    low: allIssues.filter(i => i.confidence === 'low').length,
  };

  console.log(chalk.red(`  High confidence: ${byConfidence.high}`));
  console.log(chalk.yellow(`  Medium confidence: ${byConfidence.medium}`));
  console.log(chalk.gray(`  Low confidence: ${byConfidence.low}`));

  // Output to file
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (outputFormat === 'csv') {
    const csv = [
      'slug,title,issue_type,confidence,details',
      ...allIssues.map(i => 
        `"${i.slug}","${i.title}","${i.issue_type}","${i.confidence}","${JSON.stringify(i.details).replace(/"/g, "'")}"`)
    ].join('\n');
    
    const csvPath = `docs/audit-reports/advanced-patterns-${timestamp}.csv`;
    writeFileSync(csvPath, csv);
    console.log(chalk.green(`\n  ✅ CSV report saved: ${csvPath}`));
  } else {
    const jsonPath = `docs/audit-reports/advanced-patterns-${timestamp}.json`;
    writeFileSync(jsonPath, JSON.stringify(allIssues, null, 2));
    console.log(chalk.green(`\n  ✅ JSON report saved: ${jsonPath}`));
  }

  // Show top issues
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            TOP HIGH-CONFIDENCE ISSUES (First 10)                     ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  const highConfidence = allIssues
    .filter(i => i.confidence === 'high')
    .slice(0, 10);

  for (const issue of highConfidence) {
    console.log(chalk.yellow(`\n  ${issue.title} (${issue.slug})`));
    console.log(chalk.gray(`    Issue: ${issue.issue_type}`));
    console.log(chalk.gray(`    ${JSON.stringify(issue.details, null, 2).substring(0, 200)}`));
  }

  console.log(chalk.blue('\n  Run with --csv to output CSV format\n'));
}

main().catch(console.error);
