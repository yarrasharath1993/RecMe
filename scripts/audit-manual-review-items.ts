#!/usr/bin/env npx tsx
/**
 * Comprehensive audit to identify items requiring manual review
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ManualReviewItem {
  id: string;
  slug: string;
  title: string;
  year: number | null;
  issue_type: string;
  issue_description: string;
  current_value: string;
  suggested_action: string;
  severity: 'high' | 'medium' | 'low';
}

const manualReviewItems: ManualReviewItem[] = [];

// Helper to normalize names
function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return String(s).toLowerCase().trim();
}

// Check for duplicate cast (same person in hero and heroine)
async function checkDuplicateCast() {
  console.log(chalk.yellow('Checking for duplicate cast...'));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, hero, heroine')
    .not('hero', 'is', null)
    .not('heroine', 'is', null);

  if (!movies) return;

  for (const movie of movies) {
    const hero = normalize(movie.hero);
    const heroine = normalize(movie.heroine);
    
    if (hero && heroine && hero === heroine) {
      manualReviewItems.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en || movie.slug,
        year: movie.release_year,
        issue_type: 'DUPLICATE_CAST',
        issue_description: `Same person listed as both hero and heroine: "${movie.hero}"`,
        current_value: `Hero: ${movie.hero}, Heroine: ${movie.heroine}`,
        suggested_action: 'Identify correct hero/heroine pair',
        severity: 'high',
      });
    }
  }
  
  console.log(chalk.green(`Found ${manualReviewItems.length} duplicate cast issues`));
}

// Check for missing lead cast
async function checkMissingLeadCast() {
  console.log(chalk.yellow('Checking for missing lead cast...'));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, hero, heroine')
    .or('hero.is.null,heroine.is.null');

  if (!movies) return;

  const initialCount = manualReviewItems.length;

  for (const movie of movies) {
    const hasHero = !!movie.hero;
    const hasHeroine = !!movie.heroine;
    
    if (!hasHero && !hasHeroine) {
      manualReviewItems.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en || movie.slug,
        year: movie.release_year,
        issue_type: 'MISSING_LEAD_CAST',
        issue_description: 'Both hero and heroine are missing',
        current_value: 'No lead cast',
        suggested_action: 'Research and add hero/heroine',
        severity: 'high',
      });
    } else if (!hasHero) {
      manualReviewItems.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en || movie.slug,
        year: movie.release_year,
        issue_type: 'MISSING_HERO',
        issue_description: 'Hero is missing',
        current_value: `Heroine: ${movie.heroine}`,
        suggested_action: 'Research and add hero',
        severity: 'medium',
      });
    } else if (!hasHeroine) {
      manualReviewItems.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en || movie.slug,
        year: movie.release_year,
        issue_type: 'MISSING_HEROINE',
        issue_description: 'Heroine is missing',
        current_value: `Hero: ${movie.hero}`,
        suggested_action: 'Research and add heroine',
        severity: 'medium',
      });
    }
  }
  
  console.log(chalk.green(`Found ${manualReviewItems.length - initialCount} missing cast issues`));
}

// Check for suspicious entries (award ceremonies, TV shows, etc.)
async function checkSuspiciousEntries() {
  console.log(chalk.yellow('Checking for suspicious entries...'));
  
  const suspiciousKeywords = [
    'award', 'ceremony', 'utsavam', 'function', 'event',
    'tv show', 'series', 'episode', 'season',
    'documentary', 'docu', 'interview',
    'short film', 'short', 'music video',
  ];

  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, synopsis');

  if (!movies) return;

  const initialCount = manualReviewItems.length;

  for (const movie of movies) {
    const title = normalize(movie.title_en || '');
    const synopsis = normalize(movie.synopsis || '');
    const combined = `${title} ${synopsis}`;

    for (const keyword of suspiciousKeywords) {
      if (combined.includes(keyword)) {
        manualReviewItems.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en || movie.slug,
          year: movie.release_year,
          issue_type: 'SUSPICIOUS_ENTRY',
          issue_description: `May not be a feature film (contains: "${keyword}")`,
          current_value: movie.title_en || movie.slug,
          suggested_action: 'Verify if this is a feature film or should be removed/reclassified',
          severity: 'medium',
        });
        break; // Only add once per movie
      }
    }
  }
  
  console.log(chalk.green(`Found ${manualReviewItems.length - initialCount} suspicious entries`));
}

// Check for bad slugs (Wikidata IDs, etc.)
async function checkBadSlugs() {
  console.log(chalk.yellow('Checking for bad slugs...'));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year')
    .like('slug', 'q%');

  if (!movies) return;

  const initialCount = manualReviewItems.length;

  for (const movie of movies) {
    manualReviewItems.push({
      id: movie.id,
      slug: movie.slug,
      title: movie.title_en || movie.slug,
      year: movie.release_year,
      issue_type: 'BAD_SLUG',
      issue_description: 'Slug is a Wikidata ID instead of proper slug',
      current_value: movie.slug,
      suggested_action: 'Generate proper slug from title',
      severity: 'medium',
    });
  }
  
  console.log(chalk.green(`Found ${manualReviewItems.length - initialCount} bad slug issues`));
}

// Check for placeholder posters
async function checkPlaceholderPosters() {
  console.log(chalk.yellow('Checking for placeholder posters...'));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, poster_url')
    .or('poster_url.ilike.%placeholder%,poster_url.ilike.%via.placeholder%');

  if (!movies) return;

  const initialCount = manualReviewItems.length;

  for (const movie of movies) {
    manualReviewItems.push({
      id: movie.id,
      slug: movie.slug,
      title: movie.title_en || movie.slug,
      year: movie.release_year,
      issue_type: 'PLACEHOLDER_POSTER',
      issue_description: 'Poster URL is a placeholder',
      current_value: movie.poster_url || 'N/A',
      suggested_action: 'Find and update with actual poster URL',
      severity: 'low',
    });
  }
  
  console.log(chalk.green(`Found ${manualReviewItems.length - initialCount} placeholder poster issues`));
}

// Check for movies with very short titles (might be errors)
async function checkSuspiciousTitles() {
  console.log(chalk.yellow('Checking for suspicious titles...'));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year');

  if (!movies) return;

  const initialCount = manualReviewItems.length;

  for (const movie of movies) {
    const title = movie.title_en || '';
    if (title.length > 0 && title.length < 3) {
      manualReviewItems.push({
        id: movie.id,
        slug: movie.slug,
        title: movie.title_en || movie.slug,
        year: movie.release_year,
        issue_type: 'SUSPICIOUS_TITLE',
        issue_description: `Title is suspiciously short: "${title}" (${title.length} characters)`,
        current_value: title,
        suggested_action: 'Verify title is correct',
        severity: 'low',
      });
    }
  }
  
  console.log(chalk.green(`Found ${manualReviewItems.length - initialCount} suspicious title issues`));
}

// Check for gender swaps (common female names in hero field, male names in heroine field)
async function checkGenderSwaps() {
  console.log(chalk.yellow('Checking for potential gender swaps...'));
  
  const commonFemaleNames = [
    'sridevi', 'jaya prada', 'vijayashanti', 'soundarya', 'ramya krishnan',
    'anushka shetty', 'tamannaah', 'samantha', 'kajal', 'shriya saran',
    'rakul preet', 'rashmika', 'pooja hegde', 'nayanthara', 'trisha',
  ];

  const commonMaleNames = [
    'prabhas', 'mahesh babu', 'pawan kalyan', 'allu arjun', 'ram charan',
    'jr. ntr', 'nagarjuna', 'venkatesh', 'chiranjeevi', 'balakrishna',
    'ravi teja', 'nani', 'sai dharam tej', 'varun tej', 'naga chaitanya',
  ];

  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, hero, heroine')
    .not('hero', 'is', null)
    .not('heroine', 'is', null);

  if (!movies) return;

  const initialCount = manualReviewItems.length;

  for (const movie of movies) {
    const hero = normalize(movie.hero);
    const heroine = normalize(movie.heroine);

    // Check if female name is in hero field
    for (const femaleName of commonFemaleNames) {
      if (hero.includes(femaleName) && !heroine.includes(femaleName)) {
        manualReviewItems.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en || movie.slug,
          year: movie.release_year,
          issue_type: 'POTENTIAL_GENDER_SWAP',
          issue_description: `Female name "${movie.hero}" in hero field`,
          current_value: `Hero: ${movie.hero}, Heroine: ${movie.heroine}`,
          suggested_action: 'Verify if this is a gender swap or female-centric film',
          severity: 'high',
        });
        break;
      }
    }

    // Check if male name is in heroine field
    for (const maleName of commonMaleNames) {
      if (heroine.includes(maleName) && !hero.includes(maleName)) {
        manualReviewItems.push({
          id: movie.id,
          slug: movie.slug,
          title: movie.title_en || movie.slug,
          year: movie.release_year,
          issue_type: 'POTENTIAL_GENDER_SWAP',
          issue_description: `Male name "${movie.heroine}" in heroine field`,
          current_value: `Hero: ${movie.hero}, Heroine: ${movie.heroine}`,
          suggested_action: 'Verify if this is a gender swap',
          severity: 'high',
        });
        break;
      }
    }
  }
  
  console.log(chalk.green(`Found ${manualReviewItems.length - initialCount} potential gender swap issues`));
}

async function runAudit() {
  console.log(chalk.bold('\n🔍 COMPREHENSIVE AUDIT FOR MANUAL REVIEW ITEMS\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');

  await checkDuplicateCast();
  await checkMissingLeadCast();
  await checkSuspiciousEntries();
  await checkBadSlugs();
  await checkPlaceholderPosters();
  await checkSuspiciousTitles();
  await checkGenderSwaps();

  // Sort by severity (high first) then by year
  manualReviewItems.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return (b.year || 0) - (a.year || 0); // Newer first
  });

  // Generate CSV
  const csvHeader = 'id,slug,title,year,issue_type,issue_description,current_value,suggested_action,severity\n';
  const csvRows = manualReviewItems.map(item => 
    `"${item.id}","${item.slug}","${item.title}",${item.year || ''},"${item.issue_type}","${item.issue_description}","${item.current_value}","${item.suggested_action}","${item.severity}"`
  ).join('\n');
  const csv = csvHeader + csvRows;

  writeFileSync('MANUAL-REVIEW-ITEMS.csv', csv);

  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 AUDIT SUMMARY\n'));
  
  const bySeverity = {
    high: manualReviewItems.filter(i => i.severity === 'high').length,
    medium: manualReviewItems.filter(i => i.severity === 'medium').length,
    low: manualReviewItems.filter(i => i.severity === 'low').length,
  };

  const byType = manualReviewItems.reduce((acc, item) => {
    acc[item.issue_type] = (acc[item.issue_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`Total items requiring manual review: ${chalk.bold(manualReviewItems.length)}\n`);
  console.log('By severity:');
  console.log(`  ${chalk.red('High:')} ${bySeverity.high}`);
  console.log(`  ${chalk.yellow('Medium:')} ${bySeverity.medium}`);
  console.log(`  ${chalk.gray('Low:')} ${bySeverity.low}\n`);
  console.log('By issue type:');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  
  console.log(chalk.bold(`\n📄 Results saved to: MANUAL-REVIEW-ITEMS.csv\n`));
  
  // Show top 20 high-priority items
  const highPriority = manualReviewItems.filter(i => i.severity === 'high').slice(0, 20);
  if (highPriority.length > 0) {
    console.log(chalk.bold('🔴 TOP HIGH-PRIORITY ITEMS:\n'));
    highPriority.forEach((item, idx) => {
      console.log(`${idx + 1}. ${chalk.bold(item.title)} (${item.year || 'N/A'})`);
      console.log(`   ${chalk.yellow(item.issue_type)}: ${item.issue_description}`);
      console.log();
    });
  }
}

runAudit().catch(console.error);
